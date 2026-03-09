---
id: '002'
title: extract dateUtils and admin API routes
status: done
use-cases:
- SUC-001
- SUC-002
- SUC-003
- SUC-005
depends-on:
- '001'
---

# extract dateUtils and admin API routes

## Description

1. Extract `currentWeekMonday()` from `server/src/routes/checkins.ts` into
   a new `server/src/utils/dateUtils.ts` utility so both checkins and the new
   compliance route share the same date arithmetic.

2. Create `server/src/routes/admin.ts` with all admin API routes (instructor
   list, instructor activate/deactivate, compliance, notifications) and register
   it in `server/src/index.ts`.

All routes use the existing `isAdmin` middleware via `router.use(isAdmin)`.

## Acceptance Criteria

- [ ] `server/src/utils/dateUtils.ts` exports `currentWeekMonday(): string`
  (returns ISO date string of the most recent Monday, e.g. `"2026-03-02"`)
  and `lastMondayOnOrBefore(date: Date): string`
- [ ] `checkins.ts` imports from `dateUtils` instead of defining its own
  helper; existing checkins tests still pass
- [ ] `GET /api/admin/instructors` returns 401 without session, 403 for
  non-admin, 200 with array of `AdminInstructorDto` for admin
  - Each item: `{ id, userId, name, email, isActive, studentCount, ratioBadge }`
  - `ratioBadge`: `'ok'` for ≤4, `'warning'` for 5–6, `'alert'` for 7+
  - `studentCount` derived from `instructor_students` JOIN `instructors`
- [ ] `PATCH /api/admin/instructors/:id` toggles `isActive`; returns 404 for
  unknown id, 200 with updated instructor on success
- [ ] `GET /api/admin/compliance?month=YYYY-MM` returns array of
  `ComplianceRow`: `{ instructorId, name, pending, draft, sent, recentCheckinSubmitted }`
  - `recentCheckinSubmitted` is true if a `ta_checkins` row exists for this
    instructor with `weekOf` equal to the last Monday ≤ last day of queried month
  - Defaults to current month if `?month` is absent
- [ ] `GET /api/admin/notifications` returns all notifications newest-first;
  `?unread=true` filters to `isRead = false`
- [ ] `PATCH /api/admin/notifications/:id/read` sets `isRead = true`; returns
  404 for unknown id
- [ ] Both `adminRouter` imported and registered in `server/src/index.ts` with
  `app.use('/api', adminRouter)`
- [ ] Server tests in `tests/server/admin.test.ts` cover all auth guards and
  happy-path cases

## Implementation Notes

Route file structure for `admin.ts`:
```ts
import { Router } from 'express';
import { isAdmin } from '../middleware/auth';

export const adminRouter = Router();
adminRouter.use(isAdmin);

// GET /api/admin/instructors
// PATCH /api/admin/instructors/:id
// GET /api/admin/compliance
// GET /api/admin/notifications
// PATCH /api/admin/notifications/:id/read
```

Ratio badge logic (hardcoded threshold = 6):
```ts
function ratioBadge(count: number): 'ok' | 'warning' | 'alert' {
  if (count <= 4) return 'ok';
  if (count <= 6) return 'warning';
  return 'alert';
}
```

The `lastMondayOnOrBefore(date)` in `dateUtils.ts`:
- Find the day-of-week (0=Sun … 6=Sat); subtract days to reach Monday
- Return `date.toISOString().slice(0, 10)` for the result

## Testing

- **Existing**: `npm run test:server` — all 64 tests must still pass
- **New**: `tests/server/admin.test.ts`
  - Auth guards (401 unauth, 403 non-admin) for each endpoint
  - `GET /api/admin/instructors` returns correct shape and badge values
  - `PATCH /api/admin/instructors/:id` toggles `isActive`
  - `GET /api/admin/compliance` returns correct review counts per instructor
  - `recentCheckinSubmitted` is true/false based on `ta_checkins` presence
  - `GET /api/admin/notifications` lists and filters by unread
  - `PATCH /api/admin/notifications/:id/read` marks notification read
- **Verification**: `npm run test:server`
