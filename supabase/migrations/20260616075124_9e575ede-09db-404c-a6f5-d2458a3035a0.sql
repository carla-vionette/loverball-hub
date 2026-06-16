
-- Fix 1: Prevent hosts from reading guest_phone on event_rsvps via direct table SELECT.
-- Admins continue to access guest_phone via the SECURITY DEFINER admin_get_event_attendees RPC.
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM authenticated, anon;

-- Fix 2: Prevent privilege-escalation via direct UPDATE on sensitive profile columns.
-- Updates to these columns must go through admin/service-role paths.
REVOKE UPDATE (membership_tier, grandfathered, account_type) ON public.profiles FROM authenticated, anon;
