-- Allow smaller image scales down to 0.1x
ALTER TABLE public.menu_items DROP CONSTRAINT IF EXISTS menu_items_image_scale_check;
ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_image_scale_check CHECK ((image_scale >= 0.1) AND (image_scale <= 3.0));