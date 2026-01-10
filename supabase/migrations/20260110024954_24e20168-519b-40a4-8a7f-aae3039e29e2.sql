-- Drop the existing member-only policy
DROP POLICY IF EXISTS "Members can view other member profiles" ON public.profiles;

-- Create new policy: anyone with a profile can view all profiles
CREATE POLICY "Profile holders can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
  )
);