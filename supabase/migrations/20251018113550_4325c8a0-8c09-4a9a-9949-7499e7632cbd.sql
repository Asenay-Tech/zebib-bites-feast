-- Fix token generation by including extensions schema in search_path so gen_random_bytes resolves
CREATE OR REPLACE FUNCTION public.generate_verification_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, extensions'
AS $function$
DECLARE
  token TEXT;
BEGIN
  -- gen_random_bytes is provided by pgcrypto in the extensions schema
  token := encode(gen_random_bytes(32), 'base64');
  token := replace(token, '/', '_');
  token := replace(token, '+', '-');
  token := replace(token, '=', '');
  RETURN token;
END;
$function$;