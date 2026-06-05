-- Allow direct event links to be publicly viewable by anyone (anon + auth).
-- Previously anon could only read events with visibility='public'.
DROP POLICY IF EXISTS "Anyone can view events by slug" ON public.events;
DROP POLICY IF EXISTS "Anyone can view public events" ON public.events;

CREATE POLICY "Anyone can view events"
  ON public.events
  FOR SELECT
  USING (true);