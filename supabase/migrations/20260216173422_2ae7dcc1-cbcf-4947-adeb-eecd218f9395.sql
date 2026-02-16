
-- Community Groups table
CREATE TABLE public.community_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT NOT NULL DEFAULT 'interest', -- 'team', 'interest', 'custom'
  team_key TEXT, -- e.g. 'lakers', 'lafc' for auto-created team groups
  icon_emoji TEXT DEFAULT '💬',
  created_by UUID REFERENCES auth.users(id),
  is_official BOOLEAN NOT NULL DEFAULT false,
  rules TEXT,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group Members junction table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group Messages table
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- RLS: community_groups
CREATE POLICY "Anyone can view groups"
  ON public.community_groups FOR SELECT
  USING (true);

CREATE POLICY "Members can create groups"
  ON public.community_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'member'));

CREATE POLICY "Group creator or admin can update"
  ON public.community_groups FOR UPDATE
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete groups"
  ON public.community_groups FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS: group_members
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (has_role(auth.uid(), 'member'));

CREATE POLICY "Members can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'member'));

CREATE POLICY "Members can leave groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage members"
  ON public.group_members FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS: group_messages
CREATE POLICY "Group members can view messages"
  ON public.group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and moderators can pin/manage messages"
  ON public.group_messages FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Message sender can delete own messages"
  ON public.group_messages FOR DELETE
  USING (
    auth.uid() = sender_id OR
    has_role(auth.uid(), 'admin')
  );

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Update member count trigger
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_group_member_change
AFTER INSERT OR DELETE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.update_group_member_count();

-- Seed official team groups
INSERT INTO public.community_groups (name, description, group_type, team_key, icon_emoji, is_official, member_count) VALUES
  ('Lakers Chat', 'Los Angeles Lakers discussion and game threads', 'team', 'lakers', '💜', true, 0),
  ('LAFC Chat', 'Los Angeles FC match discussions', 'team', 'lafc', '⚽', true, 0),
  ('Dodgers Chat', 'LA Dodgers game day conversations', 'team', 'dodgers', '⚾', true, 0),
  ('Sparks Chat', 'LA Sparks WNBA talk', 'team', 'sparks', '⚡', true, 0),
  ('Angel City FC Chat', 'Angel City FC NWSL discussion', 'team', 'angel-city', '😇', true, 0),
  ('Rams Chat', 'LA Rams football talk', 'team', 'rams', '🐏', true, 0),
  ('Clippers Chat', 'LA Clippers discussion', 'team', 'clippers', '✂️', true, 0),
  ('Galaxy Chat', 'LA Galaxy soccer discussion', 'team', 'galaxy', '🌟', true, 0),
  ('Watch Party Planners', 'Coordinate watch parties for any game', 'interest', NULL, '📺', true, 0),
  ('Pickup Games', 'Find and organize pickup games around LA', 'interest', NULL, '🏀', true, 0),
  ('Sports Fashion', 'Game day outfits, jersey culture, and style inspo', 'interest', NULL, '👗', true, 0),
  ('LA28 Olympics Hype', 'Everything 2028 Olympics in Los Angeles', 'interest', NULL, '🏅', true, 0);
