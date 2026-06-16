
DROP POLICY IF EXISTS "Authenticated users can read event chat" ON public.event_chat_messages;
DROP POLICY IF EXISTS "RSVPd users can read event chat" ON public.event_chat_messages;

CREATE POLICY "RSVPd users can read event chat"
  ON public.event_chat_messages FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id::text = event_chat_messages.event_id
        AND (e.host_user_id = auth.uid()
             OR auth.uid() = ANY(e.co_host_ids))
    )
    OR EXISTS (
      SELECT 1 FROM public.event_rsvps r
      WHERE r.event_id::text = event_chat_messages.event_id
        AND r.user_id = auth.uid()
        AND r.status = ANY (ARRAY['going','attending','interested','approved','confirmed'])
    )
  );
