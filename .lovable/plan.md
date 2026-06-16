# Events Section Rebuild

A full replacement of the Events list + detail experience around one rule:
**the 50-mile radius decides whether a user can RSVP as Going to the venue, or
only as Watching at a nearby bar.**

I'm mapping the spec onto tables you already have instead of creating parallel
ones — the schema you described is essentially already in the DB under
different names. Nothing about the current behavior is preserved; the visible
Events screens and the RSVP UI are torn out and replaced.

## Scope

**In:** `/events` list, `/event/:id` detail, event card, bar picker sheet,
going graph (stadium + watch parties by bar grouped and sorted by proximity to
viewer), realtime event chat, attendee profile preview with Add + DM.

**Out (reused, not rebuilt):** auth, profiles, friend/connection system, DM
threads, admin event editor, ticket/checkout, event submissions flow.

## The 50-mile rule

A single helper `getEventDistanceMiles(event, viewer)` (Haversine) is the only
gate. Used in three places:

1. Event card — decides whether to render `Going` button at all.
2. Event detail RSVP control — same.
3. Going graph "At the venue" list — shown to everyone; not viewer-gated.

Out-of-radius events render Watching only. Going is *absent*, not disabled.

If the viewer has no coords, both buttons show (we can't gate without a
location); a small "Set your location" nudge sits next to the RSVP row, linking
to the existing zip-prompt.

## Data — using what's already there

No new tables. Tiny additive migration only:

- `events.location_lat`, `events.location_lng` — already exist.
- `event_rsvps.rsvp_type` (`stadium` | `bar`) — already exists, maps to
  `going` / `watching`.
- `event_rsvps.bar_id`, `bar_name` — already exist; we extend with a real FK.
- `watch_locations` — already the "watch_spots" table (lat/lng/city).
- `event_chat_messages` — already exists, used as the going chat.

Migration adds:

- `event_rsvps.watch_location_id uuid references watch_locations(id)` (nullable;
  required when `rsvp_type = 'bar'` via a trigger).
- Postgres function `public.distance_miles(lat1, lng1, lat2, lng2) returns
  double precision` (Haversine, immutable) — used by an RPC for the going graph
  so distance sort happens server-side.
- RPC `get_event_going_graph(p_event_id uuid, p_viewer_lat, p_viewer_lng)`
  returning two result sets folded into JSON: `stadium` attendees and
  `watch_parties` (array of `{ watch_location, distance_mi, attendees[] }`
  sorted by distance from viewer). Joins `profiles` for avatar/name only —
  no PII — and respects the existing `event_rsvps` SELECT policies.
- Add `event_chat_messages` to `supabase_realtime` publication.
- RLS confirmed: read for any authenticated user on a public event; insert
  restricted to users with a non-canceled `event_rsvps` row for that event.

## Screens

### `/events` — list

- Editorial header: "Events" (Playfair) + user city subhead.
- Filter chips: All / Sports / Culture / Loverball — drive a single query
  param. No heavy sidebar.
- Vertical feed sorted by `event_date` ascending, in-radius first then
  out-of-radius. Skeleton cards while loading. Editorial empty state.
- **Card** (whole card tappable to detail):
  - Left 4px accent bar + small tag, color by `event_type`:
    `external_sports` → black, `curated_culture` → teal,
    `loverball_hosted` → raspberry.
  - Banner image (with branded gradient fallback — no AI imagery).
  - Playfair title, date · time, venue name, distance ("8 mi" or "Watch only").
  - Inline RSVP row:
    - In radius: `Going` (raspberry filled when active) + `Watching` (outline).
    - Out of radius: `Watching` only.
    - Tapping `Going` writes RSVP optimistically.
    - Tapping `Watching` opens the bar picker sheet.
    - If already RSVP'd, the active button is filled and shows a tiny "Change"
      affordance; long-press / overflow gives "Cancel RSVP".

### Bar picker sheet (shared, used from card + detail)

