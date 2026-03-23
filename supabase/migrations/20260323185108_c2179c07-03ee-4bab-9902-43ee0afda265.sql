
-- Add new columns to creator_applications for enhanced multi-step form
ALTER TABLE public.creator_applications
  ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'creator',
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS sport text,
  ADD COLUMN IF NOT EXISTS league text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS instagram_followers integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS tiktok_followers integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS youtube_followers integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS twitter_followers integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone DEFAULT now();

-- Create storage bucket for application uploads if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-uploads', 'application-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to application-uploads bucket
CREATE POLICY "Authenticated users can upload application files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'application-uploads');

-- Allow public read access to application uploads
CREATE POLICY "Public can view application uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'application-uploads');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own application uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'application-uploads');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own application uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'application-uploads');
