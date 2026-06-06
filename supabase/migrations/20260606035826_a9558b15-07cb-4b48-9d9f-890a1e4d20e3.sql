REVOKE SELECT (phone_number, birthdate, zip_code, latitude, longitude, sms_unsubscribed) ON public.profiles FROM anon, authenticated;

REVOKE SELECT (event_password_hash) ON public.events FROM anon, authenticated;

DROP POLICY IF EXISTS "Hosts can view RSVPs for their events" ON public.event_rsvps;
CREATE POLICY "Hosts can view RSVPs for their events"
  ON public.event_rsvps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_rsvps.event_id
        AND (
          e.host_user_id = auth.uid()
          OR auth.uid() = ANY (COALESCE(e.co_host_ids, ARRAY[]::uuid[]))
        )
    )
  );