
-- group_members: restrict cross-group enumeration
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
CREATE POLICY "Members can view co-members of their groups"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- post_likes: only own likes visible
DROP POLICY IF EXISTS "Authenticated users can view post likes" ON public.post_likes;
CREATE POLICY "Users can view own post likes"
ON public.post_likes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- video_likes: only own likes visible
DROP POLICY IF EXISTS "Authenticated users can view likes" ON public.video_likes;
CREATE POLICY "Users can view own video likes"
ON public.video_likes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
