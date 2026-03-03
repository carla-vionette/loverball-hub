
-- 1. Fix video_likes: require authentication for SELECT
DROP POLICY IF EXISTS "Anyone can view likes" ON public.video_likes;
CREATE POLICY "Authenticated users can view likes"
ON public.video_likes FOR SELECT
TO authenticated
USING (true);

-- 2. Fix post_likes: require authentication for SELECT
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
CREATE POLICY "Authenticated users can view post likes"
ON public.post_likes FOR SELECT
TO authenticated
USING (true);

-- 3. Fix analytics_events: restrict INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Authenticated users can insert analytics"
ON public.analytics_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Fix notifications: restrict INSERT to service role only (remove public WITH CHECK true)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);
