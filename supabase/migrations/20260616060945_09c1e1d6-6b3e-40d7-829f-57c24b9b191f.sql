
REVOKE SELECT (birthdate, phone_number, latitude, longitude, zip_code)
  ON public.profiles FROM authenticated;
REVOKE SELECT (birthdate, phone_number, latitude, longitude, zip_code)
  ON public.profiles FROM anon;

REVOKE SELECT (guest_phone) ON public.event_rsvps FROM authenticated;
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM anon;
