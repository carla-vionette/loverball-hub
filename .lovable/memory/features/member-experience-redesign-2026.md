---
name: Member Experience Redesign 2026
description: Logged-in member surfaces — Feed daily home, Profile dashboard, Events full schedule, Game Detail tabbed Where-to-Watch, 4-mode personalization (women's-first/stats/vibes/local) persisted to profiles.fan_modes
type: feature
---

## Surfaces & layout

**Feed (`/feed`)** — daily home base.
Sections in order: Greeting → PersonalizationControls (4 fan modes) → ForYouTonight (1 game + 1 story + 1 event) → Live Now (ProfileScores) → Tonight (ProfileWhereToWatch + RSVPs) → News You'll Care About (MySportsFeed) → Plans Nearby (SmartEvents). Every section header carries a "Because you follow X" explanation label tied to the member's profile teams/sports/city.

**Profile (`/profile`)** — personalized dashboard, not an account page.
Composes ForYouTonight, SmartEvents, SuggestedFans, PersonalizationControls. Vibe bio is hero-level identity. Empty events state surfaces SmartEvents recommendations rather than going blank.

**Events (`/events`)** — curated + complete.
Default view: next 30 days, Schedule mode, grouped by date with collapsible day sections. Highlights/Schedule toggle. Date presets (Tonight/Weekend/7d/30d/All). Removable filter pills. "Showing X of Y upcoming events · within R mi of City" transparency line. Empty state only fires when truly zero and offers a "See all upcoming" reset.

**Game Detail (`/game/:id`)** — segmented tabs: Going · Where to watch · Chat.
Hero adds Share + Add to calendar quick actions. Chat empty state seeds 4 prompt chips ("Who's going in person?", "Where is everyone watching?", "Best pregame meetup?", "Anyone coming solo?").

## Personalization (4 fan modes)

Stored as `profiles.fan_modes text[]` with values: `womens_first`, `stats`, `vibes`, `local`. `useFanMode()` hook (`PersonalizationControls.tsx`) hydrates from localStorage instantly, then syncs from DB on auth, and fires-and-forgets writes on toggle. Defaults: women's-first + vibes + local on, stats off.

## Where-to-Watch data model

Three new tables (created 2026 migration):

- **`watch_locations`** — bars/partner venues/community spots. Columns: name, neighborhood, city, state, address, lat/lng, website, image_url, `vibe_tags text[]` (women's sports crowd, big screens, sound on, solo-friendly, good for groups, official watch party), `leagues_supported text[]`, `is_partner boolean` (admin-only), `submitted_by` (null = official), `status` (approved/pending/rejected). Members can submit `status='pending'`; only admins can flip `is_partner=true` or approve.

- **`watch_location_pins`** — links a location to either an event (`event_id`) or external sports game (`external_game_id`, e.g. SeatGeek id). Has `note`, `upvote_count`, `status`. CHECK constraint enforces one of the two targets is present. UNIQUE per (location, target, submitter).

- **`watch_pin_upvotes`** — composite PK `(pin_id, user_id)`. Trigger `watch_pin_upvote_count_sync` keeps `watch_location_pins.upvote_count` in sync.

`WatchSpotsPanel` component (`src/components/game/WatchSpotsPanel.tsx`) is the single consumer. Renders approved pins sorted by upvotes; empty state queries `watch_locations` in the same city as suggestions with a "Pin this" CTA; "Suggest a spot" dialog creates a `pending` location + a pin in one round trip.

## Curation labels used across surfaces

"Because you follow {team}" · "Picked for {sport} fans" · "Women's sports crowd" · "Near you" · "Popular in {city}" · "Big social energy" (≥12 RSVPs) · "Popular this week" (≥5 RSVPs) · "Good for solo fans" · "Community + connection" · "Loverball pick" (fallback for first card).

## Empty-state rule

No surface ever shows a passive "nothing here" message. Each empty state offers a next action: suggested events when no RSVPs, nearby bars when no pins, seeded chat prompts when no messages, "See all upcoming" reset when filters over-narrow.
