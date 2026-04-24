import { eq, and, notLike } from 'drizzle-orm';
import Groq from 'groq-sdk';
import { db } from '../db';
import { instructors, users, instructorStudents, monthlyReviews, students } from '../db/schema';
import { sendSlackDM } from './slack';

export interface ReminderResult {
  sent: number;
  notFound: number;
  results: Array<{ name: string; email: string; dmSent: boolean; pending: number }>;
}

export async function sendMonthlyReminders(
  month: string,
  nameFilter?: string,
): Promise<ReminderResult> {
  const [year, mon] = month.split('-');
  const monthLabel = new Date(Number(year), Number(mon) - 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const appUrl = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '');

  const allInstructors = await db
    .select({ id: instructors.id, name: users.name, email: users.email })
    .from(instructors)
    .innerJoin(users, eq(instructors.userId, users.id))
    .where(and(eq(instructors.isActive, true), notLike(users.email, '%example.com%')));

  const filter = nameFilter?.toLowerCase().trim();
  const targetInstructors = filter
    ? allInstructors.filter((i) => i.name.toLowerCase().includes(filter))
    : allInstructors;

  const results: ReminderResult['results'] = [];

  for (const instr of targetInstructors) {
    const assignedStudents = await db
      .select({ id: students.id, name: students.name })
      .from(instructorStudents)
      .innerJoin(students, eq(instructorStudents.studentId, students.id))
      .where(eq(instructorStudents.instructorId, instr.id))
      .orderBy(students.name);

    if (assignedStudents.length === 0) continue;

    const sentReviews = await db
      .select({ studentId: monthlyReviews.studentId })
      .from(monthlyReviews)
      .where(
        and(
          eq(monthlyReviews.instructorId, instr.id),
          eq(monthlyReviews.month, month),
          eq(monthlyReviews.status, 'sent'),
        ),
      );
    const sentIds = new Set(sentReviews.map((r) => r.studentId));
    const pending = assignedStudents.filter((s) => !sentIds.has(s.id));

    if (pending.length === 0) continue;

    const studentList = pending.map((s) => `• ${s.name}`).join('\n');

    const staticText = [
      `:wave: Hi ${instr.name}! This is a reminder from LEAGUE to complete your *${monthLabel}* progress reviews.`,
      '',
      `*Students still needing reviews (${pending.length}):*`,
      studentList,
      '',
      `Log in and complete them here: ${appUrl}/reviews?month=${month}`,
    ].join('\n');

    let text = staticText;

    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 256,
          messages: [
            {
              role: 'system',
              content: `You write short, friendly Slack DMs for a coding education nonprofit called The LEAGUE of Amazing Programmers.
Tone: warm, encouraging, collegial — not corporate, not naggy.
Rules:
- Address the instructor by first name only
- Mention the month naturally in a sentence (don't just say "for April")
- List the students exactly as given, each on its own line with a bullet (•)
- End with the login link on its own line, no label needed
- Use Slack bold (*word*) sparingly — just for the student list header
- Total length: 5–8 lines, no more
- Do NOT add greetings like "Hey!" or sign-offs like "Thanks!" — get straight to it`,
            },
            {
              role: 'user',
              content: `Write a Slack reminder to ${instr.name.split(' ')[0]} to send their ${monthLabel} progress reviews.
Pending students (${pending.length}):
${studentList}
Login link: ${appUrl}/reviews?month=${month}`,
            },
          ],
        });
        const generated = completion.choices[0]?.message?.content?.trim();
        if (generated) text = generated;
      } catch { /* fall through to static text */ }
    }

    let dmSent = false;
    try {
      dmSent = await sendSlackDM(instr.email, text);
    } catch {
      dmSent = false;
    }

    results.push({ name: instr.name, email: instr.email, dmSent, pending: pending.length });
  }

  const sent = results.filter((r) => r.dmSent).length;
  const notFound = results.filter((r) => !r.dmSent).length;
  return { sent, notFound, results };
}
