-- ============================================================
-- Phase 1 & 2: Creator/Team/Organization Applications + Approval System
-- Adds: account_type, approval_status to profiles
-- Adds: creator_applications table
-- Adds: approval_status to events and videos
-- ============================================================

-- ── 1. Add account_type and approval columns to profiles ──
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'member'
    CHECK (account_type IN ('member', 'team', 'creator', 'organization')),
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS official_email text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_bio text,
  ADD COLUMN IF NOT EXISTS org_name text;

-- ── 2. Create creator_applications table ──
CREATE TABLE IF NOT EXISTS public.creator_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('team', 'creator', 'organization')),
  official_email text NOT NULL,
  phone_number text NOT NULL,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_bio text,
  org_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own creator applications"
  ON public.creator_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create own creator applications"
  ON public.creator_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all applications
CREATE POLICY "Admins can manage creator applications"
  ON public.creator_applications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 3. Add approval_status to events ──
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 4. Add approval_status to videos ──
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- ── 5. Update events SELECT policy to only show approved events to non-admins ──
-- Drop existing policy first (safe with IF EXISTS pattern)
DROP POLICY IF EXISTS "Anyone can view public events" ON public.events;

CREATE POLICY "Anyone can view approved public events"
  ON public.events FOR SELECT
  USING (
    (approval_status = 'approved' AND (visibility = 'public' OR public.has_role(auth.uid(), 'member')))
    OR public.has_role(auth.uid(), 'admin')
  );

-- Allow approved creators/teams/orgs to insert events (pending approval)
CREATE POLICY "Approved creators can submit events"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND account_type IN ('team', 'creator', 'organization')
      AND approval_status = 'approved'
    )
  );

-- ── 6. Update videos SELECT policy to only show approved videos ──
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;

CREATE POLICY "Anyone can view approved videos"
  ON public.videos FOR SELECT
  USING (
    approval_status = 'approved'
    OR public.has_role(auth.uid(), 'admin')
  );

-- Allow approved creators/teams/orgs to insert videos (pending approval)
DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;

CREATE POLICY "Admins can manage videos"
  ON public.videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Approved creators can upload videos"
  ON public.videos FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND account_type IN ('team', 'creator', 'organization')
      AND approval_status = 'approved'
    )
  );

-- ── 7. Updated_at trigger for creator_applications ──
CREATE TRIGGER update_creator_applications_updated_at
  BEFORE UPDATE ON public.creator_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
