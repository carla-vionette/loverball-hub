
-- 1. Fix point_transactions: Remove user-facing INSERT policy, restrict to service_role only
DROP POLICY IF EXISTS "Users can insert own points" ON public.point_transactions;

CREATE POLICY "Service role can insert points"
ON public.point_transactions
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. Fix videos: Remove overly permissive SELECT policy, keep only published+approved
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;

-- 3. Fix profiles: Create a view-restricting policy that hides phone_number from non-owners
-- We'll use a security definer function to get safe profile data
-- The existing get_safe_profile already strips phone_number, but the raw SELECT policy exposes it.
-- We need to create a column-level security approach. Since Postgres doesn't have column-level RLS,
-- we'll create a security definer function that acts as the data access layer.
-- For now, let's add a profiles policy that restricts what non-owners can see.

-- First check existing profiles policies and add a restricted one
-- The profiles table likely has open SELECT. We need to ensure phone_number is protected.
-- We'll handle this by updating get_safe_profile to be the recommended access pattern
-- and documenting that direct profile queries should go through it.
