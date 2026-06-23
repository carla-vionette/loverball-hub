
ALTER TABLE public.profiles_sensitive
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS birthdate date;

INSERT INTO public.profiles_sensitive (id, phone_number, birthday, birthdate, latitude, longitude, zip_code, neighborhood)
SELECT p.id, p.phone_number, p.birthdate, p.birthdate, p.latitude, p.longitude, p.zip_code, p.neighborhood
FROM public.profiles p
ON CONFLICT (id) DO UPDATE SET
  phone_number = COALESCE(public.profiles_sensitive.phone_number, EXCLUDED.phone_number),
  birthday     = COALESCE(public.profiles_sensitive.birthday, EXCLUDED.birthday),
  birthdate    = COALESCE(public.profiles_sensitive.birthdate, EXCLUDED.birthdate),
  latitude     = COALESCE(public.profiles_sensitive.latitude, EXCLUDED.latitude),
  longitude    = COALESCE(public.profiles_sensitive.longitude, EXCLUDED.longitude),
  zip_code     = COALESCE(public.profiles_sensitive.zip_code, EXCLUDED.zip_code),
  neighborhood = COALESCE(public.profiles_sensitive.neighborhood, EXCLUDED.neighborhood);

CREATE OR REPLACE FUNCTION public.get_my_location()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'zip_code', s.zip_code,
    'city', p.city,
    'latitude', s.latitude,
    'longitude', s.longitude,
    'neighborhood', s.neighborhood
  )
  FROM public.profiles p
  LEFT JOIN public.profiles_sensitive s ON s.id = p.id
  WHERE p.id = auth.uid()
$function$;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS phone_number,
  DROP COLUMN IF EXISTS birthdate,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude,
  DROP COLUMN IF EXISTS zip_code,
  DROP COLUMN IF EXISTS neighborhood;

DROP POLICY IF EXISTS "Authenticated users can read event chat" ON public.event_chat_messages;

CREATE POLICY "Event members can read event chat"
ON public.event_chat_messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id::text = event_chat_messages.event_id
      AND (e.host_user_id = auth.uid()
           OR auth.uid() = ANY (COALESCE(e.co_host_ids, ARRAY[]::uuid[])))
  )
  OR EXISTS (
    SELECT 1 FROM public.event_rsvps r
    WHERE r.event_id::text = event_chat_messages.event_id
      AND r.user_id = auth.uid()
      AND COALESCE(r.status, 'going') IN ('going','interested','attending','confirmed','accepted','yes')
      AND COALESCE(r.approval_status, 'approved') IN ('approved','accepted','auto_approved')
  )
);
