# Akuafi System Architecture Map (Read-Only Assessment)

Date: 2026-02-22
Scope: Architectural/contextual understanding only (no logic/schema/business-rule changes)
Status: Production-stage system with mixed legacy + current paths

## 1. Executive Summary

Akuafi is a QR-based coupon redemption SaaS built on Next.js + Supabase. The core consumer flow (scan -> OTP -> coupon issuance) is operational and backed by DB/RPC validation. The main architectural weakness is not the redemption logic itself, but schema/API drift across multiple generations of implementation (legacy vs current models), especially in admin analytics and some admin APIs.

Current architecture supports:
- Campaign creation
- QR/bottle generation
- OTP verification
- Coupon issuance
- Coupon claiming
- Client/admin dashboards (partially view-driven)

Primary risk theme:
- Contract drift across tables/fields/status semantics (`code` vs `coupon_code`, `claimed` vs `redeemed`, `is_used` vs `status`)

## 2. High-Level System Topology

### Runtime Stack
- Frontend: Next.js App Router (`src/app`)
- Backend APIs: Next.js Route Handlers (`src/app/api`)
- Database/Auth/Storage: Supabase (PostgreSQL + Auth + Storage)
- Hosting: Vercel (implied by `vercel.json`)
- SMS/OTP: 2Factor via custom OTP service (`src/services/otp.ts`)

### Core Domains (Current Data Model Intent)
- `admins` (admin auth allowlist)
- `clients` (tenant/business entity)
- `campaigns`
- `bottles` (QR-bearing units)
- `users` (end consumers by phone)
- `coupons` (issued/active/claimed lifecycle)
- `redemptions` (claim/redeem logs + metrics/counters source in several flows)
- `otp_sessions`
- `qr_jobs` (async QR pipeline, currently partially frozen in UX/backend usage)

## 3. Core Consumer Redemption Flow (Active Path)

### Step A: QR Scan Landing
- Route: `/scan/[qr_token]`
- File: `src/app/scan/[qr_token]/page.tsx`
- Behavior:
  - Calls `/api/bottles/check`
  - If QR already blocked/used -> shows "used" UI
  - Else shows form for name + phone + optional address

### Step B: OTP Send (Preflight Validation)
- API: `/api/otp/send`
- File: `src/app/api/otp/send/route.ts`
- Flow:
  - Normalizes phone
  - Calls DB RPC `validate_bottle_for_otp(p_qr_token, p_phone)`
  - RPC validates:
    - QR exists
    - QR not already used
    - Campaign active/date-valid
    - Same user/phone not already participating in campaign
  - Sends OTP via `otpService.sendOTP()`
  - Stores OTP session in `otp_sessions`

### Step C: OTP Verify + Coupon Issuance
- API: `/api/redeem`
- File: `src/app/api/redeem/route.ts`
- Flow:
  - Validates OTP via `otpService.validateOTP()`
  - Fetches bottle and campaign
  - Pre-checks QR reuse and same-user same-campaign using `coupons`
  - Generates prefix-based coupon code (+ collision retry loop)
  - Calls DB RPC `redeem_coupon_atomic(...)`
  - Returns `coupon_code` + `discount_value`

### Step D: Coupon Claim (Merchant/Client-side Claim)
- API: `/api/coupons/redeem`
- File: `src/app/api/coupons/redeem/route.ts`
- Used by:
  - `src/components/dashboard/coupons/CouponVerification.tsx`
  - `src/components/dashboard/coupons/GeneratedCouponsList.tsx`
- Behavior:
  - Atomically updates coupon `status` from `active` -> `claimed`
  - Inserts a row into `redemptions` for metrics/logging (best-effort; logs failures)

## 4. Business Constraints (Observed and Preserved)

These align with the stated hard rules and are enforced via a combination of DB constraints + RPC checks:

### Rule 1: One phone per campaign
- Mechanism:
  - `users.phone` unique (global user identity by phone)
  - User/campaign duplicate checks in validation RPC and redeem flow
  - Historical/legacy constraint definitions exist on coupon/redemption paths

