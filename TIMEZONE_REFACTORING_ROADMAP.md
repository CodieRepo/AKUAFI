# AKUAFI Timezone Refactoring Roadmap

**Status**: ✅ Completed (Closed)  
**Created**: February 22, 2026

**Completion Note**: Timezone handling is now contractually enforced via CI guard.

- Guard script: [scripts/check-timezone-contract.js](scripts/check-timezone-contract.js)
- Run command: `npm run check:timezone-contract`

---

## Quick Summary

| Layer        | Status  | Details                                      |
| ------------ | ------- | -------------------------------------------- |
| **Database** | ✅ PASS | UTC only, no AT TIME ZONE conversions        |
| **RPC**      | ✅ PASS | `v_now TIMESTAMPTZ := NOW()` → UTC           |
| **API**      | ✅ PASS | `new Date().toISOString()` → UTC ISO strings |
| **Frontend** | ✅ PASS | Single formatter contract enforced           |

---

## Final State (Completed)

- UTC remains single source of truth in DB and API payloads.
- Final UI formatting uses centralized timezone helpers in [src/lib/formatTimestamp.ts](src/lib/formatTimestamp.ts).
- IST day grouping uses `istDateKey(...)` instead of UTC string slicing.
- Legacy redemptions endpoint semantics were corrected/deprecated to avoid misleading timestamps.
- Regression guard enforces the contract on future changes.

---

## Files Requiring Updates

### 1. PRIORITY 1: Broken (Missing timeZone param)

#### src/components/dashboard/coupons/CouponTable.tsx

- **Line**: 57
- **Current**:
  ```typescript
  {
    coupon.redeemed_at
      ? new Date(coupon.redeemed_at).toLocaleDateString()
      : "-";
  }
  ```
- **Problem**: Uses browser default timezone (could be UTC, EDT, IST, etc.)
- **Fix**:
  ```typescript
  import { formatToISTDate } from "@/lib/formatTimestamp";
  {
    coupon.redeemed_at ? formatToISTDate(coupon.redeemed_at) : "-";
  }
  ```

#### src/components/dashboard/coupons/CouponVerification.tsx

- **Line**: 208
- **Current**:
  ```typescript
  {
    couponData?.generated_at
      ? new Date(couponData.generated_at).toLocaleDateString()
      : "N/A";
  }
  ```
- **Fix**:
  ```typescript
  import { formatToISTDate } from "@/lib/formatTimestamp";
  {
    couponData?.generated_at ? formatToISTDate(couponData.generated_at) : "N/A";
  }
  ```

#### src/components/dashboard/coupons/GeneratedCouponsList.tsx

- **Line**: 239
- **Current**:
  ```typescript
  {
    new Date(coupon.generated_at).toLocaleDateString();
  }
  ```
- **Fix**:
  ```typescript
  import { formatToISTDate } from "@/lib/formatTimestamp";
  {
    formatToISTDate(coupon.generated_at);
  }
  ```

---

### 2. PRIORITY 2: Correct but Not Centralized

#### src/components/dashboard/CampaignTable.tsx

- **Lines**: 25-28
- **Current**: Local `formatIST()` function
  ```typescript
  function formatIST(dateString: string) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
    });
  }
  ```
- **Fix**: Remove local function, import from lib
  ```typescript
  import { formatToIST } from "@/lib/formatTimestamp";
  // Replace all calls to formatIST() with formatToIST()
  ```

#### src/components/dashboard/coupons/CouponVerification.tsx

- **Line**: 253
- **Current**:
  ```typescript
  {
    new Date(couponData.redeemed_at).toLocaleString("en-IN", {
      timeStyle: "short",
      dateStyle: "medium",
      timeZone: "Asia/Kolkata",
    });
  }
  ```
- **Fix**:
  ```typescript
  import { formatToIST } from "@/lib/formatTimestamp";
  {
    formatToIST(couponData.redeemed_at, "medium");
  }
  ```

#### src/components/dashboard/coupons/GeneratedCouponsList.tsx

- **Line**: 243
- **Current**:
  ```typescript
  {
    new Date(coupon.redeemed_at).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  ```
- **Fix**:
  ```typescript
  import { formatToIST, formatToISTCompact } from "@/lib/formatTimestamp";
  {
    formatToISTCompact(coupon.redeemed_at);
  }
  ```

#### src/components/admin/redemptions/RedemptionTable.tsx

- **Line**: 83
- **Current**:
  ```typescript
  {
    new Date(created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  }
  ```
- **Fix**:
  ```typescript
  import { formatToIST } from "@/lib/formatTimestamp";
  {
    formatToIST(created_at);
  }
  ```

