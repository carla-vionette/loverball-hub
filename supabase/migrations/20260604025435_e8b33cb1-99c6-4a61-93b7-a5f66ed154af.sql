
-- 1. Hide event password hash from any client-side SELECT (verification still works via verify_event_password RPC).
REVOKE SELECT (event_password_hash) ON public.events FROM anon, authenticated;

-- 2. Restrict modification of co_host_ids to the original host or an admin.
-- Prevents a host from granting an arbitrary user co-host privileges to harvest invitee contacts/tokens.
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_co_host_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.co_host_ids, ARRAY[]::uuid[]) IS DISTINCT FROM COALESCE(OLD.co_host_ids, ARRAY[]::uuid[]) THEN
    IF auth.uid() IS DISTINCT FROM OLD.host_user_id
       AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only the event host or an admin can modify co_host_ids';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_events_protect_co_hosts ON public.events;
CREATE TRIGGER trg_events_protect_co_hosts
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_co_host_changes();

-- 3. Hide invite tokens and recipient contact details from client SELECTs.
-- Edge functions (service_role) and SECURITY DEFINER RPCs continue to work.
REVOKE SELECT (invite_link_token, recipient_email, recipient_phone)
  ON public.event_invites FROM anon, authenticated;

-- 4. Hide notification preferences and precise location from public profile reads.
-- Owners read their own settings via get_my_account_settings() / get_my_location().
REVOKE SELECT (
  sms_notifications_enabled,
  sms_unsubscribed,
  in_app_notifications_enabled,
  email_notifications_enabled,
  zip_code,
  latitude,
  longitude
) ON public.profiles FROM anon, authenticated;

-- Owner-only location lookup, used by the active-area selector.
CREATE OR REPLACE FUNCTION public.get_my_location()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'zip_code', p.zip_code,
    'city', p.city,
    'latitude', p.latitude,
    'longitude', p.longitude
  )
  FROM public.profiles p
  WHERE p.id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_my_location() TO authenticated;
