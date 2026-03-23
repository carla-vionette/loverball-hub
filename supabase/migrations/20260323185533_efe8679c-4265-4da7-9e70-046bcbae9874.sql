
-- Add missing columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS co_host_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rsvp_approval_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_visibility boolean DEFAULT true;

-- Create event_comments table
CREATE TABLE IF NOT EXISTS public.event_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view event comments
CREATE POLICY "Anyone can view event comments"
  ON public.event_comments FOR SELECT
  TO public
  USING (true);

-- Authenticated users can post comments
CREATE POLICY "Authenticated users can post event comments"
  ON public.event_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own comments
CREATE POLICY "Users can delete own event comments"
  ON public.event_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
