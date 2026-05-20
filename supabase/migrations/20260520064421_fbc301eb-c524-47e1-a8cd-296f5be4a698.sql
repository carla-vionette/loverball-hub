
CREATE TABLE public.story_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('fire','hundred','mad','watching','love')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (article_id, user_id, reaction)
);

CREATE INDEX idx_story_reactions_article ON public.story_reactions(article_id);
CREATE INDEX idx_story_reactions_user ON public.story_reactions(user_id);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are publicly viewable"
ON public.story_reactions FOR SELECT
USING (true);

CREATE POLICY "Users insert their own reactions"
ON public.story_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own reactions"
ON public.story_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
