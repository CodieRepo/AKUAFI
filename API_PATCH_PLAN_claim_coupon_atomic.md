# Akuafi Phase-1: claim_coupon_atomic RPC Integration

## 1. API Patch Plan for /api/coupons/redeem

### Before (Current Problematic Pattern)

```typescript
// TWO SEPARATE STEPS (NOT ATOMIC — DRIFT RISK)
// Step 1: Update coupon
const { data, error } = await getSupabaseAdmin()
  .from("coupons")
  .update({ status: "claimed", redeemed_at: now() })
  .eq("coupon_code", coupon_code)
  .eq("status", "active")
  .select()
  .single();

if (error) return 400; // Coupon not found or not active

// Step 2: Insert redemption (CAN FAIL AFTER STEP 1 SUCCEEDS)
const { error: redemptionError } = await getSupabaseAdmin()
  .from("redemptions")
  .insert({
    user_id: data.user_id, // May be null for legacy coupons → FK violation
    campaign_id: data.campaign_id,
    coupon_code: data.coupon_code,
    bottle_id: data.bottle_id,
    redeemed_at: now(),
  });

if (redemptionError) {
  // PROBLEM: Coupon already marked as 'claimed'
  // But redemptions insert failed → inconsistent state
  console.error("Insert failed, but coupon is already claimed");
}
```

**Problem**: If Step 2 fails, Step 1 is already committed. Coupon appears claimed in DB but has no redemption record.

---

### After (Atomic Pattern)

```typescript
// SINGLE RPC CALL - FULLY ATOMIC
const { data, error } = await getSupabaseAdmin().rpc("claim_coupon_atomic", {
  p_coupon_code: coupon_code,
  p_actor_user_id: optional_user_id, // For audit/logging
  p_metadata: {}, // Reserved for future extensibility
});

// Handle response
if (error) {
  // DB call failed
  return NextResponse.json({ error: error.message }, { status: 500 });
}

if (!data[0]?.success) {
  // RPC returned failure with error_code
  const errorCode = data[0].error_code;

  const statusMap = {
    "not-found": 404,
    "not-active": 409, // Already claimed/expired
    "incomplete-claim": 400, // Missing required links
    "constraint-violation": 409, // User/bottle already redeemed
    "fk-violation": 400, // Invalid reference
    "internal-error": 500,
  };

  const status = statusMap[errorCode] || 500;
  return NextResponse.json(
    { error: data[0].error_message, code: errorCode },
    { status },
  );
}

// Success
const claimed = data[0];
return NextResponse.json({
  success: true,
  coupon: {
    code: claimed.coupon_code,
    campaign_id: claimed.campaign_id,
    user_id: claimed.user_id,
    bottle_id: claimed.bottle_id,
    redeemed_at: claimed.redeemed_at,
  },
});
```

---

## 2. Error Code Mapping (Recommended)

| Error Code             | Meaning                                                       | HTTP Status | Recommendation                                             |
| ---------------------- | ------------------------------------------------------------- | ----------- | ---------------------------------------------------------- |
| `not-found`            | Coupon code doesn't exist                                     | 404         | Check coupon code spelling                                 |
| `not-active`           | Coupon already claimed/expired                                | 409         | Explain to user: "Already redeemed"                        |
| `incomplete-claim`     | Coupon missing user_id/campaign_id/bottle_id                  | 400         | Contact support (data integrity issue)                     |
| `constraint-violation` | User already redeemed _this campaign_, or bottle already used | 409         | User-friendly: "You've already redeemed for this campaign" |
| `fk-violation`         | Invalid user/campaign/bottle reference                        | 400         | Contact support (data structure issue)                     |
| `internal-error`       | Unexpected database error                                     | 500         | Contact support; log full error                            |

---

## 3. Next.js Implementation Example

```typescript
// src/app/api/coupons/redeem/route.ts (UPDATED)

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { coupon_code } = await request.json();

    if (!coupon_code || typeof coupon_code !== "string") {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 },
      );
    }

    // SINGLE ATOMIC RPC CALL
    const { data, error } = await getSupabaseAdmin().rpc(
      "claim_coupon_atomic",
      {
        p_coupon_code: coupon_code,
        p_actor_user_id: null, // Optional: set to authenticated user ID if available
        p_metadata: {}, // Optional: add request context if needed
      },
    );

    // Handle RPC call errors (network, DB down, etc.)
    if (error) {
      console.error("RPC Error:", error);
      return NextResponse.json(
        { error: "System error", code: "internal-error" },
        { status: 500 },
      );
    }

    // Parse response (RPC returns array of records)
    const result = data?.[0];
    if (!result) {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 },
      );
    }

    // If success flag is false, return error
    if (!result.success) {
      const statusMap: Record<string, number> = {
        "not-found": 404,
        "not-active": 409,
        "incomplete-claim": 400,
        "constraint-violation": 409,
        "fk-violation": 400,
        "internal-error": 500,
      };

      const status = statusMap[result.error_code] || 500;

      return NextResponse.json(
        {
          error: result.error_message,
          code: result.error_code,
        },
        { status },
      );
    }

    // Success: return claimed coupon
    return NextResponse.json({
      success: true,
      message: "Coupon claimed successfully",
      coupon: {
        code: result.coupon_code,
        coupon_id: result.coupon_id,
        campaign_id: result.campaign_id,
        user_id: result.user_id,
        bottle_id: result.bottle_id,
        redeemed_at: result.redeemed_at,
      },
    });
  } catch (error) {
    console.error("Error in /api/coupons/redeem:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

---

## 4. Testing Checklist

- [ ] **Happy path**: Valid active coupon → Claimed + Redemption logged ✓
- [ ] **Not found**: Invalid coupon code → 404 with not-found
- [ ] **Already claimed**: Coupon status != 'active' → 409 with not-active
- [ ] **Missing user_id**: Coupon.user_id is NULL → 400 with incomplete-claim
- [ ] **Duplicate user per campaign**: Same user claims in same campaign → 409 with constraint-violation
- [ ] **Duplicate bottle**: Same bottle scanned twice → 409 with constraint-violation
- [ ] **Concurrent claims**: Two simultaneous claims (FOR UPDATE lock) → One succeeds, one fails with constraint-violation
- [ ] **Rollback verification**: Insert fails → Coupon still in 'active' state (check after error)

---

## 5. Deployment Notes

1. **Deploy migration first** (`20260222_claim_coupon_atomic.sql`)
   - Supabase will run the SQL to create the RPC and GRANT permissions
2. **Update API endpoint** (replace /api/coupons/redeem)
   - Test in staging first
   - Monitor error logs for new error codes
3. **No data migration needed**
   - The RPC works with existing coupon/redemption records
   - Legacy data issues (null user_id) are handled by returning `incomplete-claim`
4. **Monitor metrics**
   - Track `incomplete-claim` errors to identify backfill priority
   - Watch for `constraint-violation` frequency (expected for power users)
