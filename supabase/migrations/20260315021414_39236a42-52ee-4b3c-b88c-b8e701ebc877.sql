-- Enable realtime for direct_messages and friendships so badge updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;