/**
 * Shared helpers for the event-password test suite.
 *
 * Uses the public anon key (the same one the browser uses) and a set of
 * test-only RPCs that are hard-restricted to the seeded test event:
 *   - _test_reset_event_password_attempts(event_id, session_token?)
 *   - _test_age_event_password_attempts(event_id, session_token, seconds)
 *   - _test_set_event_password(event_id, password)
 *
 * Tests stay deterministic by "aging" attempt timestamps backwards instead
 * of waiting for the real 5-minute cooldown.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Env overrides let CI / local point at a different project if ever needed.
// Defaults match the live Lovable Cloud project the app is wired to. The
// test-only RPCs are SECURITY DEFINER and hard-restricted to the seeded test
// event UUID, so the anon key is sufficient — no service role required.
export const SUPABASE_URL =
  process.env.LOCKOUT_TEST_SUPABASE_URL ?? "https://nfjavjfxgxrpvieinpdp.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.LOCKOUT_TEST_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mamF2amZ4Z3hycHZpZWlucGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDc4ODcsImV4cCI6MjA4MDAyMzg4N30.4JeTq8_D-g611y1ruIHFJwVmomnms6mNOWF6ORrkq0U";

export const EVENT_ID = "00000000-0000-0000-0000-00000000beef";
export const DEFAULT_PASSWORD = "lockout-test-pw";
export const COOLDOWN_SECONDS = 300; // mirrors v_window_seconds in the RPC
export const MAX_ATTEMPTS = 5;

export type VerifyResult = {
  ok?: boolean;
  locked?: boolean;
  attempts_left?: number;
  retry_after_seconds?: number;
  error?: string;
};

export const newClient = (): SupabaseClient =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export const randomToken = () => {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
};

export const verify = async (
  client: SupabaseClient,
  password: string,
  token: string,
): Promise<VerifyResult> => {
  const { data, error } = await client.rpc("verify_event_password", {
    p_event_id: EVENT_ID,
    p_password: password,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    p_session_token: token,
  } as any);
  if (error) throw new Error(`verify_event_password failed: ${error.message}`);
  return (data ?? {}) as VerifyResult;
};

/** Wipe attempt history (optionally narrowed to a single token). */
export const resetAttempts = async (client: SupabaseClient, token?: string) => {
  const { error } = await client.rpc("_test_reset_event_password_attempts", {
    p_event_id: EVENT_ID,
    p_session_token: token ?? null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  if (error) throw new Error(`reset failed: ${error.message}`);
};

/** Shift attempts backwards by `seconds` so a cooldown appears expired. */
export const ageAttempts = async (
  client: SupabaseClient,
  token: string,
  seconds: number,
): Promise<number> => {
  const { data, error } = await client.rpc("_test_age_event_password_attempts", {
    p_event_id: EVENT_ID,
    p_session_token: token,
    p_seconds: seconds,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  if (error) throw new Error(`age failed: ${error.message}`);
  return (data as number) ?? 0;
};

/** Rotate the test event's password. */
export const setPassword = async (client: SupabaseClient, password: string) => {
  const { error } = await client.rpc("_test_set_event_password", {
    p_event_id: EVENT_ID,
    p_password: password,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  if (error) throw new Error(`set password failed: ${error.message}`);
};

// ---- tiny assertion runner ------------------------------------------------
export class TestRunner {
  failed = 0;
  passed = 0;
  current = "";

  group(name: string) {
    this.current = name;
    console.log(`\n● ${name}`);
  }

  expect(cond: unknown, msg: string) {
    if (cond) {
      this.passed++;
      console.log(`  ✓ ${msg}`);
    } else {
      this.failed++;
      console.error(`  ✗ ${msg}  [in: ${this.current}]`);
    }
  }

  summary() {
    const total = this.passed + this.failed;
    console.log(
      `\n${this.failed === 0 ? "✅" : "❌"} ${this.passed}/${total} assertions passed` +
        (this.failed ? ` (${this.failed} failed)` : ""),
    );
    return this.failed === 0;
  }
}

/** Run N wrong attempts in order and return every response. */
export const runWrongAttempts = async (
  client: SupabaseClient,
  token: string,
  count: number,
): Promise<VerifyResult[]> => {
  const out: VerifyResult[] = [];
  for (let i = 1; i <= count; i++) {
    out.push(await verify(client, `wrong-${i}-${Date.now()}`, token));
  }
  return out;
};
