GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_event_rsvps TO authenticated;
GRANT ALL ON public.external_event_rsvps TO service_role;

GRANT SELECT, INSERT, DELETE ON public.event_chat_messages TO authenticated;
GRANT ALL ON public.event_chat_messages TO service_role;