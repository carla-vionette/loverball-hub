CREATE OR REPLACE FUNCTION public.verify_event_password(p_event_id uuid, p_password text, p_session_token text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public', 'extensions'
AS $function$
DECLARE
  v_hash text;
  v_required boolean;
BEGIN
  SELECT event_password_hash, COALESCE(password_required, false)
    INTO v_hash, v_required
  FROM public.events WHERE id = p_event_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'locked', false, 'attempts_left', 5,
      'retry_after_seconds', 0, 'error', 'not_found');
  END IF;

  IF NOT v_required OR v_hash IS NULL OR length(v_hash) = 0 THEN
    RETURN jsonb_build_object('ok', true, 'locked', false,
      'attempts_left', 5, 'retry_after_seconds', 0);
  END IF;

  IF p_password IS NOT NULL AND length(p_password) > 0 AND v_hash = crypt(p_password, v_hash) THEN
    RETURN jsonb_build_object('ok', true, 'locked', false,
      'attempts_left', 5, 'retry_after_seconds', 0);
  END IF;

  RETURN jsonb_build_object('ok', false, 'locked', false,
    'attempts_left', 5, 'retry_after_seconds', 0);
END;
$function$;