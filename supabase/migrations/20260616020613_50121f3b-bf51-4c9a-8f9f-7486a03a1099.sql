-- Revoke column-level read access to precise GPS coordinates from clients.
-- Owners can still read their own coordinates because RLS + column privileges
-- both must allow access; the get_my_location() SECURITY DEFINER RPC and
-- service-role/edge functions continue to work.
REVOKE SELECT (latitude, longitude) ON public.profiles FROM authenticated;
REVOKE SELECT (latitude, longitude) ON public.profiles FROM anon;