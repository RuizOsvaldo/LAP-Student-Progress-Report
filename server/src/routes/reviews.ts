import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { monthlyReviews, students } from '../db/schema';
import { isActiveInstructor } from '../middleware/auth';
import { sendReviewEmail } from '../services/email';

export const reviewsRouter = Router();

reviewsRouter.use(isActiveInstructor);

function formatReview(
  review: typeof monthlyReviews.$inferSelect,
  studentName: string,
) {
  return {
    id: review.id,
    studentId: review.studentId,
    studentName,
    month: review.month,
    status: review.status,
    subject: review.subject,
    body: review.body,
    sentAt: review.sentAt ? review.sentAt.toISOString() : null,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

// GET /api/reviews?month=YYYY-MM
reviewsRouter.get('/reviews', async (req, res, next) => {
  try {
    const instructorId = req.session.user!.instructorId!;
    const monthParam = req.query.month as string | undefined;
    const month =
      monthParam && /^\d{4}-\d{2}$/.test(monthParam)
        ? monthParam
        : new Date().toISOString().slice(0, 7);

    const rows = await db
      .select({
        review: monthlyReviews,
        studentName: students.name,
      })
      .from(monthlyReviews)
      .innerJoin(students, eq(monthlyReviews.studentId, students.id))
      .where(
        and(eq(monthlyReviews.instructorId, instructorId), eq(monthlyReviews.month, month)),
      );

    res.json(rows.map((r) => formatReview(r.review, r.studentName)));
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews
reviewsRouter.post('/reviews', async (req, res, next) => {
  try {
    const instructorId = req.session.user!.instructorId!;
    const { studentId, month } = req.body as { studentId?: number; month?: string };

    if (!studentId || !month) {
      res.status(400).json({ error: 'studentId and month are required' });
      return;
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId));

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const [review] = await db
      .insert(monthlyReviews)
      .values({ instructorId, studentId, month })
      .onConflictDoNothing()
      .returning();

    if (!review) {
      // Row already exists — return it
      const [existing] = await db
        .select()
        .from(monthlyReviews)
        .where(
          and(
            eq(monthlyReviews.instructorId, instructorId),
            eq(monthlyReviews.studentId, studentId),
            eq(monthlyReviews.month, month),
          ),
        );
      res.status(200).json(formatReview(existing, student.name));
      return;
    }

    res.status(201).json(formatReview(review, student.name));
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/:id
reviewsRouter.get('/reviews/:id', async (req, res, next) => {
  try {
    const instructorId = req.session.user!.instructorId!;
    const id = parseInt(req.params.id, 10);

    const [row] = await db
      .select({ review: monthlyReviews, studentName: students.name })
      .from(monthlyReviews)
      .innerJoin(students, eq(monthlyReviews.studentId, students.id))
      .where(and(eq(monthlyReviews.id, id), eq(monthlyReviews.instructorId, instructorId)));

    if (!row) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    res.json(formatReview(row.review, row.studentName));
  } catch (err) {
    next(err);
  }
});

// PUT /api/reviews/:id
reviewsRouter.put('/reviews/:id', async (req, res, next) => {
  try {
    const instructorId = req.session.user!.instructorId!;
    const id = parseInt(req.params.id, 10);

    const [existing] = await db
      .select({ review: monthlyReviews, studentName: students.name })
      .from(monthlyReviews)
      .innerJoin(students, eq(monthlyReviews.studentId, students.id))
      .where(and(eq(monthlyReviews.id, id), eq(monthlyReviews.instructorId, instructorId)));

    if (!existing) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    if (existing.review.status === 'sent') {
      res.status(409).json({ error: 'Cannot edit a sent review' });
      return;
    }

    const { subject, body } = req.body as { subject?: string; body?: string };

    const [updated] = await db
      .update(monthlyReviews)
      .set({ subject, body, status: 'draft', updatedAt: new Date() })
      .where(eq(monthlyReviews.id, id))
      .returning();

    res.json(formatReview(updated, existing.studentName));
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews/:id/send
reviewsRouter.post('/reviews/:id/send', async (req, res, next) => {
  try {
    const instructorId = req.session.user!.instructorId!;
    const id = parseInt(req.params.id, 10);

    const [existing] = await db
      .select({
        review: monthlyReviews,
        studentName: students.name,
        guardianEmail: students.guardianEmail,
      })
      .from(monthlyReviews)
      .innerJoin(students, eq(monthlyReviews.studentId, students.id))
      .where(and(eq(monthlyReviews.id, id), eq(monthlyReviews.instructorId, instructorId)));

    if (!existing) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    // Idempotent: if already sent, return current state
    if (existing.review.status === 'sent') {
      res.json(formatReview(existing.review, existing.studentName));
      return;
    }

    const now = new Date();
    const [updated] = await db
      .update(monthlyReviews)
      .set({ status: 'sent', sentAt: now, updatedAt: now })
      .where(eq(monthlyReviews.id, id))
      .returning();

    if (existing.guardianEmail) {
      sendReviewEmail({
        toEmail: existing.guardianEmail,
        studentName: existing.studentName,
        month: updated.month,
        reviewBody: updated.body ?? '',
        feedbackToken: updated.feedbackToken,
      }).catch((err) => {
        (req.log ?? console).error({ err }, 'SendGrid email failed');
      });
    }

    res.json(formatReview(updated, existing.studentName));
  } catch (err) {
    next(err);
  }
});
