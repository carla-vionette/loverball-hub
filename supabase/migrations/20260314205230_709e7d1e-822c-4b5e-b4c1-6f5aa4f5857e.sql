
-- Drop the member policy that still exposes all columns
DROP POLICY IF EXISTS "Members can view other member profiles" ON public.profiles;
