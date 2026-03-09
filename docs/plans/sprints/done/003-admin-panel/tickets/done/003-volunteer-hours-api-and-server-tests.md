---
id: '003'
title: volunteer hours API and server tests
status: done
use-cases:
- SUC-004
depends-on:
- '001'
---

# volunteer hours API and server tests

## Description

Create `server/src/routes/volunteer-hours.ts` with full CRUD for the
`volunteer_hours` table and register it in `server/src/index.ts`. Manual
entries can be created, updated, and deleted. Pike13-sourced entries
(`source = 'pike13'`) cannot be deleted (returns 403).

## Acceptance Criteria

- [ ] `GET /api/admin/volunteer-hours` returns 401 without session, 403 for
  non-admin, 200 with array of `VolunteerHourDto` for admin
  - Supports query params: `volunteerName` (partial match), `category`,
    `from` (ISO date), `to` (ISO date)
- [ ] `POST /api/admin/volunteer-hours` creates a new entry; returns 400 if
  `volunteerName`, `category`, or `hours` are missing
- [ ] `PUT /api/admin/volunteer-hours/:id` updates an existing entry; returns
  404 for unknown id
- [ ] `DELETE /api/admin/volunteer-hours/:id` deletes a manual entry; returns
  403 if `source = 'pike13'`; returns 404 for unknown id
- [ ] `volunteerHoursRouter` imported and registered in `server/src/index.ts`
  with `app.use('/api', volunteerHoursRouter)`
- [ ] Server tests in `tests/server/volunteer-hours.test.ts` cover all auth
  guards, CRUD happy paths, and the 403-on-pike13-delete guard

## Implementation Notes

Route file (`volunteer-hours.ts`):
```ts
import { Router } from 'express';
import { isAdmin } from '../middleware/auth';

export const volunteerHoursRouter = Router();
volunteerHoursRouter.use(isAdmin);
```

The `GET` filter params (`from`, `to`) compare against `recordedAt` using
Drizzle's `gte` / `lte`. The `volunteerName` filter uses `ilike` for
case-insensitive partial matching.

Response shape (`VolunteerHourDto`):
```ts
{
  id: number
  volunteerName: string
  category: string
  hours: number
  description: string | null
  recordedAt: string   // ISO timestamp
  source: 'manual' | 'pike13'
}
```

## Testing

- **Existing**: `npm run test:server` — all tests including ticket 002 must pass
- **New**: `tests/server/volunteer-hours.test.ts`
  - Auth guards (401 unauth, 403 non-admin)
  - `POST` creates entry; `GET` lists it
  - Filter by `category` returns subset
  - `PUT` updates fields
  - `DELETE` removes manual entry
  - `DELETE` on a `source = 'pike13'` entry returns 403
  - `POST` with missing fields returns 400
- **Verification**: `npm run test:server`