- Bottom sheet titled "Where are you watching?"
- Queries `watch_locations` near the viewer (by `distance_miles`), closest
  first. Each row: name, neighborhood, distance, image, vibe tags.
- Search input at top for filtering by name.
- Confirm = upsert `event_rsvps` with `rsvp_type='bar'`, `watch_location_id`,
  and `bar_name` snapshot.
- Empty state: "No watch spots listed near you yet — RSVP as watching anyway?"
  with a single confirm button that writes the RSVP with `watch_location_id`
  null. Never a dead end.

### `/event/:id` — detail

Sections, top to bottom:

1. **Header** — banner image, title (Playfair), league, date/time, venue,
   type tag, distance.
2. **Your RSVP** — Same Going/Watching control with the 50-mile rule. Active
   state obvious. If watching, shows the chosen bar with "change". One
   "Cancel RSVP" link.
3. **Who's Going** — the going graph, two clearly separated groups:
   - **At the venue · N** — stadium icon, avatar/name grid of everyone with
     `rsvp_type='stadium'`. Tap → profile preview.
   - **Watch parties · N** — for each bar with attendees, a card showing:
     bar name, distance from viewer, attendee count, avatar stack.
     Sorted closest-first to viewer. First 3 expanded, rest collapsed
     under "More watch parties".
   - Empty states for each group, never blank.
4. **Event chat** — tab inside the detail labeled "Going chat". Realtime on
   `event_chat_messages`. Composer pinned at bottom; auto-scroll. Only
   RSVP'd users can post (server-enforced); non-RSVP'd see a read-only view
   with "RSVP to join the chat" CTA. Tap avatar → profile preview.

### Profile preview sheet

Opens from any avatar/name (going graph or chat). Shows avatar, name, city,
public profile bits via existing `get_safe_profile` RPC. Two real actions:

- **Add** — wires the existing `friendships` flow; reflects Add → Requested →
  Connected.
- **DM** — routes to the existing `/messages` thread with that user.

No placeholder buttons anywhere.

## Files

**New / replaced:**

- `src/pages/Events.tsx` — replaced.
- `src/pages/EventDetail.tsx` — replaced.
- `src/components/events/EventCard.tsx` — new.
- `src/components/events/RsvpControl.tsx` — new, shared.
- `src/components/events/BarPickerSheet.tsx` — new.
- `src/components/events/GoingGraph.tsx` — new.
- `src/components/events/EventChatPanel.tsx` — new (wraps existing
  `EventChatThread` with the RSVP gate + composer).
- `src/components/events/ProfilePreviewSheet.tsx` — new (uses existing
  `useFriendships` and DM route).
- `src/hooks/useEventRsvp.ts` — new, single source of truth for RSVP state +
  mutations, optimistic.
- `src/hooks/useGoingGraph.ts` — new, calls the new RPC, viewer-aware.
- `src/lib/distance.ts` — `haversineMiles`, `formatMiles`.

**Removed:** the current `EventDetail.tsx` inline RSVP UI, the old
`WhoElseGoingTabs.tsx`, and the mock-attendee fallbacks in those files. Any
references in `Feed.tsx` / sidebar to the old components are repointed.

**Migration:** one new file adding the column, FK, validation trigger,
distance function, RPC, and realtime publication entry.

## Audit before finishing

- Run `rg` for every `to=`/`href=`/`navigate(` introduced; confirm each
  resolves to a real route (`/event/:id`, `/profile/:id`, `/messages`,
  `/edit-profile`).
- Manual click-through in the preview: list → card → detail → RSVP both
  modes → bar picker → going graph avatar → profile preview → Add → DM.
- Typecheck/build via the harness.

## Notes / open questions I'm resolving without asking

- Treating Watch parties as **always viewer-proximity sorted**, but never
  hidden — far bars collapse, they don't disappear, so a user watching with
  far-away friends still sees them.
- "At the venue" list is **not** viewer-distance gated — if you're at the
  game you're at the game.
- If the user has no saved coords, the 50-mile rule defaults to *showing
  both buttons* and surfacing a zip nudge, so we never silently strip the
  Going option.
