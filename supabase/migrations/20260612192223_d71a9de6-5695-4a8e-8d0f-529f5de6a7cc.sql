-- =========================================================
-- 1. WATCH_LOCATIONS — bars, partner venues, community spots
-- =========================================================
CREATE TABLE public.watch_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  neighborhood text,
  city text NOT NULL,
  state text,
  address text,
  latitude double precision,
  longitude double precision,
  phone text,
  website text,
  image_url text,
  vibe_tags text[] NOT NULL DEFAULT '{}',
  leagues_supported text[] NOT NULL DEFAULT '{}',
  is_partner boolean NOT NULL DEFAULT false,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','pending','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX watch_locations_city_idx ON public.watch_locations (lower(city));
CREATE INDEX watch_locations_status_idx ON public.watch_locations (status);
CREATE INDEX watch_locations_vibe_tags_idx ON public.watch_locations USING gin (vibe_tags);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_locations TO authenticated;
GRANT SELECT ON public.watch_locations TO anon;
GRANT ALL ON public.watch_locations TO service_role;

ALTER TABLE public.watch_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved watch locations"
  ON public.watch_locations FOR SELECT
  USING (status = 'approved' OR submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can submit watch locations"
  ON public.watch_locations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND submitted_by = auth.uid()
    AND (is_partner = false)            -- partner flag is admin-only
    AND status IN ('pending','approved') -- members can't auto-reject
  );

CREATE POLICY "Members can edit their own pending submissions"
  ON public.watch_locations FOR UPDATE
  USING (submitted_by = auth.uid() AND status = 'pending')
  WITH CHECK (submitted_by = auth.uid() AND status = 'pending' AND is_partner = false);

CREATE POLICY "Members can delete their own pending submissions"
  ON public.watch_locations FOR DELETE
  USING (submitted_by = auth.uid() AND status = 'pending');

CREATE POLICY "Admins manage all watch locations"
  ON public.watch_locations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER watch_locations_updated_at
  BEFORE UPDATE ON public.watch_locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================
-- 2. WATCH_LOCATION_PINS — link a venue to an event or game
-- =========================================================
CREATE TABLE public.watch_location_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_location_id uuid NOT NULL REFERENCES public.watch_locations(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  external_game_id text,                     -- e.g. SeatGeek event id for sports games
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text,
  upvote_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','pending','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT watch_pins_target_present CHECK (event_id IS NOT NULL OR external_game_id IS NOT NULL),
  CONSTRAINT watch_pins_unique_event   UNIQUE (watch_location_id, event_id, submitted_by),
  CONSTRAINT watch_pins_unique_game    UNIQUE (watch_location_id, external_game_id, submitted_by)
);

CREATE INDEX watch_pins_event_idx       ON public.watch_location_pins (event_id);
CREATE INDEX watch_pins_external_idx    ON public.watch_location_pins (external_game_id);
CREATE INDEX watch_pins_location_idx    ON public.watch_location_pins (watch_location_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_location_pins TO authenticated;
GRANT SELECT ON public.watch_location_pins TO anon;
GRANT ALL ON public.watch_location_pins TO service_role;

ALTER TABLE public.watch_location_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved pins"
  ON public.watch_location_pins FOR SELECT
  USING (status = 'approved' OR submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can pin a watch location"
  ON public.watch_location_pins FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND submitted_by = auth.uid());

CREATE POLICY "Members can edit their own pins"
  ON public.watch_location_pins FOR UPDATE
  USING (submitted_by = auth.uid())
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Members can delete their own pins"
  ON public.watch_location_pins FOR DELETE
  USING (submitted_by = auth.uid());

CREATE POLICY "Admins manage all pins"
  ON public.watch_location_pins FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER watch_location_pins_updated_at
  BEFORE UPDATE ON public.watch_location_pins
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================
-- 3. WATCH_PIN_UPVOTES — one upvote per member per pin
-- =========================================================
CREATE TABLE public.watch_pin_upvotes (
  pin_id uuid NOT NULL REFERENCES public.watch_location_pins(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pin_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.watch_pin_upvotes TO authenticated;
GRANT ALL ON public.watch_pin_upvotes TO service_role;

ALTER TABLE public.watch_pin_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read all upvotes"
  ON public.watch_pin_upvotes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Members can upvote"
  ON public.watch_pin_upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can remove their upvote"
  ON public.watch_pin_upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Keep upvote_count in sync
CREATE OR REPLACE FUNCTION public.watch_pin_upvote_count_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.watch_location_pins
       SET upvote_count = upvote_count + 1
     WHERE id = NEW.pin_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.watch_location_pins
       SET upvote_count = GREATEST(0, upvote_count - 1)
     WHERE id = OLD.pin_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER watch_pin_upvotes_count_ins
  AFTER INSERT ON public.watch_pin_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.watch_pin_upvote_count_sync();

CREATE TRIGGER watch_pin_upvotes_count_del
  AFTER DELETE ON public.watch_pin_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.watch_pin_upvote_count_sync();

-- =========================================================
-- 4. profiles.fan_modes — drives personalization across app
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fan_modes text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profiles.fan_modes IS
  'Active fan modes for personalization. Allowed values: womens_first, stats, vibes, local';
