import { Router } from 'express';
import express from 'express';
import { verifySlackSignature } from '../middleware/verifySlack';
import { generateComplianceReport, generateStudentStatusReport } from '../services/slackReport';
import { sendMonthlyReminders } from '../services/slackReminder';
import { isSlackConfigured } from '../services/slack';

export const slackRouter = Router();

interface SlackPayload {
  command: string;
  text: string;
  response_url: string;
  user_name: string;
}

function parseArgs(text: string): { month: string; nameFilter?: string } {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  const monthIdx = parts.findIndex((p) => /^\d{4}-\d{2}$/.test(p));
  const month = monthIdx !== -1 ? parts[monthIdx] : new Date().toISOString().slice(0, 7);
  const nameParts = parts.filter((_, i) => i !== monthIdx);
  const nameFilter = nameParts.length > 0 ? nameParts.join(' ') : undefined;
  return { month, nameFilter };
}

async function replyAsync(url: string, text: string): Promise<void> {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response_type: 'ephemeral', text }),
  });
}

// POST /api/slack/command
// Handles all LEAGUE slash commands registered in the Slack App.
// Middleware is scoped to this route only — raw body capture + signature verification.
// Responds within 3 s; long operations post their result to response_url asynchronously.
slackRouter.post(
  '/slack/command',
  express.raw({ type: 'application/x-www-form-urlencoded' }),
  (req, _res, next) => {
    req.rawBody = req.body as Buffer;
    const params = new URLSearchParams(req.body.toString());
    req.body = Object.fromEntries(params.entries());
    next();
  },
  verifySlackSignature,
  (req, res) => {
  const { command, text, response_url } = req.body as SlackPayload;

  if (!isSlackConfigured()) {
    res.json({ response_type: 'ephemeral', text: ':x: Slack integration is not configured on the server.' });
    return;
  }

  const { month, nameFilter } = parseArgs(text);

  switch (command) {
    case '/student-reports': {
      res.json({ response_type: 'ephemeral', text: ':hourglass: Generating report and posting to channel...' });
      generateComplianceReport(month, true)
        .then(({ text: report }) =>
          replyAsync(response_url, `:white_check_mark: Report posted to channel.\n\`\`\`\n${report}\n\`\`\``)
        )
        .catch((err) => replyAsync(response_url, `:x: Failed: ${(err as Error).message}`));
      break;
    }

    case '/remind-instructor': {
      const target = nameFilter ? `instructors matching "${nameFilter}"` : 'all instructors';
      res.json({ response_type: 'ephemeral', text: `:hourglass: Sending reminders to ${target}...` });
      sendMonthlyReminders(month, nameFilter)
        .then(({ sent, notFound, results }) => {
          if (nameFilter && results.length === 0) {
            return replyAsync(response_url, `:grey_question: No instructors found matching "${nameFilter}".`);
          }
          return replyAsync(
            response_url,
            `:white_check_mark: Done — ${sent} DM(s) delivered, ${notFound} instructor(s) not found in Slack.`,
          );
        })
        .catch((err) => replyAsync(response_url, `:x: Failed: ${(err as Error).message}`));
      break;
    }

    case '/reports-status': {
      generateComplianceReport(month, false, nameFilter)
        .then(({ text: report }) => res.json({ response_type: 'ephemeral', text: report }))
        .catch((err) =>
          res.json({ response_type: 'ephemeral', text: `:x: Failed: ${(err as Error).message}` })
        );
      break;
    }

    case '/student-status': {
      if (!nameFilter) {
        res.json({
          response_type: 'ephemeral',
          text: ':x: Please provide a student name. Usage: `/student-status <name> [YYYY-MM]`',
        });
        return;
      }
      res.json({ response_type: 'ephemeral', text: ':hourglass: Looking up student reports…' });
      generateStudentStatusReport(month, nameFilter)
        .then(({ text: report }) => replyAsync(response_url, report))
        .catch((err) => replyAsync(response_url, `:x: Failed: ${(err as Error).message}`));
      break;
    }

    default:
      res.json({
        response_type: 'ephemeral',
        text: `:grey_question: Unknown command \`${command}\`. Available: \`/student-reports [YYYY-MM]\`, \`/remind-instructor [name] [YYYY-MM]\`, \`/reports-status [name] [YYYY-MM]\`, \`/student-status <name> [YYYY-MM]\``,
      });
  }
  },
);
