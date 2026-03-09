---
id: '001'
title: volunteer-hours schema and migration
status: done
use-cases:
- SUC-004
depends-on: []
---

# volunteer-hours schema and migration

## Description

Add the `volunteer_hours` table to `server/src/db/schema.ts` and generate +
apply the Drizzle migration. This is the only schema change in Sprint 003 and
must land first so all subsequent tickets can reference the new table.

## Acceptance Criteria

- [ ] `volunteerHours` table defined in `schema.ts` with columns:
  `id` (serial PK), `volunteerName` (text not null), `category` (text not
  null), `hours` (real not null), `description` (text nullable),
  `recordedAt` (timestamp defaultNow not null), `source` (text default
  `'manual'` not null)
- [ ] `VolunteerHour` and `NewVolunteerHour` types exported from `schema.ts`
- [ ] Drizzle migration file generated in `server/drizzle/`
- [ ] Migration applies cleanly: `npm run db:migrate` exits 0
- [ ] `tests/db/schema.test.ts` extended to insert + read back a
  `volunteer_hours` row asserting `hours` accepts `1.5` (float preserved)
  and `source` defaults to `'manual'`

## Implementation Notes

Import `real` from `drizzle-orm/pg-core` (not currently imported).

Schema block to add at the end of the tables section:
```ts
export const volunteerHours = pgTable('volunteer_hours', {
  id: serial('id').primaryKey(),
  volunteerName: text('volunteer_name').notNull(),
  category: text('category').notNull(),
  hours: real('hours').notNull(),
  description: text('description'),
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
  source: text('source').notNull().default('manual'),
});

export type VolunteerHour = typeof volunteerHours.$inferSelect;
export type NewVolunteerHour = typeof volunteerHours.$inferInsert;
```

After editing `schema.ts`:
```bash
cd server && npm run db:generate && npm run db:migrate
```

## Testing

- **Existing**: `npm run test:db` — all existing schema tests must still pass
- **New**: extend `tests/db/schema.test.ts` with a `volunteer_hours` suite:
  insert a row with `hours: 1.5`, read back, assert float is preserved and
  `source === 'manual'`
- **Verification**: `npm run test:db`
