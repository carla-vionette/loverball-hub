-- Allow all authenticated members to view event guests for public events
-- This fixes the issue where users can't see who signed up for events
CREATE POLICY "Members can view guests of public events"
ON public.event_guests
FOR SELECT
USING (
  has_role(auth.uid(), 'member'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_guests.event_id
    AND (e.visibility = 'public' OR e.host_user_id = auth.uid())
  )
);

-- Also allow admins to see all event guests
CREATE POLICY "Admins can manage all event guests"
ON public.event_guests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));