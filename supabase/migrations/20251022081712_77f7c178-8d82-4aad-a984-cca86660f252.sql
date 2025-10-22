-- Modify specialties table to reference menu_items
-- First, add the new column
ALTER TABLE public.specialties ADD COLUMN menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE;

-- Drop the old columns that duplicate menu_item data
ALTER TABLE public.specialties DROP COLUMN IF EXISTS title_de;
ALTER TABLE public.specialties DROP COLUMN IF EXISTS title_en;
ALTER TABLE public.specialties DROP COLUMN IF EXISTS description_de;
ALTER TABLE public.specialties DROP COLUMN IF EXISTS description_en;
ALTER TABLE public.specialties DROP COLUMN IF EXISTS image_url;

-- Add unique constraint to prevent duplicate menu items in specialties
ALTER TABLE public.specialties ADD CONSTRAINT unique_menu_item_id UNIQUE (menu_item_id);