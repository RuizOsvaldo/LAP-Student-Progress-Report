---
id: '005'
title: volunteer hours page and client tests
status: done
use-cases:
- SUC-004
depends-on:
- '003'
- '004'
---

# volunteer hours page and client tests

## Description

Complete the `VolunteerHoursPage` started in ticket 004 with full CRUD UI
(add, edit, delete entries, filter by volunteer/category/date range, CSV
export) and write the client-side tests.

## Acceptance Criteria

- [ ] `VolunteerHourDto` added to `client/src/types/admin.ts`
- [ ] `VolunteerHoursPage` displays a filterable table of entries with columns:
  volunteer name, category, hours, description, date, source
- [ ] **Add Entry** button opens an inline form / dialog with fields:
  volunteer name (text), category (select), hours (number, step=0.5),
  description (text, optional), date (date picker, defaults to today)
- [ ] Form submits `POST /api/admin/volunteer-hours`; table refreshes on success
- [ ] Each row has **Edit** (opens pre-filled form, submits `PUT`) and
  **Delete** buttons; `source = 'pike13'` rows have Delete disabled
- [ ] Filters (volunteer name text input, category select, from/to date
  inputs) narrow the displayed rows on change
- [ ] **Export CSV** button downloads the currently-filtered data as a CSV
  file with columns matching the table
- [ ] `tests/client/VolunteerHoursPage.test.tsx` covers: renders entry list,
  Add Entry form fires POST, Delete fires DELETE, pike13 row has Delete
  disabled, CSV export triggers download

## Implementation Notes

Use the existing `MonthPicker`-style approach (controlled query params via
Wouter's `useSearch`) for the date range filters — or simpler local state
if month-level granularity is not required here.

CSV export utility (inline, no library):
```ts
function exportToCsv(rows: VolunteerHourDto[], filename: string) {
  const header = ['Volunteer', 'Category', 'Hours', 'Description', 'Date', 'Source'];
  const lines = rows.map(r =>
    [r.volunteerName, r.category, r.hours, r.description ?? '', r.recordedAt.slice(0, 10), r.source].join(',')
  );
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

## Testing

- **Existing**: `npm run test:client` — all previous tests must still pass
- **New**: `tests/client/VolunteerHoursPage.test.tsx`
  - Renders list of entries from mocked `GET /api/admin/volunteer-hours`
  - Add form submits `POST` with correct body
  - Delete button fires `DELETE /api/admin/volunteer-hours/:id`
  - `source = 'pike13'` row has Delete button disabled
  - CSV export: assert `URL.createObjectURL` called with a Blob
- **Verification**: `npm run test:client`
