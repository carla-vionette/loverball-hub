-- 1. Add real FK from event_rsvps to watch_locations for "watching" RSVPs.
ALTER TABLE public.event_rsvps
  ADD COLUMN IF NOT EXISTS watch_location_id uuid REFERENCES public.watch_locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS event_rsvps_watch_location_idx
  ON public.event_rsvps(watch_location_id)
  WHERE watch_location_id IS NOT NULL;

-- 2. Haversine distance helper (miles). Immutable so it can be used in any context.
CREATE OR REPLACE FUNCTION public.distance_miles(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
) RETURNS double precision
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN NULL
    ELSE 3958.8 * 2 * asin(sqrt(
      power(sin(radians((lat2 - lat1) / 2)), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      power(sin(radians((lng2 - lng1) / 2)), 2)
    ))
  END
$$;

GRANT EXECUTE ON FUNCTION public.distance_miles(double precision, double precision, double precision, double precision)
  TO anon, authenticated, service_role;

-- 3. Going-graph RPC: returns stadium attendees + watch parties grouped by bar,
-- with each bar's distance from the viewer's coords. Avatars/names only — no PII.
CREATE OR REPLACE FUNCTION public.get_event_going_graph(
  p_event_id uuid,
  p_viewer_lat double precision DEFAULT NULL,
  p_viewer_lng double precision DEFAULT NULL
) RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH attendees AS (
    SELECT
      r.user_id,
      r.rsvp_type,
      r.watch_location_id,
      r.bar_name,
      p.name,
      p.profile_photo_url,
      p.city
    FROM public.event_rsvps r
    LEFT JOIN public.profiles p ON p.id = r.user_id
    WHERE r.event_id = p_event_id
      AND r.status IN ('attending','approved','confirmed','going')
      AND auth.uid() IS NOT NULL
  ),
  stadium AS (
    SELECT jsonb_agg(jsonb_build_object(
      'id', a.user_id,
      'name', COALESCE(a.name, 'Member'),
      'profile_photo_url', a.profile_photo_url,
      'city', a.city
    ) ORDER BY a.name NULLS LAST) AS list,
    COUNT(*)::int AS total
    FROM attendees a
    WHERE a.rsvp_type = 'stadium'
  ),
  watch_groups AS (
    SELECT
      COALESCE(a.watch_location_id::text, 'unspecified-' || COALESCE(a.bar_name, '')) AS group_key,
      a.watch_location_id,
      COALESCE(wl.name, a.bar_name) AS bar_name,
      wl.neighborhood,
      wl.city AS bar_city,
      wl.image_url,
      wl.latitude AS bar_lat,
      wl.longitude AS bar_lng,
      CASE
        WHEN p_viewer_lat IS NOT NULL AND p_viewer_lng IS NOT NULL AND wl.latitude IS NOT NULL AND wl.longitude IS NOT NULL
        THEN public.distance_miles(p_viewer_lat, p_viewer_lng, wl.latitude, wl.longitude)
        ELSE NULL
      END AS distance_mi,
      jsonb_agg(jsonb_build_object(
        'id', a.user_id,
        'name', COALESCE(a.name, 'Member'),
        'profile_photo_url', a.profile_photo_url
      ) ORDER BY a.name NULLS LAST) AS attendees,
      COUNT(*)::int AS attendee_count
    FROM attendees a
    LEFT JOIN public.watch_locations wl ON wl.id = a.watch_location_id
    WHERE a.rsvp_type = 'bar'
    GROUP BY group_key, a.watch_location_id, wl.name, a.bar_name, wl.neighborhood, wl.city, wl.image_url, wl.latitude, wl.longitude
  ),
  watch_parties AS (
    SELECT jsonb_agg(jsonb_build_object(
      'watch_location_id', wg.watch_location_id,
      'bar_name', wg.bar_name,
      'neighborhood', wg.neighborhood,
      'city', wg.bar_city,
      'image_url', wg.image_url,
      'distance_mi', wg.distance_mi,
      'attendee_count', wg.attendee_count,
      'attendees', wg.attendees
    ) ORDER BY wg.distance_mi NULLS LAST, wg.attendee_count DESC) AS list,
    COALESCE(SUM(wg.attendee_count), 0)::int AS total
    FROM watch_groups wg
  )
  SELECT jsonb_build_object(
    'stadium', jsonb_build_object(
      'attendees', COALESCE((SELECT list FROM stadium), '[]'::jsonb),
      'total', COALESCE((SELECT total FROM stadium), 0)
    ),
    'watch_parties', jsonb_build_object(
      'groups', COALESCE((SELECT list FROM watch_parties), '[]'::jsonb),
      'total', COALESCE((SELECT total FROM watch_parties), 0)
    )
  )
$$;

GRANT EXECUTE ON FUNCTION public.get_event_going_graph(uuid, double precision, double precision)
  TO authenticated, service_role;

-- 4. Confirm event_chat_messages is in realtime publication (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'event_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_chat_messages;
  END IF;
END $$;