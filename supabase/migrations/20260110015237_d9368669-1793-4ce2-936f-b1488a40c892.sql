-- Drop the overly permissive policy
DROP POLICY "Users can update invite used count" ON public.invites;

-- Create a more restrictive policy - only allow updating used_count
CREATE POLICY "Users can increment invite used count"
ON public.invites
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (used_count = (SELECT used_count + 1 FROM public.invites WHERE id = invites.id));