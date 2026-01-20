-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos', 
  'videos', 
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-m4v']
);

-- Storage policies for videos bucket
CREATE POLICY "Anyone can view videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Channel owners can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' 
  AND EXISTS (
    SELECT 1 FROM public.creator_channels
    WHERE owner_user_id = auth.uid()
    AND status = 'approved'
  )
);

CREATE POLICY "Channel owners can update their videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.creator_channels
    WHERE owner_user_id = auth.uid()
    AND status = 'approved'
  )
);

CREATE POLICY "Channel owners can delete their videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos'
  AND EXISTS (
    SELECT 1 FROM public.creator_channels
    WHERE owner_user_id = auth.uid()
    AND status = 'approved'
  )
);