### Rule 2: Same QR cannot be reused
- Mechanism:
  - QR token identifies `bottles` row
  - `bottle_id` uniqueness is enforced in at least one schema track (legacy/local migrations)
  - Current runtime also pre-checks `coupons` by `bottle_id` before redemption

### Rule 3: Same phone with different QR in same campaign is blocked
- Mechanism:
  - Preflight RPC checks user existing coupon in campaign
  - Redeem API checks `coupons` for `(user_id, campaign_id)`
  - Additional DB uniqueness exists in some migration tracks

## 5. Admin / Client Architecture

### Admin Surface
- Protected layout uses `verifyAdmin()` (`admins` table check)
- Main sections:
  - Dashboard
  - Campaigns
  - Campaign detail
  - Clients
  - Redemptions monitor
  - QR generator

### Client Surface
- Supabase auth session-based
- Client identity resolved via `clients.user_id = auth.users.id`
- Dashboard reads analytics views + scoped campaign/coupon data
- Coupon verification/claim UI is wired, but some analytics definitions are still transitional

## 6. Data Access Layers (Current Reality)

Akuafi currently uses four parallel data access patterns:

1. Direct table queries from Next.js APIs with service-role client
- Example: `/api/redeem`, `/api/bottles/check`, `/api/coupons/redeem`

2. Direct table queries from browser/server components via Supabase auth client (RLS-scoped)
- Example: client/admin dashboard pages reading views and tables

3. RPC-based DB logic for critical validation/atomicity
- `validate_bottle_for_otp`
- `redeem_coupon_atomic`
- `increment_scan_count`

4. SQL views for analytics abstraction
- `campaign_metrics_v1`
- `client_dashboard_v1`
- `campaign_user_details_v1`

This is a good architectural direction, but currently mixed with legacy assumptions in some APIs.

## 7. Analytics Architecture (Current)

### View-Based Analytics (Best Current Direction)
- `campaign_metrics_v1`
  - Aggregates QR totals from `bottles`
  - Aggregates claims/unique users from `coupons` (status-filtered to `claimed`)
- `client_dashboard_v1`
  - Aggregates per-client totals from `campaign_metrics_v1`
- `campaign_user_details_v1`
  - Joins `coupons` + `users` + `campaigns` for row-level dashboards

### Why Metrics Drift Happens Today
Some admin APIs/pages still query legacy columns/statuses:
- `code` instead of `coupon_code`
- `created_at` instead of `generated_at`/`redeemed_at`
- `status='redeemed'` while active claim flow writes `claimed`
- `bottles.status='used'` while some paths rely on `is_used` and/or `coupons` as truth

Result:
- Partial zeros after refresh
- Null joins
- Inconsistent counts between pages

## 8. QR Generation Architecture (Current Split)

### Active in UI / Admin Route
- Synchronous generation and ZIP download (`/api/admin/qr/generate`)
- Backend hard cap: 200 QRs per request
- UI batches larger totals into multiple requests

### Async Pipeline (Exists but Not Primary)
- `qr_jobs` table + `/api/internal/qr-worker`
- Supports processing + zipping phases with Supabase Storage
- Useful for scale, but currently not the main production path

### Architectural Note
Two QR generation systems exist simultaneously. This is acceptable during transition but is a scalability and maintainability risk if left ambiguous.

## 9. Security & Multi-Tenant Readiness Snapshot

### Strengths
- Admin layout/server APIs mostly use `verifyAdmin()`
- Client RLS policies exist for `coupons` and `redemptions`
- Service-role used for privileged operations (campaign creation, QR generation, redeem RPC calls)

### Gaps / Risks
- At least one admin endpoint uses only authenticated session + service-role actions without `verifyAdmin()` (campaign delete route)
- Some older/broad RLS policies allow generic authenticated reads on important tables
- Multiple schema tracks increase the chance of environment mismatch (dev vs prod behavior)

