
-- Analytics events table for tracking all user behavior, engagement, and content metrics
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  session_id text,
  event_type text NOT NULL,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  page_path text,
  referrer_path text,
  duration_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_page ON public.analytics_events(page_path);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (including anonymous users)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

-- Only admins can read analytics data
CREATE POLICY "Admins can read analytics"
ON public.analytics_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete old data
CREATE POLICY "Admins can delete analytics"
ON public.analytics_events FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
