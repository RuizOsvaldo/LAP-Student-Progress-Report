/**
 * Pike13 sync service unit tests.
 *
 * Requires a running PostgreSQL instance with DATABASE_URL set.
 * Fetch is mocked — no real Pike13 network calls are made.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '../../server/src/db/schema';
import { runSync, PIKE13_GITHUB_FIELD_KEY } from '../../server/src/services/pike13Sync';

let pool: Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

let testUserId: number;
let testInstructorId: number;
const INSTRUCTOR_EMAIL = 'pike13sync-test@test.local';

beforeAll(async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set');
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });

  // Broad cleanup in FK order so we can create a clean test instructor
  await db.delete(schema.volunteerHours);
  await db.delete(schema.instructorStudents);
  await db.delete(schema.students);

  // Create a test user + instructor used to verify assignment creation
  const [user] = await db
    .insert(schema.users)
    .values({ email: INSTRUCTOR_EMAIL, name: 'Test Sync Instructor' })
    .onConflictDoUpdate({ target: schema.users.email, set: { name: 'Test Sync Instructor' } })
    .returning({ id: schema.users.id });
  testUserId = user.id;

  const existing = await db
    .select({ id: schema.instructors.id })
    .from(schema.instructors)
    .where(eq(schema.instructors.userId, testUserId));

  if (existing.length > 0) {
    testInstructorId = existing[0].id;
  } else {
    const [instr] = await db
      .insert(schema.instructors)
      .values({ userId: testUserId, isActive: true })
      .returning({ id: schema.instructors.id });
    testInstructorId = instr.id;
  }
});

afterAll(async () => {
  await db.delete(schema.volunteerHours);
  await db.delete(schema.instructorStudents);
  await db.delete(schema.students);
  await db.delete(schema.instructors).where(eq(schema.instructors.id, testInstructorId));
  await db.delete(schema.users).where(eq(schema.users.id, testUserId));
  await pool.end();
});

afterEach(async () => {
  await db.delete(schema.volunteerHours);
  await db.delete(schema.instructorStudents);
  await db.delete(schema.students);
});

// ---- Mock fetch helper ----

function buildFetch(data: {
  people?: object[];
  event_occurrences?: object[];
  visits?: object[];
}): typeof fetch {
  return async (url: Parameters<typeof fetch>[0]) => {
    const s = String(url);
    let body: object;
    if (s.includes('/people')) body = { people: data.people ?? [] };
    else if (s.includes('/event_occurrences')) body = { event_occurrences: data.event_occurrences ?? [] };
    else if (s.includes('/visits')) body = { visits: data.visits ?? [] };
    else body = {};
    return { ok: true, json: async () => body } as Response;
  };
}

// ---- TA/VA filter ----

describe('TA/VA filter', () => {
  it('excludes TA and VA people from student upserts', async () => {
    const fetchFn = buildFetch({
      people: [
        { id: 1, name: 'TA Alice' },
        { id: 2, name: 'VA Bob' },
        { id: 3, name: 'Regular Student' },
      ],
    });

    const result = await runSync(db, 'tok', fetchFn);

    expect(result.studentsUpserted).toBe(1);
    const rows = await db.select().from(schema.students);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Regular Student');
  });
});

// ---- GitHub username ----

describe('GitHub username', () => {
  it('populates githubUsername from custom field', async () => {
    const fetchFn = buildFetch({
      people: [
        {
          id: 10,
          name: 'Student With GH',
          custom_fields: [{ name: PIKE13_GITHUB_FIELD_KEY, value: 'gh-handle' }],
        },
      ],
    });

    await runSync(db, 'tok', fetchFn);

    const [s] = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.pike13SyncId, '10'));
    expect(s.githubUsername).toBe('gh-handle');
  });

  it('sets githubUsername to null when field is absent', async () => {
    const fetchFn = buildFetch({ people: [{ id: 11, name: 'Student No GH' }] });

    await runSync(db, 'tok', fetchFn);

    const [s] = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.pike13SyncId, '11'));
    expect(s.githubUsername).toBeNull();
  });
});

// ---- Idempotency ----

describe('Idempotency', () => {
  it('running sync twice produces one student row', async () => {
    const fetchFn = buildFetch({ people: [{ id: 20, name: 'Idempotent Student' }] });

    await runSync(db, 'tok', fetchFn);
    await runSync(db, 'tok', fetchFn);

    const rows = await db.select().from(schema.students);
    expect(rows).toHaveLength(1);
  });
});

// ---- Volunteer hours ----

describe('Volunteer hours', () => {
  it('creates hour with correct source, externalId, and hours', async () => {
    const fetchFn = buildFetch({
      people: [{ id: 30, name: 'TA Charlie' }],
      event_occurrences: [
        {
          id: 100,
          start_at: '2026-03-01T10:00:00Z',
          end_at: '2026-03-01T11:30:00Z',
          staff_members: [],
        },
      ],
      visits: [{ id: 200, person_id: 30, event_occurrence_id: 100 }],
    });

    const result = await runSync(db, 'tok', fetchFn);

    expect(result.hoursCreated).toBe(1);
    const [hr] = await db.select().from(schema.volunteerHours);
    expect(hr.source).toBe('pike13');
    expect(hr.externalId).toBe('100-30');
    expect(hr.hours).toBeCloseTo(1.5);
    expect(hr.category).toBe('Teaching');
    expect(hr.volunteerName).toBe('TA Charlie');
  });

  it('does not create duplicate hours on second sync', async () => {
    const fetchFn = buildFetch({
      people: [{ id: 31, name: 'VA Diana' }],
      event_occurrences: [
        {
          id: 101,
          start_at: '2026-03-01T09:00:00Z',
          end_at: '2026-03-01T10:00:00Z',
          staff_members: [],
        },
      ],
      visits: [{ id: 201, person_id: 31, event_occurrence_id: 101 }],
    });

    await runSync(db, 'tok', fetchFn);
    const result2 = await runSync(db, 'tok', fetchFn);

    expect(result2.hoursCreated).toBe(0);
    const rows = await db.select().from(schema.volunteerHours);
    expect(rows).toHaveLength(1);
  });
});

// ---- Instructor-student assignments ----

describe('Instructor-student assignments', () => {
  it('creates assignment when student visits an instructor session', async () => {
    const fetchFn = buildFetch({
      people: [{ id: 40, name: 'Assignment Student' }],
      event_occurrences: [
        {
          id: 200,
          start_at: '2026-03-01T10:00:00Z',
          end_at: '2026-03-01T11:00:00Z',
          staff_members: [{ id: 999, name: 'Test Instructor', email: INSTRUCTOR_EMAIL }],
        },
      ],
      visits: [{ id: 300, person_id: 40, event_occurrence_id: 200 }],
    });

    const result = await runSync(db, 'tok', fetchFn);

    expect(result.assignmentsCreated).toBe(1);
    const [student] = await db
      .select()
      .from(schema.students)
      .where(eq(schema.students.pike13SyncId, '40'));
    const assignments = await db
      .select()
      .from(schema.instructorStudents)
      .where(eq(schema.instructorStudents.studentId, student.id));
    expect(assignments).toHaveLength(1);
    expect(assignments[0].instructorId).toBe(testInstructorId);
  });

  it('does not create duplicate assignments on second sync', async () => {
    const fetchFn = buildFetch({
      people: [{ id: 41, name: 'Dup Assignment Student' }],
      event_occurrences: [
        {
          id: 201,
          start_at: '2026-03-01T10:00:00Z',
          end_at: '2026-03-01T11:00:00Z',
          staff_members: [{ id: 999, name: 'Test Instructor', email: INSTRUCTOR_EMAIL }],
        },
      ],
      visits: [{ id: 301, person_id: 41, event_occurrence_id: 201 }],
    });

    await runSync(db, 'tok', fetchFn);
    const result2 = await runSync(db, 'tok', fetchFn);

    expect(result2.assignmentsCreated).toBe(0);
  });
});
