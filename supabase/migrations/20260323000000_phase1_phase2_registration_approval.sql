-- Phase 1 & 2: Registration Flow + Admin Approval System
-- Adds account types, approval workflows for profiles, events, and videos

-- 1. Add account_type and approval columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'member'
    CHECK (account_type IN ('member', 'team', 'creator', 'organization')),
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('approved', 'pending_review', 'rejected')),
  ADD COLUMN IF NOT EXISTS official_email text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_bio text,
  ADD COLUMN IF NOT EXISTS org_name text;

-- 2. Add approval_status to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('approved', 'pending', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles(id);

-- 3. Add approval_status to videos table
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('approved', 'pending', 'rejected'));

-- 4. Create creator_applications table for tracking the application process
CREATE TABLE IF NOT EXISTS creator_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL CHECK (account_type IN ('team', 'creator', 'organization')),
  official_email text NOT NULL,
  phone_number text NOT NULL,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_bio text,
  org_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON events(approval_status);
CREATE INDEX IF NOT EXISTS idx_videos_approval_status ON videos(approval_status);
CREATE INDEX IF NOT EXISTS idx_creator_applications_status ON creator_applications(status);
CREATE INDEX IF NOT EXISTS idx_creator_applications_user_id ON creator_applications(user_id);

-- 6. RLS policies for creator_applications
ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;

-- Users can read their own applications
CREATE POLICY "Users can view own applications"
  ON creator_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can create own applications"
  ON creator_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON creator_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can update applications (approve/reject)
CREATE POLICY "Admins can update applications"
  ON creator_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- 7. Update RLS for events: only approved events visible publicly
-- Drop existing select policy if it exists, then recreate
DO $$
BEGIN
  -- Try to drop existing public select policy for events
  BEGIN
    DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (approval_status = 'approved' OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));

-- 8. Update RLS for videos: only approved videos visible publicly
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "Videos are viewable by everyone" ON videos;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

CREATE POLICY "Videos are viewable by everyone"
  ON videos FOR SELECT
  USING (approval_status = 'approved' OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));
