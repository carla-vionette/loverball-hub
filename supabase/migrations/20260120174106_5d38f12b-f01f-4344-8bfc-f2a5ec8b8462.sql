-- Create creator_channels table
CREATE TABLE public.creator_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  channel_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sport_focus TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create creator_applications table
CREATE TABLE public.creator_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_user_id UUID NOT NULL,
  desired_channel_name TEXT NOT NULL,
  content_focus TEXT NOT NULL,
  example_content_links TEXT,
  social_handles TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'declined')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create videos table (external URLs only)
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.creator_channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  tags TEXT[] DEFAULT '{}'::text[],
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create video_likes table
CREATE TABLE public.video_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Create video_views table
CREATE TABLE public.video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.creator_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- Creator Channels RLS Policies
CREATE POLICY "Anyone can view approved channels"
ON public.creator_channels
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Channel owners can view own channels"
ON public.creator_channels
FOR SELECT
USING (auth.uid() = owner_user_id);

CREATE POLICY "Admins can manage all channels"
ON public.creator_channels
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Channel owners can update own approved channels"
ON public.creator_channels
FOR UPDATE
USING (auth.uid() = owner_user_id AND status = 'approved')
WITH CHECK (auth.uid() = owner_user_id AND status = 'approved');

-- Creator Applications RLS Policies
CREATE POLICY "Users can view own applications"
ON public.creator_applications
FOR SELECT
USING (auth.uid() = applicant_user_id);

CREATE POLICY "Members can create applications"
ON public.creator_applications
FOR INSERT
WITH CHECK (auth.uid() = applicant_user_id AND has_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Admins can manage all applications"
ON public.creator_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Videos RLS Policies
CREATE POLICY "Anyone can view published videos from approved channels"
ON public.videos
FOR SELECT
USING (
  is_published = true 
  AND EXISTS (
    SELECT 1 FROM public.creator_channels 
    WHERE id = videos.channel_id AND status = 'approved'
  )
);

CREATE POLICY "Channel owners can manage own videos"
ON public.videos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.creator_channels 
    WHERE id = videos.channel_id 
    AND owner_user_id = auth.uid()
    AND status = 'approved'
  )
);

CREATE POLICY "Admins can manage all videos"
ON public.videos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Video Likes RLS Policies
CREATE POLICY "Anyone can view likes"
ON public.video_likes
FOR SELECT
USING (true);

CREATE POLICY "Members can create likes"
ON public.video_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'member'::app_role));

CREATE POLICY "Users can delete own likes"
ON public.video_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Video Views RLS Policies
CREATE POLICY "Anyone can create views"
ON public.video_views
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all views"
ON public.video_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for creator_channels
CREATE TRIGGER update_creator_channels_updated_at
BEFORE UPDATE ON public.creator_channels
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_creator_channels_owner ON public.creator_channels(owner_user_id);
CREATE INDEX idx_creator_channels_status ON public.creator_channels(status);
CREATE INDEX idx_creator_channels_slug ON public.creator_channels(slug);
CREATE INDEX idx_creator_applications_applicant ON public.creator_applications(applicant_user_id);
CREATE INDEX idx_creator_applications_status ON public.creator_applications(status);
CREATE INDEX idx_videos_channel ON public.videos(channel_id);
CREATE INDEX idx_videos_published ON public.videos(is_published);
CREATE INDEX idx_video_likes_video ON public.video_likes(video_id);
CREATE INDEX idx_video_likes_user ON public.video_likes(user_id);
CREATE INDEX idx_video_views_video ON public.video_views(video_id);