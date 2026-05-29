
-- 1. analytics_events: tighten INSERT policy
DROP POLICY IF EXISTS "Users can insert their own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Authenticated users can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.analytics_events;

CREATE POLICY "Authenticated users insert their own analytics events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 2. badges: drop public read policy
DROP POLICY IF EXISTS "Anyone can view badges" ON public.badges;
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
DROP POLICY IF EXISTS "Public can view badges" ON public.badges;

-- Ensure owner + admin read policy exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='badges'
      AND policyname='Users can view their own badges'
  ) THEN
    CREATE POLICY "Users can view their own badges"
    ON public.badges
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 3. members: restrict SELECT to self + admins
DROP POLICY IF EXISTS "Authenticated users can view members" ON public.members;
DROP POLICY IF EXISTS "Members are viewable by authenticated users" ON public.members;
DROP POLICY IF EXISTS "Anyone authenticated can view members" ON public.members;

CREATE POLICY "Members and admins can view membership"
ON public.members
FOR SELECT
TO authenticated
USING (auth.uid() = profile_id OR public.has_role(auth.uid(), 'admin'));

-- 4. profiles: remove unused `role` column to eliminate privilege escalation surface
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
