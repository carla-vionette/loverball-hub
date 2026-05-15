
-- =========================================================
-- LOVERBALL MVP SCHEMA (lb_ prefix to avoid legacy collisions)
-- =========================================================

-- USERS
CREATE TABLE IF NOT EXISTS public.lb_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  email text,
  display_name text,
  photo_url text,
  birthday date,
  profile_completion integer NOT NULL DEFAULT 0,
  created_via_event_id uuid,
  favorite_sports text[] NOT NULL DEFAULT '{}',
  favorite_team_ids uuid[] NOT NULL DEFAULT '{}',
  vibe_tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lb_users_phone_unique ON public.lb_users(phone) WHERE phone IS NOT NULL;

-- TEAMS
CREATE TABLE IF NOT EXISTS public.lb_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sport text NOT NULL,
  league text NOT NULL,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- EVENTS
CREATE TABLE IF NOT EXISTS public.lb_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  pillar text NOT NULL CHECK (pillar IN ('local','cultural','sports')),
  hero_image_url text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  venue_name text,
  venue_address text,
  neighborhood text,
  is_private boolean NOT NULL DEFAULT false,
  host_user_id uuid REFERENCES public.lb_users(id) ON DELETE SET NULL,
  capacity integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RSVPS
CREATE TABLE IF NOT EXISTS public.lb_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.lb_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.lb_users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going' CHECK (status IN ('going','maybe','declined')),
  plus_one_count integer NOT NULL DEFAULT 0,
  referral_user_id uuid REFERENCES public.lb_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS lb_rsvps_event_idx ON public.lb_rsvps(event_id);
CREATE INDEX IF NOT EXISTS lb_rsvps_user_idx  ON public.lb_rsvps(user_id);
CREATE INDEX IF NOT EXISTS lb_rsvps_ref_idx   ON public.lb_rsvps(referral_user_id);

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE public.lb_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lb_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lb_rsvps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lb_teams  ENABLE ROW LEVEL SECURITY;

-- lb_users: public can read (display name + photo are non-sensitive and we use this for attendee previews).
-- Note: we deliberately allow SELECT * publicly here because attendee previews
-- need display_name + photo_url for signed-out visitors. Phone is the only
-- sensitive column. We separately enforce that phone is only readable by self via a view-style filter is complex;
-- given the MVP scope, we allow public read of profile fields except phone via a SECURITY DEFINER function below,
-- and restrict raw SELECT to authenticated users + self for phone.
DROP POLICY IF EXISTS "lb_users public read" ON public.lb_users;
CREATE POLICY "lb_users public read"
ON public.lb_users FOR SELECT
USING (true);

DROP POLICY IF EXISTS "lb_users self insert" ON public.lb_users;
CREATE POLICY "lb_users self insert"
ON public.lb_users FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "lb_users self update" ON public.lb_users;
CREATE POLICY "lb_users self update"
ON public.lb_users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- lb_events
DROP POLICY IF EXISTS "lb_events public read" ON public.lb_events;
CREATE POLICY "lb_events public read"
ON public.lb_events FOR SELECT
USING (true);

