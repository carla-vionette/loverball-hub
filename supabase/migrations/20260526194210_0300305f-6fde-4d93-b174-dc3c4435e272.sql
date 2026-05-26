
-- 1. Drop redundant sensitive columns from profiles (live in profiles_sensitive)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;

-- 2. Protect event_rsvps.guest_phone via column-level revoke
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM anon, authenticated;

-- Admin-only helper to read attendees including guest_phone
CREATE OR REPLACE FUNCTION public.admin_get_event_attendees(p_event_id uuid)
RETURNS TABLE (
  id uuid,
  status text,
  user_id uuid,
  plus_ones integer,
  guest_name text,
  guest_phone text,
  created_at timestamptz,
  profile_name text,
  profile_city text,
  profile_photo_url text,
  profile_instagram_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT r.id, r.status, r.user_id, r.plus_ones, r.guest_name, r.guest_phone, r.created_at,
         p.name, p.city, p.profile_photo_url, p.instagram_url
  FROM public.event_rsvps r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.event_id = p_event_id
  ORDER BY r.created_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_event_attendees(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_event_attendees(uuid) TO authenticated;

-- 3. Storage policy hardening
-- application-uploads: require per-user folder prefix on INSERT
DROP POLICY IF EXISTS "Authenticated users can upload application files" ON storage.objects;
CREATE POLICY "Authenticated users can upload application files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'application-uploads'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- videos: restrict upload/update/delete to files under the owning channel's folder
DROP POLICY IF EXISTS "Channel owners can upload videos" ON storage.objects;
CREATE POLICY "Channel owners can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.creator_channels c
    WHERE c.owner_user_id = auth.uid()
      AND c.status = 'approved'
      AND (storage.foldername(name))[1] = c.id::text
  )
);

DROP POLICY IF EXISTS "Channel owners can update their videos" ON storage.objects;
CREATE POLICY "Channel owners can update their videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.creator_channels c
    WHERE c.owner_user_id = auth.uid()
      AND c.status = 'approved'
      AND (storage.foldername(name))[1] = c.id::text
  )
);

DROP POLICY IF EXISTS "Channel owners can delete their videos" ON storage.objects;
CREATE POLICY "Channel owners can delete their videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.creator_channels c
    WHERE c.owner_user_id = auth.uid()
      AND c.status = 'approved'
      AND (storage.foldername(name))[1] = c.id::text
  )
);

-- 4. Revoke EXECUTE on internal trigger SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_create_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_create_invite_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_admin_auto_assignment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lb_handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_friend_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_direct_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_group_member_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_admin_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_chat_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_create_match() FROM PUBLIC, anon, authenticated;
