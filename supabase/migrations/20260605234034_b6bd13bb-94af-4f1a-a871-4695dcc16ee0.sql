-- Restrict access to sensitive columns on events table
-- The "Anyone can view events" policy uses USING(true) to allow public link access,
-- but event_password_hash should never be exposed via the Data API.
REVOKE SELECT (event_password_hash) ON public.events FROM anon, authenticated;

-- Also revoke any potential exposure of password attempts internals (defense in depth)
-- (kept service_role intact for edge functions and admin RPCs)