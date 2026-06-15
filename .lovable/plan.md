# Where-to-Watch v2 — Unified Member Experience

One reusable surface across Events, Game Detail, and Feed. Members always see something useful — never a blank watch section.

## 1. Component architecture

New shared component: `src/components/watch/WhereToWatchUnified.tsx`

```text
WhereToWatchUnified
├─ <Header>                "Where to Watch · {game/event title}"
├─ <SourceStrip>           shows active source: Live · Curated · Community
├─ <MyPick> (if checked-in) "You're watching at Greyhound · Change · Open chat"
├─ <FriendsRow>            "3 members watching · Mia + 2 friends going"
├─ <LocationList>          ranked WatchLocationCard[]
└─ <Footer>                "Suggest a spot" + source disclaimer
```

Wraps existing `WatchSpotsPanel`/`NearbySportsBars`/`WhereToWatch` logic into a single API:

```ts
<WhereToWatchUnified
  context={{ kind: 'game', externalGameId, league, homeTeam, awayTeam, startTime, lat, lng, city }}
  // OR kind: 'event' with eventId
  variant="full" | "compact"  // compact for Feed cards
/>
```

Old `WhereToWatch.tsx` and `NearbySportsBars.tsx` become thin wrappers calling the unified component (no breaking imports).

## 2. Data source priority (resolved server-side)

New edge function `where-to-watch-spots`:

```text
1. Official Loverball watch events  → events table where event_type='watch_party'
                                       AND (sport_tags ⊇ league OR team match)
                                       AND date ≈ game start time
2. Partner venues                    → watch_locations.is_partner=true, city match
3. Curated watch bars                → watch_locations.status='approved', city + league match
4. Community pins                    → watch_location_pins for this game (existing logic)
5. Google Places nearby sports bars  → existing nearby-sports-bars proxy
6. Static curated fallback           → src/data/laSportsBars.ts when city is LA, else
                                       generic "popular sports bars" suggestion list
```

Each result is normalized to `WatchSpot`:

```ts
type WatchSpot = {
  id: string;
  source: 'official' | 'partner' | 'curated' | 'community' | 'places' | 'fallback';
  name: string;
  neighborhood?: string;
  city: string;
  distanceMi?: number;
  rating?: number;
  reviewCount?: number;
  vibe?: string;            // short description
  vibeTags: string[];       // 'womens-sports-crowd', 'big-screens', 'sound-on', etc.
  lat?: number; lng?: number;
  website?: string;
  mapsUrl: string;
  watchingCount: number;    // members checked in for this game
  friendsWatching: { id: string; name: string; photo: string | null }[];
  rank: number;             // priority score for sorting
};
```

Ranking score: `sourceWeight(0–60) + distanceBoost + popularityBoost(watchingCount) + relevanceBoost(league/team match)`.

## 3. Surfaces

| Surface | Where | Variant |
|---|---|---|
| Events page | top of "Where are you watching?" module | `full` |
| Game Detail | "Where to watch" tab (already exists) | `full` |
| Feed | inside `ForYouTonight` card when a relevant game tonight | `compact` (top 3 spots only) |
| Profile `ProfileWhereToWatch` | replace internals with unified component | `compact` |

## 4. Card design (`WatchLocationCard`)

```text
┌──────────────────────────────────────────────────────┐
│ [PARTNER]   Greyhound Bar & Grill          ★ 4.6    │
│             Highland Park · 2.1 mi · 142 reviews    │
│             "WNBA on every screen, sound on"        │
│             #womens-sports-crowd #sound-on          │
│             ─────────────────────────────────────── │
│  ●●● 5 members watching · Mia + 2 friends going     │
│  [I'm watching here]  [Save] [Maps] [Share]         │
└──────────────────────────────────────────────────────┘
```

- Source badge top-left: official / partner / curated / community / nearby / suggested
- Distance hidden when unknown; rating hidden when 0
- Vibe chips capped at 3 visible, +N overflow
- CTAs are 44px tap targets, primary "I'm watching here" full-width on mobile <380px

## 5. Component states

| State | Trigger | UI |
|---|---|---|
| `loading` | initial fetch | 3 skeleton cards + "Finding spots near you…" |
| `live-ok` | Places + DB returned ≥1 spot | Source strip: "Live · powered by community + Google" |
| `places-failed-curated` | Places error, curated/community filled in | Banner: "Live nearby search is offline — showing our curated picks" |
| `no-local-suggested` | Zero in-city matches, showing generic fallback | "No strong nearby matches — try these popular spots, or suggest one" + CTA |
| `picked` | User checked in for this game | Sticky pill: "You're watching at {venue} · Change · Open chat" |
| `low-social` | watchingCount = 0 across all spots | Soft prompt: "Be the first to check in — your friends will see where you are" |
| `error-fatal` | All sources failed (rare) | Curated static list + "Refresh" |

## 6. "I'm watching here" action

New table `game_watch_checkins` (migration):

