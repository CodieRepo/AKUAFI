-- Create or update otp_sessions table
CREATE TABLE IF NOT EXISTS public.otp_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone text NOT NULL,
    session_id text, -- From 2Factor API
    otp text, -- We might not need this if using 2Factor Verify API, but good for fallback/audit if strictly needed. However, 2Factor VERIFY api checks it. The user said "Store returned session_id securely". We'll keep OTP column nullable or just use session_id.
    -- standard 2Factor flow: Send -> get session_id. Verify -> send session_id + user_input_otp.
    -- We don't necessarily know the OTP if using Autogen.
    -- So 'otp' column might be unused for Autogen flow, but let's keep it for compatibility or manual OTPs.
    attempts int DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    verified_at timestamp with time zone,
    verified boolean DEFAULT false
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_sessions_phone ON public.otp_sessions (phone);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_session_id ON public.otp_sessions (session_id);
