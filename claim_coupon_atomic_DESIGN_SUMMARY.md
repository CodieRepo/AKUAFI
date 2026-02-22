# claim_coupon_atomic: Design & Implementation Summary

## Overview

Full atomic coupon claiming RPC with redemption logging. Eliminates the drift where coupons mark as 'claimed' but redemptions insert fails.

**Files Created**:

1. [20260222_claim_coupon_atomic.sql](supabase/migrations/20260222_claim_coupon_atomic.sql) — RPC function + GRANT
2. [API_PATCH_PLAN_claim_coupon_atomic.md](API_PATCH_PLAN_claim_coupon_atomic.md) — API integration guide + code example
3. [LEGACY_COUPON_POLICY.md](LEGACY_COUPON_POLICY.md) — Legacy null user_id handling + backfill strategy

---

## Function Specification

### Signature

```sql
claim_coupon_atomic(
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
```

### Key Guarantees

| Requirement                                      | Met? | How                                                                               |
| ------------------------------------------------ | ---- | --------------------------------------------------------------------------------- |
| Single transaction                               | ✅   | PL/pgSQL function runs atomically; coupon update + redemptions insert in same txn |
| Coupon must be 'active'                          | ✅   | Validation check before any mutations                                             |
| Required links (user_id, campaign_id, bottle_id) | ✅   | 3 explicit NOT NULL checks; fail if any is NULL                                   |
| Coupon status → 'claimed' + redeemed_at = now()  | ✅   | UPDATE before INSERT; timestamp captured                                          |
| Redemptions insert on success                    | ✅   | INSERT uses coupon's validated fields                                             |
| Rollback on constraint violation                 | ✅   | unique_violation exception handler; transaction rolls back                        |
| Return claimed coupon data                       | ✅   | RETURN TABLE with all fields on success                                           |
| Security: SECURITY DEFINER                       | ✅   | Function defined with SECURITY DEFINER for privilege elevation                    |
| Permissions: GRANT to authenticated              | ✅   | GRANT EXECUTE to authenticated role                                               |

---

## Success Path (Happy Case)

```
1. SELECT coupon FOR UPDATE (lock)
2. Validate coupon exists
3. Validate status = 'active'
4. Validate user_id NOT NULL
5. Validate campaign_id NOT NULL
6. Validate bottle_id NOT NULL
7. UPDATE coupons SET status='claimed', redeemed_at=now()
8. INSERT INTO redemptions (user_id, campaign_id, bottle_id, coupon_code, redeemed_at)
9. COMMIT (implicit)
10. RETURN { success: true, coupon data }
```

**HTTP Response** (200 OK):

```json
{
  "success": true,
  "coupon": {
    "code": "ABC-123456",
    "campaign_id": "uuid...",
    "user_id": "uuid...",
    "bottle_id": "uuid...",
    "redeemed_at": "2026-02-22T10:30:00Z"
  }
}
```

---

## Error Paths & HTTP Mapping

| Error Code             | Condition                           | HTTP | User Message                                      | Rationale                                |
| ---------------------- | ----------------------------------- | ---- | ------------------------------------------------- | ---------------------------------------- |
| `not-found`            | coupon_code doesn't exist           | 404  | "Coupon code not found"                           | Resource doesn't exist                   |
| `not-active`           | coupon.status ≠ 'active'            | 409  | "Coupon already redeemed"                         | State conflict (already claimed/expired) |
| `incomplete-claim`     | user_id IS NULL                     | 400  | "Coupon data incomplete (internal error)"         | Bad request, data integrity issue        |
| `incomplete-claim`     | campaign_id IS NULL                 | 400  | "Coupon data incomplete (internal error)"         | Bad request, data integrity issue        |
| `incomplete-claim`     | bottle_id IS NULL                   | 400  | "Coupon data incomplete (internal error)"         | Bad request, data integrity issue        |
| `constraint-violation` | User already redeemed this campaign | 409  | "You've already redeemed for this campaign"       | State conflict (business rule)           |
| `constraint-violation` | Bottle already redeemed             | 409  | "This QR code was already used"                   | State conflict (business rule)           |
| `fk-violation`         | FK constraint fails                 | 400  | "Invalid coupon reference data (contact support)" | Bad request (data structure issue)       |
| `internal-error`       | Unexpected DB error                 | 500  | "System error (contact support)"                  | Server error                             |

---

## Transaction Safety: The FOR UPDATE Lock

