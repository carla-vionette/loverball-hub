-- Drop existing restrictive policies on member_applications
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.member_applications;
DROP POLICY IF EXISTS "Users can create own applications" ON public.member_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.member_applications;

-- Create proper PERMISSIVE policies (default behavior, uses OR logic)

-- Admins can do everything
CREATE POLICY "Admins can manage all applications"
  ON public.member_applications
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can only view their own applications (must be authenticated)
CREATE POLICY "Users can view own applications"
  ON public.member_applications
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can create applications for themselves (must be authenticated)
CREATE POLICY "Users can create own applications"
  ON public.member_applications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can update their own pending applications
CREATE POLICY "Users can update own applications"
  ON public.member_applications
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);