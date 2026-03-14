
-- Move sensitive columns to a separate table with strict owner-only access
-- 1. Create the sensitive data table
CREATE TABLE IF NOT EXISTS public.profiles_sensitive (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text,
  birthday date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.profiles_sensitive ENABLE ROW LEVEL SECURITY;

-- 3. Owner-only access (and admins)
CREATE POLICY "Users can view own sensitive data"
ON public.profiles_sensitive FOR SELECT
TO authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own sensitive data"
ON public.profiles_sensitive FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own sensitive data"
ON public.profiles_sensitive FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 4. Migrate existing data from profiles to profiles_sensitive
INSERT INTO public.profiles_sensitive (id, phone_number, birthday)
SELECT id, phone_number, birthday FROM public.profiles
WHERE phone_number IS NOT NULL OR birthday IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  phone_number = EXCLUDED.phone_number,
  birthday = EXCLUDED.birthday;

-- 5. Drop the now-redundant columns from profiles
-- (keeping them would defeat the purpose)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone_number;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS birthday;

-- 6. Drop the profiles_public view (no longer needed since profiles table is now safe)
DROP VIEW IF EXISTS public.profiles_public;

-- 7. Drop the overly permissive member policy and redundant policies
DROP POLICY IF EXISTS "Members can view other member profiles limited" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view basic profile info" ON public.profiles;

-- 8. Create clean policies: own profile + member browsing (now safe since no sensitive columns)
CREATE POLICY "Users and members can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'member'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);
