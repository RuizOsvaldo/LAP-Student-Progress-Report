import { eq, and, count, notLike, sql } from 'drizzle-orm';
import { db } from '../db';
import { instructors, users, instructorStudents, monthlyReviews, students } from '../db/schema';
import { sendSlackChannelMessage } from './slack';

export interface ReportResult {
  text: string;
  postedToChannel: boolean;
}

export async function generateComplianceReport(
  month: string,
  postToChannel = false,
  nameFilter?: string,
): Promise<ReportResult> {
  const [year, mon] = month.split('-');
  const monthLabel = new Date(Number(year), Number(mon) - 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const allInstructors = await db
    .select({ id: instructors.id, name: users.name })
    .from(instructors)
    .innerJoin(users, eq(instructors.userId, users.id))
    .where(and(eq(instructors.isActive, true), notLike(users.email, '%example.com%')));

  const reviewCounts = await db
    .select({
      instructorId: monthlyReviews.instructorId,
      status: monthlyReviews.status,
      count: count(),
    })
    .from(monthlyReviews)
    .where(eq(monthlyReviews.month, month))
    .groupBy(monthlyReviews.instructorId, monthlyReviews.status);

  const countMap = new Map<number, { pending: number; draft: number; sent: number }>();
  for (const row of reviewCounts) {
    if (!countMap.has(row.instructorId)) {
      countMap.set(row.instructorId, { pending: 0, draft: 0, sent: 0 });
    }
    countMap.get(row.instructorId)![row.status as 'pending' | 'draft' | 'sent'] = Number(row.count);
  }

  const studentCounts = await db
    .select({ instructorId: instructorStudents.instructorId, count: count() })
    .from(instructorStudents)
    .groupBy(instructorStudents.instructorId);
  const studentCountMap = new Map(studentCounts.map((r) => [r.instructorId, Number(r.count)]));

  const filter = nameFilter?.toLowerCase().trim();
  const targetInstructors = filter
    ? allInstructors.filter((i) => i.name.toLowerCase().includes(filter))
    : allInstructors;

  const rows = targetInstructors.map((i) => {
    const counts = countMap.get(i.id) ?? { pending: 0, draft: 0, sent: 0 };
    const total = studentCountMap.get(i.id) ?? 0;
    return { name: i.name, sent: counts.sent, total, done: counts.sent >= total && total > 0 };
  });

  const done = rows.filter((r) => r.done);
  const incomplete = rows.filter((r) => !r.done && r.total > 0);
  const noStudents = rows.filter((r) => r.total === 0);

  const scope = filter ? ` — filtered: "${nameFilter}"` : '';
  const lines = [
    `:bar_chart: *LEAGUE Review Compliance Report — ${monthLabel}${scope}*`,
    '',
    `*${done.length} of ${targetInstructors.length} instructor(s) complete*`,
    '',
  ];

  if (incomplete.length > 0) {
    lines.push(':x: *Still needed:*');
    for (const r of incomplete) lines.push(`  • ${r.name} — ${r.sent}/${r.total} sent`);
    lines.push('');
  }

  if (done.length > 0) {
    lines.push(':white_check_mark: *Completed:*');
    for (const r of done) lines.push(`  • ${r.name}`);
    lines.push('');
  }

  if (noStudents.length > 0) {
    lines.push(`:grey_question: *No students assigned:* ${noStudents.map((r) => r.name).join(', ')}`);
  }

  const text = lines.join('\n');

  if (postToChannel) {
    await sendSlackChannelMessage(text);
  }

  return { text, postedToChannel: postToChannel };
}

export async function generateStudentStatusReport(
  month: string,
  nameFilter: string,
): Promise<ReportResult> {
  const [year, mon] = month.split('-');
  const monthLabel = new Date(Number(year), Number(mon) - 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const rows = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      guardianEmail: students.guardianEmail,
      instructorId: instructors.id,
      instructorName: users.name,
      reviewStatus: monthlyReviews.status,
      reviewBody: monthlyReviews.body,
      sentAt: monthlyReviews.sentAt,
    })
    .from(students)
    .leftJoin(instructorStudents, eq(instructorStudents.studentId, students.id))
    .leftJoin(instructors, eq(instructors.id, instructorStudents.instructorId))
    .leftJoin(users, eq(users.id, instructors.userId))
    .leftJoin(
      monthlyReviews,
      and(
        eq(monthlyReviews.studentId, students.id),
        eq(monthlyReviews.instructorId, instructors.id),
        eq(monthlyReviews.month, month),
      ),
    )
    .where(sql`lower(${students.name}) like ${'%' + nameFilter.toLowerCase() + '%'}`);

  if (rows.length === 0) {
    return {
      text: `:grey_question: No students found matching "${nameFilter}".`,
      postedToChannel: false,
    };
  }

  // Group rows by studentId
  const studentMap = new Map<number, {
    name: string;
    guardianEmail: string | null;
    entries: Array<{
      instructorName: string | null;
      status: string | null;
      body: string | null;
      sentAt: Date | null;
    }>;
  }>();

  for (const row of rows) {
    if (!studentMap.has(row.studentId)) {
      studentMap.set(row.studentId, {
        name: row.studentName,
        guardianEmail: row.guardianEmail,
        entries: [],
      });
    }
    studentMap.get(row.studentId)!.entries.push({
      instructorName: row.instructorName,
      status: row.reviewStatus,
      body: row.reviewBody,
      sentAt: row.sentAt,
    });
  }

  const lines = [
    `:mag: *Student Report Status — ${monthLabel} — "${nameFilter}"*`,
    '',
  ];

  for (const [, student] of studentMap) {
    const guardianNote = student.guardianEmail ? ` · guardian: ${student.guardianEmail}` : '';
    lines.push(`*${student.name}*${guardianNote}`);

    if (student.entries.length === 1 && !student.entries[0].instructorName) {
      lines.push('  _Not assigned to any instructor_');
    } else {
      for (const entry of student.entries) {
        const instrLabel = entry.instructorName ?? '(unknown instructor)';
        if (!entry.status) {
          lines.push(`  :clock1: _${instrLabel}_ — no review created yet`);
        } else if (entry.status === 'sent') {
          const sentDate = entry.sentAt
            ? entry.sentAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'unknown date';
          lines.push(`  :white_check_mark: _${instrLabel}_ — sent ${sentDate}`);
          if (entry.body) {
            const preview = entry.body.length > 400 ? entry.body.slice(0, 400) + '…' : entry.body;
            lines.push(`  > ${preview.replace(/\n+/g, ' ')}`);
          }
        } else if (entry.status === 'draft') {
          lines.push(`  :pencil: _${instrLabel}_ — draft (not sent yet)`);
        } else {
          lines.push(`  :clock1: _${instrLabel}_ — pending (not started)`);
        }
      }
    }
    lines.push('');
  }

  return { text: lines.join('\n').trim(), postedToChannel: false };
}
