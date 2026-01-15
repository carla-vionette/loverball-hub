-- Add explicit SELECT deny for non-admins (defense-in-depth)
-- Invite validation happens through validate_and_use_invite SECURITY DEFINER function
CREATE POLICY "Non-admins cannot read invites"
  ON public.invites FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Prevent non-admins from creating invites directly
CREATE POLICY "Non-admins cannot create invites"
  ON public.invites FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Prevent non-admins from modifying invites
CREATE POLICY "Non-admins cannot update invites"
  ON public.invites FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Prevent non-admins from deleting invites
CREATE POLICY "Non-admins cannot delete invites"
  ON public.invites FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));