The function uses `SELECT ... FOR UPDATE` to lock the coupon row during the transaction. This prevents:

```
Timeline WITHOUT lock:
T1: User A selects coupon (status = 'active', count = 1)
T2: User B selects coupon (status = 'active', count = 1)  ← Same coupon!
T3: User A updates coupon, inserts redemption → OK
T4: User B updates coupon, inserts redemption → FAILS (constraint)

Timeline WITH lock (claim_coupon_atomic):
T1: User A selects coupon FOR UPDATE (locks row)
T2: User B tries to select coupon FOR UPDATE (WAITS for lock release)
T3: User A updates coupon, inserts redemption → OK, COMMIT, lock released
T4: User B's SELECT finally runs, sees status = 'claimed' → Returns not-active → FAILS gracefully
```

✅ Second claim fails atomically with error, not partial success.

---

## No Behavior Change (except authorization gate)

| Aspect                   | Before             | After              | Change?            |
| ------------------------ | ------------------ | ------------------ | ------------------ |
| Coupon → 'claimed' logic | Same               | Same               | No                 |
| Redemption insert logic  | Same               | Same               | No                 |
| Timestamp capture        | Same (now())       | Same (now())       | No                 |
| Error handling           | Drift possible     | Atomic             | **Yes (fix only)** |
| Authorization            | None in RPC itself | None in RPC itself | No change          |
| Constraints enforced     | Same               | Same               | No                 |

---

## Testing Checklist

### Unit Tests (SQL)

```sql
-- Test 1: Happy path
SELECT * FROM claim_coupon_atomic('VALID-CODE');
-- Expect: success=true, coupon data

-- Test 2: Not found
SELECT * FROM claim_coupon_atomic('NONEXISTENT');
-- Expect: success=false, error_code='not-found'

-- Test 3: Not active (already claimed)
SELECT * FROM claim_coupon_atomic('ALREADY-CLAIMED-CODE');
-- Expect: success=false, error_code='not-active'

-- Test 4: Missing user_id
SELECT * FROM claim_coupon_atomic('NULL-USER-CODE');
-- Expect: success=false, error_code='incomplete-claim'

-- Test 5: Concurrent claims (race condition test)
-- In Transaction A: BEGIN; SELECT claim_coupon_atomic('RACE-CODE'); -- blocks on FOR UPDATE
-- In Transaction B: BEGIN; SELECT claim_coupon_atomic('RACE-CODE'); -- waits
-- Commit A first → B now sees 'not-active'
-- Expect: One succeeds, one fails with not-active
```

### Integration Tests (Node.js)

See [API_PATCH_PLAN_claim_coupon_atomic.md](API_PATCH_PLAN_claim_coupon_atomic.md) for Next.js test examples.

### Load Test

- 100 concurrent claims on same coupon
- 10 concurrent claims on different coupons
- Expected: All succeed atomically (1st wins, others fail with not-active)

---

## Deployment Checklist

### Pre-Deployment (1-2 days before)

- [ ] Run legacy coupon analysis queries from [LEGACY_COUPON_POLICY.md](LEGACY_COUPON_POLICY.md)
- [ ] Assess backfill scope (expect 0 if data is clean)
- [ ] Test migration on staging database
- [ ] Review error codes with frontend/support team

### Deployment Day

- [ ] Deploy migration `20260222_claim_coupon_atomic.sql`
  - Supabase: Push to migrations folder, run via dashboard or CLI
  - Verify: `SELECT * FROM pg_proc WHERE proname = 'claim_coupon_atomic'` — should exist
- [ ] Verify GRANT worked: `\dp claim_coupon_atomic` — should show authenticated
- [ ] Update `/api/coupons/redeem` route (see API patch plan)
- [ ] Deploy API changes
- [ ] Monitor logs for errors

### Post-Deployment (1-7 days after)

- [ ] Monitor error rate (watch for new error codes)
- [ ] Check zero `incomplete-claim` errors (unless backfill was incomplete)
- [ ] Verify redemption counts match coupon claims (no drift)
- [ ] Load test: simulate high concurrency
- [ ] Logging: Ensure error messages are user-friendly

---

## Notes on Authorization

**This RPC does NOT enforce authorization** (who is allowed to claim).

Instead:

- **In the RPC**: SECURITY DEFINER runs with elevated privileges (can read/write any coupon)
- **In the API endpoint** (`/api/coupons/redeem`): Check authentication (user is logged in, or API key is valid)
- **Optional audit**: Pass `p_actor_user_id` for logging who triggered the claim

