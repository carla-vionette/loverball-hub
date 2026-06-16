
-- 1) lb_users: remove all anon table privileges (RLS already blocks, but defense-in-depth)
REVOKE ALL ON public.lb_users FROM anon;

-- 2) profiles.zip_code: revoke column SELECT for anon/authenticated (matches latitude/longitude treatment)
REVOKE SELECT (zip_code) ON public.profiles FROM anon, authenticated;
