# Event Password Gate & Lockout

## What it does and why

Private events (`/e/:id`) are gated by an optional host-set password. The gate
lets the host share an event with a specific guest list without exposing the
attendee preview or RSVP affordances to the open web.

A failed-attempt lockout prevents brute-force guessing of weak host passwords.
Server-enforced, so clearing storage, refreshing, swapping browsers, or
changing the event password mid-lockout cannot bypass it.

## Thresholds & where to change them

| Setting          | Value         | Source of truth                                            |
| ---------------- | ------------- | ---------------------------------------------------------- |
| Max attempts     | **5**         | `v_max_attempts` in `verify_event_password` (migration)    |
| Cooldown window  | **5 minutes** | `v_window_seconds` in `verify_event_password` (migration)  |
| Client mirror    | same          | `MAX_ATTEMPTS` / `LOCKOUT_MS` in `eventPasswordGate.logic` |

To change thresholds safely:

1. Update the constants inside `verify_event_password` via a new migration.
2. Mirror them in `src/components/eventPasswordGate.logic.ts`. The client
   constants are only used for fallback copy / UI tick rate; the server value
   always wins because the lockout deadline is computed from
   `retry_after_seconds` returned by the RPC.
3. Re-run the e2e and unit tests.

## Server-side identifier & attempts table

The `event_password_attempts` table stores one row per attempt:
`(event_id, identifier, success, attempted_at)`.

The identifier is computed inside `verify_event_password`:

- Signed-in users → `u:<auth.uid()>` (device/browser swap cannot bypass).
- Anonymous users → `s:<session_token>` (a 32-hex-char token persisted in
  `localStorage` under `event_pw_session_token`).

Lockout is "5 failed attempts in 5 minutes for the same (event_id,
identifier)". A successful attempt clears that identifier's failure history.

User-facing copy never mentions accounts, emails, or whether the password was
"close" — only the password and the cooldown window — to avoid leaking
account-validity signals.

## State machine (client)

| State              | Trigger                                          |
| ------------------ | ------------------------------------------------ |
| `idle`             | First load, or after a successful unlock         |
| `wrong`            | Server returned `ok=false`, `attempts_left ≥ 2`  |
| `last_attempt`     | Server returned `attempts_left === 1`            |
| `locked`           | Server returned `locked=true`                    |
| `cooldown_expired` | Local `lockedUntil` has passed; ready to try    |

All transitions are pure functions in `src/components/eventPasswordGate.logic.ts`
and covered by unit tests in
`src/components/__tests__/eventPasswordGate.logic.test.ts`.

## Running tests locally

```bash
# Unit tests for the gate logic state machine (fast, deterministic).
bunx vitest run src/components/__tests__/eventPasswordGate.logic.test.ts

# End-to-end test that exercises the live Lovable Cloud RPC.
bun run test:e2e:lockout

# Same e2e wrapped in the CI retry harness (transient-only retries).
bun run test:e2e:lockout:ci
```

The e2e test seeds two test events via migrations
`2026...163848` and `2026...174629` and uses the fixed event id
`00000000-0000-0000-0000-00000000beef` with password `lockout-test-pw`.

## CI workflow

`.github/workflows/test-event-password-lockout.yml` runs on every PR.

Highlights:

- **Pinned versions** (`BUN_VERSION`, `NODE_VERSION` in the workflow `env`).
  Bump in a standalone PR.
- **Bun cache** keyed on `OS + Bun version + hash(bun.lockb, bun.lock,
  package.json)` for fast installs.
- **Retries for transient errors only** via `scripts/run-with-retry.ts`. Real
  assertion failures (`✗`, `assertion(s) failed`) are never retried.
- **Failure artifact** `event-password-lockout-e2e-logs` uploads
  `e2e-lockout.log` for triage when the job fails.

### Marking as required

The job name is `event-password-lockout-e2e`. In GitHub:
**Settings → Branches → Branch protection rules → main → Require status
checks → search "event-password-lockout-e2e" → check it.**

## Backward compatibility

- Existing events with no password (`password_required = false`) are
  unaffected — the RPC short-circuits and returns `ok: true`.
- The legacy boolean overload of `verify_event_password` still exists for any
  caller that hasn't been updated, but the gate UI now uses the JSON overload.
- No schema changes were made in this refactor; only client and CI files were
  touched.
