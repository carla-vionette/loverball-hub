-- Add policy to allow members to view other member profiles
-- This is needed for the Network/matching feature to work

CREATE POLICY "Members can view other member profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND public.has_role(auth.uid(), 'member')
  );