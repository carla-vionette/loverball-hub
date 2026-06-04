-- Fix 1: Hide event_password_hash from clients via column-level privilege revoke.
-- RLS still controls row access; column privileges prevent reading the hash even
-- when a row is otherwise visible. Server-side SECURITY DEFINER functions
-- (verify_event_password / set_event_password) continue to access the column.
REVOKE SELECT (event_password_hash) ON public.events FROM anon, authenticated;

-- Fix 2: Add admin SELECT policy to lb_users so admins don't need service-role bypass.
CREATE POLICY "Admins can view lb_users"
  ON public.lb_users
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
