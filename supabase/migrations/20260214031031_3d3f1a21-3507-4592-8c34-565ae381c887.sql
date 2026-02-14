-- Add new columns to creator_channels for richer channel profiles
ALTER TABLE public.creator_channels
  ADD COLUMN IF NOT EXISTS channel_type text NOT NULL DEFAULT 'creator',
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS brand_colors jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS league text,
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS follower_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_views bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS content_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS target_audience text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS upload_schedule text,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;