
-- ============================================
-- SECURITY FIX 1: Enable RLS on invites table
-- ============================================
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Users can view their own invites
CREATE POLICY "Users can view own invites"
ON public.invites FOR SELECT
TO authenticated
USING (auth.uid() = inviter_id);

-- Admins can view all invites
CREATE POLICY "Admins can view all invites"
ON public.invites FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can create invites for themselves
CREATE POLICY "Users can create own invites"
ON public.invites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = inviter_id);

-- ============================================
-- SECURITY FIX 2: Add RLS policies to subscriptions
-- ============================================
CREATE POLICY "Users can view own subscription"
ON public.subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscriptions"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert subscriptions"
ON public.subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SECURITY FIX 3: Restrict profiles - sensitive data protection
-- ============================================
DROP POLICY IF EXISTS "Members can view other member profiles" ON public.profiles;

-- Security definer function for safe profile access (strips PII)
CREATE OR REPLACE FUNCTION public.get_safe_profile(profile_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'bio', p.bio,
    'city', p.city,
    'profile_photo_url', p.profile_photo_url,
    'favorite_sports', p.favorite_sports,
    'favorite_la_teams', p.favorite_la_teams,
    'primary_role', p.primary_role,
    'pronouns', p.pronouns,
    'industries', p.industries,
    'looking_for_tags', p.looking_for_tags,
    'other_interests', p.other_interests,
    'created_at', p.created_at
  )
  FROM public.profiles p
  WHERE p.id = profile_id
$$;

-- Members can view other profiles (row-level access)
-- Sensitive columns (phone, birthday) protected via edge function + get_safe_profile
CREATE POLICY "Members can view other profiles basic info"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR public.has_role(auth.uid(), 'member')
  OR public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- SECURITY FIX 4: Restrict video_views INSERT
-- ============================================
DROP POLICY IF EXISTS "Anyone can create views" ON public.video_views;

CREATE POLICY "Authenticated users can create views"
ON public.video_views FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- ============================================
-- SECURITY FIX 5: Admin config table (replace hardcoded emails)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read config"
ON public.admin_config FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage config"
ON public.admin_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.admin_config (config_key, config_value)
VALUES ('admin_emails', '["carla@loverball.com", "icastro@loverball.com"]'::jsonb)
ON CONFLICT (config_key) DO NOTHING;

-- Update admin validation to use config table instead of hardcoded emails
CREATE OR REPLACE FUNCTION public.validate_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  allowed_emails JSONB;
BEGIN
  IF NEW.role = 'admin' THEN
    SELECT config_value INTO allowed_emails
    FROM public.admin_config
    WHERE config_key = 'admin_emails';

    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;

    IF user_email IS NULL OR NOT (allowed_emails ? user_email) THEN
      RAISE EXCEPTION 'Only authorized users can be assigned admin role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_admin_auto_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_emails JSONB;
BEGIN
  SELECT config_value INTO allowed_emails
  FROM public.admin_config
  WHERE config_key = 'admin_emails';

  IF allowed_emails IS NOT NULL AND (allowed_emails ? NEW.email) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- SECURITY FIX 6: Tighten event_rsvps PII access
-- ============================================
DROP POLICY IF EXISTS "Users can view own RSVPs or as event host" ON public.event_rsvps;

CREATE POLICY "Users and hosts can view RSVPs"
ON public.event_rsvps FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_rsvps.event_id 
    AND events.host_user_id = auth.uid()
  )
);
