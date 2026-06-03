
-- Attempts log
CREATE TABLE IF NOT EXISTS public.event_password_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  identifier text NOT NULL, -- 'u:<uuid>' or 's:<session_token>'
  success boolean NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.event_password_attempts TO service_role;

ALTER TABLE public.event_password_attempts ENABLE ROW LEVEL SECURITY;

-- No client policies: only the SECURITY DEFINER function touches this table.
CREATE POLICY "service role only" ON public.event_password_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_epa_event_identifier_time
  ON public.event_password_attempts (event_id, identifier, attempted_at DESC);

-- Replace verify_event_password with a rate-limited variant returning jsonb.
CREATE OR REPLACE FUNCTION public.verify_event_password(
  p_event_id uuid,
  p_password text,
  p_session_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
  v_required boolean;
  v_identifier text;
  v_max_attempts constant int := 5;
  v_window_seconds constant int := 300; -- 5 minutes
  v_recent_failures int;
  v_last_failure timestamptz;
  v_retry_after int;
  v_ok boolean;
BEGIN
  -- Resolve identifier: prefer auth.uid(), fall back to provided session token.
  IF auth.uid() IS NOT NULL THEN
    v_identifier := 'u:' || auth.uid()::text;
  ELSIF p_session_token IS NOT NULL AND length(p_session_token) BETWEEN 8 AND 128 THEN
    v_identifier := 's:' || p_session_token;
  ELSE
    RETURN jsonb_build_object(
      'ok', false, 'locked', false, 'attempts_left', v_max_attempts,
      'retry_after_seconds', 0, 'error', 'missing_session'
    );
  END IF;

  SELECT event_password_hash, COALESCE(password_required, false)
    INTO v_hash, v_required
  FROM public.events WHERE id = p_event_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'locked', false, 'attempts_left', 0,
      'retry_after_seconds', 0, 'error', 'not_found');
  END IF;

  IF NOT v_required OR v_hash IS NULL OR length(v_hash) = 0 THEN
    RETURN jsonb_build_object('ok', true, 'locked', false,
      'attempts_left', v_max_attempts, 'retry_after_seconds', 0);
  END IF;

  -- Check lockout window: count failures in last v_window_seconds.
  SELECT count(*), max(attempted_at)
    INTO v_recent_failures, v_last_failure
  FROM public.event_password_attempts
  WHERE event_id = p_event_id
    AND identifier = v_identifier
    AND success = false
    AND attempted_at > now() - make_interval(secs => v_window_seconds);

  IF v_recent_failures >= v_max_attempts THEN
    v_retry_after := GREATEST(
      0,
      v_window_seconds - EXTRACT(EPOCH FROM (now() - v_last_failure))::int
    );
    RETURN jsonb_build_object('ok', false, 'locked', true,
      'attempts_left', 0, 'retry_after_seconds', v_retry_after);
  END IF;

  v_ok := (p_password IS NOT NULL AND length(p_password) > 0
           AND v_hash = crypt(p_password, v_hash));

  INSERT INTO public.event_password_attempts (event_id, identifier, success)
  VALUES (p_event_id, v_identifier, v_ok);

  IF v_ok THEN
    -- Clear failure history on success.
    DELETE FROM public.event_password_attempts
    WHERE event_id = p_event_id AND identifier = v_identifier AND success = false;
    RETURN jsonb_build_object('ok', true, 'locked', false,
      'attempts_left', v_max_attempts, 'retry_after_seconds', 0);
  END IF;

  v_recent_failures := v_recent_failures + 1;
  IF v_recent_failures >= v_max_attempts THEN
    RETURN jsonb_build_object('ok', false, 'locked', true,
      'attempts_left', 0, 'retry_after_seconds', v_window_seconds);
  END IF;

  RETURN jsonb_build_object('ok', false, 'locked', false,
    'attempts_left', v_max_attempts - v_recent_failures,
    'retry_after_seconds', 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_event_password(uuid, text, text) TO anon, authenticated;
