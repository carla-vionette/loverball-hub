-- Ensure column-level SELECT on event_rsvps.guest_phone is REVOKED from
-- client roles, so RLS row policies (including the host SELECT policy)
-- cannot leak guest phone numbers via direct table queries.
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM anon;
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM authenticated;
REVOKE UPDATE (guest_phone) ON public.event_rsvps FROM anon;

-- service_role retains full access for edge functions / admin tooling.
GRANT SELECT (guest_phone) ON public.event_rsvps TO service_role;