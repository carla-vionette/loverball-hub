
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;

CREATE POLICY "Anonymous can view public events"
  ON public.events FOR SELECT
  TO anon
  USING (visibility = 'public');

CREATE POLICY "Authenticated can view permitted events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR (visibility = 'members_only' AND public.has_role(auth.uid(), 'member'::app_role))
    OR host_user_id = auth.uid()
    OR auth.uid() = ANY(co_host_ids)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
