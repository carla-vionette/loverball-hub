
-- Public buckets serve files via public URL without RLS; the broad SELECT
-- policies only enabled API listing of all files. Drop them.
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view application uploads" ON storage.objects;
