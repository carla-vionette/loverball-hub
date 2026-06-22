DROP POLICY IF EXISTS "RSVPd users can read event chat" ON public.event_chat_messages;
DROP POLICY IF EXISTS "RSVPd users, hosts, admins post chat" ON public.event_chat_messages;

CREATE POLICY "Authenticated users can read event chat"
  ON public.event_chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can post event chat"
  ON public.event_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);