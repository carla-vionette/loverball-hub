-- Add price column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;

-- Add location_category for venue type filtering
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS venue_type text DEFAULT 'indoor';