---

### 3. PRIORITY 3: Date-Only (Already OK, Optional to Refactor)

#### src/app/admin/(protected)/inventory/page.tsx

- **Line**: 448
- **Current**: `new Date(b.dispatched_at).toLocaleDateString("en-IN")`
- **Status**: ✅ OK (date-only, no time confusion)
- **Optional Fix**: `formatToISTDate(b.dispatched_at)`

#### src/app/admin/(protected)/contact-queries/page.tsx

- **Line**: 212
- **Current**: `new Date(q.created_at).toLocaleDateString("en-IN")`
- **Status**: ✅ OK (date-only, no time confusion)
- **Optional Fix**: `formatToISTDate(q.created_at)`

#### src/app/client/dashboard/page.tsx

- **Line**: 112
- **Current**: `new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" })`
- **Status**: ✅ OK (date-only, no time confusion)
- **Optional Fix**: `formatToISTDate(d.date)`

#### src/app/admin/(protected)/inventory/[id]/page.tsx

- **Line**: 303
- **Current**: `new Date(batch.dispatched_at).toLocaleDateString("en-IN")`
- **Status**: ✅ OK (date-only, no time confusion)
- **Optional Fix**: `formatToISTDate(batch.dispatched_at)`

---

### 4. ALREADY CORRECT (No Changes Needed)

#### supabase/functions/send-contact-notification/index.ts

- **Line**: 82
- **Current**: `new Date(created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })`
- **Status**: ✅ Correct (server-side Node.js enforces IST)
- **Note**: Optional to replace with centralized helper if function imports from lib

---

## Implementation Order

### Batch 1: Critical (Deploy Together)

1. Deploy `/src/lib/formatTimestamp.ts` ✅ (Done)
2. Update PRIORITY 1 files (3 files)
3. Update PRIORITY 2 files (5 files)
4. Test in staging

### Batch 2: Optional (Deploy Later)

5. Update PRIORITY 3 files (4 files)
6. Update email template (1 file)

---

## Code Template

### Import Statement

```typescript
import {
  formatToIST,
  formatToISTDate,
  formatToISTTime,
  formatToISTCompact,
  formatToISTVerbose,
} from "@/lib/formatTimestamp";
```

### Common Replacements

**Date only:**

```typescript
// Before
new Date(timestamp).toLocaleDateString();

// After
formatToISTDate(timestamp);
```

**Time only:**

```typescript
// Before
new Date(timestamp).toLocaleTimeString();

// After
formatToISTTime(timestamp);
```

**Date + Time (compact):**

```typescript
// Before
new Date(timestamp).toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
});

// After
formatToIST(timestamp, "medium");
```

**Date + Time (compact for tables):**

```typescript
// Before
new Date(timestamp).toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// After
formatToISTCompact(timestamp);
```

**Date + Time (verbose):**

```typescript
// Before
new Date(timestamp).toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  month: "long",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// After
formatToISTVerbose(timestamp);
```

---

## Verification Checklist

After each file update:

- [ ] Import statement added
- [ ] All old inline `toLocaleString()` calls replaced
- [ ] All old `toLocaleDateString()` calls without timeZone replaced
- [ ] Component still compiles (no TypeScript errors)
- [ ] Component renders correctly in staging
- [ ] Timestamp displays in IST (test with browser timezone set to UTC)
- [ ] No console errors

---

## Testing Command

```bash
# Run tests for timestamp formatting
npm test -- formatTimestamp

# Or manual test in browser console:
const { formatToIST } = await import('@/lib/formatTimestamp');
console.log(formatToIST("2026-02-22T10:30:00Z"));
// Expected: "Feb 22, 2026, 4:00 PM" (IST = UTC + 5:30)
```

---

## Database Queries (Verification)

```sql
-- Verify all redemptions use UTC timestamps
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN redeemed_at IS NULL THEN 1 END) as null_redeemed_at
FROM redemptions;

-- Check coupon timestamps
SELECT
  coupon_code,
  redeemed_at,
  (redeemed_at AT TIME ZONE 'UTC')::text as utc_time
FROM coupons
LIMIT 10;
```

---

## Success Criteria

✅ **All timestamps in database**: UTC  
✅ **All API responses**: UTC ISO 8601 with Z suffix  
✅ **All frontend displays**: IST using centralized helpers  
✅ **No AT TIME ZONE in SQL**: Only for display verification  
✅ **Tests pass**: Browser timezone doesn't affect display  
✅ **No regressions**: Existing functionality unchanged
