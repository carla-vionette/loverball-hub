-- Allow any authenticated user to view profiles (for attendee lists, member cards, etc.)
-- Drop the restrictive policy and replace with one that allows all authenticated users
DROP POLICY IF EXISTS "Users and members can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Also drop the redundant "Users can view own profile" since the new policy covers it
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;