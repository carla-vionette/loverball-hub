# MVP Launch Cleanup Plan

This is a large, destructive refactor across ~80+ files. I'll execute it in ordered phases so the build stays green and nothing important breaks. Please confirm before I start.

## 1. Final Information Architecture

Bottom nav (mobile) + desktop nav:

| Tab | Route | Purpose |
|---|---|---|
| WATCH | `/feed` | Videos, stories, member posts, Loverball picks |
| EVENTS | `/events` | Browse, RSVP, attendees, chat, add to calendar |
| CLUB | `/club` | Members directory (replaces Starting XI) |
| PROFILE | `/profile` | Identity, quick actions, RSVPs, teams, scores, where to watch/buy/news |

All other top-level routes get removed or merged. Auth, legal, admin, event detail, member profile, settings, edit profile, messages, checkout success remain as supporting routes (not in nav).

## 2. Pages / Routes to DELETE

- `StartingXi.tsx`, `StartingXiProfile.tsx`, `StartingXiIncoming.tsx`, `ClubDrafts.tsx` and all `src/components/club/*` (Draft cards, Mutual celebration, Inbox)
- `Connect.tsx`, `Connections.tsx` (legacy, replaced by Club)
- `Members.tsx`, `MemberProfile.tsx` → consolidated into Club + reuse `/profile/:id`
- `Friends.tsx` → merged into Club as "Connections" view, or removed if redundant
- `Leaderboard.tsx`, `PricingPage.tsx`, `BillingPage.tsx`, `InvitesPage.tsx`, `InviteLanding.tsx`, `Membership.tsx`, `About.tsx`, `Contact.tsx` (keep only if linked from footer; remove from nav and lazy chunks otherwise — I'll keep legal pages + remove the rest)
- `Explore.tsx` → merged into Feed
- `FinishProfile.tsx` → merged into Onboarding
- `Inbox.tsx` → consolidated with `MessagesPage.tsx` / `DirectMessages.tsx` into a single Messages screen
- `lib/startingXiData.ts`, mock files no longer referenced

## 3. Components to DELETE / consolidate

- All `components/club/*` (Starting XI artifacts)
- `MySportsFeed`, `TrendingNews`, `WhatsHappeningNow` if not used on the 4 core pages — audit and remove unreferenced
- `EarlyAccessBanner`, `SponsorCard`, `ReferralLeaderboard`, `BadgeShelf`, `BadgeUnlockAnimation` if unused after profile simplification
- Consolidate duplicate messaging UIs (Inbox vs MessagesPage vs DirectMessages → one)

## 4. Per-section work

### PROFILE (`/profile`)
Reorganize into clear blocks:
- A. Header (avatar, name, city, membership tier)
- B. Quick actions row: Edit Profile · Messages · Settings · Log Out
- C. My Events (RSVPs, horizontal scroll)
- D. Favorite Teams (chips with link to team news)
- E. Live Scores (existing `ProfileScores`)
- F. Where to Watch / Tickets / News (compact preview, CTA → Watch)

Remove: long news feed, stats overview duplication, anything not in spec.

### EVENTS (`/events`)
- Search bar + simple filters (date / category / location)
- Event cards: title, date/time, venue, RSVP state, attendee count
- Primary CTA: RSVP. Secondary: View / Chat
- On detail: attendee list with "Add friend" + "Message", event chat, **Add to Calendar (ICS download)** — new utility `lib/ics.ts`

### CLUB (`/club`)
Brand-new page replacing Starting XI:
- Search bar
- Suggested members section (reuse `PeopleYouMayKnow` logic)
- Member grid/list: avatar, name, city, favorite teams, mutuals
- Actions per card: View Profile · Add · Message
- Route `/club/xi` and all sub-routes → redirect to `/club`
- Update bottom nav `path: "/club"` (currently `/club/xi`)

### WATCH (`/feed`)
- Tabs/pills: Following · Loverball Picks · Stories
- Stories row at top (existing `FeedStoriesPanel` / `StoriesSection`)
- Video feed below
- Upload entry point (existing `VideoUploadDialog`) gated to verified channels per existing policy
- Like/comment if already wired; otherwise skip

## 5. Technical Cleanup

- Update `BottomNav.tsx`: CLUB → `/club`, matches updated
- Update `App.tsx`: remove deleted route imports, add `/club/xi → /club` redirect, drop unused lazy chunks
- Run `rg` for references to each deleted file before deletion; fix imports
- Consolidate duplicate fetching in Profile (single hook combining RSVPs + teams + scores)
- Lazy-load heavy sections (scores, news preview) with Suspense
- Add loading/empty/error states for: Club list, Events list, Watch feed, Profile blocks
- Verify auth guards on `/profile`, RSVP actions, chat sends, uploads
- Run typecheck; fix all broken imports
- Mobile spacing pass: safe-area, 44px tap targets, sticky bottom-nav clearance

## 6. Database / backend

No schema changes planned. I will NOT drop tables (data preservation). I'll only stop reading from tables that back deleted features (e.g. `swipes`, `matches`, `chats`, `messages` if Starting XI was the only consumer — I'll verify; if DMs use `direct_messages` only, the match/chat tables become orphaned but safe to keep).

Edge functions: keep all current ones; remove none unless clearly unreferenced.

## 7. Deliverables (after execution)

1. List of deleted files
2. Final IA summary
3. Tech cleanup summary
4. Remaining launch risks

---

**Scope check before I proceed:**
- This will delete ~15–20 pages and ~10+ components. OK to proceed destructively?
- Keep legal pages (Privacy, Terms) accessible via footer? (recommended yes)
- Keep `/auth`, `/onboarding`, `/settings`, `/edit-profile`, `/messages`, `/event/:slug`, `/profile/:id`, `/admin/*`? (recommended yes — they're supporting routes, not nav)
- OK to drop `Membership`, `Pricing`, `Billing`, `Leaderboard`, `Invites`, `About`, `Contact` entirely for MVP?

Confirm and I'll execute in phases (nav + redirects → Club rebuild → Profile reorg → Events ICS → Watch tabs → delete dead files → typecheck).
