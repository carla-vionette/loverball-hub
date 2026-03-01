
-- Add membership tier column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS membership_tier text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_period text DEFAULT 'monthly';
