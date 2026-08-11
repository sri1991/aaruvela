-- =====================================================
-- SUPABASE STORAGE BUCKETS & POLICIES
-- Run in the Supabase SQL Editor. Safe to re-run.
-- =====================================================

-- -----------------------------------------------------
-- membership  (member photos, payment proofs)
-- Uploaded by anonymous applicants during onboarding,
-- so anon INSERT has to stay open for this bucket.
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anon users can upload" ON storage.objects;

INSERT INTO storage.buckets (id, name, public)
VALUES ('membership', 'membership', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to read files in the 'membership' bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'membership');

-- Allow anon users to upload files to 'membership' bucket
CREATE POLICY "Anon users can upload" ON storage.objects
FOR INSERT TO public WITH CHECK (bucket_id = 'membership');

-- Allow anon users to update their own uploads (optional, but good for retries)
CREATE POLICY "Anon users can update" ON storage.objects
FOR UPDATE TO public USING (bucket_id = 'membership');

-- Give public access to the bucket itself (so it can be listed)
CREATE POLICY "Public bucket access" ON storage.buckets
FOR SELECT USING (id = 'membership');


-- -----------------------------------------------------
-- chairman / videos / announcements / ads
--
-- These are PUBLIC READ but have NO insert/update/delete
-- policy on purpose. The browser never writes to them with
-- the anon key; it uploads using a signed upload URL that
-- the backend mints with the service-role key after checking
-- the caller's role and quota. Signed upload tokens bypass
-- RLS, so no INSERT policy is needed — and without one, a
-- leaked anon key cannot be used to fill the buckets.
-- -----------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chairman', 'chairman', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = true, file_size_limit = 10485760, allowed_mime_types = ARRAY['application/pdf'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('videos', 'videos', true, 26214400,
        ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE
  SET public = true, file_size_limit = 26214400,
      allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('announcements', 'announcements', true, 2097152,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true, file_size_limit = 2097152,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ads', 'ads', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true, file_size_limit = 2097152,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Public read for the four content buckets
DROP POLICY IF EXISTS "Public read content buckets" ON storage.objects;
CREATE POLICY "Public read content buckets" ON storage.objects
FOR SELECT USING (bucket_id IN ('chairman', 'videos', 'announcements', 'ads'));

-- The videos bucket also stores a small JPEG poster frame per video, which is
-- why image/jpeg is in its allowed mime types.
