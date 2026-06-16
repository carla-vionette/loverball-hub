
-- 1) Profiles: hide sensitive PII columns from authenticated/anon (column-level revoke).
--    Owner reads use get_my_location() / get_my_account_settings() / profiles_sensitive.
REVOKE SELECT (phone_number, birthdate, latitude, longitude, zip_code, state)
  ON public.profiles FROM authenticated;
REVOKE SELECT (phone_number, birthdate, latitude, longitude, zip_code, state)
  ON public.profiles FROM anon;
-- Service role keeps full access for edge functions.

-- 2) Event chat: require RSVP / host / admin to post.
DROP POLICY IF EXISTS "Users post chat as themselves" ON public.event_chat_messages;
CREATE POLICY "RSVPd users, hosts, admins post chat"
  ON public.event_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id::text = event_chat_messages.event_id
          AND (e.host_user_id = auth.uid() OR auth.uid() = ANY (e.co_host_ids))
      )
      OR EXISTS (
        SELECT 1 FROM public.event_rsvps r
        WHERE r.event_id::text = event_chat_messages.event_id
          AND r.user_id = auth.uid()
          AND r.status = ANY (ARRAY['going','attending','interested','approved','confirmed'])
      )
    )
  );

-- 3) Event invites: drop the member-side insert policy. Only hosts/co-hosts/admins
--    may create invites containing recipient phone/email.
DROP POLICY IF EXISTS "Members create invites for open-invite events" ON public.event_invites;

-- 4) Drop test-only SECURITY DEFINER helpers from production.
DROP FUNCTION IF EXISTS public._test_reset_event_password_attempts(uuid, text);
DROP FUNCTION IF EXISTS public._test_age_event_password_attempts(uuid, text, integer);
DROP FUNCTION IF EXISTS public._test_set_event_password(uuid, text);

-- 5) Lock search_path on remaining mutable function.
ALTER FUNCTION public.distance_miles(double precision, double precision, double precision, double precision)
  SET search_path = public;
