-- 1) Add stadium/bar fields to event RSVPs
ALTER TABLE public.event_rsvps
  ADD COLUMN IF NOT EXISTS rsvp_type text,
  ADD COLUMN IF NOT EXISTS bar_id text,
  ADD COLUMN IF NOT EXISTS bar_name text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_rsvps_rsvp_type_check'
  ) THEN
    ALTER TABLE public.event_rsvps
      ADD CONSTRAINT event_rsvps_rsvp_type_check
      CHECK (rsvp_type IS NULL OR rsvp_type IN ('stadium','bar'));
  END IF;
END $$;

-- 2) RPC: attendees with their stadium/bar choice, gated to signed-in callers
CREATE OR REPLACE FUNCTION public.get_event_attendee_breakdown(p_event_id uuid)
RETURNS TABLE (
  user_id uuid,
  name text,
  profile_photo_url text,
  bio text,
  city text,
  favorite_sports text[],
  primary_role text,
  rsvp_type text,
  bar_id text,
  bar_name text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.user_id,
    p.name,
    p.profile_photo_url,
    p.bio,
    p.city,
    p.favorite_sports,
    p.primary_role,
    r.rsvp_type,
    r.bar_id,
    r.bar_name,
    r.created_at
  FROM public.event_rsvps r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.event_id = p_event_id
    AND r.status IN ('attending','approved','confirmed')
    AND auth.uid() IS NOT NULL
    AND p.name IS NOT NULL
  ORDER BY
    CASE r.rsvp_type WHEN 'stadium' THEN 0 WHEN 'bar' THEN 1 ELSE 2 END,
    r.bar_name NULLS LAST,
    r.created_at ASC
$$;

GRANT EXECUTE ON FUNCTION public.get_event_attendee_breakdown(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_event_attendee_breakdown(uuid) FROM anon, public;