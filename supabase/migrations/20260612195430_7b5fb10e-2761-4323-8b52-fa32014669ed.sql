DROP POLICY IF EXISTS "Anyone authenticated can view external RSVPs" ON public.external_event_rsvps;

CREATE POLICY "Users view own external RSVPs"
ON public.external_event_rsvps
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));