---
id: "003"
title: public feedback API routes and server tests
status: todo
use-cases: [SUC-002]
depends-on: ["001"]
---

# public feedback API routes and server tests

## Description

Create `server/src/routes/feedback.ts` with two public (no auth) endpoints:
`GET /api/feedback/:token` to fetch review context and `POST /api/feedback/:token`
to submit a rating and optional comment. Register the router in `index.ts`.
On successful POST, create an `adminNotification`.

## Acceptance Criteria

- [ ] `server/src/routes/feedback.ts` created with `feedbackRouter`
- [ ] `GET /api/feedback/:token` returns 200 `{ studentName, month, alreadySubmitted: false }`
      for a valid token with no existing feedback
- [ ] `GET /api/feedback/:token` returns 200 `{ studentName, month, alreadySubmitted: true }`
      when a `service_feedback` row already exists for the review
- [ ] `GET /api/feedback/:token` returns 404 for an unknown token
- [ ] `POST /api/feedback/:token` with `{ rating: 4 }` creates a
      `service_feedback` row and returns 201
- [ ] `POST /api/feedback/:token` with `{ rating: 4, comment: "Great!" }`
      stores both fields and returns 201
- [ ] `POST /api/feedback/:token` returns 409 if feedback already exists
- [ ] `POST /api/feedback/:token` returns 400 if `rating` is missing,
      not an integer, or outside 1–5
- [ ] On successful POST, an `adminNotification` row is created with message
      `"New feedback from guardian of <studentName>"`
- [ ] `feedbackRouter` registered in `server/src/index.ts` (alongside public
      routers, no auth middleware applied)
- [ ] All existing tests pass

## Implementation Notes

No auth middleware on this router. The `adminNotifications.fromUserId` is
currently NOT NULL; make it nullable in the schema and migration as part of
this ticket (system-generated notifications have no originating user):

```ts
// schema change: make fromUserId nullable
fromUserId: integer('from_user_id').references(() => users.id),  // remove .notNull()
```

Add this to the migration generated in ticket 001 (or generate a new one).

Route skeleton:
```ts
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { monthlyReviews, serviceFeedback, adminNotifications, students } from '../db/schema';

export const feedbackRouter = Router();

// GET /api/feedback/:token
feedbackRouter.get('/feedback/:token', async (req, res, next) => { ... });

// POST /api/feedback/:token
feedbackRouter.post('/feedback/:token', async (req, res, next) => { ... });
```

Registration in `server/src/index.ts` (after `counterRouter`):
```ts
import { feedbackRouter } from './routes/feedback';
app.use('/api', feedbackRouter);
```

## Testing

- **Existing**: `npm run test:server` — all must pass
- **New** (`tests/server/feedback.test.ts`):
  - GET valid token → 200 `alreadySubmitted: false`
  - GET valid token with existing feedback → 200 `alreadySubmitted: true`
  - GET unknown token → 404
  - POST valid token, `{ rating: 3 }` → 201; row in `service_feedback`
  - POST valid token, `{ rating: 3, comment: "Good" }` → 201
  - POST duplicate → 409
  - POST rating = 0 → 400
  - POST rating = 6 → 400
  - POST no rating → 400
  - POST creates `adminNotification` with student name
- **Verification**: `npm run test:server`
