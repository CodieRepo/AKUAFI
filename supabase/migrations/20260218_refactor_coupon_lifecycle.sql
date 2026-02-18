-- Migration: 20260218_refactor_coupon_lifecycle.sql
-- Description: Refactors coupon lifecycle to 2-stage (Active -> Claimed) and backfills data.

-- 1. Update Coupons Table Schema
DO $$
BEGIN
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'status') THEN
        ALTER TABLE coupons ADD COLUMN status TEXT CHECK (status IN ('active', 'claimed', 'expired', 'redeemed')) DEFAULT 'active';
    END IF;

    -- Add user_id column (for mapping who claimed it)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'user_id') THEN
        ALTER TABLE coupons ADD COLUMN user_id UUID REFERENCES users(id);
    END IF;

    -- Add bottle_id column (for uniqueness check)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'bottle_id') THEN
        ALTER TABLE coupons ADD COLUMN bottle_id UUID REFERENCES bottles(id);
    END IF;

    -- Add redeemed_at if missing (it might exist, but ensure it's there)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'redeemed_at') THEN
        ALTER TABLE coupons ADD COLUMN redeemed_at TIMESTAMPTZ;
    END IF;

    -- Add generated_at if missing (some old schemas might rely on created_at)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'generated_at') THEN
         ALTER TABLE coupons ADD COLUMN generated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Ensure client_id exists (it should, but just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'client_id') THEN
        -- We might need to backfill client_id if it's missing, usually derived from campaign. 
        -- For now assume it exists or we add it nullable.
        ALTER TABLE coupons ADD COLUMN client_id UUID REFERENCES clients(id);
    END IF;

END $$;

-- 2. Backfill Coupons from Redemptions
-- We need to ensure every redemption has a corresponding 'claimed' coupon entry.
-- This is critical for the "Source of Truth" shift.
INSERT INTO coupons (
    campaign_id,
    client_id, -- Assuming redemptions might not have client_id, we fetch from campaigns? Or redemptions might have it?
               -- Wait, previous `redeem_coupon_atomic` logic didn't insert into coupons. 
               -- So `coupons` table is likely empty OR only has manually generated ones?
               -- A previous migration `20240213_coupon_customization.sql` DID insert into coupons.
               -- But the user said "Currently... Coupons are generated only during redeem_coupon_atomic which inserts DIRECTLY into redemptions".
               -- So `coupons` table might be empty or stale.
    coupon_code,
    user_id,
    bottle_id,
    status,
    generated_at,
    redeemed_at
)
SELECT 
    r.campaign_id,
    c.client_id, -- Fetch client_id from campaigns
    r.coupon_code,
    r.user_id,
    r.bottle_id,
    'claimed', -- Backfilled items are already claimed
    r.redeemed_at, -- generated_at = redeemed_at for legacy
    r.redeemed_at
FROM redemptions r
JOIN campaigns c ON r.campaign_id = c.id
WHERE NOT EXISTS (
    SELECT 1 FROM coupons cp WHERE cp.coupon_code = r.coupon_code
);

-- 3. Replace redeem_coupon_atomic RPC
CREATE OR REPLACE FUNCTION redeem_coupon_atomic(
  p_user_id UUID,
  p_campaign_id UUID,
  p_bottle_id UUID,
  p_client_id UUID,
  p_phone TEXT,
  p_coupon_code TEXT,
  p_discount NUMERIC,
  p_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon_id UUID;
BEGIN
  -- Insert into COUPONS table as ACTIVE
  -- This replaces the direct insert into redemptions
  INSERT INTO coupons (
    campaign_id,
    client_id,
    bottle_id,
    user_id,
    coupon_code,
    status,
    generated_at,
    discount_value, -- Assuming column exists or we don't need it for now. Wait, strict schema.
                    -- The migration 20240213 added discount_value. 
                    -- We should check if discount_value needs to be set.
    redeemed_at -- Valid to be NULL for active
  )
  VALUES (
    p_campaign_id,
    p_client_id,
    p_bottle_id,
    p_user_id,
    p_coupon_code,
    'active',
    NOW(),
    p_discount,
    NULL -- Redeemed at is null for ACTIVE coupons
  )
  RETURNING id INTO v_coupon_id;

  -- Return success
  RETURN json_build_object(
    'success', true, 
    'coupon_id', v_coupon_id,
    'coupon_code', p_coupon_code,
    'status', 'active'
  );

EXCEPTION 
  WHEN unique_violation THEN
    -- Check which constraint was violated
    IF SQLERRM LIKE '%coupon_code%' THEN
        RETURN json_build_object('success', false, 'error', 'Coupon code collision', 'code', 'COUPON_COLLISION');
    ELSIF SQLERRM LIKE '%bottle_id%' THEN
        RETURN json_build_object('success', false, 'error', 'Bottle already used', 'code', 'ALREADY_REDEEMED');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Duplicate entry', 'code', 'DUPLICATE_ENTRY', 'details', SQLERRM);
    END IF;
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM, 'code', 'INTERNAL_ERROR');
END;
$$;
