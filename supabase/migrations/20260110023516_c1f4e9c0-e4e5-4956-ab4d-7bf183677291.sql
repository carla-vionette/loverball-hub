-- Allow members to view other members' profiles for the Network feature
CREATE POLICY "Members can view other member profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'member'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);