import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { monthlyReviews, serviceFeedback, adminNotifications, students } from '../db/schema';

export const feedbackRouter = Router();

// GET /api/feedback/:token
// Public — no auth required
feedbackRouter.get('/feedback/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    const [row] = await db
      .select({
        reviewId: monthlyReviews.id,
        studentName: students.name,
        month: monthlyReviews.month,
      })
      .from(monthlyReviews)
      .innerJoin(students, eq(monthlyReviews.studentId, students.id))
      .where(eq(monthlyReviews.feedbackToken, token));

    if (!row) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    const [existing] = await db
      .select({ id: serviceFeedback.id })
      .from(serviceFeedback)
      .where(eq(serviceFeedback.reviewId, row.reviewId));

    res.json({
      studentName: row.studentName,
      month: row.month,
      alreadySubmitted: !!existing,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/feedback/:token
// Public — no auth required
feedbackRouter.post('/feedback/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    const [row] = await db
      .select({
        reviewId: monthlyReviews.id,
        studentName: students.name,
        month: monthlyReviews.month,
      })
      .from(monthlyReviews)
      .innerJoin(students, eq(monthlyReviews.studentId, students.id))
      .where(eq(monthlyReviews.feedbackToken, token));

    if (!row) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    const { rating, comment } = req.body as { rating?: unknown; comment?: unknown };

    if (
      rating === undefined ||
      rating === null ||
      !Number.isInteger(rating) ||
      (rating as number) < 1 ||
      (rating as number) > 5
    ) {
      res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
      return;
    }

    const [existing] = await db
      .select({ id: serviceFeedback.id })
      .from(serviceFeedback)
      .where(eq(serviceFeedback.reviewId, row.reviewId));

    if (existing) {
      res.status(409).json({ error: 'Feedback already submitted' });
      return;
    }

    const [fb] = await db
      .insert(serviceFeedback)
      .values({
        reviewId: row.reviewId,
        rating: rating as number,
        comment: typeof comment === 'string' ? comment : null,
      })
      .returning();

    await db.insert(adminNotifications).values({
      message: `New feedback from guardian of ${row.studentName}`,
    });

    res.status(201).json({
      id: fb.id,
      reviewId: fb.reviewId,
      rating: fb.rating,
      comment: fb.comment,
      submittedAt: fb.submittedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
