-- Create storage bucket policies for menu-images
-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view menu images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can upload menu images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update menu images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete menu images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Policy: Anyone can view menu images (public bucket)
CREATE POLICY "Anyone can view menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- Policy: Only admins can upload menu images
CREATE POLICY "Admins can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Only admins can update menu images
CREATE POLICY "Admins can update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Only admins can delete menu images
CREATE POLICY "Admins can delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);