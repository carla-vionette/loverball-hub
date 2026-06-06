
-- Add new onboarding + trial fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS pro_leagues text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS college_leagues text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS favorite_teams text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS vibe_tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS grandfathered boolean NOT NULL DEFAULT false;

-- Grandfather all existing users (created before this migration)
UPDATE public.profiles
   SET grandfathered = true
 WHERE created_at < now();

-- New signups: trial_started_at defaults to now() going forward
ALTER TABLE public.profiles
  ALTER COLUMN trial_started_at SET DEFAULT now();

-- Backfill trial_started_at for any rows that still lack it (none should remain after grandfathering, but be safe)
UPDATE public.profiles
   SET trial_started_at = COALESCE(trial_started_at, created_at)
 WHERE trial_started_at IS NULL;

-- Seed a teams table for the typeahead in onboarding
CREATE TABLE IF NOT EXISTS public.teams_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  league text NOT NULL,
  level text NOT NULL CHECK (level IN ('pro','college')),
  sport text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS teams_directory_name_idx ON public.teams_directory (lower(name));
CREATE INDEX IF NOT EXISTS teams_directory_league_idx ON public.teams_directory (league);

GRANT SELECT ON public.teams_directory TO anon, authenticated;
GRANT ALL ON public.teams_directory TO service_role;

ALTER TABLE public.teams_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams directory is publicly readable"
  ON public.teams_directory FOR SELECT
  USING (true);
