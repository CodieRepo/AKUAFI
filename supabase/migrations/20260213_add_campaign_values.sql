-- Add missing columns for campaign values
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS coupon_min_value INT,
ADD COLUMN IF NOT EXISTS coupon_max_value INT;
