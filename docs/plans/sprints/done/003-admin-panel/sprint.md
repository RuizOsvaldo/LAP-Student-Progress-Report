---
id: '003'
title: Admin Panel
status: done
branch: sprint/003-admin-panel
use-cases:
- SUC-001
- SUC-002
- SUC-003
- SUC-004
- SUC-005
---

# Sprint 003: Admin Panel

## Goals

Deliver the admin-facing half of LEAGUE Report. Admins can activate/deactivate
instructor accounts, monitor monthly review compliance, view TA check-in
completion, read in-app notifications from instructors, see student-to-instructor
staff ratio health, and record and report volunteer hours.

## Problem

Admins currently have no visibility into:
1. Which instructors have sent progress reviews for the current month
2. Whether weekly TA attendance check-ins have been submitted
3. How many students each instructor manages (ratio health vs. the 6:1 target)
4. In-app messages sent by instructors via the "Notify Admin" button
5. Volunteer hours contributed by instructors and TAs

## Solution

A new admin section protected by the existing `isAdmin` middleware. New API
routes live under `/api/admin/*`; new client pages under `/admin/*`. A new
`volunteer_hours` table is added for manual entry (Pike13-sourced teaching
hours are deferred to Sprint 005). The compliance dashboard queries
`monthly_reviews` grouped by instructor and month. Ratio warnings derive from
`instructor_students` row counts against a configurable threshold in
`admin_settings`.

## Success Criteria

- Admin can view a list of all instructors and toggle `isActive`
- Admin can view a per-month compliance table showing each instructor's
  pending/draft/sent review counts
- Admin can see which instructors have or have not submitted their weekly
  TA check-in
- Admin can read and dismiss in-app notifications from instructors
- Admin can create, edit, and delete manual volunteer hours entries and
  view a filtered/exported summary
- Staff ratio alerts (warning at 5–6 students, flag at 7+) appear in the
  admin UI based on `instructor_students` data

## Scope

### In Scope

- New `volunteer_hours` table and Drizzle migration
- Admin API routes: instructor list/activate, compliance, notifications,
  volunteer hours CRUD
- Admin frontend pages: AdminDashboardPage, InstructorListPage,
  CompliancePage, VolunteerHoursPage
- Staff ratio alert display (computed from `instructor_students`)
- TA check-in completion visibility per instructor per week
- Volunteer hours manual entry (admin-entered) with category, hours,
  description; reporting view filterable by volunteer, category, date range

### Out of Scope

- Email delivery for ratio alerts (in-app display only)
- Pike13-sourced teaching volunteer hours (Sprint 005)
- Guardian feedback page (Sprint 004)
- Changes to instructor-facing pages

## Test Strategy

- **Backend**: Jest + Supertest in `tests/server/admin.test.ts` covering
  auth guards, instructor activate/deactivate, compliance endpoint, and
  notifications; `tests/server/volunteer-hours.test.ts` for volunteer CRUD
- **Frontend**: Vitest + React Testing Library for `AdminDashboardPage`,
  `InstructorListPage`, `CompliancePage`, `VolunteerHoursPage`
- **DB**: `tests/db/schema.test.ts` extended for `volunteer_hours` table
- All existing tests (64 server, 18 client) must continue to pass

## Architecture Notes

- All admin routes use the existing `isAdmin` middleware — no new auth logic
- `volunteer_hours.source` distinguishes `'manual'` (this sprint) from
  `'pike13'` (Sprint 005) so the table design is forward-compatible
- Staff ratio is a read-only computation, not stored; re-computed on each
  admin dashboard load from `instructor_students` JOIN `instructors`
- `admin_settings` already holds the admin email whitelist; the staff ratio
  threshold will be stored as a new row with key `max_students_per_instructor`

## Definition of Ready

Before tickets can be created, all of the following must be true:

- [ ] Sprint planning documents are complete (sprint.md, use cases, technical plan)
- [ ] Architecture review passed
- [ ] Stakeholder has approved the sprint plan

## Tickets

(To be created after sprint approval.)
