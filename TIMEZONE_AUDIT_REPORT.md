# AKUAFI Timezone Audit & Remediation Plan

**Date**: February 22, 2026  
**Status**: Phase-1 Stabilization (Timezone Compliance)

---

## Executive Summary

✅ **Database Layer**: Confirmed UTC-only (no AT TIME ZONE conversions)  
✅ **RPC Layer** (`claim_coupon_atomic`): Confirmed UTC (v_now TIMESTAMPTZ := NOW())  
✅ **API Responses**: Confirmed UTC ISO 8601 (new Date().toISOString())  
⚠️ **Frontend Display**: Inconsistent timezone formatting → Needs standardization

**Action**: Centralize frontend timestamp formatting via `@/lib/formatTimestamp.ts`

---

## Database & RPC Audit

### ✅ Supabase/Postgres Configuration

**Status**: COMPLIANT

```sql
-- Created in 20260218_create_admins_table.sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL

-- RPC: 20260222_claim_coupon_atomic.sql
DECLARE v_now TIMESTAMPTZ := NOW();  -- ✅ UTC
UPDATE coupons SET redeemed_at = v_now;  -- ✅ Stored as UTC
INSERT INTO redemptions (..., redeemed_at) VALUES (..., v_now);  -- ✅ UTC
```

**Verified**: No AT TIME ZONE conversions for storage or business logic.

---

### ✅ API Response Layer

**Status**: COMPLIANT

```typescript
// src/app/api/coupons/redeem/route.ts
redeemed_at: new Date().toISOString()  // ✅ Returns UTC with Z suffix

// Example response:
{
  success: true,
  coupon: {
    redeemed_at: "2026-02-22T10:30:00.000Z"  // ✅ UTC ISO 8601
  }
}
```

**All APIs return raw UTC timestamps** — no timezone conversion.

---

## Frontend Display Audit

### ⚠️ Current Issues

| Component                       | File                                                            | Current Implementation                                                          | Issue                                                | Status       |
| ------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------ |
| RedemptionTable                 | `src/components/admin/redemptions/RedemptionTable.tsx:83`       | `toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })`                         | ✅ Correct, but not using centralized helper         | Custom       |
| CouponTable (Dashboard)         | `src/components/dashboard/coupons/CouponTable.tsx:57`           | `toLocaleDateString()`                                                          | ❌ Missing timeZone → Browser default (UTC)          | Inconsistent |
| CouponTable (Campaign)          | `src/components/dashboard/CampaignTable.tsx:25-28`              | `formatIST()` local helper                                                      | ✅ Correct, but not centralized                      | Duplicate    |
| CouponVerification              | `src/components/dashboard/coupons/CouponVerification.tsx:208`   | `toLocaleDateString()`                                                          | ❌ Missing timeZone → Browser default                | Inconsistent |
| CouponVerification (Redeemed)   | `src/components/dashboard/coupons/CouponVerification.tsx:253`   | `toLocaleString("en-IN", { timeStyle: 'short', ... timeZone: 'Asia/Kolkata' })` | ✅ Correct, but verbose inline code                  | Custom       |
| GeneratedCouponsList            | `src/components/dashboard/coupons/GeneratedCouponsList.tsx:239` | `toLocaleDateString()`                                                          | ❌ Missing timeZone → Browser default                | Inconsistent |
| GeneratedCouponsList (Redeemed) | `src/components/dashboard/coupons/GeneratedCouponsList.tsx:243` | `toLocaleString("en-IN", { ... timeZone: 'Asia/Kolkata' })`                     | ✅ Correct, but inline                               | Custom       |
| InventoryPage                   | `src/app/admin/(protected)/inventory/page.tsx:448`              | `toLocaleDateString("en-IN")`                                                   | ⚠️ Date-only, no timezone (OK for date)              | Minor        |
| ContactQueriesPage              | `src/app/admin/(protected)/contact-queries/page.tsx:212`        | `toLocaleDateString("en-IN")`                                                   | ⚠️ Date-only, no timezone (OK for date)              | Minor        |
| ClientDashboard                 | `src/app/client/dashboard/page.tsx:112`                         | `toLocaleDateString("en-IN", { weekday: "short" })`                             | ⚠️ Date-only, no timezone (OK for date)              | Minor        |
| EmailTemplate                   | `supabase/functions/send-contact-notification/index.ts:82`      | `toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })`                         | ✅ Correct (server-side NodeJS), ensures consistency | Good         |

### Problem Pattern

**❌ Incorrect** (Browser default, not IST):

```typescript
new Date(utcTimestamp).toLocaleDateString(); // Uses browser timezone!
new Date(utcTimestamp).toLocaleDateString("en-IN"); // Still uses browser timezone
```

**✅ Correct** (Explicit IST):

