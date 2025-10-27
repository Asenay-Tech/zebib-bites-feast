-- Fix search path for update_category_settings_updated_at function
CREATE OR REPLACE FUNCTION update_category_settings_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;