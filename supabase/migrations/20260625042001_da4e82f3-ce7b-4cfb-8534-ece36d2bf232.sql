-- Allow all authenticated users to discover members_only events in listings.
-- Access/RSVP gating is enforced separately at the RSVP layer.
DROP POLICY IF EXISTS "Authenticated can view permitted events" ON public.events;

CREATE POLICY "Authenticated can view permitted events"
ON public.events
FOR SELECT
TO authenticated
USING (
  visibility IN ('public', 'members_only')
  OR host_user_id = auth.uid()
  OR auth.uid() = ANY (co_host_ids)
  OR has_role(auth.uid(), 'admin'::app_role)
);