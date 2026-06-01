DROP POLICY IF EXISTS "Authenticated users can insert own analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Members viewable by authenticated users" ON public.members;