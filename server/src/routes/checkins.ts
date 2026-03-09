import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { taCheckins, adminNotifications } from '../db/schema';
import { isActiveInstructor } from '../middleware/auth';
import { currentWeekMonday } from '../utils/dateUtils';

export const checkinsRouter = Router();

checkinsRouter.use(isActiveInstructor);

// GET /api/checkins/pending
checkinsRouter.get('/checkins/pending', async (req, res, next) => {
  try {
    const instructorId = req.session.user!.instructorId!;
    const weekOf = currentWeekMonday();

    // Check if already submitted for this week
    const existing = await db
      .select()
      .from(taCheckins)
      .where(and(eq(taCheckins.instructorId, instructorId), eq(taCheckins.weekOf, weekOf)));

    // TAs would come from instructor_students in Sprint 005; empty for now
    res.json({
      weekOf,
      alreadySubmitted: existing.length > 0,
      entries: [],
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/checkins
checkinsRouter.post('/checkins', async (req, res, next) => {
  try {
    const instructorId = req.session.user!.instructorId!;
    const { weekOf, entries } = req.body as {
      weekOf?: string;
      entries?: Array<{ taName: string; wasPresent: boolean }>;
    };

    if (!weekOf || !Array.isArray(entries)) {
      res.status(400).json({ error: 'weekOf and entries are required' });
      return;
    }

    for (const entry of entries) {
      await db
        .insert(taCheckins)
        .values({ instructorId, taName: entry.taName, weekOf, wasPresent: entry.wasPresent })
        .onConflictDoUpdate({
          target: [taCheckins.instructorId, taCheckins.taName, taCheckins.weekOf],
          set: { wasPresent: entry.wasPresent, submittedAt: new Date() },
        });
    }

    res.json({ ok: true, weekOf, count: entries.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/checkins/notify-admin
checkinsRouter.post('/checkins/notify-admin', async (req, res, next) => {
  try {
    const userId = req.session.user!.id;
    const { message } = req.body as { message?: string };

    if (!message) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    await db.insert(adminNotifications).values({ fromUserId: userId, message });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
