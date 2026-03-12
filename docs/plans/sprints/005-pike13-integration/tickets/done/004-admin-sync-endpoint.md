---
id: "004"
title: Admin sync endpoint
status: done
use-cases:
- SUC-002
depends-on:
- "002"
- "003"
---

# Admin sync endpoint

## Description

Add `POST /api/admin/sync/pike13` to `server/src/routes/admin.ts`.

Requires `isAdmin` middleware.

**Logic:**
1. Query `pike13_admin_token` — if no row exists, return 409 with
   `{ error: 'Pike13 not connected' }`
2. If token is expired, attempt refresh using `refresh_token` and update the
   stored row (basic refresh; if refresh fails return 401)
3. Call `runSync(db, accessToken)` from `pike13Sync.ts`
4. Return 200 with `SyncResult`:
   ```ts
   { studentsUpserted: number, assignmentsCreated: number, hoursCreated: number }
   ```

## Acceptance Criteria

- [ ] `POST /api/admin/sync/pike13` returns 401 for non-admin users
- [ ] Returns 409 `{ error: 'Pike13 not connected' }` when no admin token exists
- [ ] Returns 200 with correct counts on successful sync
- [ ] Endpoint delegates all Pike13 logic to `runSync` (thin route handler)

## Testing

- **Existing tests to run**: `npm run test:server`
- **New tests to write**: `tests/server/pike13SyncRoute.test.ts`
  - Non-admin → 401
  - No token in DB → 409
  - Sync succeeds with mocked `runSync` → 200 with counts
- **Verification command**: `npm run test:server`
