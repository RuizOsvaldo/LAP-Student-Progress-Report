import { Router } from 'express';
import { eq, and, count, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  instructors,
  users,
  instructorStudents,
  monthlyReviews,
  taCheckins,
  adminNotifications,
} from '../db/schema';
import { isAdmin } from '../middleware/auth';
import { lastMondayOfMonth } from '../utils/dateUtils';

export const adminRouter = Router();

adminRouter.use(isAdmin);

// ---------- Instructor routes ----------

function ratioBadge(studentCount: number): 'ok' | 'warning' | 'alert' {
  if (studentCount <= 4) return 'ok';
  if (studentCount <= 6) return 'warning';
  return 'alert';
}

// GET /api/admin/instructors
adminRouter.get('/admin/instructors', async (_req, res, next) => {
  try {
    const rows = await db
      .select({
        id: instructors.id,
        userId: instructors.userId,
        name: users.name,
        email: users.email,
        isActive: instructors.isActive,
      })
      .from(instructors)
      .innerJoin(users, eq(instructors.userId, users.id));

    const studentCounts = await db
      .select({
        instructorId: instructorStudents.instructorId,
        count: count(),
      })
      .from(instructorStudents)
      .groupBy(instructorStudents.instructorId);

    const countMap = new Map(studentCounts.map((r) => [r.instructorId, Number(r.count)]));

    const result = rows.map((r) => {
      const studentCount = countMap.get(r.id) ?? 0;
      return { ...r, studentCount, ratioBadge: ratioBadge(studentCount) };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/instructors/:id
adminRouter.patch('/admin/instructors/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { isActive } = req.body as { isActive?: boolean };

    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'isActive (boolean) is required' });
      return;
    }

    const [updated] = await db
      .update(instructors)
      .set({ isActive })
      .where(eq(instructors.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Instructor not found' });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ---------- Compliance route ----------

// GET /api/admin/compliance?month=YYYY-MM
adminRouter.get('/admin/compliance', async (req, res, next) => {
  try {
    const monthParam = req.query.month as string | undefined;
    const month =
      monthParam && /^\d{4}-\d{2}$/.test(monthParam)
        ? monthParam
        : new Date().toISOString().slice(0, 7);

    const recentMonday = lastMondayOfMonth(month);

    // Get all instructors with user info
    const allInstructors = await db
      .select({
        id: instructors.id,
        name: users.name,
      })
      .from(instructors)
      .innerJoin(users, eq(instructors.userId, users.id))
      .where(eq(instructors.isActive, true));

    // Review counts per instructor for this month
    const reviewCounts = await db
      .select({
        instructorId: monthlyReviews.instructorId,
        status: monthlyReviews.status,
        count: count(),
      })
      .from(monthlyReviews)
      .where(eq(monthlyReviews.month, month))
      .groupBy(monthlyReviews.instructorId, monthlyReviews.status);

    // Check-in submissions for the most recent Monday of the month
    const checkinRows = await db
      .select({ instructorId: taCheckins.instructorId })
      .from(taCheckins)
      .where(eq(taCheckins.weekOf, recentMonday));

    const checkinSet = new Set(checkinRows.map((r) => r.instructorId));

    const countMap = new Map<number, { pending: number; draft: number; sent: number }>();
    for (const row of reviewCounts) {
      if (!countMap.has(row.instructorId)) {
        countMap.set(row.instructorId, { pending: 0, draft: 0, sent: 0 });
      }
      countMap.get(row.instructorId)![row.status] = Number(row.count);
    }

    const result = allInstructors.map((i) => ({
      instructorId: i.id,
      name: i.name,
      pending: countMap.get(i.id)?.pending ?? 0,
      draft: countMap.get(i.id)?.draft ?? 0,
      sent: countMap.get(i.id)?.sent ?? 0,
      recentCheckinSubmitted: checkinSet.has(i.id),
    }));

    res.json({ month, rows: result });
  } catch (err) {
    next(err);
  }
});

// ---------- Notification routes ----------

// GET /api/admin/notifications?unread=true
adminRouter.get('/admin/notifications', async (req, res, next) => {
  try {
    const unreadOnly = req.query.unread === 'true';

    const conditions = unreadOnly ? [eq(adminNotifications.isRead, false)] : [];

    const rows = await db
      .select({
        id: adminNotifications.id,
        fromUserName: users.name,
        message: adminNotifications.message,
        isRead: adminNotifications.isRead,
        createdAt: adminNotifications.createdAt,
      })
      .from(adminNotifications)
      .innerJoin(users, eq(adminNotifications.fromUserId, users.id))
      .where(conditions.length ? and(...(conditions as [typeof conditions[0]])) : sql`true`)
      .orderBy(sql`${adminNotifications.createdAt} DESC`);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/notifications/:id/read
adminRouter.patch('/admin/notifications/:id/read', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const [updated] = await db
      .update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});
