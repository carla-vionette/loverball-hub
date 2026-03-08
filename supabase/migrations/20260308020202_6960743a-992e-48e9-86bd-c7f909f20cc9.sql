
CREATE TABLE public.feed_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  sport_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  team_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feed items"
  ON public.feed_items
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage feed items"
  ON public.feed_items
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));
