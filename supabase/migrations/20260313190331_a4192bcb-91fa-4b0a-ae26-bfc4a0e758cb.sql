
-- Create follows table
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

-- Add going_solo to event_guests
ALTER TABLE public.event_guests ADD COLUMN IF NOT EXISTS going_solo boolean NOT NULL DEFAULT false;

-- RLS for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows" ON public.follows
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);
