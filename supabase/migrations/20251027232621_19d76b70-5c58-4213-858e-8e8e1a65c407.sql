-- Create table for category settings
CREATE TABLE IF NOT EXISTS public.category_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  show_image BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.category_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read category settings
CREATE POLICY "Anyone can view category settings"
  ON public.category_settings
  FOR SELECT
  USING (true);

-- Only admins can modify category settings
CREATE POLICY "Admins can insert category settings"
  ON public.category_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update category settings"
  ON public.category_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete category settings"
  ON public.category_settings
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_category_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_settings_timestamp
  BEFORE UPDATE ON public.category_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_category_settings_updated_at();