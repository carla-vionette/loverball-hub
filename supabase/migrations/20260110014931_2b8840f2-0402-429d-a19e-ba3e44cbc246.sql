-- Allow authenticated users to update invite used_count when validating
CREATE POLICY "Users can update invite used count"
ON public.invites
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow users to insert their own member role (for invite validation)
CREATE POLICY "Users can insert own member role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'member');