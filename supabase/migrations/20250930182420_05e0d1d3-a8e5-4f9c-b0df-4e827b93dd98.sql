-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.generate_ticket_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  date_part TEXT;
  random_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  RETURN 'ZB-' || date_part || '-' || random_part;
END;
$$;