-- Migration: 20260218_architecture_update.sql
-- Description: Adds location/date/counters to campaigns, address to redemptions, and updates RPCs.

-- 1. Add Columns to Campaigns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS campaign_date DATE,
ADD COLUMN IF NOT EXISTS total_scans INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS redeemed_count INTEGER NOT NULL DEFAULT 0;

-- 2. Add Column to Redemptions
ALTER TABLE redemptions
ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_campaigns_location ON campaigns(location);
CREATE INDEX IF NOT EXISTS idx_campaigns_date ON campaigns(campaign_date);

-- 4. Backfill Redeemed Count (Safe idempotent update)
WITH counts AS (
    SELECT campaign_id, COUNT(*) as cnt 
    FROM redemptions 
    GROUP BY campaign_id
)
UPDATE campaigns 
SET redeemed_count = counts.cnt
FROM counts
WHERE campaigns.id = counts.campaign_id;

-- 5. Trigger to Maintain Redeemed Count
CREATE OR REPLACE FUNCTION update_campaign_redemption_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE campaigns
    SET redeemed_count = redeemed_count + 1
    WHERE id = NEW.campaign_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_redemption_count ON redemptions;
CREATE TRIGGER trg_update_redemption_count
AFTER INSERT ON redemptions
FOR EACH ROW
EXECUTE FUNCTION update_campaign_redemption_count();

-- 6. RPC: Increment Scan Count (New)
CREATE OR REPLACE FUNCTION increment_scan_count(p_campaign_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  UPDATE campaigns 
  SET total_scans = total_scans + 1 
  WHERE id = p_campaign_id
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE WARNING 'Campaign % not found during scan increment', p_campaign_id;
  END IF;
END;
$$;

-- 7. RPC: Atomic Redemption (Overload with p_address)
-- We keep the old signature (if it exists) and add this new one.
-- Supabase/PostgREST will match based on arguments passed.

CREATE OR REPLACE FUNCTION redeem_coupon_atomic(
  p_user_id UUID,
  p_campaign_id UUID,
  p_bottle_id UUID,
  p_client_id UUID,
  p_phone TEXT,
  p_coupon_code TEXT,
  p_discount NUMERIC,
  p_address TEXT -- <--- NEW PARAMETER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_redemption_id UUID;
BEGIN
  -- Insert with Address
  INSERT INTO redemptions (
    user_id, campaign_id, bottle_id, coupon_code, redeemed_at, address
  )
  VALUES (
    p_user_id, p_campaign_id, p_bottle_id, p_coupon_code, NOW(), p_address
  )
  RETURNING id INTO v_redemption_id;

  -- NOTE: Redeemed count is handled by the trigger trg_update_redemption_count

  RETURN json_build_object('success', true, 'redemption_id', v_redemption_id);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
