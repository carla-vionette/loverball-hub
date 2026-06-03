-- Test-only helpers for the event password lockout suite.
-- Both functions hard-restrict their effect to the seeded test event id
-- (00000000-0000-0000-0000-00000000beef) so they cannot be abused against
-- real events. Granted to anon/authenticated so the e2e scripts (which run
-- with only the anon key) can use them.

CREATE OR REPLACE FUNCTION public._test_reset_event_password_attempts(
  p_event_id uuid,
  p_session_token text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_event_id <> '00000000-0000-0000-0000-00000000beef'::uuid THEN
    RAISE EXCEPTION 'test helper restricted to seeded test event';
  END IF;
  DELETE FROM public.event_password_attempts
   WHERE event_id = p_event_id
     AND (p_session_token IS NULL OR identifier = 's:' || p_session_token);
END;
$$;

-- Subtract `p_seconds` from `attempted_at` on every attempt row matching the
-- test event (optionally narrowed to a session token). This lets tests
-- simulate cooldown expiry instantly instead of waiting 5 real minutes.
CREATE OR REPLACE FUNCTION public._test_age_event_password_attempts(
  p_event_id uuid,
  p_session_token text,
  p_seconds integer
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  IF p_event_id <> '00000000-0000-0000-0000-00000000beef'::uuid THEN
    RAISE EXCEPTION 'test helper restricted to seeded test event';
  END IF;
  IF p_seconds <= 0 OR p_seconds > 86400 THEN
    RAISE EXCEPTION 'p_seconds out of range';
  END IF;
  UPDATE public.event_password_attempts
     SET attempted_at = attempted_at - make_interval(secs => p_seconds)
   WHERE event_id = p_event_id
     AND (p_session_token IS NULL OR identifier = 's:' || p_session_token);
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

GRANT EXECUTE ON FUNCTION public._test_reset_event_password_attempts(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public._test_age_event_password_attempts(uuid, text, integer) TO anon, authenticated;

-- Test-only helper to rotate the password on the seeded test event.
-- Restricted to the test event id; lets us assert "password change during
-- lockout does not bypass" without an authenticated host session.
CREATE OR REPLACE FUNCTION public._test_set_event_password(
  p_event_id uuid,
  p_password text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_event_id <> '00000000-0000-0000-0000-00000000beef'::uuid THEN
    RAISE EXCEPTION 'test helper restricted to seeded test event';
  END IF;
  UPDATE public.events
     SET event_password_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
         password_required = true
   WHERE id = p_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public._test_set_event_password(uuid, text) TO anon, authenticated;