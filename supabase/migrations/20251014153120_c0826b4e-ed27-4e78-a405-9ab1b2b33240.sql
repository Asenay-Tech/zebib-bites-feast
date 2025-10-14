-- Create menu_items table with admin tracking
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name_de text NOT NULL,
  name_en text NOT NULL,
  description_de text,
  description_en text,
  price jsonb NOT NULL,
  image_url text,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view menu items
CREATE POLICY "Anyone can view menu items"
ON public.menu_items
FOR SELECT
USING (true);

-- Only admins can insert menu items
CREATE POLICY "Admins can insert menu items"
ON public.menu_items
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update menu items
CREATE POLICY "Admins can update menu items"
ON public.menu_items
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete menu items
CREATE POLICY "Admins can delete menu items"
ON public.menu_items
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true);

-- Allow anyone to view menu images
CREATE POLICY "Anyone can view menu images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'menu-images');

-- Only admins can upload menu images
CREATE POLICY "Admins can upload menu images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update menu images
CREATE POLICY "Admins can update menu images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete menu images
CREATE POLICY "Admins can delete menu images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));