-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('pending', 'member', 'admin');

-- Create user_roles table for role management (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Extend profiles table with new fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_role TEXT,
ADD COLUMN IF NOT EXISTS industries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS looking_for_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS favorite_la_teams TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interested_in_world_cup_la BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS interested_in_la28 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Invites table
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invites"
  ON public.invites FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can validate invite codes"
  ON public.invites FOR SELECT
  USING (true);

-- Member applications table
CREATE TABLE public.member_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL,
  role_title TEXT,
  instagram_or_linkedin_url TEXT,
  why_join TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.member_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON public.member_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications"
  ON public.member_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all applications"
  ON public.member_applications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Swipes table
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (swiper_id, target_user_id)
);

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own swipes"
  ON public.swipes FOR SELECT
  USING (auth.uid() = swiper_id AND public.has_role(auth.uid(), 'member'));

CREATE POLICY "Members can create swipes"
  ON public.swipes FOR INSERT
  WITH CHECK (auth.uid() = swiper_id AND public.has_role(auth.uid(), 'member'));

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_b_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_a_id, user_b_id)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own matches"
  ON public.matches FOR SELECT
  USING ((auth.uid() = user_a_id OR auth.uid() = user_b_id) AND public.has_role(auth.uid(), 'member'));

-- Chats table
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view chats for their matches"
  ON public.chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE m.id = match_id 
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    )
    AND public.has_role(auth.uid(), 'member')
  );

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages in their chats"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chats c
      JOIN public.matches m ON m.id = c.match_id
      WHERE c.id = chat_id
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    )
    AND public.has_role(auth.uid(), 'member')
  );

CREATE POLICY "Members can send messages in their chats"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats c
      JOIN public.matches m ON m.id = c.match_id
      WHERE c.id = chat_id
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    )
    AND public.has_role(auth.uid(), 'member')
  );

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  venue_name TEXT,
  city TEXT DEFAULT 'Los Angeles',
  event_type TEXT CHECK (event_type IN ('panel', 'watch_party', 'brunch', 'salon', 'party', 'networking', 'game', 'other')),
  sport_tags TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'members_only', 'invite_only')),
  host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public events"
  ON public.events FOR SELECT
  USING (visibility = 'public' OR public.has_role(auth.uid(), 'member') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Event RSVPs table
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'waitlisted', 'attending', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own RSVPs"
  ON public.event_rsvps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can create RSVPs"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'member'));

CREATE POLICY "Users can update own RSVPs"
  ON public.event_rsvps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all RSVPs"
  ON public.event_rsvps FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Sports ticker items table
CREATE TABLE public.sports_ticker_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('game', 'score', 'headline', 'event')),
  title TEXT NOT NULL,
  tag TEXT,
  starts_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sports_ticker_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ticker items"
  ON public.sports_ticker_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage ticker items"
  ON public.sports_ticker_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Function to check for mutual swipe and create match
CREATE OR REPLACE FUNCTION public.check_and_create_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mutual_swipe_exists BOOLEAN;
  new_match_id UUID;
BEGIN
  -- Only process right swipes
  IF NEW.direction = 'right' THEN
    -- Check if target has already swiped right on the swiper
    SELECT EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swiper_id = NEW.target_user_id
      AND target_user_id = NEW.swiper_id
      AND direction = 'right'
    ) INTO mutual_swipe_exists;
    
    IF mutual_swipe_exists THEN
      -- Create match (order users consistently)
      INSERT INTO public.matches (user_a_id, user_b_id)
      VALUES (
        LEAST(NEW.swiper_id, NEW.target_user_id),
        GREATEST(NEW.swiper_id, NEW.target_user_id)
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO new_match_id;
      
      -- Create chat for the match if match was created
      IF new_match_id IS NOT NULL THEN
        INSERT INTO public.chats (match_id)
        VALUES (new_match_id);
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create matches
CREATE TRIGGER on_swipe_check_match
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_create_match();

-- Updated_at trigger for events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Updated_at trigger for member_applications  
CREATE TRIGGER update_member_applications_updated_at
  BEFORE UPDATE ON public.member_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();