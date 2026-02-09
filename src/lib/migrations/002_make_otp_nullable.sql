-- Make otp column nullable to support 2Factor Autogen flow
ALTER TABLE otp_sessions ALTER COLUMN otp DROP NOT NULL;