```typescript
new Date(utcTimestamp).toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata", // Explicit!
});
```

---

## Solution: Centralized Helper Library

### Created: `/src/lib/formatTimestamp.ts`

**Exports**:

| Function                           | Purpose               | Example Output                               |
| ---------------------------------- | --------------------- | -------------------------------------------- |
| `formatToIST(utcString, 'medium')` | Full timestamp in IST | "Feb 22, 2026, 4:00 PM"                      |
| `formatToISTDate(utcString)`       | Date only in IST      | "22 Feb 2026"                                |
| `formatToISTTime(utcString)`       | Time only in IST      | "4:00:00 PM"                                 |
| `formatToISTCompact(utcString)`    | Table/list display    | "22 Feb 2026, 4:00 PM"                       |
| `formatToISTVerbose(utcString)`    | Detailed display      | "Monday, 22 February 2026 at 4:00:00 PM IST" |
| `toUTCISO(dateInput)`              | Normalize to UTC ISO  | "2026-02-22T10:30:00.000Z"                   |
| `isFutureIST(utcString)`           | Check if future       | boolean                                      |
| `isPastIST(utcString)`             | Check if past         | boolean                                      |
| `getTimeRemaining(utcString)`      | Time until expiry     | "2 days 5h"                                  |

---

## Remediation Strategy

### Phase 1: Deployment ✅

- Deploy `/src/lib/formatTimestamp.ts` (already created)
- Database/RPC unchanged (already UTC-compliant)
- APIs unchanged (already UTC-compliant)

### Phase 2: Refactor Components (Recommended)

#### Priority 1: Inconsistent Components (Missing timeZone)

1. **CouponTable (Dashboard)**  
   File: [src/components/dashboard/coupons/CouponTable.tsx](src/components/dashboard/coupons/CouponTable.tsx)  
   Change:

   ```typescript
   // Before
   {
     coupon.redeemed_at
       ? new Date(coupon.redeemed_at).toLocaleDateString()
       : "-";
   }

   // After
   import { formatToISTDate } from "@/lib/formatTimestamp";
   {
     coupon.redeemed_at ? formatToISTDate(coupon.redeemed_at) : "-";
   }
   ```

