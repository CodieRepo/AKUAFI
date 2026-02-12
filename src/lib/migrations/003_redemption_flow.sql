-- 1. ADD CONSTRAINTS (DB LEVEL LOCKS)

-- A. Lock Phone per Campaign (One redemption per phone number for a specific campaign)
-- We use user_id because users table has unique phone constraint.
ALTER TABLE coupons 
ADD CONSTRAINT unique_user_campaign 
UNIQUE (user_id, campaign_id);

-- B. Lock QR Code (One coupon per bottle)
-- Ensuring a bottle can only yield one coupon ever.
ALTER TABLE coupons 
ADD CONSTRAINT unique_bottle_redemption 
UNIQUE (bottle_id);


-- 2. RPC FUNCTION (ATOMIC REDEMPTION)

CREATE OR REPLACE FUNCTION redeem_coupon(
  p_phone TEXT,
  p_qr_token TEXT,
  p_name TEXT DEFAULT 'Anonymous'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_bottle_id UUID;
  v_campaign_id UUID;
  v_coupon_min INT;
  v_coupon_max INT;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
  v_is_active BOOLEAN;
  v_discount_value INT;
  v_coupon_code TEXT;
  v_is_used BOOLEAN;
BEGIN

  -- A. GET/CREATE USER (Atomic)
  SELECT id INTO v_user_id FROM users WHERE phone = p_phone;
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (phone, name) VALUES (p_phone, p_name)
    RETURNING id INTO v_user_id;
  END IF;

  -- B. LOOKUP BOTTLE & CAMPAIGN (Lock Row for Update to prevent race conditions)
  SELECT 
    b.id, 
    b.is_used,
    b.campaign_id,
    c.coupon_min_value,
    c.coupon_max_value,
    c.start_date,
    c.end_date,
    c.is_active
  INTO 
    v_bottle_id, 
    v_is_used,
    v_campaign_id,
    v_coupon_min,
    v_coupon_max,
    v_start_date,
    v_end_date,
    v_is_active
  FROM bottles b
  JOIN campaigns c ON b.campaign_id = c.id
  WHERE b.qr_token = p_qr_token
  FOR UPDATE OF b; -- Critical: Locks the bottle row until transaction ends

  -- C. VALIDATIONS
  
  -- 1. Check existence
  IF v_bottle_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid QR code', 'code', 404);
  END IF;

  -- 2. Check if already used
  -- We check both the flag AND the coupons table via unique constraint later
  IF v_is_used THEN
    RETURN json_build_object('error', 'Coupon redeemed from this QR', 'code', 409);
  END IF;

  -- 3. Check Campaign Status
  IF NOT v_is_active THEN
    RETURN json_build_object('error', 'Campaign is inactive', 'code', 400);
  END IF;

  IF NOW() < v_start_date THEN
    RETURN json_build_object('error', 'Campaign has not started', 'code', 400);
  END IF;

  IF NOW() > v_end_date THEN
    RETURN json_build_object('error', 'Campaign has expired', 'code', 400);
  END IF;

  -- 4. Check User Eligibility (Phone + Campaign)
  -- We rely on the UNIQUE constraint, but checking here gives a cleaner error
  PERFORM 1 FROM coupons WHERE user_id = v_user_id AND campaign_id = v_campaign_id;
  IF FOUND THEN
    RETURN json_build_object('error', 'Mobile already registered', 'code', 409);
  END IF;

  -- D. GENERATE COUPON
  v_discount_value := floor(random() * (v_coupon_max - v_coupon_min + 1) + v_coupon_min)::INT;
  v_coupon_code := 'AKUAFI-' || upper(substring(md5(random()::text) from 1 for 5));

  -- E. INSERT COUPON & UPDATE BOTTLE
  -- This will fail if constraints are violated, giving us a safety net
  BEGIN
    INSERT INTO coupons (
      code, 
      user_id, 
      campaign_id, 
      bottle_id, 
      discount_value, 
      status, 
      issued_at
    ) VALUES (
      v_coupon_code,
      v_user_id,
      v_campaign_id,
      v_bottle_id,
      v_discount_value,
      'issued',
      NOW()
    );

    UPDATE bottles 
    SET is_used = TRUE, used_at = NOW() 
    WHERE id = v_bottle_id;

  EXCEPTION 
    WHEN unique_violation THEN
      -- Handle specific constraint violations if they slipped through
      -- (e.g. race condition on user insert or coupon insert)
      RETURN json_build_object('error', 'Redemption failed due to conflict', 'code', 409);
  END;

  -- F. RETURN SUCCESS
  RETURN json_build_object(
    'success', true,
    'coupon', v_coupon_code,
    'value', v_discount_value
  );

END;
$$;
