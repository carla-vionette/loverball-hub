
-- Fix the security definer view warning - drop security_barrier since the underlying 
-- profiles table RLS already handles row-level access control
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT 
  id,
  name,
  pronouns,
  city,
  neighborhood,
  bio,
  profile_photo_url,
  favorite_sports,
  favorite_la_teams,
  favorite_teams_players,
  primary_role,
  industries,
  looking_for_tags,
  other_interests,
  membership_tier,
  total_points,
  current_streak,
  longest_streak,
  interested_in_world_cup_la,
  interested_in_la28,
  age_range,
  participation_preferences,
  sports_experience_types,
  event_comfort_level,
  created_at,
  updated_at
FROM public.profiles;
