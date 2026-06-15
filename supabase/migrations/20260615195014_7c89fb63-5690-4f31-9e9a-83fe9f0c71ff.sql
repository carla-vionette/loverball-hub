
-- 1. Add display columns to watch_locations
ALTER TABLE public.watch_locations
  ADD COLUMN IF NOT EXISTS hours jsonb,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS rating numeric(2,1),
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0;

-- 2. game_watch_checkins
CREATE TABLE IF NOT EXISTS public.game_watch_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_game_id text,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  watch_location_id uuid REFERENCES public.watch_locations(id) ON DELETE SET NULL,
  place_external_id text,
  place_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '8 hours'),
  CONSTRAINT watch_checkin_target_present CHECK (external_game_id IS NOT NULL OR event_id IS NOT NULL),
  CONSTRAINT watch_checkin_venue_present CHECK (
    watch_location_id IS NOT NULL OR place_external_id IS NOT NULL OR (place_snapshot ? 'name')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_watch_checkin_user_game
  ON public.game_watch_checkins (user_id, external_game_id)
  WHERE external_game_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_watch_checkin_user_event
  ON public.game_watch_checkins (user_id, event_id)
  WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_watch_checkin_game ON public.game_watch_checkins (external_game_id) WHERE external_game_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_watch_checkin_event ON public.game_watch_checkins (event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_watch_checkin_expires ON public.game_watch_checkins (expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_watch_checkins TO authenticated;
GRANT ALL ON public.game_watch_checkins TO service_role;

ALTER TABLE public.game_watch_checkins ENABLE ROW LEVEL SECURITY;

-- Own rows: full access
DROP POLICY IF EXISTS "watch_checkins_own_select" ON public.game_watch_checkins;
CREATE POLICY "watch_checkins_own_select"
  ON public.game_watch_checkins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "watch_checkins_friends_select" ON public.game_watch_checkins;
CREATE POLICY "watch_checkins_friends_select"
  ON public.game_watch_checkins FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND ((f.requester_id = auth.uid() AND f.addressee_id = game_watch_checkins.user_id)
          OR (f.addressee_id = auth.uid() AND f.requester_id = game_watch_checkins.user_id))
    )
  );

DROP POLICY IF EXISTS "watch_checkins_own_insert" ON public.game_watch_checkins;
CREATE POLICY "watch_checkins_own_insert"
  ON public.game_watch_checkins FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "watch_checkins_own_update" ON public.game_watch_checkins;
CREATE POLICY "watch_checkins_own_update"
  ON public.game_watch_checkins FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "watch_checkins_own_delete" ON public.game_watch_checkins;
CREATE POLICY "watch_checkins_own_delete"
  ON public.game_watch_checkins FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_watch_checkins_updated_at ON public.game_watch_checkins;
CREATE TRIGGER trg_watch_checkins_updated_at
  BEFORE UPDATE ON public.game_watch_checkins
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Aggregate counts RPC (security definer, no PII)
CREATE OR REPLACE FUNCTION public.get_watch_checkin_counts(
  p_game_ids text[] DEFAULT NULL,
  p_event_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  external_game_id text,
  event_id uuid,
  watch_location_id uuid,
  place_external_id text,
  place_name text,
  watcher_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    c.external_game_id,
    c.event_id,
    c.watch_location_id,
    c.place_external_id,
    COALESCE(c.place_snapshot->>'name', wl.name) AS place_name,
    COUNT(*)::bigint AS watcher_count
  FROM public.game_watch_checkins c
  LEFT JOIN public.watch_locations wl ON wl.id = c.watch_location_id
  WHERE c.expires_at > now()
    AND (
      (p_game_ids IS NOT NULL AND c.external_game_id = ANY(p_game_ids))
      OR (p_event_ids IS NOT NULL AND c.event_id = ANY(p_event_ids))
    )
  GROUP BY c.external_game_id, c.event_id, c.watch_location_id, c.place_external_id,
           COALESCE(c.place_snapshot->>'name', wl.name)
$$;

GRANT EXECUTE ON FUNCTION public.get_watch_checkin_counts(text[], uuid[]) TO authenticated, anon;

-- 4. Friend check-ins RPC
CREATE OR REPLACE FUNCTION public.get_friend_watch_checkins(
  p_game_id text DEFAULT NULL,
  p_event_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  name text,
  profile_photo_url text,
  watch_location_id uuid,
  place_external_id text,
  place_name text,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    c.user_id,
    p.name,
    p.profile_photo_url,
    c.watch_location_id,
    c.place_external_id,
    COALESCE(c.place_snapshot->>'name', wl.name) AS place_name,
    c.created_at
  FROM public.game_watch_checkins c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.watch_locations wl ON wl.id = c.watch_location_id
  WHERE c.expires_at > now()
    AND auth.uid() IS NOT NULL
    AND (
      (p_game_id IS NOT NULL AND c.external_game_id = p_game_id)
      OR (p_event_id IS NOT NULL AND c.event_id = p_event_id)
    )
    AND EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND ((f.requester_id = auth.uid() AND f.addressee_id = c.user_id)
          OR (f.addressee_id = auth.uid() AND f.requester_id = c.user_id))
    )
$$;

GRANT EXECUTE ON FUNCTION public.get_friend_watch_checkins(text, uuid) TO authenticated;

-- 5. Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'game_watch_checkins'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.game_watch_checkins';
  END IF;
END $$;
