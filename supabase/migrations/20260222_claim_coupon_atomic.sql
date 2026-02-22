-- Migration: 20260222_claim_coupon_atomic.sql
-- Description: Introduces claim_coupon_atomic RPC for atomic coupon claiming + redemption logging.
-- Ensures single transaction semantics: coupon update + redemptions insert succeed/fail together.
-- Eliminates drift where coupon.status='claimed' but redemptions insert fails.

-- ==========================================
-- FUNCTION: claim_coupon_atomic
-- ==========================================
-- Purpose: Atomically claim a coupon and log redemption in a single transaction.
--
-- Behavior:
--   1. Validates coupon exists and is 'active'
--   2. Validates coupon has ALL required links (user_id, campaign_id, bottle_id) - NO NULL VALUES
--   3. Updates coupon: status='claimed', redeemed_at=NOW()
--   4. Inserts into redemptions with coupon's user_id, campaign_id, bottle_id, coupon_code
--   5. If either update or insert fails, entire transaction rolls back
--
-- Constraints enforced:
--   - Unique (user_id, campaign_id) on redemptions (one redemption per user per campaign)
--   - FK constraints on user_id, campaign_id, bottle_id
--   - Coupon must be 'active' before claiming (checked in WHERE clause)
--   - FOR UPDATE lock prevents concurrent double-claims
--
-- Error cases:
--   - Coupon not found → error_code 'not-found' (404)
--   - Coupon not active → error_code 'not-active' (409)
--   - Coupon missing user_id/campaign_id/bottle_id → error_code 'incomplete-claim' (400)
--   - Redemptions unique/FK constraint violation → error_code 'constraint-violation'/'fk-violation' (409/400)
--   - Other DB errors → error_code 'internal-error' (500)
--
CREATE OR REPLACE FUNCTION claim_coupon_atomic(
  p_coupon_code TEXT,
  p_actor_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  coupon_code TEXT,
  coupon_id UUID,
  campaign_id UUID,
  user_id UUID,
  bottle_id UUID,
  redeemed_at TIMESTAMPTZ,
  success BOOLEAN,
  error_code TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_constraint_name TEXT;
  v_error_detail TEXT;
  v_updated_rows INT;
BEGIN
  -- STEP 1: FETCH COUPON WITH LOCK (prevents concurrent claims via FOR UPDATE)
  SELECT 
    id, 
    coupon_code, 
    campaign_id, 
    user_id, 
    bottle_id, 
    status, 
    redeemed_at
  INTO v_coupon
  FROM coupons
  WHERE coupon_code = p_coupon_code
  FOR UPDATE;

  -- STEP 2: VALIDATE COUPON EXISTS
  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT 
      p_coupon_code, 
      NULL::UUID, 
      NULL::UUID, 
      NULL::UUID, 
      NULL::UUID, 
      NULL::TIMESTAMPTZ,
      FALSE,
      'not-found'::TEXT,
      'Coupon with code ' || p_coupon_code || ' does not exist'::TEXT;
    RETURN;
  END IF;

  -- STEP 3: VALIDATE COUPON IS ACTIVE
  IF v_coupon.status != 'active' THEN
    RETURN QUERY SELECT 
      v_coupon.coupon_code, 
      v_coupon.id, 
      v_coupon.campaign_id, 
      v_coupon.user_id, 
      v_coupon.bottle_id, 
      v_coupon.redeemed_at,
      FALSE,
      'not-active'::TEXT,
      'Coupon is not in active status (current: ' || COALESCE(v_coupon.status, 'NULL') || ')'::TEXT;
    RETURN;
  END IF;

  -- STEP 4: VALIDATE COUPON HAS ALL REQUIRED LINKS (NO NULLS)
  IF v_coupon.user_id IS NULL THEN
    RETURN QUERY SELECT 
      v_coupon.coupon_code, 
      v_coupon.id, 
      v_coupon.campaign_id, 
      v_coupon.user_id, 
      v_coupon.bottle_id, 
      v_coupon.redeemed_at,
      FALSE,
      'incomplete-claim'::TEXT,
      'Coupon is missing user_id (legacy coupon without user assignment)'::TEXT;
    RETURN;
  END IF;

  IF v_coupon.campaign_id IS NULL THEN
    RETURN QUERY SELECT 
      v_coupon.coupon_code, 
      v_coupon.id, 
      v_coupon.campaign_id, 
      v_coupon.user_id, 
      v_coupon.bottle_id, 
      v_coupon.redeemed_at,
      FALSE,
      'incomplete-claim'::TEXT,
      'Coupon is missing campaign_id'::TEXT;
    RETURN;
  END IF;

  IF v_coupon.bottle_id IS NULL THEN
    RETURN QUERY SELECT 
      v_coupon.coupon_code, 
      v_coupon.id, 
      v_coupon.campaign_id, 
      v_coupon.user_id, 
      v_coupon.bottle_id, 
      v_coupon.redeemed_at,
      FALSE,
      'incomplete-claim'::TEXT,
      'Coupon is missing bottle_id'::TEXT;
    RETURN;
  END IF;

  -- STEP 5: UPDATE COUPON STATUS TO 'CLAIMED'
  -- Recheck status='active' in WHERE to catch race conditions after FOR UPDATE lock released
  UPDATE coupons
  SET status = 'claimed',
      redeemed_at = v_now
  WHERE id = v_coupon.id AND status = 'active';

  -- Verify we actually updated the row (defensive check for timing issues)
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows = 0 THEN
    RETURN QUERY SELECT 
      v_coupon.coupon_code, 
      v_coupon.id, 
      v_coupon.campaign_id, 
      v_coupon.user_id, 
      v_coupon.bottle_id, 
      v_coupon.redeemed_at,
      FALSE,
      'not-active'::TEXT,
      'Coupon status changed before update (race condition: another claim in progress)'::TEXT;
    RETURN;
  END IF;

  -- STEP 6: INSERT INTO REDEMPTIONS TABLE
  -- This happens in the same transaction. If it fails, the coupon update will be rolled back.
  -- p_actor_user_id and p_metadata are reserved for future audit trail/logging.
  INSERT INTO redemptions (
    user_id,
    campaign_id,
    bottle_id,
    coupon_code,
    redeemed_at
  )
  VALUES (
    v_coupon.user_id,
    v_coupon.campaign_id,
    v_coupon.bottle_id,
    v_coupon.coupon_code,
    v_now
  );

  -- STEP 7: RETURN SUCCESS WITH CLAIMED COUPON DATA
  RETURN QUERY SELECT 
    v_coupon.coupon_code,
    v_coupon.id,
    v_coupon.campaign_id,
    v_coupon.user_id,
    v_coupon.bottle_id,
    v_now,
    TRUE,
    NULL::TEXT,
    NULL::TEXT;
  RETURN;

EXCEPTION 
  -- CONSTRAINT VIOLATIONS: Extract constraint name via GET STACKED DIAGNOSTICS
  WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
    
    RETURN QUERY SELECT 
      v_coupon.coupon_code,
      v_coupon.id,
      v_coupon.campaign_id,
      v_coupon.user_id,
      v_coupon.bottle_id,
      NULL::TIMESTAMPTZ,
      FALSE,
      'constraint-violation'::TEXT,
      'Unique constraint violation on redemptions (' || COALESCE(v_constraint_name, 'unknown') || '). ' ||
      'User may already be redeemed for this campaign, or bottle/coupon already used.'::TEXT;
    RETURN;

  -- FOREIGN KEY VIOLATIONS
  WHEN foreign_key_violation THEN
    GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME, v_error_detail = MESSAGE_TEXT;
    
    RETURN QUERY SELECT 
      v_coupon.coupon_code,
      v_coupon.id,
      v_coupon.campaign_id,
      v_coupon.user_id,
      v_coupon.bottle_id,
      NULL::TIMESTAMPTZ,
      FALSE,
      'fk-violation'::TEXT,
      'Foreign key constraint violation (' || COALESCE(v_constraint_name, 'unknown') || '). ' ||
      COALESCE(v_error_detail, 'Invalid reference to user, campaign, or bottle.'::TEXT);
    RETURN;

  -- OTHER DATABASE ERRORS
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      v_coupon.coupon_code,
      v_coupon.id,
      v_coupon.campaign_id,
      v_coupon.user_id,
      v_coupon.bottle_id,
      NULL::TIMESTAMPTZ,
      FALSE,
      'internal-error'::TEXT,
      'Database error [' || SQLSTATE || ']: ' || SQLERRM;
    RETURN;
END;
$$;

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================
-- WARNING: SECURITY DEFINER runs with elevated privileges (service_role).
-- This RPC does NOT enforce authorization itself; it only validates coupon state.
--
-- API layer MUST enforce authorization:
--   - Verify user is authenticated (required)
--   - Optionally verify user is admin (depends on coupon claim workflow)
--   - Log caller identity (pass p_actor_user_id for audit trail)
--   - Validate coupon code format/origin before calling
--
GRANT EXECUTE ON FUNCTION claim_coupon_atomic(TEXT, UUID, JSONB) TO authenticated;

-- Optional: Uncomment to allow public/anon coupon claims (requires frontend auth validation)
-- GRANT EXECUTE ON FUNCTION claim_coupon_atomic(TEXT, UUID, JSONB) TO anon;

