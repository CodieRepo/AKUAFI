-- Fix Schema Mismatch for Coupons Table
-- This migration adds columns referenced by the redeem_coupon RPC that were missing from the table definition.

-- 1. Add missing columns safely
ALTER TABLE coupons
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS discount_value INT,
ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ;

-- 2. Ensure Unique Constraint on coupon_code
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_coupon_code'
    ) THEN
        ALTER TABLE coupons ADD CONSTRAINT unique_coupon_code UNIQUE (coupon_code);
    END IF;
END $$;
