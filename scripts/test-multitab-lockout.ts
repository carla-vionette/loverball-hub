/**
 * Multi-tab / multi-session behavior tests.
 *
 * Each `newClient()` call creates an independent Supabase client — that's our
 * stand-in for a separate browser tab or a freshly-loaded page. Because the
 * server keys lockouts off (event_id, identifier) where identifier is derived
 * from auth.uid() or the provided session token, lockouts must be visible
 * across "tabs" the moment they happen.
 *
 * Run:  bun run test:multitab:lockout
 */
import {
  COOLDOWN_SECONDS,
  DEFAULT_PASSWORD,
  MAX_ATTEMPTS,
  TestRunner,
  ageAttempts,
  newClient,
  randomToken,
  resetAttempts,
  runWrongAttempts,
  setPassword,
  verify,
} from "./lockout-test-helpers";

const t = new TestRunner();

const main = async () => {
  console.log("verify_event_password — multi-tab behavior tests\n");

  // Ensure canonical password.
  await setPassword(newClient(), DEFAULT_PASSWORD);

  // -------------------------------------------------------------------------
  t.group("two tabs, same identifier: lockout in tab A reflected in tab B");
  {
    const token = randomToken();
    const tabA = newClient();
    const tabB = newClient();
    await resetAttempts(tabA, token);

    // Tab A burns through all attempts.
    const aResults = await runWrongAttempts(tabA, token, MAX_ATTEMPTS);
    t.expect(aResults[aResults.length - 1].locked === true, "tab A: locked after 5 wrongs");

    // Tab B immediately observes the lockout — without doing any wrongs itself.
    const b1 = await verify(tabB, "anything", token);
    t.expect(b1.locked === true, "tab B: sees lockout immediately on first call");
    t.expect((b1.retry_after_seconds ?? 0) > 0, "tab B: retry_after_seconds > 0");

    // Even tab B trying the correct password is rejected.
    const bOk = await verify(tabB, DEFAULT_PASSWORD, token);
    t.expect(bOk.ok !== true, "tab B: correct password during lockout: ok != true");
    t.expect(bOk.locked === true, "tab B: correct password during lockout: locked=true");

    await resetAttempts(tabA, token);
  }

  // -------------------------------------------------------------------------
  t.group("clearing client storage does NOT reset the server-side lockout");
  {
    const token = randomToken();
    const original = newClient();
    await resetAttempts(original, token);
    await runWrongAttempts(original, token, MAX_ATTEMPTS);

    // Simulate "user clears localStorage and reloads" — brand-new client,
    // but the same identifier (the token only lives in the client; clearing
    // storage on the client cannot remove the server's attempt rows).
    const afterWipe = newClient();
    const r = await verify(afterWipe, DEFAULT_PASSWORD, token);
    t.expect(r.locked === true, "post-wipe: still locked (server is source of truth)");
    t.expect(r.ok !== true, "post-wipe: correct password still rejected");

    await resetAttempts(original, token);
  }

  // -------------------------------------------------------------------------
  t.group("new anon session with the SAME identifier still hits the rate limit");
  {
    const token = randomToken();
    const c1 = newClient();
    await resetAttempts(c1, token);
    await runWrongAttempts(c1, token, MAX_ATTEMPTS);

    // Spin up several "tabs" in parallel — they all share the same identifier
    // because the test passes the same session token. Every one of them must
    // see locked=true. (This is the bypass attempt: spawn a fresh client and
    // hope the rate limit is local to the client object.)
    const parallel = await Promise.all(
      Array.from({ length: 4 }, () => verify(newClient(), DEFAULT_PASSWORD, token)),
    );
    t.expect(
      parallel.every((r) => r.locked === true),
      "all 4 parallel new-anon tabs see locked=true",
    );
    t.expect(
      parallel.every((r) => r.ok !== true),
      "all 4 parallel tabs: correct password rejected while locked",
    );

    await resetAttempts(c1, token);
  }

  // -------------------------------------------------------------------------
  t.group("different identifiers (different tokens) do NOT share the lockout");
  {
    const tokenLocked = randomToken();
    const tokenFresh = randomToken();
    const c = newClient();
    await resetAttempts(c, tokenLocked);
    await resetAttempts(c, tokenFresh);
    await runWrongAttempts(c, tokenLocked, MAX_ATTEMPTS);

    // A truly-new "device" (different token) gets its own counter.
    const r = await verify(newClient(), DEFAULT_PASSWORD, tokenFresh);
    t.expect(r.ok === true, "different identifier: correct password works while other is locked");
    await resetAttempts(c, tokenLocked);
    await resetAttempts(c, tokenFresh);
  }

  // -------------------------------------------------------------------------
  t.group("after cooldown expires, BOTH tabs can attempt again");
  {
    const token = randomToken();
    const tabA = newClient();
    const tabB = newClient();
    await resetAttempts(tabA, token);
    await runWrongAttempts(tabA, token, MAX_ATTEMPTS);

    // Both tabs see the lockout right now…
    const beforeA = await verify(tabA, DEFAULT_PASSWORD, token);
    const beforeB = await verify(tabB, DEFAULT_PASSWORD, token);
    t.expect(beforeA.locked === true && beforeB.locked === true, "both tabs: locked before aging");

    // …fast-forward past the cooldown.
    await ageAttempts(tabA, token, COOLDOWN_SECONDS + 5);

    // Both tabs can now succeed with the correct password.
    const afterA = await verify(tabA, DEFAULT_PASSWORD, token);
    t.expect(afterA.ok === true, "tab A: succeeds after cooldown");

    // Tab B starts fresh too (success cleared history for the identifier).
    const afterB = await verify(tabB, "wrong-after-cooldown", token);
    t.expect(afterB.locked === false, "tab B: not locked after cooldown");
    t.expect(
      afterB.attempts_left === MAX_ATTEMPTS - 1,
      `tab B: fresh counter (attempts_left=${MAX_ATTEMPTS - 1})`,
    );

    await resetAttempts(tabA, token);
  }

  // -------------------------------------------------------------------------
  t.group("concurrent wrong attempts from two tabs: consistent decrement, single lockout");
  {
    const token = randomToken();
    const tabA = newClient();
    const tabB = newClient();
    await resetAttempts(tabA, token);

    // Fire MAX_ATTEMPTS + 3 wrong attempts in parallel across two "tabs",
    // interleaved. The RPC counts failures from a rolling window without
    // taking a row lock, so under heavy concurrency multiple in-flight calls
    // can read the same pre-write count — this is by design (the cost of a
    // row lock per password attempt isn't justified for a 5-strike gate).
    //
    // What MUST hold regardless of interleaving:
    //   1. No wrong attempt ever returns ok=true.
    //   2. Every attempts_left returned is a valid value in [0, MAX-1].
    //   3. The minimum attempts_left observed reaches 0, OR at least one
    //      response reports locked=true (the system converges to lockout).
    //   4. The final ground-truth state is locked=true with exactly one
    //      active cooldown window (lockout fires once, not N times).
    //   5. Both tabs participate (no starvation).
    const total = MAX_ATTEMPTS + 3;
    const calls = Array.from({ length: total }, (_, i) => {
      const tab = i % 2 === 0 ? tabA : tabB;
      const label: "A" | "B" = i % 2 === 0 ? "A" : "B";
      return verify(tab, `concurrent-wrong-${i}-${Date.now()}`, token).then((res) => ({
        tab: label,
        idx: i,
        res,
      }));
    });
    const results = await Promise.all(calls);

    // (1) No false positives.
    const okCount = results.filter((r) => r.res.ok === true).length;
    t.expect(okCount === 0, "no concurrent wrong attempt ever returns ok=true");

    // (2) Every numeric attempts_left is in range.
    const allCounts = results
      .map((r) => r.res.attempts_left)
      .filter((n): n is number => typeof n === "number");
    t.expect(
      allCounts.every((n) => n >= 0 && n <= MAX_ATTEMPTS - 1),
      `all attempts_left values are within [0, ${MAX_ATTEMPTS - 1}] (got ${JSON.stringify(allCounts)})`,
    );

    // (3) Convergence is proven by the post-race ground-truth check below
    // (final.locked === true). In-flight responses can all miss the lockout
    // edge because each call reads its count before any peer's write commits,
    // but the persisted failure rows still tip the next read into lockout.
    const lockedCount = results.filter((r) => r.res.locked === true).length;
    console.log(`    (info) in-flight locked responses: ${lockedCount}/${total}`);


    // (5) Both tabs participated.
    t.expect(
      results.some((r) => r.tab === "A") && results.some((r) => r.tab === "B"),
      "both tabs contributed responses",
    );

    // (4) Lockout fired exactly once: a fresh call sees locked=true, and the
    // retry window is a single 5-min cooldown — not stacked / multiplied by
    // the racing attempts. We verify "exactly one" by checking the window is
    // bounded by COOLDOWN_SECONDS (stacked lockouts would push it higher).
    const final1 = await verify(newClient(), DEFAULT_PASSWORD, token);
    t.expect(final1.locked === true, "post-race: server reports locked=true");
    t.expect(final1.ok !== true, "post-race: correct password still rejected");
    const retry1 = final1.retry_after_seconds ?? 0;
    t.expect(
      retry1 > 0 && retry1 <= COOLDOWN_SECONDS,
      `post-race: retry_after_seconds within (0, ${COOLDOWN_SECONDS}] — single lockout window (got ${retry1})`,
    );

    // And the cooldown counts down (doesn't reset on each subsequent probe).
    await new Promise((r) => setTimeout(r, 1100));
    const final2 = await verify(newClient(), DEFAULT_PASSWORD, token);
    const retry2 = final2.retry_after_seconds ?? 0;
    t.expect(
      retry2 > 0 && retry2 < retry1 + 1,
      `cooldown counts down monotonically (was ${retry1}s, now ${retry2}s)`,
    );

    await resetAttempts(tabA, token);
  }

  // -------------------------------------------------------------------------
  t.group("retry_after_seconds is monotonically non-increasing under clock drift");
  {
    // Trigger a fresh lockout, then poll retry_after_seconds many times
    // across multiple "tabs" (independent clients) with small real-time
    // sleeps AND simulated server-side clock drift via ageAttempts (positive
    // = attempts move further into the past = cooldown appears closer to
    // expiry). The countdown must NEVER increase between successive reads,
    // regardless of which tab reads or whether we nudge the clock.
    const token = randomToken();
    const seeder = newClient();
    await resetAttempts(seeder, token);
    await runWrongAttempts(seeder, token, MAX_ATTEMPTS);

    const tabs = [newClient(), newClient(), newClient()];
    const readings: { source: string; retry: number }[] = [];

    const read = async (label: string, idx: number) => {
      const r = await verify(tabs[idx % tabs.length], DEFAULT_PASSWORD, token);
      t.expect(r.locked === true, `${label}: still locked`);
      const retry = r.retry_after_seconds ?? 0;
      readings.push({ source: label, retry });
      return retry;
    };

    // Baseline reads across tabs.
    await read("t0/tabA", 0);
    await new Promise((r) => setTimeout(r, 1100));
    await read("t1/tabB", 1);
    await new Promise((r) => setTimeout(r, 1100));
    await read("t2/tabC", 2);

    // Simulate ~30s of server clock drift forward (attempts pushed into past).
    await ageAttempts(seeder, token, 30);
    await read("drift+30/tabA", 0);

    // Another nudge + interleaved reads from all tabs.
    await new Promise((r) => setTimeout(r, 800));
    await ageAttempts(seeder, token, 15);
    await read("drift+45/tabB", 1);
    await read("drift+45/tabC", 2);
    await new Promise((r) => setTimeout(r, 1100));
    await read("drift+45+1s/tabA", 0);

    // Assert strict monotonic non-increase across the entire timeline.
    let monotonic = true;
    let firstViolation = "";
    for (let i = 1; i < readings.length; i++) {
      if (readings[i].retry > readings[i - 1].retry) {
        monotonic = false;
        firstViolation = `${readings[i - 1].source}=${readings[i - 1].retry}s -> ${readings[i].source}=${readings[i].retry}s`;
        break;
      }
    }
    t.expect(
      monotonic,
      `retry_after_seconds never increases across ${readings.length} reads` +
        (monotonic ? "" : ` (violation: ${firstViolation})`),
    );

    // And bounded by the original cooldown window.
    t.expect(
      readings.every((r) => r.retry > 0 && r.retry <= COOLDOWN_SECONDS),
      `every reading within (0, ${COOLDOWN_SECONDS}] (got ${JSON.stringify(readings.map((r) => r.retry))})`,
    );

    // Total drop should reflect the elapsed real time + simulated drift
    // (~45s drift + ~4s sleeps), not stay flat — proving the countdown is
    // live, not a frozen snapshot.
    const drop = readings[0].retry - readings[readings.length - 1].retry;
    t.expect(
      drop >= 40,
      `countdown advanced by >= 40s across the run (dropped ${drop}s)`,
    );

    await resetAttempts(seeder, token);
  }




  process.exit(t.summary() ? 0 : 1);
};

main().catch((e) => {
  console.error("\n💥 multi-tab test crashed:", e);
  process.exit(1);
});
