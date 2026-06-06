-- Hide sensitive PII columns from authenticated role via column-level revoke.
-- These columns are not read by client code; admins access via service role/admin functions.

REVOKE SELECT (admin_notes) ON public.event_submissions FROM authenticated;
REVOKE SELECT (recipient_phone, recipient_email) ON public.event_invites FROM authenticated;
