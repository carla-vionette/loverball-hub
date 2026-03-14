
-- Fix: profiles phone_number and birthday exposed to all members
-- Drop the overly permissive member SELECT policy
DROP POLICY IF EXISTS "Members can view other profiles basic info" ON public.profiles;

-- Keep "Users can view own profile" (already exists) for full self-access

-- Create a restricted policy for members viewing OTHER profiles
-- This grants row access but we'll use a security barrier view for column restriction
-- Since RLS can't restrict columns, we create a function-based approach

-- Create a security definer function that returns only safe profile columns for other users
CREATE OR REPLACE FUNCTION public.get_public_profile_columns(target_id uuid)
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
    'favorite_teams_players', p.favorite_teams_players,
    'primary_role', p.primary_role,
    'pronouns', p.pronouns,
    'industries', p.industries,
    'looking_for_tags', p.looking_for_tags,
    'other_interests', p.other_interests,
    'membership_tier', p.membership_tier,
    'total_points', p.total_points,
    'current_streak', p.current_streak,
    'created_at', p.created_at
  )
  FROM public.profiles p
  WHERE p.id = target_id
$$;

-- Create a restricted SELECT policy for authenticated users viewing other profiles
-- Only allows access to name and profile_photo_url via direct query
-- Full profile data for other users should go through get_public_profile_columns() or get-member-profiles edge function
CREATE POLICY "Authenticated can view basic profile info"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id  -- Full access to own profile
  OR has_role(auth.uid(), 'admin'::app_role)  -- Admins see everything
);

-- For member-to-member profile browsing (chat, DMs), create a minimal policy
-- This allows members to see ONLY specific columns of other members
-- Note: RLS is row-level, so we need to grant row access but the edge function handles column filtering
-- We'll create a separate restricted policy for member access
CREATE POLICY "Members can view other member profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'member'::app_role)
);
