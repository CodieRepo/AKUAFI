# AKUAFI Overhaul Progress Tracker

🟢 **PHASE 1: Code Quality Cleanup** — Stability Focus

## Step 1: Fix Unused Imports

- [x] Run `npm run lint --fix` (identified 204 issues: 122 errors, 82 warnings)
- [x] Manually verify & remove unused imports:
  - [x] ✅ `src/app/admin/(protected)/campaigns/new/page.tsx` — Removed: `createClient`, `ChevronLeft`
  - [x] ✅ `src/app/admin/(protected)/layout.tsx` — Removed: unused `user` variable, `error` parameter
  - [x] ✅ `src/app/admin/(protected)/qr-generator/page.tsx` — Removed: `Download`
  - [x] ✅ `src/app/admin/(protected)/redemptions/page.tsx` — Removed: `Loader2`, `Filter`, `CalendarIcon`
  - [x] ✅ `src/app/admin/login/page.tsx` — Removed: `Lock`
  - [x] ✅ `src/components/admin/clients/CreateClientModal.tsx` — Removed: `cn`
- [x] TypeScript check passed (npx tsc --noEmit: exit code 0)
- [x] Next.js build successful (npm run build: all routes compiled)
- [x] Commits made:
  - Commit 1: "Phase 1-A: Remove unused imports from admin files (campaigns/new, layout)"
  - Commit 2: "Phase 1-A: Remove unused imports from admin pages (qr-generator, redemptions, login, create-client-modal)"
- [ ] Visual testing (admin login, dashboard, campaign creation):
  - [ ] Admin login page loads without errors
  - [ ] Campaign creation page renders correctly
  - [ ] QR generator page displays correctly
  - [ ] Redemptions page loads properly
  - [ ] No console errors
  - [ ] No visual breakage

**Status**: ✅ COMPLETED — All unused imports removed & verified  
**Date Completed**: 2026-02-21  
**Files Modified**: 6  
**Lines Removed**: ~30 unused imports

---

## Step 1-B: Fix Unescaped JSX Entities (Website Pages Only)

**Files Fixed**:

- [x] ✅ `src/app/(website)/about/ClientAbout.tsx` — Fixed: `"real estate."` → `&quot;real estate.&quot;`
- [x] ✅ `src/app/(website)/pricing/page.tsx` — Fixed: `brand's` → `brand&apos;s`, `Let's` → `Let&apos;s`

**Verification**:

- [x] TypeScript check passed (npx tsc --noEmit: exit code 0)
- [x] Committed: "Phase 1-B: Fix unescaped JSX entities in website pages (about, pricing)"
- [ ] Manual visual testing needed:
  - [ ] /about page renders correctly
  - [ ] /pricing page renders correctly
  - [ ] No hydration warnings in console
  - [ ] No console errors

**Status**: ✅ COMPLETED (website pages fixed)  
**Date**: 2026-02-21

---

**Off-Limits** (Do NOT touch):

- ❌ `/api/` — all API routes
- ❌ `/scan/` — redemption pages
- ❌ redemption/OTP logic

**Safe to Fix**:

- ✅ `src/app/admin/(protected)/(dashboard)/dashboard.tsx` — Lines 12, 82
- ✅ `src/app/admin/(protected)/campaigns/[id]/page.tsx` — Lines 15-16
- ✅ `src/app/admin/(protected)/campaigns/new/page.tsx` — Line 56
- ✅ `src/app/admin/(protected)/login/page.tsx` — Line 45
- ✅ Any admin components in `src/components/admin/`

**Approach**:

1. Replace `any` with proper interfaces (create local if unsure)
2. After each file: Run `npx tsc --noEmit`
3. After each file: Open admin dashboard in browser

**Example Pattern**:

```typescript
interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}
```

**Files to Fix**:

- [x] dashboard.tsx (lines 12, 82)
- [x] campaign/[id]/page.tsx (lines 15-16)
- [x] campaigns/new/page.tsx (line 56)
- [x] login/page.tsx (line 45)
- [x] Other admin components (if found during lint)

