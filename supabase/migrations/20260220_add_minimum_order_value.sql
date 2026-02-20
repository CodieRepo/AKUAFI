-- Analytics Enhancement: Add minimum_order_value to campaigns
-- Used for Estimated Revenue calculation: claimed_count × minimum_order_value
-- Does NOT affect coupon lifecycle, QR flow, OTP, or any existing business logic.
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS minimum_order_value numeric DEFAULT 0;
