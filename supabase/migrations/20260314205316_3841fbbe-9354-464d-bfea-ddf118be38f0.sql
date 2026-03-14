
-- Create a security barrier view that excludes sensitive columns
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_barrier = true)
AS
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

-- Re-add member policy for profiles table so joins work,
-- but now the app code will use profiles_public view for other-user queries
CREATE POLICY "Members can view other member profiles limited"
ON public.profiles FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'member'::app_role)
);
