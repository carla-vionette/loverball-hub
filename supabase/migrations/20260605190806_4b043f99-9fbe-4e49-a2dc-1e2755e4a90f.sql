DROP POLICY IF EXISTS "Anyone can insert client errors" ON public.client_errors;

CREATE POLICY "Anon can insert anonymous client errors"
ON public.client_errors
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated users can insert their own client errors"
ON public.client_errors
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());