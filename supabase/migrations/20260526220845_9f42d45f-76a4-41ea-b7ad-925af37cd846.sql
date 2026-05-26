
-- 1. Restrict event-images uploads to user-owned folder
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Restrict lb_rsvps SELECT to authenticated users
DROP POLICY IF EXISTS "lb_rsvps public read" ON public.lb_rsvps;
CREATE POLICY "lb_rsvps authenticated read"
ON public.lb_rsvps
FOR SELECT
TO authenticated
USING (true);
