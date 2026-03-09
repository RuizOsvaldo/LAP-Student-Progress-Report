---
id: '001'
title: feedback_token schema migration
status: done
use-cases:
- SUC-004
depends-on: []
---

# feedback_token schema migration

## Description

Add `feedback_token uuid NOT NULL DEFAULT gen_random_uuid()` to `monthly_reviews`
with a unique constraint. This UUID is the unguessable token embedded in the
feedback link sent to guardians and used to look up the review on the feedback page.

## Acceptance Criteria

- [ ] `uuid` added to the `drizzle-orm/pg-core` import in `server/src/db/schema.ts`
- [ ] `feedbackToken: uuid('feedback_token').notNull().defaultRandom()` added
      to the `monthlyReviews` table definition
- [ ] `unique().on(t.feedbackToken)` added to the `monthlyReviews` constraints array
- [ ] `npm run db:generate` produces a migration adding `feedback_token uuid NOT NULL
      DEFAULT gen_random_uuid()` to `monthly_reviews`
- [ ] Migration applies without errors; existing rows receive a unique UUID
- [ ] All existing db and server tests pass

## Implementation Notes

```ts
// server/src/db/schema.ts
import { ..., uuid } from 'drizzle-orm/pg-core';   // add uuid

export const monthlyReviews = pgTable(
  'monthly_reviews',
  {
    // ... existing columns unchanged ...
    feedbackToken: uuid('feedback_token').notNull().defaultRandom(),
  },
  (t) => [
    unique().on(t.instructorId, t.studentId, t.month), // existing
    unique().on(t.feedbackToken),                       // new
  ],
);
```

## Testing

- **Existing**: `npm run test:db && npm run test:server` — all must pass
- **New** (`tests/db/schema.test.ts`):
  - All `monthly_reviews` rows have a non-null `feedback_token` after migration
  - Inserting two rows with the same `feedback_token` raises a unique violation
- **Verification**: `npm run test:db`
