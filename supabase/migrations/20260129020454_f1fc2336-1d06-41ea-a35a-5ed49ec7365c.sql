-- Add DELETE policy for swipes table to allow users to undo their swipes
CREATE POLICY "Members can delete own swipes"
ON public.swipes
FOR DELETE
USING (auth.uid() = swiper_id AND has_role(auth.uid(), 'member'::app_role));