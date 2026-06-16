
DROP POLICY IF EXISTS "Owners and admins can read application uploads" ON storage.objects;

CREATE POLICY "Owners and admins can read application uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'application-uploads'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );
