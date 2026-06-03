/**
 * RPC-level tests for verify_event_password.
 *
 * Hits the live Lovable Cloud RPC with only the anon key and validates every
 * branch of the lockout state machine, including bypass attempts.
 *
 * Deterministic: uses _test_age_event_password_attempts to fast-forward the
 * cooldown window so the suite finishes in seconds instead of 5 real minutes.
 *
 * Run:  bun run test:rpc:lockout
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
  console.log("verify_event_password — RPC-level tests\n");
  const client = newClient();

  // Make sure the event password is the canonical one before we start, in
  // case a previous run left it rotated.
  await setPassword(client, DEFAULT_PASSWORD);

  // -------------------------------------------------------------------------
  t.group("correct password returns ok:true and resets attempts");
  {
    const token = randomToken();
    await resetAttempts(client, token);

    // Two wrong attempts to seed some failure history…
    const wrongs = await runWrongAttempts(client, token, 2);
    t.expect(wrongs.every((r) => r.ok === false && !r.locked), "two wrong attempts rejected");

    // …then a correct one should succeed AND clear the failure history.
    const ok = await verify(client, DEFAULT_PASSWORD, token);
    t.expect(ok.ok === true, "correct password: ok=true");
    t.expect(ok.locked === false, "correct password: locked=false");

    // Next 4 wrongs should NOT trip a lockout (history was cleared).
    const after = await runWrongAttempts(client, token, 4);
    t.expect(
      after.every((r) => r.locked === false),
      "post-success: 4 more wrongs still not locked (history cleared)",
    );
    await resetAttempts(client, token);
  }

  // -------------------------------------------------------------------------
  t.group("wrong password increments attempts_left and returns ok:false");
  {
    const token = randomToken();
    await resetAttempts(client, token);
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      const r = await verify(client, `wrong-${i}`, token);
      t.expect(r.ok === false, `attempt ${i}: ok=false`);
      t.expect(r.locked === false, `attempt ${i}: not yet locked`);
      t.expect(
        r.attempts_left === MAX_ATTEMPTS - i,
        `attempt ${i}: attempts_left=${MAX_ATTEMPTS - i} (got ${r.attempts_left})`,
      );
    }
    await resetAttempts(client, token);
  }

  // -------------------------------------------------------------------------
  t.group("5th wrong locks; further attempts (even correct) are rejected");
  {
    const token = randomToken();
    await resetAttempts(client, token);
    const results = await runWrongAttempts(client, token, MAX_ATTEMPTS);
    const last = results[results.length - 1];
    t.expect(last.locked === true, "5th wrong: locked=true");
    t.expect((last.retry_after_seconds ?? 0) > 0, "5th wrong: retry_after_seconds > 0");

    // Further wrong attempt → still locked.
    const moreWrong = await verify(client, "still-wrong", token);
    t.expect(moreWrong.locked === true, "post-lockout wrong: locked=true");

    // Correct password during lockout → must STILL be rejected.
    const correctDuringLock = await verify(client, DEFAULT_PASSWORD, token);
    t.expect(correctDuringLock.ok !== true, "correct during lockout: ok != true");
    t.expect(correctDuringLock.locked === true, "correct during lockout: locked=true");
    await resetAttempts(client, token);
  }

  // -------------------------------------------------------------------------
  t.group("after cooldown expires, the next correct attempt succeeds");
  {
    const token = randomToken();
    await resetAttempts(client, token);
    await runWrongAttempts(client, token, MAX_ATTEMPTS);

    // Fast-forward by COOLDOWN_SECONDS + 5s — every recorded attempt now sits
    // outside the rolling window, so the server stops counting them.
    const aged = await ageAttempts(client, token, COOLDOWN_SECONDS + 5);
    t.expect(aged >= MAX_ATTEMPTS, `aged at least ${MAX_ATTEMPTS} rows (got ${aged})`);

    const ok = await verify(client, DEFAULT_PASSWORD, token);
    t.expect(ok.ok === true, "post-cooldown correct password: ok=true");
    t.expect(ok.locked === false, "post-cooldown: locked=false");
    await resetAttempts(client, token);
  }

  // -------------------------------------------------------------------------
  t.group("password rotation during lockout does NOT bypass the lockout");
  {
    const token = randomToken();
    await resetAttempts(client, token);
    await runWrongAttempts(client, token, MAX_ATTEMPTS);

    // Rotate to a brand-new password mid-lockout.
    const rotated = `rotated-${Date.now()}`;
    await setPassword(client, rotated);

    // Even the *new* correct password is rejected while locked.
    const r = await verify(client, rotated, token);
    t.expect(r.locked === true, "new password during lockout: locked=true");
    t.expect(r.ok !== true, "new password during lockout: ok != true");

    // Restore canonical password and reset.
    await setPassword(client, DEFAULT_PASSWORD);
    await resetAttempts(client, token);
  }

  // -------------------------------------------------------------------------
  t.group("different session tokens have independent attempt counters");
  {
    const tokA = randomToken();
    const tokB = randomToken();
    await resetAttempts(client, tokA);
    await resetAttempts(client, tokB);

    // Lock token A.
    const rA = await runWrongAttempts(client, tokA, MAX_ATTEMPTS);
    t.expect(rA[rA.length - 1].locked === true, "token A: locked after 5 wrongs");

    // Token B is unaffected — fresh counter.
    const rB1 = await verify(client, "wrong-on-B", tokB);
    t.expect(rB1.locked === false, "token B: independent, not locked");
    t.expect(rB1.attempts_left === MAX_ATTEMPTS - 1, "token B: attempts_left=4");

    // Token B correct password works while A is still locked.
    const rBok = await verify(client, DEFAULT_PASSWORD, tokB);
    t.expect(rBok.ok === true, "token B: correct password succeeds while A locked");

    await resetAttempts(client, tokA);
    await resetAttempts(client, tokB);
  }

  process.exit(t.summary() ? 0 : 1);
};

main().catch((e) => {
  console.error("\n💥 RPC test crashed:", e);
  process.exit(1);
});
