
-- Fix: revoke guest_phone column on event_rsvps from authenticated; keep service_role access
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM authenticated;
REVOKE SELECT (guest_phone) ON public.event_rsvps FROM anon;

-- Fix: revoke billing/notification preference columns on profiles from authenticated
REVOKE SELECT (sms_unsubscribed, email_notifications_enabled, in_app_notifications_enabled, membership_tier, billing_period, total_points, grandfathered, trial_started_at) ON public.profiles FROM authenticated;
REVOKE SELECT (sms_unsubscribed, email_notifications_enabled, in_app_notifications_enabled, membership_tier, billing_period, total_points, grandfathered, trial_started_at) ON public.profiles FROM anon;

-- Allow users to read their own notification/billing fields via existing get_my_account_settings RPC (already SECURITY DEFINER).
-- Service role retains full access.

-- Fix: remove sensitive tables from Realtime publication to prevent broadcast leakage.
ALTER PUBLICATION supabase_realtime DROP TABLE public.external_event_rsvps;
ALTER PUBLICATION supabase_realtime DROP TABLE public.game_rsvps;
