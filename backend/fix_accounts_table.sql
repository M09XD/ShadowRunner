-- Fix accounts table schema
-- Drop the password column if it exists and keep password_hash
ALTER TABLE accounts DROP COLUMN IF EXISTS password;

-- Ensure password_hash column exists and is properly configured
ALTER TABLE accounts ALTER COLUMN password_hash SET NOT NULL;

-- Verify the table structure
\d accounts;