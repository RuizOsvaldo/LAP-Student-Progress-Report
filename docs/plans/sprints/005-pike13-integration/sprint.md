---
id: "005"
title: Pike13 Integration
status: planning
branch: sprint/005-pike13-integration
use-cases:
- SUC-001
- SUC-002
- SUC-003
- SUC-004
- SUC-005
---

# Sprint 005 — Pike13 Integration

## Goals

Connect LEAGUE Report to the LEAGUE's Pike13 account. Instructors complete a
one-time OAuth flow to authorise access. An admin-triggered sync fetches
students enrolled in each instructor's classes, upserts student records,
assigns students to instructors, populates GitHub usernames, and auto-creates
teaching volunteer hours from Pike13 session data. TA/VA names are filtered
out throughout.

## Problem

Student and assignment data is entered manually today. The LEAGUE's authoritative
source is Pike13 — it already tracks class enrolments, instructor assignments,
and session attendance. Without a sync the app drifts out of sync with reality
and volunteer teaching hours that should flow automatically from class sessions
are being omitted.

## Solution

- Instructors connect their Pike13 account via OAuth2; tokens stored in the
  existing `pike13_tokens` table.
- An admin-triggered endpoint (`POST /api/admin/sync/pike13`) iterates over
  all active instructors that have a token, calls the Pike13 API, and upserts
  students, assignments, and volunteer hours.
- TA/VA filtering: any Pike13 staff member whose display name starts with
  `TA ` or `VA ` is skipped entirely.
- GitHub username: read from a Pike13 custom field (`github_username`) on the
  client record; stored in a new `githubUsername` column on `students`.
- Teaching volunteer hours: each completed Pike13 session where a TA/VA was
  marked present creates a `volunteer_hours` row with `source = 'pike13'`.
  Duplicate protection via a unique constraint on `(source, externalId)`.

## Success Criteria

- Instructor can initiate and complete the Pike13 OAuth flow from a settings
  page; token is stored and status shows "Connected"
- Admin can trigger a full sync from the admin panel; sync result (counts) is
  returned
- TA/VA names never appear as students or instructors
- GitHub usernames present in Pike13 appear on corresponding student rows
- Teaching hours from Pike13 sessions appear in `volunteer_hours` with
  `source = 'pike13'`; re-running the sync does not create duplicates
- All existing tests pass; new tests cover OAuth callback, sync service, and
  admin sync endpoint

## Scope

### In Scope

- `githubUsername` (nullable text) and `pike13SyncId` (nullable text, unique)
  columns added to `students`
- `externalId` (nullable text) column added to `volunteer_hours`; unique
  constraint on `(source, externalId)` where both are non-null
- `pike13_admin_token` table (single row; admin-level OAuth tokens)
- Admin Pike13 OAuth routes: `GET /api/admin/pike13/connect`,
  `/api/admin/pike13/callback`, `/api/admin/pike13/status`
- Pike13 sync service (`server/src/services/pike13Sync.ts`) — pure functions,
  injectable fetch, testable without network
- Admin sync endpoint: `POST /api/admin/sync/pike13`
- Pike13 section on `AdminDashboardPage` — connect status, "Connect Pike13"
  button, "Sync Pike13" button with result counts
- TA/VA filtering during sync
- GitHub username read from Pike13 custom field `github_acct_name`

### Out of Scope

- Automated/scheduled sync (admin-triggered only in this sprint)
- Pike13 write-back
- Webhook-based sync
- Displaying or using GitHub usernames (stored but not used until Sprint 006)

## Test Strategy

- **DB**: new columns present; unique constraint on `volunteer_hours(source,
  externalId)` enforced
- **Server**: OAuth callback stores token; sync service filters TA/VA; sync
  upserts students and hours; duplicate sync is idempotent
- **Client**: Admin dashboard Pike13 section shows connected/disconnected state
  from mocked API; sync button triggers endpoint and displays result counts

## Architecture Notes

- Pike13 OAuth uses Authorization Code flow (server-side, no PKCE required).
- The sync service is decoupled from the route: the route calls the service
  and returns the result.
- Pike13 API base URL: `https://<subdomain>.pike13.com/api/v2/`.
- Secrets: `PIKE13_CLIENT_ID`, `PIKE13_CLIENT_SECRET`, `PIKE13_SUBDOMAIN`.

## Definition of Ready

Before tickets can be created, all of the following must be true:

- [x] Sprint planning documents are complete (sprint.md, use cases, technical plan)
- [x] Architecture review passed
- [x] Stakeholder has approved the sprint plan

## Tickets

(To be created after sprint approval.)
