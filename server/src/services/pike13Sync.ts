import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';

/** Pike13 custom field key for the student's GitHub account name */
export const PIKE13_GITHUB_FIELD_KEY = 'github_acct_name';

export interface SyncResult {
  studentsUpserted: number;
  assignmentsCreated: number;
  hoursCreated: number;
}

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// ---- Pike13 API response shapes ----

interface Pike13Person {
  id: number;
  name: string;
  email?: string;
  custom_fields?: Array<{ name: string; value: string | null }>;
}

interface Pike13EventOccurrence {
  id: number;
  start_at: string;
  end_at: string;
  staff_members?: Array<{ id: number; name: string; email?: string }>;
}

interface Pike13Visit {
  id: number;
  person_id: number;
  event_occurrence_id: number;
}

async function fetchPike13<T>(
  url: string,
  key: string,
  accessToken: string,
  fetchFn: typeof fetch,
): Promise<T[]> {
  const res = await fetchFn(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Pike13 API returned ${res.status} for ${url}`);
  }
  const data = (await res.json()) as Record<string, T[]>;
  return data[key] ?? [];
}

export async function runSync(
  db: DrizzleDb,
  accessToken: string,
  fetchFn: typeof fetch = fetch,
): Promise<SyncResult> {
  const base = (process.env.PIKE13_BASE_URL ?? 'https://pike13.com').replace(/\/$/, '');

  // Fetch all data from Pike13
  const people = await fetchPike13<Pike13Person>(
    `${base}/api/v2/desk/people`,
    'people',
    accessToken,
    fetchFn,
  );

  const [eventOccurrences, visits] = await Promise.all([
    fetchPike13<Pike13EventOccurrence>(
      `${base}/api/v2/desk/event_occurrences`,
      'event_occurrences',
      accessToken,
      fetchFn,
    ),
    fetchPike13<Pike13Visit>(
      `${base}/api/v2/desk/visits`,
      'visits',
      accessToken,
      fetchFn,
    ),
  ]);

  // Classify people: TA/VA are filtered out of student upserts but used for volunteer hours
  const isTaOrVa = (name: string) => name.startsWith('TA ') || name.startsWith('VA ');
  const taVaIds = new Set(people.filter((p) => isTaOrVa(p.name)).map((p) => p.id));
  const studentPeople = people.filter((p) => !isTaOrVa(p.name));
  const pike13IdToName = new Map(people.map((p) => [p.id, p.name]));

  // Upsert students by pike13SyncId
  const pike13IdToStudentId = new Map<number, number>();
  let studentsUpserted = 0;

  for (const person of studentPeople) {
    const githubUsername =
      person.custom_fields?.find((f) => f.name === PIKE13_GITHUB_FIELD_KEY)?.value ?? null;

    const [row] = await db
      .insert(schema.students)
      .values({
        name: person.name,
        guardianEmail: person.email ?? null,
        pike13SyncId: String(person.id),
        githubUsername,
      })
      .onConflictDoUpdate({
        target: schema.students.pike13SyncId,
        set: {
          name: person.name,
          guardianEmail: person.email ?? null,
          githubUsername,
        },
      })
      .returning({ id: schema.students.id });

    pike13IdToStudentId.set(person.id, row.id);
    studentsUpserted++;
  }

  // Load our instructors; match Pike13 staff members to instructors by email
  const instructorRows = await db
    .select({ id: schema.instructors.id, email: schema.users.email })
    .from(schema.instructors)
    .innerJoin(schema.users, eq(schema.instructors.userId, schema.users.id));

  const emailToInstructorId = new Map(
    instructorRows.map((r) => [r.email.toLowerCase(), r.id]),
  );

  // Build per-occurrence maps: duration (hours) and matched instructor IDs
  const occDuration = new Map<number, number>();
  const occToInstructors = new Map<number, number[]>();

  for (const occ of eventOccurrences) {
    const ms = new Date(occ.end_at).getTime() - new Date(occ.start_at).getTime();
    occDuration.set(occ.id, ms / 3_600_000);

    const instructorIds: number[] = [];
    for (const staff of occ.staff_members ?? []) {
      const instructorId = staff.email
        ? emailToInstructorId.get(staff.email.toLowerCase())
        : undefined;
      if (instructorId !== undefined) instructorIds.push(instructorId);
    }
    occToInstructors.set(occ.id, instructorIds);
  }

  // Process visits: TA/VA → volunteer hours; students → instructor assignments
  let assignmentsCreated = 0;
  let hoursCreated = 0;

  for (const visit of visits) {
    const { person_id, event_occurrence_id } = visit;

    if (taVaIds.has(person_id)) {
      const volunteerName = pike13IdToName.get(person_id) ?? String(person_id);
      const hours = occDuration.get(event_occurrence_id) ?? 1;
      const externalId = `${event_occurrence_id}-${person_id}`;

      const inserted = await db
        .insert(schema.volunteerHours)
        .values({ volunteerName, category: 'Teaching', hours, source: 'pike13', externalId })
        .onConflictDoNothing()
        .returning({ id: schema.volunteerHours.id });

      hoursCreated += inserted.length;
    } else {
      const studentId = pike13IdToStudentId.get(person_id);
      if (studentId === undefined) continue;

      for (const instructorId of occToInstructors.get(event_occurrence_id) ?? []) {
        const inserted = await db
          .insert(schema.instructorStudents)
          .values({ instructorId, studentId })
          .onConflictDoNothing()
          .returning({ instructorId: schema.instructorStudents.instructorId });

        assignmentsCreated += inserted.length;
      }
    }
  }

  return { studentsUpserted, assignmentsCreated, hoursCreated };
}
