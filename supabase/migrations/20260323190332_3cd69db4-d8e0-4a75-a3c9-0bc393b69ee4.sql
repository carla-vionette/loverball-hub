
-- Add mutual_teams and updated_at to existing friendships table
ALTER TABLE public.friendships
  ADD COLUMN IF NOT EXISTS mutual_teams text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
