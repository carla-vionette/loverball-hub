
-- ============================================================
-- Security hardening: event_rsvps + realtime.messages
-- ============================================================

-- ---------- event_rsvps: consolidate overlapping policies ----------
-- Drop redundant/duplicate policies. Hosts + admins + owner can SELECT
-- via the single "Users and hosts can view RSVPs" policy. INSERT/UPDATE/
-- DELETE are scoped strictly to authenticated users acting on their own row.

DROP POLICY IF EXISTS "Users can view own RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can update own RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can update their own RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can delete their own RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can create their own RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Members can create RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Admins can manage all RSVPs" ON public.event_rsvps;

-- Recreate with explicit `authenticated` role (blocks anon outright).
CREATE POLICY "Admins can manage all RSVPs"
  ON public.event_rsvps
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own RSVPs"
  ON public.event_rsvps
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs"
  ON public.event_rsvps
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSVPs"
  ON public.event_rsvps
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------- realtime.messages: explicit scoped policies ----------
-- RLS is already enabled with no policies (default-deny). Add explicit
-- policies so authenticated users can only subscribe to / broadcast on
-- topics that contain their own auth.uid(). This locks down the
-- Broadcast-from-DB path even if a future migration loosens defaults.

DROP POLICY IF EXISTS "Authenticated can read own-scoped topics" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can broadcast on own-scoped topics" ON realtime.messages;

CREATE POLICY "Authenticated can read own-scoped topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() IS NOT NULL
    AND position(auth.uid()::text in realtime.topic()) > 0
  );

CREATE POLICY "Authenticated can broadcast on own-scoped topics"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() IS NOT NULL
    AND position(auth.uid()::text in realtime.topic()) > 0
  );
