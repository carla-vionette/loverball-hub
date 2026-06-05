
-- Fix 1: Stop event hosts from reading guest_phone (and other RSVP columns) directly via Data API.
-- Hosts should use admin_get_event_attendees / a host-specific RPC instead.
DROP POLICY IF EXISTS "Users and hosts can view RSVPs" ON public.event_rsvps;

CREATE POLICY "Users can view their own RSVPs"
ON public.event_rsvps
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict group:{uuid} Realtime channel subscriptions/broadcasts to group members.
DROP POLICY IF EXISTS "Members can read group topics" ON realtime.messages;
DROP POLICY IF EXISTS "Members can broadcast on group topics" ON realtime.messages;

CREATE POLICY "Members can read group topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() IS NOT NULL
  AND realtime.topic() LIKE 'group:%'
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = auth.uid()
      AND gm.group_id::text = split_part(realtime.topic(), ':', 2)
  )
);

CREATE POLICY "Members can broadcast on group topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() IS NOT NULL
  AND realtime.topic() LIKE 'group:%'
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = auth.uid()
      AND gm.group_id::text = split_part(realtime.topic(), ':', 2)
  )
);
