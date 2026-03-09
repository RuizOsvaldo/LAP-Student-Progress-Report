---
status: draft
---

# Sprint 003 Use Cases

## SUC-001: Manage Instructor Accounts

- **Actor**: Admin
- **Preconditions**: Admin is logged in
- **Main Flow**:
  1. Admin navigates to the Instructor List page (`/admin/instructors`)
  2. System displays all instructor accounts with name, email, active status,
     and assigned student count
  3. Admin clicks **Activate** or **Deactivate** next to an instructor
  4. System updates `instructors.isActive` and reflects the change immediately
- **Postconditions**: `instructors.isActive` is updated; instructor can or
  cannot log in depending on the new status
- **Acceptance Criteria**:
  - [ ] All instructors are listed with name, email, active status, student count
  - [ ] Activate/Deactivate toggle updates the database and the UI without reload
  - [ ] Page is inaccessible to non-admin users (→ 403)
  - [ ] Staff ratio badge shows warning (5–6 students) or flag (7+ students)

---

## SUC-002: View Monthly Compliance Dashboard

- **Actor**: Admin
- **Preconditions**: Admin is logged in; at least one instructor has reviews
- **Main Flow**:
  1. Admin navigates to the Compliance page (`/admin/compliance`)
  2. Admin selects a month using the month picker
  3. System displays a table: one row per instructor, columns for
     `pending`, `draft`, and `sent` review counts for that month
  4. Admin identifies instructors who have not yet sent any reviews
- **Postconditions**: Admin has a clear view of review completion for the month
- **Acceptance Criteria**:
  - [ ] Table lists every active instructor with pending/draft/sent counts
  - [ ] Month picker defaults to the current calendar month
  - [ ] Instructors with zero sent reviews are visually highlighted
  - [ ] TA check-in status (submitted / not submitted) is shown per instructor
    for the most recent week

---

## SUC-003: Read and Dismiss Admin Notifications

- **Actor**: Admin
- **Preconditions**: Admin is logged in; at least one `admin_notifications` record exists
- **Main Flow**:
  1. Admin sees an unread-notification badge on the admin dashboard
  2. Admin navigates to the notification inbox (on the admin dashboard page)
  3. System lists unread notifications with sender name, message, and timestamp
  4. Admin clicks **Mark as Read** on a notification
  5. System sets `admin_notifications.isRead = true`; badge count decrements
- **Postconditions**: Notification is marked read; badge reflects the new count
- **Acceptance Criteria**:
  - [ ] Notification count badge appears when unread notifications exist
  - [ ] All notifications are listed, newest first
  - [ ] Mark as Read updates the database and removes the item from the unread view
  - [ ] Notifications from the "Notify Admin" instructor flow appear here

---

## SUC-004: Record and Report Volunteer Hours

- **Actor**: Admin
- **Preconditions**: Admin is logged in
- **Main Flow**:
  1. Admin navigates to the Volunteer Hours page (`/admin/volunteer-hours`)
  2. Admin clicks **Add Entry**, fills in volunteer (instructor/TA name),
     category (`Teaching`, `Fundraising`, `Events`, `Admin Support`, `Other`),
     hours, optional description, and date
  3. System saves the entry to `volunteer_hours` with `source = 'manual'`
  4. Admin uses filters (by volunteer, category, date range) to narrow the
     list and views totals per volunteer and per category
  5. Admin exports the filtered summary as CSV
- **Postconditions**: New `volunteer_hours` row exists; report reflects it
- **Acceptance Criteria**:
  - [ ] Entry form accepts volunteer, category, hours, description, date
  - [ ] Entry appears in the list immediately after creation
  - [ ] Filters narrow the list correctly; totals update
  - [ ] Edit and delete work for existing manual entries
  - [ ] CSV export includes all rows matching the current filter

---

## SUC-005: View Staff Ratio Alerts

- **Actor**: Admin
- **Preconditions**: Admin is logged in; instructor_students rows exist
- **Main Flow**:
  1. Admin views the Instructor List or Admin Dashboard
  2. System computes the active student count per instructor from
     `instructor_students`
  3. Instructors with 5–6 students display a **warning** badge
  4. Instructors with 7+ students display an **alert** badge with a message
     recommending an additional TA/VA be assigned
- **Postconditions**: Admin is visually alerted to instructors near or over
  the 6:1 ratio limit
- **Acceptance Criteria**:
  - [ ] No badge shown for instructors with ≤ 4 students
  - [ ] Warning badge shown for 5–6 students
  - [ ] Alert badge shown for 7+ students
  - [ ] Threshold defaults to 6 (hardcoded in Sprint 003; runtime
    configurability via `admin_settings` deferred to a future sprint)
