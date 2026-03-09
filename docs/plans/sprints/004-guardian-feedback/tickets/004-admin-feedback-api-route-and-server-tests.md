---
id: "004"
title: admin feedback API route and server tests
status: todo
use-cases: [SUC-003]
depends-on: ["003"]
---

# admin feedback API route and server tests

## Description

Add `GET /api/admin/feedback` to `server/src/routes/admin.ts`. The route
joins `service_feedback` → `monthly_reviews` → `students` → `instructors`
→ `users` and returns an array of feedback DTOs, newest first.

## Acceptance Criteria

- [ ] `GET /api/admin/feedback` added to `adminRouter` in `server/src/routes/admin.ts`
- [ ] Returns 403 without admin auth
- [ ] Returns 200 with `AdminFeedbackDto[]` for an authenticated admin,
      ordered by `submittedAt` DESC
- [ ] Each DTO includes `id`, `reviewId`, `studentName`, `instructorName`,
      `month`, `rating`, `comment`, `submittedAt`
- [ ] Returns an empty array when no feedback exists (not 404)
- [ ] All existing tests pass

## Implementation Notes

```ts
// Append to server/src/routes/admin.ts

// GET /api/admin/feedback
adminRouter.get('/admin/feedback', async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: serviceFeedback.id,
        reviewId: serviceFeedback.reviewId,
        studentName: students.name,
        instructorName: users.name,
        month: monthlyReviews.month,
        rating: serviceFeedback.rating,
        comment: serviceFeedback.comment,
        submittedAt: serviceFeedback.submittedAt,
      })
      .from(serviceFeedback)
      .innerJoin(monthlyReviews, eq(serviceFeedback.reviewId, monthlyReviews.id))
      .innerJoin(students, eq(monthlyReviews.studentId, students.id))
      .innerJoin(instructors, eq(monthlyReviews.instructorId, instructors.id))
      .innerJoin(users, eq(instructors.userId, users.id))
      .orderBy(desc(serviceFeedback.submittedAt));

    res.json(rows.map((r) => ({
      ...r,
      submittedAt: r.submittedAt.toISOString(),
    })));
  } catch (err) {
    next(err);
  }
});
```

Add necessary imports: `serviceFeedback`, `students`, `desc` from drizzle.

## Testing

- **Existing**: `npm run test:server` — all must pass
- **New** (`tests/server/admin.test.ts`):
  - `GET /api/admin/feedback` without auth → 403
  - `GET /api/admin/feedback` as admin with no data → 200 `[]`
  - `GET /api/admin/feedback` as admin with data → 200 array with correct fields
- **Verification**: `npm run test:server`