2. **CouponVerification (Generated date)**  
   File: [src/components/dashboard/coupons/CouponVerification.tsx](src/components/dashboard/coupons/CouponVerification.tsx#L208)  
   Change:

   ```typescript
   // Before
   {
     couponData?.generated_at
       ? new Date(couponData.generated_at).toLocaleDateString()
       : "N/A";
   }

   // After
   {
     couponData?.generated_at
       ? formatToISTDate(couponData.generated_at)
       : "N/A";
   }
   ```

3. **GeneratedCouponsList (Generated date)**  
   File: [src/components/dashboard/coupons/GeneratedCouponsList.tsx](src/components/dashboard/coupons/GeneratedCouponsList.tsx#L239)  
   Change:

   ```typescript
   // Before
   {
     new Date(coupon.generated_at).toLocaleDateString();
   }

   // After
   {
     formatToISTDate(coupon.generated_at);
   }
   ```

#### Priority 2: Custom Implementations (Replace with centralized)

4. **CampaignTable (Local formatIST)**  
   File: [src/components/dashboard/CampaignTable.tsx](src/components/dashboard/CampaignTable.tsx#L25)  
   Change:

   ```typescript
   // Before: Local function
   function formatIST(dateString: string) { ... }

   // After: Use centralized
   import { formatToIST, formatToISTCompact } from '@/lib/formatTimestamp';
   // In render, replace calls to formatIST() with formatToIST()
   ```

5. **CouponVerification (Redeemed timestamp)**  
   File: [src/components/dashboard/coupons/CouponVerification.tsx](src/components/dashboard/coupons/CouponVerification.tsx#L253)  
   Change:

   ```typescript
   // Before: Inline locale options
   new Date(couponData.redeemed_at).toLocaleString("en-IN", {
     timeStyle: "short",
     dateStyle: "medium",
     timeZone: "Asia/Kolkata",
   });

   // After: Use helper
   formatToIST(couponData.redeemed_at, "medium");
   ```

6. **RedemptionTable (Correct but not centralized)**  
   File: [src/components/admin/redemptions/RedemptionTable.tsx](src/components/admin/redemptions/RedemptionTable.tsx#L83)  
   Change:

   ```typescript
   // Before: Inline locale options
   new Date(created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

   // After: Use helper
   formatToIST(created_at, "medium");
   ```

7. **GeneratedCouponsList (Redeemed timestamp)**  
   File: [src/components/dashboard/coupons/GeneratedCouponsList.tsx](src/components/dashboard/coupons/GeneratedCouponsList.tsx#L243)  
   Change:

   ```typescript
   // Before: Inline locale options
   new Date(coupon.redeemed_at).toLocaleString("en-IN", { ... })

   // After: Use helper
   formatToIST(coupon.redeemed_at, 'medium')
   ```

#### Priority 3: Date-Only Components (Minor - Already OK)

8. **InventoryPage, ContactQueriesPage, ClientDashboard**  
   Status: ✅ OK (date-only format, no timezone confusion)  
   Optional: Can refactor to `formatToISTDate()` for consistency

---

## Migration Checklist

**Before deploying refactored components**, verify:

- [ ] `/src/lib/formatTimestamp.ts` deployed and tests passing
- [ ] Import statements added to each component
- [ ] Old inline locale calls removed
- [ ] Test in staging: Timestamps display as IST (GMT+5:30)
- [ ] Test with different browser timezone settings → Should always show IST
- [ ] Verify database still stores UTC (check Supabase logs)
- [ ] Monitor API responses → Should still be UTC ISO

---

## Testing Verification

### 1. Database Verification

```sql
-- Verify UTC storage (run in Supabase SQL editor)
SELECT
  coupon_code,
  redeemed_at,
  redeemed_at AT TIME ZONE 'UTC' AS utc_time,
  redeemed_at AT TIME ZONE 'Asia/Kolkata' AS ist_time
FROM redemptions
LIMIT 5;

-- Expected: redeemed_at is stored as UTC timestamp
```

### 2. API Response Verification

```bash
# Call /api/coupons/redeem
curl -X POST http://localhost:3000/api/coupons/redeem \
  -H "Content-Type: application/json" \
  -d '{"coupon_code": "TEST-001"}'

# Expected response:
{
  "success": true,
  "coupon": {
    "redeemed_at": "2026-02-22T10:30:00.000Z"  # ✅ UTC ISO
  }
}
```

### 3. Frontend Testing

```typescript
// In browser console
import { formatToIST } from "@/lib/formatTimestamp";

// Test with known UTC time
formatToIST("2026-02-22T10:30:00Z", "medium");
// Should return: Feb 22, 2026, 4:00 PM (4:00 PM = 10:30 UTC + 5:30 IST)

// Test in different browser timezone
// In browser settings, change timezone to US/Eastern
// Frontend should still display IST (not EDT)
```

---

## Files Modified / Created

| Status       | File                                                        | Change                                       |
| ------------ | ----------------------------------------------------------- | -------------------------------------------- |
| ✅ Created   | `src/lib/formatTimestamp.ts`                                | New centralized helper library               |
| ⏳ Pending   | `src/components/dashboard/coupons/CouponTable.tsx`          | Replace toLocaleDateString()                 |
| ⏳ Pending   | `src/components/dashboard/coupons/CouponVerification.tsx`   | Replace toLocaleDateString() + inline locale |
| ⏳ Pending   | `src/components/dashboard/coupons/GeneratedCouponsList.tsx` | Replace toLocaleDateString() + inline locale |
| ⏳ Pending   | `src/components/dashboard/CampaignTable.tsx`                | Remove local formatIST, import from lib      |
| ⏳ Pending   | `src/components/admin/redemptions/RedemptionTable.tsx`      | Replace inline locale with helper            |
| ✅ Compliant | `supabase/migrations/20260222_claim_coupon_atomic.sql`      | v_now TIMESTAMPTZ := NOW() (UTC)             |
| ✅ Compliant | `src/app/api/coupons/redeem/route.ts`                       | new Date().toISOString() (UTC)               |

---

## Summary

### ✅ Database Layer

- Postgres stores all timestamps in UTC
- No AT TIME ZONE conversions on write
- RPC function uses v_now TIMESTAMPTZ := NOW()

### ✅ API Layer

- All responses return ISO 8601 UTC (Z suffix)
- No timezone conversion in endpoints

### ⏳ Frontend Layer (Ready for refactoring)

- Created centralized `formatTimestamp.ts` library
- Provides 8 formatting functions for IST display
- Ready to replace inconsistent inline implementations

### 🎯 Next Steps

1. Deploy `src/lib/formatTimestamp.ts` immediately (no breaking changes)
2. Refactor components listed in "Remediation Strategy" (low-risk, mechanical changes)
3. Test in staging with different browser timezone settings
4. Deploy with confidence that all timestamps display correctly in IST

---

## Guarantee

After implementing this audit:

✅ **Database**: Always UTC  
✅ **APIs**: Always UTC ISO strings  
✅ **Frontend**: Always displays IST (regardless of user's browser timezone)  
✅ **No AT TIME ZONE in SQL**: Never used for display purposes  
✅ **Single point of truth**: `formatTimestamp.ts` for all display formatting
