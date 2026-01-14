-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Profile holders can view all profiles" ON public.profiles;

-- The "Users can view own profile" policy is sufficient for users to see their own profile
-- For viewing other profiles, we need a non-recursive policy

-- Allow authenticated users to view all profiles (no recursion)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);