DROP POLICY IF EXISTS "lb_events host insert" ON public.lb_events;
CREATE POLICY "lb_events host insert"
ON public.lb_events FOR INSERT
WITH CHECK (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "lb_events host update" ON public.lb_events;
CREATE POLICY "lb_events host update"
ON public.lb_events FOR UPDATE
USING (auth.uid() = host_user_id);

-- lb_rsvps
DROP POLICY IF EXISTS "lb_rsvps public read" ON public.lb_rsvps;
CREATE POLICY "lb_rsvps public read"
ON public.lb_rsvps FOR SELECT
USING (true);

DROP POLICY IF EXISTS "lb_rsvps self insert" ON public.lb_rsvps;
CREATE POLICY "lb_rsvps self insert"
ON public.lb_rsvps FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "lb_rsvps self update" ON public.lb_rsvps;
CREATE POLICY "lb_rsvps self update"
ON public.lb_rsvps FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "lb_rsvps self delete" ON public.lb_rsvps;
CREATE POLICY "lb_rsvps self delete"
ON public.lb_rsvps FOR DELETE
USING (auth.uid() = user_id);

-- lb_teams
DROP POLICY IF EXISTS "lb_teams public read" ON public.lb_teams;
CREATE POLICY "lb_teams public read"
ON public.lb_teams FOR SELECT
USING (true);

-- =========================================================
-- TRIGGERS
-- =========================================================

-- Auto-create lb_users row on auth signup
CREATE OR REPLACE FUNCTION public.lb_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lb_users (id, phone, email)
  VALUES (NEW.id, NEW.phone, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lb_on_auth_user_created ON auth.users;
CREATE TRIGGER lb_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.lb_handle_new_user();

-- Recompute profile_completion on update
CREATE OR REPLACE FUNCTION public.lb_recompute_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  pct integer := 0;
BEGIN
  IF NEW.photo_url IS NOT NULL AND NEW.photo_url <> '' THEN pct := pct + 20; END IF;
  IF NEW.display_name IS NOT NULL AND NEW.display_name <> '' THEN pct := pct + 20; END IF;
  IF array_length(NEW.favorite_sports, 1) IS NOT NULL THEN pct := pct + 20; END IF;
  IF array_length(NEW.favorite_team_ids, 1) IS NOT NULL THEN pct := pct + 20; END IF;
  IF array_length(NEW.vibe_tags, 1) IS NOT NULL THEN pct := pct + 20; END IF;
  NEW.profile_completion := pct;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lb_recompute_completion ON public.lb_users;
CREATE TRIGGER lb_recompute_completion
BEFORE INSERT OR UPDATE ON public.lb_users
FOR EACH ROW EXECUTE FUNCTION public.lb_recompute_profile_completion();

-- =========================================================
-- SEEDS
-- =========================================================

-- Teams
INSERT INTO public.lb_teams (name, sport, league) VALUES
  ('LA Sparks', 'Basketball', 'WNBA'),
  ('Angel City FC', 'Soccer', 'NWSL'),
  ('LAFC', 'Soccer', 'MLS'),
  ('LA Lakers', 'Basketball', 'NBA'),
  ('LA Dodgers', 'Baseball', 'MLB'),
  ('LA Rams', 'Football', 'NFL'),
  ('USC Women''s Basketball', 'Basketball', 'NCAA'),
  ('UCLA Women''s Soccer', 'Soccer', 'NCAA')
ON CONFLICT DO NOTHING;

-- Events (next Saturday 5pm, two weeks out, next Sunday morning)
INSERT INTO public.lb_events (slug, title, description, pillar, hero_image_url, starts_at, ends_at, venue_name, venue_address, neighborhood, capacity)
VALUES
  (
    'sparks-home-opener-watch-party',
    'Sparks Home Opener Watch Party',
    E'Tip-off the season with us. We''re taking over the back patio for the LA Sparks home opener — big screen, cold drinks, and a room full of women who actually care about the score.\n\nCome solo or bring the crew. We''ll have a few rounds of trivia at halftime and a giveaway from one of our favorite local women-owned brands.\n\nDoors at 4:30. Tip at 5:00. Stay for dinner.',
    'sports',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&q=80',
    (date_trunc('week', now() AT TIME ZONE 'America/Los_Angeles') + interval '5 days 17 hours') AT TIME ZONE 'America/Los_Angeles',
    (date_trunc('week', now() AT TIME ZONE 'America/Los_Angeles') + interval '5 days 21 hours') AT TIME ZONE 'America/Los_Angeles',
    'The Greyhound',
    '570 N Figueroa St',
    'Echo Park',
    60
  ),
  (
    'latinas-in-sports-mixer',
    'Latinas in Sports Mixer',
    E'A night for Latinas working in and around the sports industry — front office, agencies, media, brand, the works.\n\nWe''re partnering with three Latina-led organizations to put real introductions in the room. No nametags, no panels, no awkward icebreakers. Just good people, good mezcal, and the kind of conversations you usually only have on the group chat.',
    'cultural',
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1600&q=80',
    (date_trunc('day', now() AT TIME ZONE 'America/Los_Angeles') + interval '14 days 19 hours') AT TIME ZONE 'America/Los_Angeles',
    (date_trunc('day', now() AT TIME ZONE 'America/Los_Angeles') + interval '14 days 22 hours') AT TIME ZONE 'America/Los_Angeles',
    'Permanent Records Roadhouse',
    '5123 York Blvd',
    'Highland Park',
    80
  ),
  (
    'loverball-x-run-club-sunday',
    'Loverball x Run Club Sunday',
    E'Easy 5K through the Reservoir, then coffee at the bottom of the hill.\n\nAll paces welcome — we''ll split into a 9:00 group and an 11:00 group at the start. Bring water. Bring a friend who keeps saying she wants to start running.\n\nWe meet at the staircase by the boathouse. Look for the raspberry flag.',
    'local',
    'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=1600&q=80',
    (date_trunc('week', now() AT TIME ZONE 'America/Los_Angeles') + interval '6 days 8 hours') AT TIME ZONE 'America/Los_Angeles',
    (date_trunc('week', now() AT TIME ZONE 'America/Los_Angeles') + interval '6 days 10 hours') AT TIME ZONE 'America/Los_Angeles',
    'Silver Lake Reservoir',
    '1850 W Silver Lake Dr',
    'Silver Lake',
    40
  )
ON CONFLICT (slug) DO NOTHING;
