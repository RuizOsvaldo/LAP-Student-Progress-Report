---
status: approved
---

# Sprint 005 Use Cases

## SUC-001: Admin Connects App to Pike13 (One-Time Setup)

- **Actor**: Admin (isAdmin = true)
- **Preconditions**: No `pike13_admin_token` row exists yet
- **Main Flow**:
  1. Admin navigates to the admin dashboard
  2. Admin sees "Pike13: Not Connected" status and a "Connect Pike13" button
  3. Admin clicks the button
  4. Browser redirects to `GET /api/admin/pike13/connect` which redirects to
     the Pike13 authorization URL
  5. Admin logs in to Pike13 and grants access
  6. Pike13 redirects to `GET /api/admin/pike13/callback?code=...`
  7. Server exchanges the code for `access_token` + `refresh_token` and stores
     them in `pike13_admin_token`
  8. Server redirects to the admin dashboard
  9. Admin dashboard now shows "Pike13: Connected"
- **Postconditions**: `pike13_admin_token` row exists with valid tokens
- **Acceptance Criteria**:
  - [ ] `GET /api/admin/pike13/connect` redirects to Pike13 authorization URL
        with correct `client_id`, `redirect_uri`, and `response_type=code`
  - [ ] `GET /api/admin/pike13/callback` exchanges the code and stores tokens
  - [ ] Admin dashboard shows "Not Connected" when no token exists
  - [ ] Admin dashboard shows "Connected" when a token exists

## SUC-002: Admin Triggers Pike13 Sync

- **Actor**: Admin (isAdmin = true)
- **Preconditions**: `pike13_admin_token` row exists with a valid token
- **Main Flow**:
  1. Admin navigates to the admin dashboard
  2. Admin clicks "Sync Pike13"
  3. Frontend calls `POST /api/admin/sync/pike13`
  4. Server fetches all instructors and their classes from Pike13 using the
     admin token
  5. Students are upserted; instructor-student assignments created
  6. Teaching volunteer hours created from session data
  7. Response returns `{ studentsUpserted, assignmentsCreated, hoursCreated }`
- **Postconditions**: `students`, `instructor_students`, and `volunteer_hours`
  tables reflect Pike13 data
- **Acceptance Criteria**:
  - [ ] `POST /api/admin/sync/pike13` returns 200 with counts
  - [ ] Students from Pike13 are upserted by `pike13SyncId`
  - [ ] Instructor-student assignments are created for new pairs
  - [ ] Re-running the sync does not create duplicate rows
  - [ ] Admin dashboard shows a "Sync Pike13" button (only when connected)

## SUC-003: TA/VA Names Are Filtered

- **Actor**: System (sync service)
- **Preconditions**: Pike13 returns class data containing TA/VA staff members
- **Main Flow**:
  1. During sync, each staff member name is checked
  2. Any name starting with `TA ` or `VA ` is skipped
  3. Only lead instructor names are processed as students or instructors
- **Postconditions**: No student or instructor row exists for a TA/VA name
- **Acceptance Criteria**:
  - [ ] Staff member with name `TA John Smith` is not upserted as a student
  - [ ] Staff member with name `VA Jane Doe` is not created as an instructor
  - [ ] Staff members without the `TA ` or `VA ` prefix are processed normally

## SUC-004: GitHub Username Synced from Pike13

- **Actor**: System (sync service)
- **Preconditions**: A student's Pike13 client record has a `github_acct_name`
  custom field value
- **Main Flow**:
  1. During sync, the student's Pike13 client record is fetched
  2. The `github_acct_name` custom field value is read
  3. The student's `githubUsername` column in the local DB is updated
- **Postconditions**: `students.githubUsername` reflects the Pike13 value
- **Acceptance Criteria**:
  - [ ] Student with a `github_acct_name` custom field in Pike13 has
        `githubUsername` populated after sync
  - [ ] Student without the custom field has `githubUsername = null`

## SUC-005: Teaching Volunteer Hours Auto-Created from Pike13 Sessions

- **Actor**: System (sync service)
- **Preconditions**: Pike13 has completed session records with TA/VA attendance
- **Main Flow**:
  1. During sync, completed sessions for each instructor's classes are fetched
  2. For each session, any TA/VA marked as present is identified
  3. A `volunteer_hours` row is created with `source = 'pike13'`,
     `externalId = '<pike13SessionId>-<taName>'`, `category = 'Teaching'`,
     `hours = <session duration in hours>`
  4. If the row already exists (same `externalId`), it is skipped
- **Postconditions**: `volunteer_hours` has one row per (session, TA/VA) pair
- **Acceptance Criteria**:
  - [ ] `volunteer_hours` row created with `source = 'pike13'` for each
        attended session
  - [ ] Duplicate sync does not create a second row for the same session
  - [ ] Session with no TA/VA attendance creates no `volunteer_hours` row
