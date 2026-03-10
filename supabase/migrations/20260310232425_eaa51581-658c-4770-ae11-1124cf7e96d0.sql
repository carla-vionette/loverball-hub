
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
ON public.direct_messages FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Authenticated users can send messages
CREATE POLICY "Users can send messages"
ON public.direct_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Receivers can mark messages as read
CREATE POLICY "Users can mark received messages as read"
ON public.direct_messages FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Users can delete their own sent messages
CREATE POLICY "Users can delete own sent messages"
ON public.direct_messages FOR DELETE TO authenticated
USING (auth.uid() = sender_id);
