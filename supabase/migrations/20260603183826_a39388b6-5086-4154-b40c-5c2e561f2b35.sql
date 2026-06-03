
DROP POLICY IF EXISTS "Anyone can look up invite by token" ON public.event_invites;

REVOKE SELECT ON public.event_invites FROM anon;

CREATE OR REPLACE FUNCTION public.get_event_invite_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  invite_link_token text,
  recipient_email text,
  recipient_phone text,
  sent_by_user_id uuid,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.event_id, i.invite_link_token, i.recipient_email,
         i.recipient_phone, i.sent_by_user_id, i.status, i.created_at
  FROM public.event_invites i
  WHERE p_token IS NOT NULL
    AND length(p_token) BETWEEN 8 AND 128
    AND i.invite_link_token = p_token
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_event_invite_by_token(text) TO anon, authenticated;
