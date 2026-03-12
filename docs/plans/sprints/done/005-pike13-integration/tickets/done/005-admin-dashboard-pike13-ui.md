---
id: "005"
title: Admin dashboard Pike13 UI
status: done
use-cases:
- SUC-001
- SUC-002
depends-on:
- "004"
---

# Admin dashboard Pike13 UI

## Description

Add a "Pike13" section to `client/src/pages/AdminDashboardPage.tsx` and the
supporting client types.

**New file:** `client/src/types/pike13.ts`
```ts
export interface Pike13StatusDto { connected: boolean }
export interface Pike13SyncResultDto {
  studentsUpserted: number
  assignmentsCreated: number
  hoursCreated: number
}
```

**Pike13 section behavior:**

1. On mount, call `GET /api/admin/pike13/status`
2. **Not connected** state:
   - Show "Pike13: Not Connected"
   - Show "Connect Pike13" button — navigates to `/api/admin/pike13/connect`
     (full page navigation, not fetch)
3. **Connected** state:
   - Show "Pike13: Connected"
   - Show "Sync Pike13" button — calls `POST /api/admin/sync/pike13` via
     `useMutation` (React Query)
   - On success: display result counts (e.g., "Synced: 12 students, 8 assignments, 24 hours")
   - On error: display error message

## Acceptance Criteria

- [ ] "Not Connected" state shows connect button when `GET /api/admin/pike13/status` returns `{ connected: false }`
- [ ] "Connected" state shows sync button when `{ connected: true }`
- [ ] Clicking "Connect Pike13" navigates to `/api/admin/pike13/connect`
- [ ] Clicking "Sync Pike13" calls `POST /api/admin/sync/pike13`
- [ ] Sync result counts are displayed after successful sync
- [ ] Error message displayed if sync fails

## Testing

- **Existing tests to run**: `npm run test:client`
- **New tests to write**: `tests/client/AdminDashboardPike13.test.tsx`
  - Renders "Not Connected" + connect button when status API returns `{ connected: false }`
  - Renders "Connected" + sync button when status API returns `{ connected: true }`
  - Clicking sync button fires `POST /api/admin/sync/pike13`
  - Sync success → result counts displayed
- **Verification command**: `npm run test:client`
