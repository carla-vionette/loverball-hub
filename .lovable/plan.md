
# Loverball Events + RSVP + Identity + Community — Build Plan

This is a large, multi-system build. Much of Phase 1 already exists in the codebase (phone OTP RSVP sheet, RsvpConfirmed, WelcomeIdentity, WelcomeCircles, WelcomeFirstMove, sticky bottom bar on EventPublic). I will extend rather than rebuild, and ship the rest in clearly scoped phases so each can be reviewed before the next runs.

## What already exists (verified)
- `EventPublic.tsx` — public event page with sticky mobile RSVP bar
- `RsvpPhoneSheet.tsx` — first name + phone + 6-digit OTP via `supabase.auth.signInWithOtp`
- `RsvpConfirmed.tsx` → `WelcomeIdentity` (3-step) → `WelcomeCircles` → `WelcomeFirstMove`
- `events` table with `capacity`, `rsvp_approval_required`, `guest_visibility`, `allow_plus_ones`, `co_host_ids`, `visibility`
- `event_rsvps` with `status`, `plus_ones`, `guest_name`, `guest_phone`
- `admin_get_event_attendees` RPC, `AdminAttendeeManager` page
- Lovable AI Gateway, Twilio SMS, Resend email all wired

## Phase 1 — Event-first landing polish (frontend only)
Goal: make the public event page genuinely persuasive for a logged-out visitor.
- Editorial hero (cover, host/community line, italic-serif title, mono date/venue, attendee avatar stack with "12 women from [city] going")
- Respect host privacy: hide guest list/count when `guest_visibility=false`
- Password gate UI (when `events.password_required`) — protected sections blurred until verified
- Sticky bottom CTA bar: **I'm in** / **Interested** / **Can't go** + Share / Save / Add to calendar secondary row
- Capacity & waitlist state on the buttons: "Full · join waitlist" when capacity reached
- Logged-out teaser vs. unlocked-after-RSVP sections clearly delineated

## Phase 2 — Backend: event settings, waitlist, approval, invites
One migration that:
- Adds to `events`: `waitlist_enabled bool`, `plus_one_limit int`, `open_invite_enabled bool`, `allow_mutual_invites bool`, `password_hash text`, `show_guest_count bool`, `anonymize_guest_list bool`, `hide_activity_timestamps bool`, `allow_photo_uploads bool`
- Adds to `event_rsvps`: `approval_status text` (not_required|pending|approved|waitlisted|removed|blocked), `attendance_status text`, `identity_completed_at timestamptz`, `invited_by_user_id uuid`, `invite_id uuid`, `waitlist_position int`
- Creates `event_invites` (id, event_id, invite_type, recipient_phone, recipient_email, invite_link_token, sent_by_user_id, source, status, created_at) with GRANTs + RLS
- Server-side `rsvp_to_event(event_id, plus_ones)` RPC that applies the policy engine (approval / capacity / waitlist) atomically — prevents race conditions on capacity
- `promote_from_waitlist(event_id)` RPC for hosts/cohosts
- `verify_event_password(event_id, password)` RPC (constant-time check)

## Phase 3 — RSVP confirmation state variants
Extend `RsvpConfirmed.tsx` to render the correct copy for each approval/attendance state:
- approved → "You're in"
- pending → "Request sent" with what-happens-next
- waitlisted → "You're on the list" + position
- removed/blocked → friendly dead-end

## Phase 4 — Host dashboard upgrade
Extend `AdminAttendeeManager.tsx` (or a new `/events/:id/manage` host-facing page) with:
- Tabs: All / Going / Interested / Pending / Waitlist / Approved / Checked-in / Declined / Removed
- Row actions: approve, waitlist, remove, promote, manual check-in, edit plus-ones
- Inline event settings drawer: capacity, waitlist toggle, approval toggle, plus-one limit, guest-list visibility, guest-count visibility, password, mutual invites
- Cohost-aware permissions (uses `events.co_host_ids`)
- Counts header by state
- Mobile-first layout; desktop is the wider variant

## Phase 5 — Community unlock & post-RSVP retention
- After identity setup, `WelcomeCircles` already shows people/circles/events — extend personalization queries to include `looking_for` and `favorite_la_teams` overlap ranking
- Add a `welcome_sequence` edge function scheduled via existing patterns:
  - Day 0: welcome SMS + first-action prompt (already partly in `WelcomeFirstMove`)
  - Day 2: relevant community groups
  - Day 5: another event suggestion
  - Day 7: profile completion nudge if `identity_completed_at` null
- Soft progressive-profile banner on `/profile` and `/feed` (dismissible, never a gate)

## Phase 6 — Event chat access gating
- Update `ChatRoom.tsx` to check the requesting user's `event_rsvps.approval_status` against host's "chat access" setting (new `events.chat_access` enum: `approved_only` | `all_rsvps` | `verified_only`)
- RLS-enforced via a `can_access_event_chat(user, event)` SQL function

## Phase 7 — Edge cases & polish
- Wrong OTP / delayed SMS / resend cooldown copy
- Event canceled state
- User suspended/blocked
- Plus-one overflow handling
- "RSVP changed later" — `event_rsvps.status` updatable, recompute approval/waitlist on change
- Accessibility, motion, brand QA pass

## Execution rules
- Use existing editorial tokens (Deep Navy `#0A1128`, Coral `#FF4D3A`, Oswald/Poppins, 20px radius) — no new color systems
- No fake data anywhere (per core memory) — empty states use real copy + branded blocks
- Every migration creates GRANTs in the same file
- Phone OTP only — no email/password rework
- One phase per turn; I will pause after each for review

## Open questions (will assume defaults unless you say otherwise)
1. **Password protection** — keep as a real feature or scope cut for v1? (Default: build the field + gate UI, leave host UI for later)
2. **Mutual invites** — track inviter relationship only, or full invite-graph viral mechanics? (Default: track only)
3. **Event chat gating default** — `approved_only`? (Default: yes)
4. **Day-2/5/7 nudges** — SMS, in-app, or both? (Default: in-app notification + SMS only for Day 0 + Day 7)

## Starting point
On approval I'll start with **Phase 1** (event-first landing polish, pure frontend) so you can see the visible direction before we touch the schema in Phase 2.
