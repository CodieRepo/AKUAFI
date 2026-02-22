# Akuafi Phase-1: Legacy Coupon (Null user_id) Policy

## Executive Summary

**Recommendation**: **FAIL HARD + BACKFILL FIRST** (Recommended)

**Rationale**:

- Maintains data integrity and fraud restrictions
- Forces resolution of root cause (orphaned coupons)
- Aligns with hardening decisions in `20260214_data_stability_phase1.sql`
- Prevents inconsistent database states
- Simple to debug and audit

---

## Policy Decision Matrix

| Policy                          | Pros                                                                               | Cons                                                                     | Recommendation   |
| ------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------- |
| **FAIL HARD** (Recommended)     | Immediate feedback; data integrity enforced; audit trail clear; no silent failures | Requires backfill first; may break existing workflows temporarily        | ✅ **PREFERRED** |
| **Soft Fail** (Not Recommended) | No backfill; transparent to legacy data                                            | Violates constraints; allows orphaned records; hides data quality issues | ❌ **AVOID**     |
| **Fallback Claim**              | Handles legacy; no backfill                                                        | Whose user_id? Assigns claim to wrong user? Fraud risk                   | ❌ **FORBIDDEN** |

---

## Recommended Policy: FAIL HARD + BACKFILL FIRST

### Phase 1: Identify and Assess (Read-Only)

Before deployment, run analysis queries to understand scope of legacy coupons.

#### Query 1: Count Coupons with NULL user_id

```sql
-- Check how many coupons are missing user_id
SELECT COUNT(*) AS coupons_with_null_user_id
FROM coupons
WHERE user_id IS NULL;

-- Example output: 0 (clean), 15 (minor), 500+ (major data issue)
```

#### Query 2: Identify Likely Orphaned Coupons (No Matching Redemption)

```sql
-- Coupons with NULL user_id that have NO corresponding redemption record
SELECT
  c.id,
  c.coupon_code,
  c.campaign_id,
  c.status,
  c.created_at,
  c.redeemed_at,
  (SELECT EXISTS(
     SELECT 1 FROM redemptions r
     WHERE r.coupon_code = c.coupon_code
   )) AS has_redemption_record
FROM coupons c
WHERE c.user_id IS NULL
  AND c.status IN ('active', 'claimed')
ORDER BY c.created_at DESC
LIMIT 100;

-- Interpretation:
-- - has_redemption_record = false → Truly orphaned, safe to mark 'expired' or delete
-- - has_redemption_record = true → Anomaly, investigate manually
```

#### Query 3: Coupons with Partial Links (user_id OK but campaign_id or bottle_id NULL)

```sql
-- Check for other incomplete coupons
SELECT
  id,
  coupon_code,
  status,
  user_id IS NULL AS user_id_null,
  campaign_id IS NULL AS campaign_id_null,
  bottle_id IS NULL AS bottle_id_null
FROM coupons
WHERE user_id IS NULL
   OR campaign_id IS NULL
   OR bottle_id IS NULL
;
```

#### Query 4: Estimate Impact

```sql
-- Show breakdown by campaign
SELECT
  c.campaign_id,
  ca.name AS campaign_name,
  COUNT(*) AS total_coupons,
  COUNT(CASE WHEN c.user_id IS NULL THEN 1 END) AS with_null_user_id,
  ROUND(100.0 * COUNT(CASE WHEN c.user_id IS NULL THEN 1 END) / COUNT(*), 2) AS percent_null_user_id
FROM coupons c
LEFT JOIN campaigns ca ON c.campaign_id = ca.id
GROUP BY c.campaign_id, ca.name
ORDER BY percent_null_user_id DESC;
```

---

### Phase 2: Backfill Decision Tree

**Decision**: Based on analysis, choose ONE action per orphaned coupon:

```
┌─────────────────────────────────────────┐
│ Coupon with NULL user_id                │
├─────────────────────────────────────────┤
│                                         │
├─ Case A: HAS matching redemption       │
│  └─ Backfill? Try to extract user_id    │
│     from redemptions table              │
│                                         │
├─ Case B: NO matching redemption        │
│  └─ Safe to expire or delete            │
│     (truly orphaned, never used)        │
│                                         │
├─ Case C: MANUAL anomaly                │
│  └─ Investigate & decide per record    │
└─────────────────────────────────────────┘
```

---

### Phase 2a: Backfill Case A (Coupons with Matching Redemption Records)

If a coupon has NULL user_id but a redemption record exists, extract the user_id from redemptions:

```sql
-- BACKFILL: Extract user_id from redemptions to coupons (Case A)
-- This is a read-then-update operation; do NOT execute yet; run the SELECT first

-- SELECT (Validation - run first):
SELECT
  c.id,
  c.coupon_code,
  c.user_id AS current_user_id,
  r.user_id AS redemption_user_id,
  r.redeemed_at
FROM coupons c
JOIN redemptions r ON c.coupon_code = r.coupon_code
WHERE c.user_id IS NULL
LIMIT 10;

-- If output looks reasonable (redemption_user_id is populated), proceed with UPDATE:

-- UPDATE (Actual backfill - run once validation is confirmed):
UPDATE coupons c
SET user_id = (
  SELECT user_id
  FROM redemptions r
  WHERE r.coupon_code = c.coupon_code
  LIMIT 1
)
WHERE c.user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM redemptions r
    WHERE r.coupon_code = c.coupon_code
  );

-- Check affected rows:
-- Expected: ~N rows updated (where N is from backfill analysis query)
```

