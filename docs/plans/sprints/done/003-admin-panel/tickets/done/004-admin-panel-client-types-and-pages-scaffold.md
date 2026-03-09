---
id: '004'
title: admin panel client types and pages scaffold
status: done
use-cases:
- SUC-001
- SUC-002
- SUC-003
- SUC-005
depends-on:
- '002'
---

# admin panel client types and pages scaffold

## Description

Add the client-side TypeScript types for admin API responses, create the four
admin pages (`AdminDashboardPage`, `InstructorListPage`, `CompliancePage`,
`VolunteerHoursPage`) and the `AdminLayout` shared navigation component, then
wire all admin routes into `App.tsx` under `ProtectedRoute role="admin"`.

## Acceptance Criteria

- [ ] `client/src/types/admin.ts` defines:
  `AdminInstructorDto`, `ComplianceRow`, `AdminNotificationDto`
  (VolunteerHourDto added in ticket 005)
- [ ] `client/src/components/AdminLayout.tsx` renders a sidebar with nav
  links: Dashboard → `/admin`, Instructors → `/admin/instructors`,
  Compliance → `/admin/compliance`, Volunteer Hours → `/admin/volunteer-hours`
- [ ] `AdminDashboardPage` (`/admin`) shows unread notification count badge
  and a list of unread notifications; each has a **Mark as Read** button
- [ ] `InstructorListPage` (`/admin/instructors`) shows a table of all
  instructors with name, email, active status (toggle button), student count,
  and ratio badge (coloured: ok=none, warning=yellow, alert=red)
- [ ] `CompliancePage` (`/admin/compliance`) shows MonthPicker + table with
  one row per instructor: name, pending, draft, sent, check-in status icon
- [ ] `VolunteerHoursPage` (`/admin/volunteer-hours`) shows a table of hours
  entries (populated in ticket 005); stub with "No entries" placeholder is
  acceptable for this ticket
- [ ] All four routes added to `App.tsx` under `<ProtectedRoute role="admin">`
  replacing the existing `AdminStub` route
- [ ] Existing routing tests updated to reflect new admin routes; all client
  tests pass

## Implementation Notes

New files:
```
client/src/types/admin.ts
client/src/components/AdminLayout.tsx
client/src/pages/AdminDashboardPage.tsx
client/src/pages/InstructorListPage.tsx
client/src/pages/CompliancePage.tsx
client/src/pages/VolunteerHoursPage.tsx  (stub)
```

`App.tsx` admin route block (replace `AdminStub`):
```tsx
<Route path="/admin" nest>
  <ProtectedRoute role="admin">
    <AdminLayout>
      <Route path="/" component={AdminDashboardPage} />
      <Route path="/instructors" component={InstructorListPage} />
      <Route path="/compliance" component={CompliancePage} />
      <Route path="/volunteer-hours" component={VolunteerHoursPage} />
    </AdminLayout>
  </ProtectedRoute>
</Route>
```

Use TanStack React Query (`useQuery`) for all data fetching. Use shadcn/ui
`Badge`, `Button`, `Table` components consistent with existing instructor pages.

The ratio badge colours: `warning` → `bg-yellow-100 text-yellow-800`;
`alert` → `bg-red-100 text-red-800`.

## Testing

- **Existing**: `npm run test:client` — all 18 tests must still pass
- **New**: `tests/client/InstructorListPage.test.tsx`
  - Renders instructor rows with name, email, active badge
  - Ratio badge shows correct colour class for `warning` and `alert`
  - Activate/Deactivate button fires `PATCH /api/admin/instructors/:id`
- **New**: `tests/client/CompliancePage.test.tsx`
  - Renders compliance table rows from mocked API response
  - Month picker changes query parameter
- **New**: `tests/client/AdminDashboardPage.test.tsx`
  - Renders notification list from mocked API response
  - Mark as Read button fires `PATCH /api/admin/notifications/:id/read`
- **Verification**: `npm run test:client`
