-- Prevent direct match creation (only trigger should create)
CREATE POLICY "Matches created by trigger only"
  ON public.matches FOR INSERT
  WITH CHECK (false);

-- Allow users to update only their own matches (status changes like blocking/archiving)
CREATE POLICY "Members can update own match status"
  ON public.matches FOR UPDATE
  USING (
    (auth.uid() = user_a_id OR auth.uid() = user_b_id) 
    AND public.has_role(auth.uid(), 'member')
  )
  WITH CHECK (
    (auth.uid() = user_a_id OR auth.uid() = user_b_id)
    AND public.has_role(auth.uid(), 'member')
  );

-- Prevent match deletion (matches should be archived via status)
CREATE POLICY "Matches cannot be deleted"
  ON public.matches FOR DELETE
  USING (false);