
-- 1) analytics_events: require user_id = auth.uid() for authenticated inserts (no NULL spoofing)
DROP POLICY IF EXISTS "Authenticated users can insert own analytics" ON public.analytics_events;
CREATE POLICY "Authenticated users can insert own analytics"
ON public.analytics_events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2) storage: channel photos must live under channels/<channel_id>/... owned by the user
DROP POLICY IF EXISTS "Channel owners can upload channel photos" ON storage.objects;
DROP POLICY IF EXISTS "Channel owners can update channel photos" ON storage.objects;
DROP POLICY IF EXISTS "Channel owners can delete channel photos" ON storage.objects;

CREATE POLICY "Channel owners can upload channel photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = 'channels'
  AND EXISTS (
    SELECT 1 FROM public.creator_channels c
    WHERE c.owner_user_id = auth.uid()
      AND c.status = 'approved'
      AND (storage.foldername(name))[2] = c.id::text
  )
);

CREATE POLICY "Channel owners can update channel photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = 'channels'
  AND EXISTS (
    SELECT 1 FROM public.creator_channels c
    WHERE c.owner_user_id = auth.uid()
      AND c.status = 'approved'
      AND (storage.foldername(name))[2] = c.id::text
  )
);

CREATE POLICY "Channel owners can delete channel photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (storage.foldername(name))[1] = 'channels'
  AND EXISTS (
    SELECT 1 FROM public.creator_channels c
    WHERE c.owner_user_id = auth.uid()
      AND c.status = 'approved'
      AND (storage.foldername(name))[2] = c.id::text
  )
);

-- 3) event_rsvps: hide guest PII from clients; admin RPC (SECURITY DEFINER) still works
REVOKE SELECT (guest_phone, guest_name) ON public.event_rsvps FROM anon, authenticated;

-- 4) lb_rsvps: restrict reads to RSVP owner, event host, and admins
DROP POLICY IF EXISTS "lb_rsvps authenticated read" ON public.lb_rsvps;
CREATE POLICY "lb_rsvps owner host admin read"
ON public.lb_rsvps FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.lb_events e
    WHERE e.id = lb_rsvps.event_id AND e.host_user_id = auth.uid()
  )
);

-- 5) profiles: hide operational/account fields from other authenticated users.
-- Column-level GRANT applies globally; we add a SECURITY DEFINER RPC so the
-- row owner can still fetch their own settings.
REVOKE SELECT (
  sms_notifications_enabled,
  sms_unsubscribed,
  in_app_notifications_enabled,
  email_notifications_enabled,
  membership_tier,
  billing_period,
  has_completed_onboarding
) ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_account_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'sms_notifications_enabled', p.sms_notifications_enabled,
    'sms_unsubscribed', p.sms_unsubscribed,
    'in_app_notifications_enabled', p.in_app_notifications_enabled,
    'email_notifications_enabled', p.email_notifications_enabled,
    'membership_tier', p.membership_tier,
    'billing_period', p.billing_period,
    'has_completed_onboarding', p.has_completed_onboarding
  )
  FROM public.profiles p
  WHERE p.id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_my_account_settings() TO authenticated;

-- Allow membership_tier exposure for public profile display via existing safe RPCs
-- (get_safe_profile and get_public_profile_columns are SECURITY DEFINER and bypass column grants).

-- 6) video_views: allow users to read their own view history
CREATE POLICY "Users can view their own video views"
ON public.video_views FOR SELECT TO authenticated
USING (auth.uid() = user_id);
