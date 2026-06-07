
-- External event RSVPs (SeatGeek/mock events identified by text IDs)
CREATE TABLE public.external_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rsvp_type text NOT NULL CHECK (rsvp_type IN ('stadium','bar')),
  bar_id text,
  bar_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
CREATE INDEX external_event_rsvps_event_idx ON public.external_event_rsvps(event_id);
CREATE INDEX external_event_rsvps_user_idx ON public.external_event_rsvps(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_event_rsvps TO authenticated;
GRANT ALL ON public.external_event_rsvps TO service_role;

ALTER TABLE public.external_event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view external RSVPs"
  ON public.external_event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert their own external RSVP"
  ON public.external_event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own external RSVP"
  ON public.external_event_rsvps FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own external RSVP"
  ON public.external_event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Chat messages for external events
CREATE TABLE public.event_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_chat_messages_event_idx ON public.event_chat_messages(event_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.event_chat_messages TO authenticated;
GRANT ALL ON public.event_chat_messages TO service_role;

ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read event chat"
  ON public.event_chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users post chat as themselves"
  ON public.event_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own chat messages"
  ON public.event_chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.external_event_rsvps;