**Status**: Completed
**Date**: 2026-02-21

---

## Step 3: Fix React Hooks (Admin UI Only)

**Patterns to Fix**:

1. **Direct setState in useEffect**

   ```typescript
   // ❌ BEFORE
   useEffect(() => setLoading(false), []);

   // ✅ AFTER
   useEffect(() => {
     const timer = setTimeout(() => setLoading(false), 0);
     return () => clearTimeout(timer);
   }, []);
   ```

2. **Missing dependencies**

   ```typescript
   // ❌ BEFORE
   useEffect(() => {
     fetchCampaign();
   }, []);

   // ✅ AFTER
   const fetchCampaign = useCallback(() => {
     // ...
   }, []);

   useEffect(() => {
     fetchCampaign();
   }, [fetchCampaign]);
   ```

**Files to Check**:

- [x] `src/app/admin/(protected)/layout.tsx` - Line 40
- [x] `src/app/admin/(protected)/campaign/[id]/page.tsx` - Line 43

**Test After**:

- [ ] Campaign detail page loads
- [ ] Dashboard metrics render correctly
- [ ] Switching between pages doesn't cause extra renders
- [ ] No infinite loops or excessive re-renders

**WarningIf dependency causes infinite loop**:

1. Stop immediately
2. Revert the change
3. Log the issue
4. Try different pattern

**Status**: In Progress
**Date**: 2026-02-21

---

## Step 4: Fix JSX Unescaped Entities

**Files**:

- [ ] `src/app/(website)/about/ClientAbout.tsx` — Lines 95:184, 95:197
- [ ] `src/app/(website)/pricing/page.tsx` — Lines 153:38, 317:54

**Pattern**:

```tsx
// ❌ BEFORE
<p>Price: $99 – get 50% off</p>

// ✅ AFTER (Option 1: HTML entity)
<p>Price: $99 &ndash; get 50% off</p>

// ✅ AFTER (Option 2: Unicode)
<p>Price: $99 – get 50% off</p>
```

**Status**: In Progress  `r`n**Date**: 2026-02-21

---

## Final Verification

**Run After All Steps**:

```bash
npm run lint
npx tsc --noEmit
```

**Expected Result**:

```
✅ 0 errors
✅ 0 warnings
```

**Test Critical Flows** (Production Lock Verification):

- [ ] **QR Scan**: Navigate to `/scan/?token=test`, form loads
- [ ] **OTP Flow**: Request OTP (check SMS service works)
- [ ] **Admin Login**: Login page works, dashboard accessible
- [ ] **Client Dashboard**: Loads campaign metrics correctly
- [ ] **Campaign Creation**: Can start creating new campaign (don't submit)
- [ ] **No console errors**: Check DevTools console for JS errors

**Status**: In Progress  `r`n**Date**: 2026-02-21

---

## Next Phase: CSV Export (After Phase 1 Passes)

Once Phase 1 is 100% clean:

✅ Lint: 0 errors  
✅ Types: 0 errors  
✅ Hooks: No warnings  
✅ Tests: All flows work

**Then start**: CSV Export feature (read-only, safe, zero risk)

---

## Stability Checklist

Before committing to `overhaul-v2`:

- [ ] No changes to `/api/` endpoints
- [ ] No changes to redemption logic
- [ ] No changes to OTP flow
- [ ] No database schema changes
- [ ] No RLS policy changes
- [ ] All existing routes behave identically
- [ ] Admin UI renders without errors
- [ ] Client UI renders without errors
- [ ] Scan page works end-to-end
- [ ] No circular dependencies introduced

---

**Philosophy**: Stability > Features > Security > Scale

Each change: Test. Verify. Document. Proceed.

No shortcuts. No risks.

---

## Decision Log

(Track decisions & blockers here)

### 2026-02-21: Phase 1 Kickoff

- Decision: Start with unused imports (lowest risk)
- Reason: Can be auto-fixed and easily reverted
- Risk: Low (zero functional changes)


