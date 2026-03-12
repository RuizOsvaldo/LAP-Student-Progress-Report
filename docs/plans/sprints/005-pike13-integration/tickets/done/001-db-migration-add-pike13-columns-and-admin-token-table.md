---
id: "001"
title: "DB migration: add Pike13 columns and admin token table"
status: done
use-cases:
- SUC-004
- SUC-005
depends-on: []
---

# DB migration: add Pike13 columns and admin token table

## Description

Add columns and a new table to `server/src/db/schema.ts` to support Pike13
integration, then generate and apply the migration.

**`students` table** — add:
- `githubUsername: text('github_username')` (nullable)
- `pike13SyncId: text('pike13_sync_id')` (nullable) with `unique()` constraint

**`volunteerHours` table** — add:
- `externalId: text('external_id')` (nullable)
- `unique().on(t.source, t.externalId)` constraint — Postgres excludes NULLs
  automatically, so manual rows with `externalId = null` never conflict

**New `pike13AdminToken` table** (single row):
- `id` — PK, generated always as identity
- `accessToken: text` — not null
- `refreshToken: text` — nullable
- `expiresAt: timestamp with timezone` — nullable
- `updatedAt: timestamp with timezone` — default now

After schema changes: `npx drizzle-kit generate` then `npx drizzle-kit migrate`.

## Acceptance Criteria

- [ ] `students` table has `github_username` and `pike13_sync_id` columns
- [ ] `pike13_sync_id` unique constraint is enforced (inserting a duplicate value raises an error)
- [ ] Two `students` rows with `pike13_sync_id = null` do NOT conflict
- [ ] `volunteer_hours` table has `external_id` column
- [ ] `(source, external_id)` unique constraint is enforced for non-null pairs
- [ ] Two `volunteer_hours` rows with `external_id = null` do NOT conflict
- [ ] `pike13_admin_token` table exists with correct columns
- [ ] Migration runs cleanly on a fresh test database

## Testing

- **Existing tests to run**: `npm run test:db`
- **New tests to write**: `tests/db/pike13Schema.test.ts`
  - Insert two students with the same non-null `pike13SyncId` → expect unique violation
  - Insert two students both with `pike13SyncId = null` → expect success
  - Insert two `volunteer_hours` rows with same `(source, externalId)` → expect conflict
  - Insert two `volunteer_hours` rows with `externalId = null` → expect success
- **Verification command**: `npm run test:db`
