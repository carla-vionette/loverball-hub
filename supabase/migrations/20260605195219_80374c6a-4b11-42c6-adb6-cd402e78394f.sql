
-- 1. event_invites: restrict SELECT so hosts/co-hosts cannot read invitee PII.
--    Only admins and the original sender can SELECT. Hosts retain INSERT/UPDATE/DELETE.
DROP POLICY IF EXISTS "Hosts and admins manage invites" ON public.event_invites;

CREATE POLICY "Admins and senders can view invites"
ON public.event_invites
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR sent_by_user_id = auth.uid()
);

CREATE POLICY "Hosts and admins can insert invites"
ON public.event_invites
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_invites.event_id
      AND (e.host_user_id = auth.uid() OR auth.uid() = ANY (e.co_host_ids))
  )
);

CREATE POLICY "Hosts and admins can update invites"
ON public.event_invites
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_invites.event_id
      AND (e.host_user_id = auth.uid() OR auth.uid() = ANY (e.co_host_ids))
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_invites.event_id
      AND (e.host_user_id = auth.uid() OR auth.uid() = ANY (e.co_host_ids))
  )
);

CREATE POLICY "Hosts and admins can delete invites"
ON public.event_invites
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_invites.event_id
      AND (e.host_user_id = auth.uid() OR auth.uid() = ANY (e.co_host_ids))
  )
);

-- 2. event_rsvps: hide guest_phone from non-admin hosts via column-level revoke.
--    Admins access via SECURITY DEFINER RPC admin_get_event_attendees (unaffected).
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM authenticated;
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM anon;

-- 3. analytics_events: allow anon inserts when user_id IS NULL (matches client_errors pattern).
CREATE POLICY "Anonymous users insert anonymous analytics events"
ON public.analytics_events
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- 4. profiles: hide precise coordinates from other authenticated users.
--    Owners read coords via get_my_location() RPC (SECURITY DEFINER, already exists).
REVOKE SELECT (latitude, longitude) ON public.profiles FROM authenticated;
REVOKE SELECT (latitude, longitude) ON public.profiles FROM anon;
