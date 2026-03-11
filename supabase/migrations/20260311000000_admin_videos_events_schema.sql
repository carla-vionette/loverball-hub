-- ============================================================
-- Loverball Platform Schema Enhancement
-- Adds: videos table, ensures profiles role field, members table
-- Adds: RLS policies for admin/member access
-- ============================================================

-- ── Videos table ──
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail text,
  category text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Everyone can view videos
CREATE POLICY "Videos are viewable by everyone"
  ON public.videos FOR SELECT
  USING (true);

-- Only admins can insert/update/delete videos
CREATE POLICY "Admins can manage videos"
  ON public.videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── Ensure profiles has a role column (safe idempotent add) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
  END IF;
END$$;

-- ── Members table (links profile to membership status) ──
CREATE TABLE IF NOT EXISTS public.members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(profile_id)
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members viewable by authenticated users"
  ON public.members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage members"
  ON public.members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ── Auto-assign admin role to Carla@stori.digital ──
-- This runs once; if the user exists, grant admin role
DO $$
DECLARE
  carla_id uuid;
BEGIN
  SELECT id INTO carla_id FROM auth.users WHERE email ILIKE 'carla@stori.digital' LIMIT 1;
  IF carla_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (carla_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
END$$;

-- ── Ensure events table has required fields ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'event_link'
  ) THEN
    ALTER TABLE public.events ADD COLUMN event_link text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'location'
  ) THEN
    ALTER TABLE public.events ADD COLUMN location text;
  END IF;
END$$;
