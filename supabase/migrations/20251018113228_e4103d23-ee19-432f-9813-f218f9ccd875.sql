-- Enable pgcrypto extension for secure token generation used by generate_verification_token()
CREATE EXTENSION IF NOT EXISTS pgcrypto;