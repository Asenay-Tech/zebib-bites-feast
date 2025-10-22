-- Add columns for storing original and edited image URLs
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS original_image_url TEXT,
ADD COLUMN IF NOT EXISTS edited_image_url TEXT,
ADD COLUMN IF NOT EXISTS image_offset_x NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_offset_y NUMERIC DEFAULT 0;