
-- 1. Fix mutable search_path on remaining functions
CREATE OR REPLACE FUNCTION public.auto_create_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.invites (inviter_id, invite_code)
  VALUES (NEW.id, substr(md5(random()::text || NEW.id::text), 1, 8))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_create_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.lb_recompute_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  pct integer := 0;
BEGIN
  IF NEW.photo_url IS NOT NULL AND NEW.photo_url <> '' THEN pct := pct + 20; END IF;
  IF NEW.display_name IS NOT NULL AND NEW.display_name <> '' THEN pct := pct + 20; END IF;
  IF array_length(NEW.favorite_sports, 1) IS NOT NULL THEN pct := pct + 20; END IF;
  IF array_length(NEW.favorite_team_ids, 1) IS NOT NULL THEN pct := pct + 20; END IF;
  IF array_length(NEW.vibe_tags, 1) IS NOT NULL THEN pct := pct + 20; END IF;
  NEW.profile_completion := pct;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- 2. Add validation/size limit trigger for analytics_events (prevents abuse & XSS-via-display)
CREATE OR REPLACE FUNCTION public.validate_analytics_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.event_type IS NULL OR length(NEW.event_type) > 64 THEN
    RAISE EXCEPTION 'Invalid event_type';
  END IF;
  IF NEW.event_name IS NULL OR length(NEW.event_name) > 200 THEN
    RAISE EXCEPTION 'Invalid event_name';
  END IF;
  IF NEW.page_path IS NOT NULL AND length(NEW.page_path) > 500 THEN
    NEW.page_path := left(NEW.page_path, 500);
  END IF;
  IF NEW.referrer_path IS NOT NULL AND length(NEW.referrer_path) > 500 THEN
    NEW.referrer_path := left(NEW.referrer_path, 500);
  END IF;
  IF NEW.properties IS NOT NULL AND octet_length(NEW.properties::text) > 10000 THEN
    RAISE EXCEPTION 'Properties payload too large';
  END IF;
  -- Strip angle brackets from text fields to defang XSS-via-display
  NEW.event_name := regexp_replace(NEW.event_name, '[<>]', '', 'g');
  IF NEW.page_path IS NOT NULL THEN
    NEW.page_path := regexp_replace(NEW.page_path, '[<>]', '', 'g');
  END IF;
  IF NEW.referrer_path IS NOT NULL THEN
    NEW.referrer_path := regexp_replace(NEW.referrer_path, '[<>]', '', 'g');
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS validate_analytics_before_insert ON public.analytics_events;
CREATE TRIGGER validate_analytics_before_insert
BEFORE INSERT ON public.analytics_events
FOR EACH ROW EXECUTE FUNCTION public.validate_analytics_event();

-- 3. Rename event_rsvps name/phone -> guest_name/guest_phone for clarity
--    and to make it explicit these are plus-one contact fields, not the user's PII.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='event_rsvps' AND column_name='name') THEN
    ALTER TABLE public.event_rsvps RENAME COLUMN name TO guest_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='event_rsvps' AND column_name='phone') THEN
    ALTER TABLE public.event_rsvps RENAME COLUMN phone TO guest_phone;
  END IF;
END$$;

COMMENT ON COLUMN public.event_rsvps.guest_name IS 'Optional plus-one/guest name (not the RSVP user). Visible only to the RSVP user and admins per RLS.';
COMMENT ON COLUMN public.event_rsvps.guest_phone IS 'Optional plus-one/guest phone (not the RSVP user). Visible only to the RSVP user and admins per RLS.';

-- 4. Tighten always-true INSERT policies so the Supabase linter is satisfied
--    and intent is explicit in-DB.
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can insert points" ON public.point_transactions;
CREATE POLICY "Service role can insert points"
ON public.point_transactions FOR INSERT
TO service_role
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.analytics_events;
CREATE POLICY "Authenticated users can insert own analytics"
ON public.analytics_events FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());
