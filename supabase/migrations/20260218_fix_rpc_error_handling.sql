-- Migration: 20260218_fix_rpc_error_handling.sql
-- Description: Improves error handling in redeem_coupon_atomic to return specific errors for unique constraint violations.

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

EXCEPTION 
  WHEN unique_violation THEN
    -- Check which constraint was violated
    IF SQLERRM LIKE '%redemptions_bottle_id_key%' OR SQLERRM LIKE '%bottle_id%' THEN
        RETURN json_build_object('success', false, 'error', 'Bottle already redeemed', 'code', 'ALREADY_REDEEMED');
    ELSIF SQLERRM LIKE '%redemptions_user_id_campaign_id_key%' OR SQLERRM LIKE '%user_id%' THEN
        RETURN json_build_object('success', false, 'error', 'User already redeemed in this campaign', 'code', 'USER_ALREADY_REDEEMED');
    ELSIF SQLERRM LIKE '%redemptions_coupon_code_key%' OR SQLERRM LIKE '%coupon_code%' THEN
        RETURN json_build_object('success', false, 'error', 'Coupon code collision', 'code', 'COUPON_COLLISION');
    ELSE
        RETURN json_build_object('success', false, 'error', 'Duplicate entry', 'code', 'DUPLICATE_ENTRY', 'details', SQLERRM);
    END IF;
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM, 'code', 'INTERNAL_ERROR');
END;
$$;
