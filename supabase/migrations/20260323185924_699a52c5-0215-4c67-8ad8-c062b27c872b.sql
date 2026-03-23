
-- Curated content table for Today's Highlights and shelves
CREATE TABLE IF NOT EXISTS public.curated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  image_url text,
  sport text,
  team_tag text,
  content_type text NOT NULL DEFAULT 'highlight',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.curated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view curated content"
  ON public.curated_content FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage curated content"
  ON public.curated_content FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
