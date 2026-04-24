import cron from 'node-cron';
import { isSlackConfigured } from './slack';
import { sendMonthlyReminders } from './slackReminder';

export function startScheduler(): void {
  // Day of month to send reminders (default: 25th). Set SLACK_REMIND_DAY to override.
  const day = process.env.SLACK_REMIND_DAY ?? '1';

  // Runs at 9:00 AM UTC on the configured day of every month.
  cron.schedule(`0 9 ${day} * *`, async () => {
    if (!isSlackConfigured()) return;

    const month = new Date().toISOString().slice(0, 7);
    console.log(`[scheduler] Running monthly Slack reminders for ${month}`);

    try {
      const { sent, notFound } = await sendMonthlyReminders(month);
      console.log(`[scheduler] Reminders sent: ${sent}, not found in Slack: ${notFound}`);
    } catch (err) {
      console.error('[scheduler] Monthly Slack reminder failed:', err);
    }
  });

  console.log(`[scheduler] Monthly Slack reminders scheduled for the 1st of each month at 09:00 UTC (day override: SLACK_REMIND_DAY=${day})`);
}
