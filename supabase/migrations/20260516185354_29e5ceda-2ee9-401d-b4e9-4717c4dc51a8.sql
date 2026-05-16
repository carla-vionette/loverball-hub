DROP POLICY IF EXISTS "Members can create swipes" ON public.swipes;
DROP POLICY IF EXISTS "Members can view own swipes" ON public.swipes;
DROP POLICY IF EXISTS "Members can delete own swipes" ON public.swipes;

CREATE POLICY "Users can create own swipes" ON public.swipes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = swiper_id);

CREATE POLICY "Users can view own swipes" ON public.swipes
  FOR SELECT TO authenticated
  USING (auth.uid() = swiper_id);

CREATE POLICY "Users can delete own swipes" ON public.swipes
  FOR DELETE TO authenticated
  USING (auth.uid() = swiper_id);