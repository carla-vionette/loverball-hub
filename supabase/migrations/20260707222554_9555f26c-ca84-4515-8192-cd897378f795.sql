DROP POLICY IF EXISTS "Authenticated users can post event chat" ON public.event_chat_messages;

CREATE POLICY "Event members can post event chat"
ON public.event_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id::text = event_chat_messages.event_id
        AND (e.host_user_id = auth.uid() OR auth.uid() = ANY (COALESCE(e.co_host_ids, ARRAY[]::uuid[])))
    )
    OR EXISTS (
      SELECT 1 FROM public.event_rsvps r
      WHERE r.event_id::text = event_chat_messages.event_id
        AND r.user_id = auth.uid()
        AND COALESCE(r.status, 'going') = ANY (ARRAY['going','interested','attending','confirmed','accepted','yes'])
        AND COALESCE(r.approval_status, 'approved') = ANY (ARRAY['approved','accepted','auto_approved'])
    )
  )
);