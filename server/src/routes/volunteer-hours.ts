import { Router } from 'express';
import { eq, and, ilike, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { volunteerHours } from '../db/schema';
import { isAdmin } from '../middleware/auth';

export const volunteerHoursRouter = Router();

volunteerHoursRouter.use(isAdmin);

// GET /api/admin/volunteer-hours
volunteerHoursRouter.get('/admin/volunteer-hours', async (req, res, next) => {
  try {
    const { volunteerName, category, from, to } = req.query as Record<string, string | undefined>;

    const conditions = [];
    if (volunteerName) conditions.push(ilike(volunteerHours.volunteerName, `%${volunteerName}%`));
    if (category) conditions.push(eq(volunteerHours.category, category));
    if (from) conditions.push(gte(volunteerHours.recordedAt, new Date(from)));
    if (to) conditions.push(lte(volunteerHours.recordedAt, new Date(to)));

    const rows = await db
      .select()
      .from(volunteerHours)
      .where(conditions.length ? and(...(conditions as [typeof conditions[0]])) : undefined)
      .orderBy(volunteerHours.recordedAt);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/volunteer-hours
volunteerHoursRouter.post('/admin/volunteer-hours', async (req, res, next) => {
  try {
    const { volunteerName, category, hours, description, recordedAt } = req.body as {
      volunteerName?: string;
      category?: string;
      hours?: number;
      description?: string;
      recordedAt?: string;
    };

    if (!volunteerName || !category || hours === undefined || hours === null) {
      res.status(400).json({ error: 'volunteerName, category, and hours are required' });
      return;
    }

    const [row] = await db
      .insert(volunteerHours)
      .values({
        volunteerName,
        category,
        hours,
        description: description ?? null,
        recordedAt: recordedAt ? new Date(recordedAt) : undefined,
        source: 'manual',
      })
      .returning();

    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/volunteer-hours/:id
volunteerHoursRouter.put('/admin/volunteer-hours/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { volunteerName, category, hours, description, recordedAt } = req.body as {
      volunteerName?: string;
      category?: string;
      hours?: number;
      description?: string;
      recordedAt?: string;
    };

    const updates: Partial<typeof volunteerHours.$inferInsert> = {};
    if (volunteerName !== undefined) updates.volunteerName = volunteerName;
    if (category !== undefined) updates.category = category;
    if (hours !== undefined) updates.hours = hours;
    if (description !== undefined) updates.description = description;
    if (recordedAt !== undefined) updates.recordedAt = new Date(recordedAt);

    const [updated] = await db
      .update(volunteerHours)
      .set(updates)
      .where(eq(volunteerHours.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/volunteer-hours/:id
volunteerHoursRouter.delete('/admin/volunteer-hours/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const [existing] = await db
      .select()
      .from(volunteerHours)
      .where(eq(volunteerHours.id, id));

    if (!existing) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    if (existing.source === 'pike13') {
      res.status(403).json({ error: 'Cannot delete Pike13-sourced entries' });
      return;
    }

    await db.delete(volunteerHours).where(eq(volunteerHours.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
