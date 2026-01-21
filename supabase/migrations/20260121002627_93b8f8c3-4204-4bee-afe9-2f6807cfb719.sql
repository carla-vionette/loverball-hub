-- Drop existing policies that may expose phone numbers
DROP POLICY IF EXISTS "Users can view RSVPs for events they're hosting" ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can view their own RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Anyone can view event RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Authenticated users can view RSVPs" ON public.event_rsvps;

-- Create secure SELECT policy: users can only see their own RSVPs or RSVPs for events they host
CREATE POLICY "Users can view own RSVPs or as event host"
ON public.event_rsvps
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_rsvps.event_id 
    AND events.host_user_id = auth.uid()
  )
);

-- Ensure INSERT policy exists for users to create their own RSVPs
DROP POLICY IF EXISTS "Users can create their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can create their own RSVPs"
ON public.event_rsvps
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ensure UPDATE policy exists for users to update their own RSVPs
DROP POLICY IF EXISTS "Users can update their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can update their own RSVPs"
ON public.event_rsvps
FOR UPDATE
USING (auth.uid() = user_id);

-- Ensure DELETE policy exists for users to delete their own RSVPs
DROP POLICY IF EXISTS "Users can delete their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can delete their own RSVPs"
ON public.event_rsvps
FOR DELETE
USING (auth.uid() = user_id);