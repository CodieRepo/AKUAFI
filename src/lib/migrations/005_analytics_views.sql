-- Analytics Layer Views
-- Standardization Phase 1: Creating views to abstract analytics logic from application layer.

-- 1. Campaign Metrics V1 (Per Campaign Stats)
-- Calculates QR counts from bottles and Claims/Users from coupons.
-- Avoids Cartesian product by aggregating separately.
CREATE OR REPLACE VIEW campaign_metrics_v1 AS
WITH bottle_counts AS (
    SELECT campaign_id, COUNT(*) as total_qr 
    FROM bottles 
    GROUP BY campaign_id
),
coupon_stats AS (
    SELECT 
        campaign_id, 
        COUNT(*) FILTER (WHERE status = 'claimed') as total_claims,
        COUNT(DISTINCT user_id) FILTER (WHERE status = 'claimed') as unique_users
    FROM coupons
    GROUP BY campaign_id
)
SELECT 
    c.id as campaign_id,
    c.client_id,
    c.name as campaign_name,
    COALESCE(b.total_qr, 0) as total_qr,
    COALESCE(cp.total_claims, 0) as total_claims,
    COALESCE(cp.unique_users, 0) as unique_users,
    CASE 
        WHEN COALESCE(b.total_qr, 0) = 0 THEN 0 
        ELSE (COALESCE(cp.total_claims, 0)::numeric / COALESCE(b.total_qr, 0)) * 100 
    END as conversion_rate
FROM campaigns c
LEFT JOIN bottle_counts b ON c.id = b.campaign_id
LEFT JOIN coupon_stats cp ON c.id = cp.campaign_id;

-- 2. Client Dashboard V1 (Aggregated Stats)
-- Aggregates metrics for the client dashboard.
-- Calculates true unique users across all campaigns for the client.
CREATE OR REPLACE VIEW client_dashboard_v1 AS
WITH client_stats AS (
    SELECT 
        c.client_id,
        COUNT(DISTINCT cp.user_id) FILTER (WHERE cp.status = 'claimed') as unique_users
    FROM campaigns c
    LEFT JOIN coupons cp ON c.id = cp.campaign_id
    GROUP BY c.client_id
),
aggregated_metrics AS (
    SELECT 
        client_id,
        COUNT(campaign_id) as total_campaigns,
        SUM(total_qr) as total_qr,
        SUM(total_claims) as total_claims
    FROM campaign_metrics_v1
    GROUP BY client_id
)
SELECT 
    am.client_id,
    am.total_campaigns,
    am.total_qr,
    am.total_claims,
    COALESCE(cs.unique_users, 0) as unique_users,
    CASE 
        WHEN am.total_qr = 0 THEN 0 
        ELSE (am.total_claims::numeric / am.total_qr) * 100 
    END as conversion_rate
FROM aggregated_metrics am
LEFT JOIN client_stats cs ON am.client_id = cs.client_id;

-- 3. Campaign User Details V1 (Row Level Data)
-- Detailed view for tables, hiding sensitive UUIDs in UI (but available for joins if needed).
CREATE OR REPLACE VIEW campaign_user_details_v1 AS
SELECT 
    cp.campaign_id,
    c.name as campaign_name,
    u.name as user_name,
    u.phone,
    cp.coupon_code,
    cp.discount_value,
    cp.status,
    cp.redeemed_at
FROM coupons cp
LEFT JOIN users u ON cp.user_id = u.id
JOIN campaigns c ON cp.campaign_id = c.id;
