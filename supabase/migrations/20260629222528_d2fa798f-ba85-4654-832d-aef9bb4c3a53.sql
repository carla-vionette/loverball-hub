
-- 1) Lock down event_rsvps.guest_phone at the column level
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM anon, authenticated;

-- 2) Lock down sensitive billing/notification/trial columns on profiles
REVOKE SELECT (
  billing_period,
  grandfathered,
  trial_started_at,
  sms_notifications_enabled,
  sms_unsubscribed,
  in_app_notifications_enabled,
  email_notifications_enabled,
  has_completed_onboarding
) ON public.profiles FROM anon, authenticated;

-- 3) Secure helper so a user can read their own trial/membership status
CREATE OR REPLACE FUNCTION public.get_my_trial_status()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'trial_started_at', p.trial_started_at,
    'grandfathered', p.grandfathered,
    'membership_tier', p.membership_tier,
    'created_at', p.created_at
  )
  FROM public.profiles p
  WHERE p.id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_my_trial_status() TO authenticated;
