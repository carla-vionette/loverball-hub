
-- Add event_tags column for searchable tags like "Solo Friendly", "New Fans Welcome", etc.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_tags text[] DEFAULT '{}'::text[];

-- Create team_follows table for users to follow teams
CREATE TABLE public.team_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_key)
);

ALTER TABLE public.team_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team follows" ON public.team_follows
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can follow teams" ON public.team_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow teams" ON public.team_follows
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
