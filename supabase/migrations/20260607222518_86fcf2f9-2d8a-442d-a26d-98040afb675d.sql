
-- Hide phone_number and birthdate from broad profile reads; keep them updatable by owner
REVOKE SELECT (phone_number, birthdate) ON public.profiles FROM authenticated;
REVOKE SELECT (phone_number, birthdate) ON public.profiles FROM anon;

-- Hide guest_phone from event hosts; only service_role/admin path should read it
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM authenticated;
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM anon;

-- Hide internal admin_notes from applicants
REVOKE SELECT (admin_notes) ON public.creator_applications FROM authenticated;
REVOKE SELECT (admin_notes) ON public.creator_applications FROM anon;
