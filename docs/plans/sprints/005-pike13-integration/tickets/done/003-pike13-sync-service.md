---
id: "003"
title: Pike13 sync service
status: done
use-cases:
- SUC-002
- SUC-003
- SUC-004
- SUC-005
depends-on:
- "001"
---

# Pike13 sync service

## Description

Create `server/src/services/pike13Sync.ts` — the core sync logic as pure
functions with injectable HTTP fetch for testability (no network required in
tests).

**Interface:**
```ts
export interface SyncResult {
  studentsUpserted: number
  assignmentsCreated: number
  hoursCreated: number
}

export async function runSync(
  db: DrizzleDb,
  accessToken: string,
  fetchFn?: typeof fetch,
): Promise<SyncResult>
```

**Pike13 API calls** (using admin access token):
- `GET /api/v2/desk/people` — fetch all clients (students)
- `GET /api/v2/desk/event_occurrences` — fetch sessions per instructor class
- `GET /api/v2/desk/visits` — fetch attendance per session

**Key logic:**

1. **TA/VA filter**: skip any person whose display name starts with `TA ` or `VA `

2. **Student upsert** by `pike13SyncId`:
   ```ts
   .onConflictDoUpdate({
     target: students.pike13SyncId,
     set: { name, guardianEmail, githubUsername }
   })
   ```

3. **GitHub username**: read from Pike13 custom field key `github_acct_name`
   on the client record. Store as a named constant at top of file so it can be
   updated once confirmed against the live API.

4. **Instructor-student assignments**: insert into `instructor_students` for
   each (instructor, student) pair found in Pike13; skip if already exists.

5. **Volunteer hours** from sessions where a TA/VA was present:
   - `source = 'pike13'`
   - `externalId = '<sessionId>-<taPersonId>'`
   - `category = 'Teaching'`
   - `hours = session duration in hours`
   - Use `.onConflictDoNothing()` for idempotency

## Acceptance Criteria

- [ ] Students with name starting `TA ` or `VA ` are never upserted
- [ ] Students are upserted by `pike13SyncId`; name, guardianEmail, githubUsername updated
- [ ] `githubUsername` populated from `github_acct_name` custom field; `null` if absent
- [ ] Instructor-student assignments created for new (instructor, student) pairs
- [ ] Volunteer hours created for each (session, TA/VA) pair with correct fields
- [ ] Running sync twice produces no duplicate students, assignments, or hours
- [ ] `SyncResult` counts accurately reflect rows created/upserted

## Testing

- **Existing tests to run**: `npm run test:server`
- **New tests to write**: `tests/server/pike13Sync.test.ts` (unit tests with mocked fetch)
  - TA/VA named person is excluded from student upserts
  - Student with `github_acct_name` custom field has `githubUsername` populated
  - Student without field has `githubUsername = null`
  - Running sync twice → idempotent (same row count)
  - Volunteer hour created with correct `source`, `externalId`, `hours`
  - Duplicate sync does not create second volunteer hour row
- **Verification command**: `npm run test:server`