## 10. Structural Weaknesses (Architecture-Level, No Logic Change Proposal)

### A. Schema / Contract Drift (Primary Weakness)
Symptoms:
- Field naming mismatches (`code` vs `coupon_code`)
- Status semantics drift (`claimed` vs `redeemed`)
- Mixed bottle usage flags (`is_used` vs `status`)
- Multiple migration locations (`supabase/migrations` and `src/lib/migrations`)

Impact:
- Analytics inconsistencies
- Admin route bugs
- Fragile maintenance for investor-ready scale

### B. Duplicate/Legacy Flow Paths
Examples:
- `/api/redeem` (current consumer flow)
- `/api/otp/verify` (older parallel verification path)
- `/api/coupons/redeem` vs `/api/admin/redemptions` POST (different status semantics)

Impact:
- Operational ambiguity
- Harder debugging and QA
- Higher risk of regressions when touching admin analytics

### C. Metrics Coupling and Best-Effort Logging
- Coupon claim status update succeeds even if `redemptions` insert fails (logged but not repaired)
- Leads to dashboard counter divergence depending on source table/view

### D. Transitioning Multi-Tenant Boundaries
- Client hierarchy exists (`clients`, `user_roles`, `admins`)
- Some access patterns still assume admin-side service role rather than fully standardized tenant-scoped APIs/views

## 11. Current Implementation State Map (Practical)

### Stable / Working
- Consumer scan flow
- OTP sending/verification
- Coupon issuance via atomic RPC pattern
- Coupon claiming UI/API (operational, though metrics logging can drift)
- Campaign creation
- QR generation (sync path, limited)

### Partially Stabilized / In Progress
- Admin analytics correctness
- Relational join consistency in older admin APIs
- Client dashboard analytics completeness and export/filtering
- Admin-client hierarchy hardening
- Async QR job pipeline production alignment

### Known Symptoms Explained by Architecture
- Metrics reset to 0 after refresh -> mixed status/field assumptions in APIs
- Null `users.name` -> legacy/backfill rows + left joins
- Eye-button 404 -> likely campaign lookup miss/notFound, not route absence

## 12. Conceptual Upgrade Plan (No Functional Changes, Planning Only)

This is a conceptual roadmap for stabilization and investor-readiness. No code/schema changes are included here.

### Phase 1: Contract Clarification (Documentation + Inventory)
- Define canonical field names/status semantics for each table
- Inventory active endpoints vs deprecated endpoints
- Record source of truth for each metric (operational vs analytical)

### Phase 2: Data Access Standardization (Concept)
- Route all dashboard metrics through view/RPC-backed contracts
- Minimize direct dashboard dependence on raw table shape changes
- Align admin APIs with current coupon lifecycle semantics

### Phase 3: Security & Tenancy Hardening (Concept)
- Uniform admin verification across all `/api/admin/*`
- RLS policy review for broad authenticated reads
- Formal tenant boundary contract (admin vs client vs service-role responsibilities)

### Phase 4: Scale Readiness (Concept)
- Promote one QR generation architecture as primary (sync or async)
- Introduce observability around claim/logging consistency and batch job failures
- Add contract/invariant tests for redemption constraints and analytics correctness

## 13. Source-of-Truth Notes (Important for Future Work)

Current repo contains multiple schema/migration references:
- `supabase/migrations/*` (most current tracked migrations)
- `src/lib/migrations/*` (older/local migration track still referenced by runtime assumptions)
- `supabase_schema.sql` (outdated snapshot, not reliable as current prod contract)

For architecture planning, treat `supabase/migrations/*` + live runtime code paths as primary, and treat other schema snapshots as historical references unless verified against production.

## 14. Recommended Use of This Document

Use this file as:
- A stabilization-phase architecture baseline
- A shared map for investor-readiness planning
- A reference for future analytics correctness work
- A checklist seed for “active path vs legacy path” consolidation

This document intentionally avoids proposing direct code/schema changes to preserve the current production flow and business rules.
