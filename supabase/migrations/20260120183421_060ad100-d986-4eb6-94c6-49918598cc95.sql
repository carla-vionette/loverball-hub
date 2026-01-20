-- Add policy to allow channel owners to upload channel photos
CREATE POLICY "Channel owners can upload channel photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = 'channels'
  AND EXISTS (
    SELECT 1 FROM creator_channels
    WHERE owner_user_id = auth.uid() 
    AND status = 'approved'
  )
);

-- Add policy to allow channel owners to update channel photos  
CREATE POLICY "Channel owners can update channel photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = 'channels'
  AND EXISTS (
    SELECT 1 FROM creator_channels
    WHERE owner_user_id = auth.uid() 
    AND status = 'approved'
  )
);

-- Add policy to allow channel owners to delete channel photos
CREATE POLICY "Channel owners can delete channel photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = 'channels'
  AND EXISTS (
    SELECT 1 FROM creator_channels
    WHERE owner_user_id = auth.uid() 
    AND status = 'approved'
  )
);