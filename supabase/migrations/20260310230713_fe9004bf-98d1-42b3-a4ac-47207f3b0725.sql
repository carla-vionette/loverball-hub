
-- Fix infinite recursion in event_guests SELECT policy
-- Drop the problematic policy and replace with a simpler one
DROP POLICY IF EXISTS "Users can view event guests for public events or events they at" ON public.event_guests;

CREATE POLICY "Users can view event guests for public events"
ON public.event_guests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_guests.event_id
    AND (e.visibility = 'public' OR e.host_user_id = auth.uid())
  )
  OR user_id = auth.uid()
);

-- Add unique constraint on event_guests(event_id, user_id) for upsert support
ALTER TABLE public.event_guests ADD CONSTRAINT event_guests_event_user_unique UNIQUE (event_id, user_id);
