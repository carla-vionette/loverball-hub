CREATE OR REPLACE FUNCTION public.verify_event_password(p_event_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
  v_required boolean;
BEGIN
  SELECT event_password_hash, COALESCE(password_required, false)
    INTO v_hash, v_required
  FROM public.events
  WHERE id = p_event_id;

  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT v_required THEN RETURN true; END IF;
  IF v_hash IS NULL OR length(v_hash) = 0 THEN RETURN true; END IF;
  IF p_password IS NULL OR length(p_password) = 0 THEN RETURN false; END IF;

  RETURN v_hash = crypt(p_password, v_hash);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_event_password(p_event_id uuid, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_host uuid;
BEGIN
  SELECT host_user_id INTO v_host FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_host IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only the host or an admin can set the password';
  END IF;

  IF p_password IS NULL OR length(p_password) = 0 THEN
    UPDATE public.events
       SET event_password_hash = NULL, password_required = false
     WHERE id = p_event_id;
  ELSE
    UPDATE public.events
       SET event_password_hash = crypt(p_password, gen_salt('bf', 10)),
           password_required = true
     WHERE id = p_event_id;
  END IF;
  RETURN true;
END;
$$;