-- Migration: 004_validate_otp.sql
-- Purpose: Validate OTP request eligibility using DB time (NOW()) to avoid timezone issues.

CREATE OR REPLACE FUNCTION validate_bottle_for_otp(
  p_qr_token TEXT,
  p_phone TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bottle RECORD;
  v_campaign RECORD;
  v_user_id UUID;
  v_existing_coupon UUID;
  v_now TIMESTAMPTZ := NOW(); -- Capture transaction time consistently
BEGIN
  -- 1. Get Bottle
  SELECT * INTO v_bottle FROM bottles WHERE qr_token = p_qr_token;
  
  IF v_bottle IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid QR code', 'code', 404);
  END IF;

  IF v_bottle.is_used THEN
    RETURN json_build_object('valid', false, 'error', 'Coupon redeemed from this QR', 'code', 409);
  END IF;

  -- 2. Get Campaign
  SELECT * INTO v_campaign FROM campaigns WHERE id = v_bottle.campaign_id;

  IF v_campaign IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Campaign not found', 'code', 404);
  END IF;

  -- 3. Check Status
  IF v_campaign.status <> 'active' THEN
     RETURN json_build_object('valid', false, 'error', 'Campaign is inactive', 'code', 400);
  END IF;

  -- 4. Check Dates (UTC Comparison in DB)
  IF v_now < v_campaign.start_date THEN
     RETURN json_build_object('valid', false, 'error', 'Campaign has not started', 'code', 400, 'debug_start', v_campaign.start_date, 'debug_now', v_now);
  END IF;

  IF v_now > v_campaign.end_date THEN
     RETURN json_build_object('valid', false, 'error', 'Campaign has expired', 'code', 400);
  END IF;

  -- 5. Check User Eligibility
  -- First get user ID
  SELECT id INTO v_user_id FROM users WHERE phone = p_phone;
  
  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_existing_coupon FROM coupons 
    WHERE user_id = v_user_id AND campaign_id = v_campaign.id;
    
    IF v_existing_coupon IS NOT NULL THEN
        RETURN json_build_object('valid', false, 'error', 'Mobile already registered', 'code', 409);
    END IF;
  END IF;

  -- Validation Passed
  RETURN json_build_object('valid', true);
END;
$$;
