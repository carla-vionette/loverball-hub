-- Add new columns to events table for enhanced event pages
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS end_time time without time zone,
ADD COLUMN IF NOT EXISTS location_type text DEFAULT 'in_person',
ADD COLUMN IF NOT EXISTS virtual_link text,
ADD COLUMN IF NOT EXISTS location_map_url text,
ADD COLUMN IF NOT EXISTS rsvp_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS allow_plus_ones boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';

-- Update event_rsvps to support yes/no/maybe and plus ones
ALTER TABLE public.event_rsvps
ADD COLUMN IF NOT EXISTS plus_ones integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS phone text;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Update RLS policy to allow viewing events by slug
CREATE POLICY "Anyone can view events by slug" 
ON public.events 
FOR SELECT 
USING (visibility = 'public' OR has_role(auth.uid(), 'member'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Generate slugs for existing events
UPDATE public.events 
SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;