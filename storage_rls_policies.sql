-- Drop existing policies if they exist to start clean
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anon users can upload" ON storage.objects;

-- Create the membership bucket if it doesn't exist
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
