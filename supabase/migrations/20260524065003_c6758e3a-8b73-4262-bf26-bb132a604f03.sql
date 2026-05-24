-- 1. lb_users: restrict public read to self only
DROP POLICY IF EXISTS "lb_users public read" ON public.lb_users;
CREATE POLICY "lb_users self select"
  ON public.lb_users FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 2. channel_subscriptions: remove permissive select
DROP POLICY IF EXISTS "Anyone can see subscription counts" ON public.channel_subscriptions;

-- 3. notifications: remove permissive insert (service role policy remains)
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;

-- 4. profiles: hide sensitive PII columns from anon/authenticated reads
REVOKE SELECT (email, phone) ON public.profiles FROM anon, authenticated;

-- 5. Storage policies: require ownership path on application-uploads + event-images
DROP POLICY IF EXISTS "Users can delete own application uploads" ON storage.objects;
CREATE POLICY "Users can delete own application uploads"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'application-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own application uploads" ON storage.objects;
CREATE POLICY "Users can update own application uploads"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'application-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated users can delete event images" ON storage.objects;
CREATE POLICY "Authenticated users can delete event images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Authenticated users can update event images" ON storage.objects;
CREATE POLICY "Authenticated users can update event images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 6. Revoke EXECUTE on SECURITY DEFINER trigger-only functions from clients
REVOKE EXECUTE ON FUNCTION public.auto_create_invite_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.auto_create_subscription() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_admin_auto_assignment() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.lb_handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_chat_message() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_direct_message() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_follow() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_friend_request() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_group_member_count() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_admin_role() FROM anon, authenticated, public;