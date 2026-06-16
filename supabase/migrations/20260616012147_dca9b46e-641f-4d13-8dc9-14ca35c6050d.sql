
-- 1) event_invites: restrict SELECT to admins only
DROP POLICY IF EXISTS "Admins and senders can view invites" ON public.event_invites;
CREATE POLICY "Admins can view invites"
  ON public.event_invites FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) game_rsvps: restrict SELECT to own + friends
DROP POLICY IF EXISTS "Authenticated can view RSVPs" ON public.game_rsvps;

CREATE POLICY "Users view own RSVP"
  ON public.game_rsvps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view friends RSVPs"
  ON public.game_rsvps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = auth.uid() AND f.addressee_id = game_rsvps.user_id) OR
          (f.addressee_id = auth.uid() AND f.requester_id = game_rsvps.user_id)
        )
    )
  );

-- 3) Helper RPC: minimal RSVP summary for a game (no sensitive cols)
CREATE OR REPLACE FUNCTION public.get_game_rsvp_summary(p_game_id uuid)
RETURNS TABLE(user_id uuid, rsvp_type text, going_solo boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.user_id, r.rsvp_type, r.going_solo
  FROM public.game_rsvps r
  WHERE r.game_id = p_game_id
$$;

GRANT EXECUTE ON FUNCTION public.get_game_rsvp_summary(uuid) TO authenticated;
