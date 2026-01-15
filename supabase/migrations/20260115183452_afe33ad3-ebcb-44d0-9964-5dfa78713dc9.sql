-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload event images (admins only enforced in app)
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Allow public read access to event images
CREATE POLICY "Public can view event images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-images');

-- Allow authenticated users to delete event images
CREATE POLICY "Authenticated users can delete event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');