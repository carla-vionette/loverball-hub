# Loverball RSVP → Identity → Community Flow

A mobile-first, event-first onboarding journey that converts a shared invite link into a verified attendee, then a fan identity, then an active community member — without forcing a heavy profile before RSVP.

## Scope

8 mobile screens + state variations, built on the existing editorial design system (Deep Navy `#0A1128`, Coral `#FF4D3A`, Oswald headings, Poppins body, 20px radius). Phone-only auth via Supabase (already enabled). Routes live under `/e/:eventId` (event), `/rsvp/*` (flow), and `/welcome/*` (post-RSVP onboarding).

## Screens

**1. Invite landing — `/e/:eventId`** (extend existing `EventPublic.tsx`)
- Hero: cover image, host avatar + community name, title, date/time, location, attendee avatar stack ("Maya + 23 others going"), short description
- Sticky bottom RSVP bar (mobile): three pill buttons — **I'm in** (coral), **Interested** (outline), **Can't make it** (ghost)
- Tone: editorial magazine card, italic serif title, mono meta labels
- Microcopy: "Hosted by [Community] · [N] women going"

**2. RSVP identity capture — bottom sheet**
- Triggered by any RSVP button when unauthenticated
- Fields: First name, mobile number (E.164 with country picker, US default)
- Header: *"Lock in your spot"* — event title shown small above
- One primary button: **Send code** (coral). No password, no email.
- Footer microcopy: "We'll text a 6-digit code. No spam, ever."

**3. OTP verification — bottom sheet step 2**
- 6 separate digit inputs (autocomplete=`one-time-code`, inputmode=`numeric`)
- Auto-submit on 6 digits
- Links: *Resend code* (30s cooldown), *Edit number*, *Back*
- Event title chip stays pinned at top for context
- Error state: "That code didn't match. Try again or resend." inline coral text, shake animation

**4. RSVP confirmed — `/rsvp/confirmed/:eventId`**
- Full-screen success: large italic serif *"You're in."*
- Event card with date, time, location, "Add to calendar" + "Share with a friend" small actions
- Belonging copy: "Save the date — [N] other women are coming too."
- Primary CTA: **Create your fan identity** (coral, full-width)
- Secondary (small text link, muted): *Skip for now*

**5. Fan identity setup — `/welcome/identity`** (3 swipeable steps, progress dots)
- Step A: Display name + optional photo upload (skippable)
- Step B: City (autocomplete, default detected), favorite teams/leagues (chip multi-select, top 12 + search)
- Step C: *What are you looking for?* multi-select chips — Friends, Watch crew, Events, Networking, Group chat, Dating (clearly opt-in). Vibe prompt: *"What kind of fan are you?"* — 6 preset cards (Diehard, Casual, Culture, Stats nerd, Tailgater, New to it) + free text
- Headline: *"Find your people."* Per-step micro-headlines.
- Each step: **Continue**; final step: **Enter the community**

**6. Personalized community welcome — `/welcome/circles`**
- 4 sections, each a horizontal shelf:
  - **People you should meet** — 6 member cards based on city + teams overlap
  - **Your circles** — team groups + city group + interest groups
  - **Events nearby** — next 3 events matching teams/city
  - **Chats waiting** — event chat for the RSVP'd event, plus 1–2 team chats
- Header: *"Welcome to Loverball, [name]."*
- CTA: **Join your circles** (joins all suggested with one tap; individual toggles available)

**7. First community action — `/welcome/first-move`**
- Single full-bleed card prompting one of:
  - "Say hi in the [Event] chat" (default if RSVP'd)
  - "Introduce yourself in [City] circle"
  - "Follow [Host]"
  - "Invite a friend who'd love this"
- Pre-filled friendly intro text, edit before send
- Skip available; either path lands on `/feed`

**8. Progressive profile prompts — non-blocking**
- After 3 sessions or 24h, soft banner on `/profile`: "Finish your profile — add bio, role, socials"
- Inline drawer, never a gate

## State variations

| State | Handling |
|---|---|
| Returning user (session active) | Skip steps 2–3; RSVP immediately, jump to step 4 |
| Returning user (no session, known number) | After OTP, detect existing profile → skip step 5, go to step 6 |
| Event full | RSVP buttons become **Join waitlist** (coral) + capacity badge "Full · waitlist open" |
| Waitlist confirmed | Step 4 variant: *"You're on the list."* — different copy, same identity CTA |
| Guest approval required | Step 4 variant: *"Request sent."* — host approval status chip, email/SMS when approved |
| Skipped profile | Land on `/feed` with persistent dismissible top strip: "Finish your fan identity →" |
| Wrong OTP | Inline error + shake; 5 attempts then 60s lockout with resend |
| Resend rate-limit | "Hold on — try again in 30s" mono caption under resend link |
| OTP expired | "Code expired. Tap resend." auto-clears inputs |
| Network error | Toast with retry; sheet state preserved |

## Technical notes

- **Auth**: `supabase.auth.signInWithOtp({ phone })` + `verifyOtp({ phone, token, type: 'sms' })`. Phone provider already configured (Twilio secrets present).
- **Routing**: new routes added to `App.tsx` eagerly (per memory: eager-load primary routes). `RSVPFlowProvider` context holds intent + event ID across steps so refresh doesn't lose state (localStorage backup, matching existing `pending_rsvp_${eventId}` pattern in `EventRSVPDialog.tsx`).
- **DB**: reuse `events`, `event_rsvps`, `profiles`. Add `profiles.fan_vibe text`, `profiles.looking_for text[]` (migration). Waitlist uses existing `status='waitlisted'`. Approval uses existing `approval_status`.
- **Personalization (step 6)**: query `profiles` by overlapping `favorite_la_teams` + `city`, limited to 12, ranked by overlap count. Circles = team channels (from seeded channels) + city group + event chat.
- **Edge function**: extend `notify-attendee-status` for waitlist + approval transitions; reuse `send-sms-notification`.
- **Bottom sheets**: shadcn `Drawer` (mobile) / `Dialog` (desktop fallback). Sticky bottom bar uses `safe-area-inset-bottom`.
- **Existing `EventRSVPDialog.tsx`** (email/password) is replaced by the new phone-OTP sheet for the public invite path. Keep the old dialog for in-app authenticated flows or remove if unused — confirm before deleting.

## Design system

- All new screens use `C` tokens from `src/lib/editorialTheme.ts` — Deep Navy surfaces, Coral CTAs, Oswald display, Poppins body, italic serif for emotional headlines (per existing pattern in `EventRSVPDialog.tsx`)
- No fake data, no AI placeholder copy (per core memory)
- Avatar stacks use real profile photos or branded color blocks when missing
- Motion: framer-motion for sheet transitions, step progress, success state (italic headline fade + scale)

## Build order

1. Migration: add `looking_for`, `fan_vibe` to `profiles`
2. `RSVPFlowProvider` + new routes wired in `App.tsx`
3. Sticky bottom RSVP bar on `EventPublic.tsx`
4. Phone OTP sheet (steps 2–3) replacing email dialog on public path
5. Confirmation screen (step 4) + state variants (waitlist, approval)
6. Identity setup (step 5) — 3-step carousel
7. Community welcome (step 6) — personalization queries
8. First action (step 7) + progressive prompt banner (step 8)

## Open questions

- Should the old `EventRSVPDialog` (email/password) be removed from the public path entirely, or kept as a fallback when SMS fails?
- Step 5 "Dating" option — keep, or scope this flow to platonic only for v1?
- Approval-required events — should the identity flow run before or after host approval?