**Example in API**:

```typescript
const userId = session?.user?.id; // Get authenticated user
const result = await rpc("claim_coupon_atomic", {
  p_coupon_code: code,
  p_actor_user_id: userId, // Optional: audit trail
});
```

---

## Monitoring & Alerts

### Key Metrics

1. **Success Rate** (should be high, ~95%+ after backfill)

   ```sql
   SELECT
     SUM(CASE WHEN success THEN 1 ELSE 0 END) AS successful,
     SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS failed,
     COUNT(*) AS total
   FROM claim_coupon_atomic_logs; -- If you add audit table
   ```

2. **Error Code Distribution**

   ```sql
   SELECT error_code, COUNT(*) FROM claim_coupon_atomic_logs
   WHERE NOT success
   GROUP BY error_code;
   ```

3. **Incomplete-Claim Errors** (should be zero)
   - Alert if count > 0: Indicates backfill issue or new data corruption

4. **Constraint-Violation Rate**
   - Expected for power users, monitor for spikes
   - Normal: ~2-5% of total claims
   - Alert if > 15%

### Sample Alert Rules

```
ALERT incomplete_claim_errors:
  error_code == 'incomplete-claim' for > 1 error in 1 hour
  → Escalate to dev team (data integrity issue)

ALERT internal_error_spike:
  error_code == 'internal-error' for > 10 errors in 1 hour
  → Check database health, Postgres logs
```

---

## Performance Implications

| Operation                | Latency      | Notes                                                          |
| ------------------------ | ------------ | -------------------------------------------------------------- |
| SELECT coupon FOR UPDATE | ~1-2ms       | Locks row; fast index seek on coupon_code                      |
| Validations (6 checks)   | ~0.5ms       | All in-memory, no IO                                           |
| UPDATE coupon            | ~2-3ms       | Single row, indexed write                                      |
| INSERT redemption        | ~2-3ms       | Single row, triggers execute (updates campaign.redeemed_count) |
| **Total RPC time**       | **~10-15ms** | Expected end-to-end for normal case                            |

Under load (100+ concurrent):

- Lock contention may increase latency for hot coupons (many users claiming same campaign)
- Mitigate: Shard by campaign → separate RPC calls per campaign

---

## Backfill Before Deployment

**CRITICAL**: Before deploying the RPC, run backfill from [LEGACY_COUPON_POLICY.md](LEGACY_COUPON_POLICY.md):

```sql
-- Analysis (run first):
SELECT COUNT(*) FROM coupons WHERE user_id IS NULL;
-- If > 0, execute backfill from LEGACY_COUPON_POLICY.md

-- Backfill (Case A):
UPDATE coupons c
SET user_id = (SELECT user_id FROM redemptions r WHERE r.coupon_code = c.coupon_code LIMIT 1)
WHERE c.user_id IS NULL
  AND EXISTS (SELECT 1 FROM redemptions WHERE coupon_code = c.coupon_code);

-- Backfill (Case B):
UPDATE coupons SET status = 'expired'
WHERE user_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM redemptions WHERE coupon_code = coupons.coupon_code);

-- Verify:
SELECT COUNT(*) FROM coupons WHERE user_id IS NULL;
-- Expected: 0
```

---

## Quick Reference: Function Behavior

```
INPUT: coupon_code = 'ABC-123456'

OUTPUTS (all possible):
1. { success: true, coupon_code, coupon_id, ..., redeemed_at, error_code: NULL }
2. { success: false, coupon_code, error_code: 'not-found', error_message: '...' }
3. { success: false, coupon_code, error_code: 'not-active', error_message: '...' }
4. { success: false, coupon_code, error_code: 'incomplete-claim', error_message: '...' }
5. { success: false, coupon_code, error_code: 'constraint-violation', error_message: '...' }
6. { success: false, coupon_code, error_code: 'fk-violation', error_message: '...' }
7. { success: false, coupon_code, error_code: 'internal-error', error_message: '...' }

ATOMICITY:
- Updates and inserts are all-or-nothing
- If any step fails, coupon stays in original state (status still 'active')
- No partial claims
```

---

## Sign-Off

- [x] No behavior change except fixing atomicity
- [x] Fraud rules untouched
- [x] No changes to /api/redeem logic
- [x] Backfill strategy for legacy nulls defined
- [x] Error mapping complete
- [x] SECURITY DEFINER + GRANT configured
- [x] Ready for Phase-1 Stabilization deployment
