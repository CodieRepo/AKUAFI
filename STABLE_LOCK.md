⚠️ **PRODUCTION LOCKED VERSION**

## Status

This AKUAFI production codebase is **FROZEN** and in live use.

## Off-Limits (Cannot Be Modified)

The following components are in production and must not be modified:

- **Redemption Logic** — `src/app/api/redeem/route.ts`
- **OTP Flow** — `src/app/api/otp/route.ts`, `src/services/otp.ts`, `src/services/sms.ts`
- **Bottle Status Checking** — `src/app/api/bottles/check/route.ts`
- **Existing Database Schema** — All current tables, columns, constraints (frozen)
- **RLS Policies** — Row-level security rules (locked)
- **Current API Endpoints** — All existing routes must maintain identical behavior
- **Coupon Generation RPC** — `redeem_coupon_atomic()` and similar database functions

## Development Strategy

All development must happen in the `overhaul-v2` branch:

1. Create dedicated feature branches from `overhaul-v2`
2. No direct commits to `main`
3. Merge to `main` only after full QA
4. Maintain backward compatibility at all times

## Why This Lock?

The current QR → OTP → Coupon redemption flow is live with active users. Stability is critical.

## When Can I Change Production Code?

✅ **Allowed** (Backward Compatible):

- Fix linting errors in components
- Add new features (new endpoints, new pages)
- Create new database views/functions
- Improve UI/styling
- Add monitoring/logging

🔒 **Not Allowed** (Breaking Changes):

- Modify redemption or OTP logic
- Change API endpoint signatures
- Alter database schema or RLS
- Rename existing columns/tables
- Change business logic in locked components

## Questions?

See `plan-akuafi.prompt.md` for detailed implementation strategy and phase breakdown.

---

**Last Updated**: February 21, 2026  
**Status**: PRODUCTION LOCKED ✅
