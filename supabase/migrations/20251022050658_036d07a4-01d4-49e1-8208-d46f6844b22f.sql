-- Add image_scale column to menu_items table to store zoom/framing preference
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS image_scale numeric DEFAULT 1.0 CHECK (image_scale >= 0.5 AND image_scale <= 3.0);

COMMENT ON COLUMN menu_items.image_scale IS 'Zoom/scale factor for menu item images (0.5 to 3.0, default 1.0)';