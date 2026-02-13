-- PHASE 1: DATA + ROUTING STABILITY MIGRATION (FINAL HARDENED)
-- Created for AKUAFI Refactor

-- ==========================================
-- STEP 1: PRE-MIGRATION CHECKS (RUN MANUALLY FIRST)
-- ==========================================
-- Check for duplicate phone numbers
-- SELECT phone, COUNT(*) FROM users GROUP BY phone HAVING COUNT(*) > 1;

-- ==========================================
-- STEP 2: SAFE CLEANUP
-- ==========================================
-- Remove invalid redemptions (missing critical links)
DELETE FROM redemptions
WHERE user_id IS NULL
   OR campaign_id IS NULL
   OR bottle_id IS NULL;

-- Remove users with no phone number (invalid state)
DELETE FROM users
WHERE phone IS NULL;


-- ==========================================
-- STEP 3: USERS TABLE HARDENING
-- ==========================================
-- Ensure phone is never NULL
ALTER TABLE users
ALTER COLUMN phone SET NOT NULL;

-- Enforce uniqueness on phone
ALTER TABLE users
ADD CONSTRAINT unique_phone UNIQUE (phone);


-- ==========================================
-- STEP 4: REDEMPTIONS TABLE HARDENING
-- ==========================================
-- Ensure critical keys are never NULL
ALTER TABLE redemptions
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE redemptions
ALTER COLUMN campaign_id SET NOT NULL;

ALTER TABLE redemptions
ALTER COLUMN bottle_id SET NOT NULL;

-- Enforce Business Rule: One redemption per campaign per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_campaign
ON redemptions (user_id, campaign_id);


-- ==========================================
-- STEP 5: COUPONS TABLE HARDENING
-- ==========================================
-- Ensure coupon codes are unique
ALTER TABLE coupons
ADD CONSTRAINT unique_coupon_code UNIQUE (code);


-- ==========================================
-- STEP 6: FOREIGN KEYS SAFEGUARDS
-- ==========================================
DO $$ 
BEGIN
    -- users FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user' AND table_name = 'redemptions'
    ) THEN
        ALTER TABLE redemptions
        ADD CONSTRAINT fk_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE;
    END IF;

    -- campaigns FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_campaign' AND table_name = 'redemptions'
    ) THEN
        ALTER TABLE redemptions
        ADD CONSTRAINT fk_campaign
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
        ON DELETE CASCADE;
    END IF;

    -- bottles FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bottle' AND table_name = 'redemptions'
    ) THEN
        ALTER TABLE redemptions
        ADD CONSTRAINT fk_bottle
        FOREIGN KEY (bottle_id) REFERENCES bottles(id)
        ON DELETE CASCADE;
    END IF;
END $$;


-- ==========================================
-- STEP 7: SECURE DASHBOARD RPC
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_unique_redeemers_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER FROM redemptions;
$$;

-- ==========================================
-- STEP 8: RLS POLICIES (ENSURE SELECT EXISTS)
-- ==========================================
-- Enable RLS on tables if not already enabled
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Add basic SELECT policies for Authenticated Users (Admins/Dashboard)
-- Note: Adjust 'authenticated' to specific admin role if your auth system uses one.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'redemptions' AND policyname = 'Enable read access for authenticated users') THEN
        CREATE POLICY "Enable read access for authenticated users" ON redemptions FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Enable read access for authenticated users') THEN
        CREATE POLICY "Enable read access for authenticated users" ON users FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'Enable read access for authenticated users') THEN
        CREATE POLICY "Enable read access for authenticated users" ON campaigns FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