```text
columns: id, user_id, external_game_id (nullable), event_id (nullable),
         watch_location_id (nullable for ad-hoc places-only spot),
         place_external_id (text, for Google Places id),
         place_snapshot (jsonb: name/city/lat/lng captured at checkin),
         created_at, expires_at (= game start + 4h)
unique: (user_id, external_game_id) WHERE external_game_id NOT NULL
unique: (user_id, event_id)         WHERE event_id NOT NULL
RLS:
  - SELECT: authenticated may read aggregate counts via SECURITY DEFINER RPC only;
            row-level SELECT restricted to own rows + friends (via friendships)
  - INSERT/UPDATE/DELETE: auth.uid() = user_id
GRANT SELECT, INSERT, UPDATE, DELETE TO authenticated; ALL TO service_role.
```

RPCs:
- `get_watch_checkin_counts(game_ids[])` → `{game_id, location_key, count}` aggregated
- `get_friend_watch_checkins(game_id)` → friends' rows only (uses `friendships` table)

Flow on tap:
1. Optimistic update (count++, "Picked" badge on card)
2. Upsert into `game_watch_checkins` (replace prior pick for same game)
3. Toast: "You're watching at {venue}. Want to join the chat?" → CTA opens `/game/:id` chat tab
4. Realtime channel `watch:{externalGameId}` broadcasts the new aggregate so other open clients update

Auto-cleanup: pg_cron daily job deletes rows where `expires_at < now()`.

## 7. Social proof & filtering

- `friendsWatching` resolved from `get_friend_watch_checkins` (uses existing `friendships`)
- Vibe tags rendered as filter chips above the list: tapping `#womens-sports-crowd` filters list client-side
- Sort options: "Best match" (default ranking), "Closest", "Most members"
- Matching heuristics (server-side in edge function):
  - league/team relevance: spot's `leagues_supported` intersects `[league]` or vibe tag contains team slug
  - women's sports relevance: spot has tag `womens-sports-crowd` OR is_partner=true with WNBA/NWSL in leagues
  - distance: from user.zip → lat/lng (`profiles.latitude/longitude`) or event/game lat/lng
  - popularity: `watchingCount` last 30d
  - time relevance: only spots open during game window (uses `watch_locations.hours` json — added)

## 8. Migration summary

```sql
-- Add hours to watch_locations
ALTER TABLE public.watch_locations
  ADD COLUMN hours jsonb,
  ADD COLUMN short_description text,
  ADD COLUMN rating numeric(2,1),
  ADD COLUMN review_count integer DEFAULT 0;

-- Check-ins table (full grants + RLS as above)
CREATE TABLE public.game_watch_checkins (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_watch_checkins TO authenticated;
GRANT ALL ON public.game_watch_checkins TO service_role;
ALTER TABLE public.game_watch_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ;

-- Aggregate + friends RPCs (security definer)
CREATE FUNCTION public.get_watch_checkin_counts(...) ...;
CREATE FUNCTION public.get_friend_watch_checkins(...) ...;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_watch_checkins;
```

## 9. Microcopy

| State | Copy |
|---|---|
| Loading | "Finding the best spots to catch the game…" |
| Live ok | "Watch spots near you · updated just now" |
| Places failed | "Live search is napping — here are our trusted picks" |
| No local | "Nothing close by tonight. These spots usually pull a great women's-sports crowd." |
| Empty social | "Nobody's checked in yet — be the first and your friends will see you here." |
| Picked | "🍻 You're watching at {venue}. Tap to open the game chat." |
| Suggest CTA | "Know a great spot? Add it — we'll review and add to the map." |
| Friends row | "{firstName} + {n} friend{s} watching nearby" |

## 10. Files changed / created

**Created**
- `supabase/functions/where-to-watch-spots/index.ts` — unified resolver (calls Places, queries DB, ranks)
- `src/components/watch/WhereToWatchUnified.tsx`
- `src/components/watch/WatchLocationCard.tsx`
- `src/components/watch/useWatchSpots.ts` (React Query hook with realtime check-in subscription)
- `src/components/watch/WatchCheckInButton.tsx`
- Migration: `game_watch_checkins` + RPCs + watch_locations columns

**Modified**
- `src/pages/Events.tsx` — replace existing watch module with `<WhereToWatchUnified variant="full" context={...} />`
- `src/pages/GameDetail.tsx` — swap `WatchSpotsPanel` in "Where to watch" tab
- `src/components/profile/ForYouTonight.tsx` — add `variant="compact"` for relevant game
- `src/components/ProfileWhereToWatch.tsx` — internals replaced
- `src/components/WhereToWatch.tsx`, `src/components/NearbySportsBars.tsx` — thin re-export wrappers (no API break)

**Untouched**
- Admin surfaces (scope excluded)
- Existing `watch_locations`/`watch_location_pins`/`watch_pin_upvotes` schema (additive only)

## 11. Build order (sequential, each independently shippable)

1. DB migration (`game_watch_checkins`, RPCs, watch_locations columns)
2. `where-to-watch-spots` edge function with priority pipeline + Places fallback
3. `useWatchSpots` hook + `WatchLocationCard` + `WhereToWatchUnified` (full variant)
4. Wire Game Detail tab → ship & verify
5. Wire Events page module → ship & verify
6. Compact variant + Feed `ForYouTonight` integration
7. Realtime aggregate updates + friends row
8. Microcopy pass + analytics events (`watch_checkin`, `watch_spot_open_maps`, `watch_spot_share`)

Approve and I'll start with step 1 (migration).
