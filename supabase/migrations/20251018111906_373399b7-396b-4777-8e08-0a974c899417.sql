-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('signup', 'password_reset', 'email_change')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_email_verification_tokens_token_hash ON public.email_verification_tokens(token_hash);
CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own tokens
CREATE POLICY "Users can view own tokens"
  ON public.email_verification_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_verification_tokens
  WHERE expires_at < now()
    AND used_at IS NULL;
END;
$$;

-- Function to generate verification token
CREATE OR REPLACE FUNCTION public.generate_verification_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
BEGIN
  token := encode(gen_random_bytes(32), 'base64');
  token := replace(token, '/', '_');
  token := replace(token, '+', '-');
  token := replace(token, '=', '');
  RETURN token;
END;
$$;