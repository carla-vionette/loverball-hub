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

  process.exit(t.summary() ? 0 : 1);
};

main().catch((e) => {
  console.error("\n💥 multi-tab test crashed:", e);
  process.exit(1);
});