---

### Phase 2b: Backfill Case B (Orphaned Coupons, No Redemption)

Coupons with NULL user_id that have NO redemption record are truly orphaned.

**Action**: Mark as 'expired' or delete, depending on audit requirements.

```sql
-- OPTION 1: Mark as 'expired' (preserves historical record, safest)
UPDATE coupons
SET status = 'expired'
WHERE user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM redemptions r
    WHERE r.coupon_code = coupons.coupon_code
  );

-- OPTION 2: Delete (if you trust data quality and want clean slate)
-- NOT RECOMMENDED without full audit first
-- DELETE FROM coupons
-- WHERE user_id IS NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM redemptions r
--     WHERE r.coupon_code = coupons.coupon_code
--   );
```

---

### Phase 2c: Manual Anomalies (Case C)

If you find coupons where:

- user_id is NULL
- Multiple or conflicting redemptions exist
- Campaign or bottle_id is also NULL

**Action**: Investigate manually, document decision, update manually (small batches).

```sql
-- Find anomalies that need manual review:
SELECT
  c.id,
  c.coupon_code,
  c.campaign_id,
  c.status,
  (SELECT COUNT(*) FROM redemptions WHERE coupon_code = c.coupon_code) AS redemption_count,
  (SELECT user_id FROM redemptions WHERE coupon_code = c.coupon_code LIMIT 1) AS first_redemption_user_id
FROM coupons c
WHERE c.user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM redemptions r
    WHERE r.coupon_code = c.coupon_code
  );

-- Manual Review Checklist:
-- 1. Does first_redemption_user_id exist and valid?
-- 2. Are there multiple redemptions for same coupon? → Data inconsistency, escalate.
-- 3. Can we confidently assign the coupon to first_redemption_user_id?
--    If YES: UPDATE coupons SET user_id = <assigned_user_id> WHERE id = <coupon_id>;
--    If NO:  Mark as 'expired' and document reason.
```

---

## Deployment Sequence

### Step 1: Assessment (Day 1)

1. Run all analysis queries above
2. Document findings in a report
3. Decide: Is backfill needed? How many records?

### Step 2: Backfill (Day 1-2, if needed)

1. Create a SQL patch file `20260222_backfill_coupon_user_ids.sql`
2. Test on staging database first
3. Run backfill queries:
   - Case A: UPDATE with redemptions join
   - Case B: UPDATE status = 'expired'
   - Case C: Manual updates (small batches, documented)

### Step 3: Deploy RPC (Day 3)

1. Deploy migration `20260222_claim_coupon_atomic.sql`
2. Function will now FAIL HARD on incomplete coupons
3. Returns HTTP 400 with `incomplete-claim` code

### Step 4: API Update (Day 3)

1. Deploy updated `/api/coupons/redeem` route
2. Monitor error logs for `incomplete-claim` (should be rare/zero after backfill)

---

## Operational Safeguards (Post-Deployment)

Once `claim_coupon_atomic` is live with FAIL HARD policy:

### Monitor for `incomplete-claim` Errors

```typescript
// In your error tracking (Sentry, LogRocket, etc.):
if (errorCode === "incomplete-claim") {
  console.error(
    "ALERT: Found coupon with missing links. Backfill may be incomplete.",
  );
  // Email ops team
}
```

### Prevent New Incomplete Coupons

- Ensure **all** coupon generation paths (API, batch scripts) require:
  - `user_id` (assigned or linked)
  - `campaign_id` (always required)
  - `bottle_id` (linked to QR)
- Add pre-insert validation in coupon creation endpoints

### Quarterly Audit

```sql
-- Re-run analysis quarterly to catch regressions:
SELECT COUNT(*) FROM coupons WHERE user_id IS NULL;
-- Expected: 0 (after backfill) and should stay 0
```

---

## FAQ

**Q: What if we don't backfill and just deploy the RPC?**  
A: Coupons with NULL user_id will fail to claim. Users report "error" with no explanation. Support team overwhelmed. Better to backfill first.

**Q: Can we make the RPC accept NULL user_id and auto-fill from somewhere?**  
A: Possible but risky. Where would we get user_id? Redemptions? Campaign owner? Risk of assigning to wrong user → Fraud. FAIL HARD is cleaner.

**Q: How long does backfill take?**  
A: Milliseconds for UPDATE if < 10k rows. If you have millions, batch in chunks of 1000-10000.

**Q: What if backfill fails?**  
A: Rollback immediately. Investigate the failing record. Fix (Case C manual intervention). Retry.

**Q: Should we delete completely or just mark expired?**  
A: Mark `expired`. Preserves audit trail. If deleted, you lose historical reference. Compliance/legal may require archive.

---

## Decision Confirmation

- [x] **Policy**: FAIL HARD + BACKFILL FIRST
- [x] **Error Code**: `incomplete-claim` with status 400
- [x] **Backfill Scope**: Cases A, B, C as outlined
- [x] **Deployment Sequence**: Assessment → Backfill → Deploy RPC → Update API
- [x] **Monitoring**: Track `incomplete-claim` errors; expect zero after backfill
- [x] **Prevention**: Enforce NOT NULL user_id in all coupon creation paths
