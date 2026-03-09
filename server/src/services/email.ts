import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? '');

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

export async function sendReviewEmail(params: {
  toEmail: string;
  studentName: string;
  month: string;
  reviewBody: string;
  feedbackToken: string;
}): Promise<void> {
  const feedbackUrl = `${APP_URL}/feedback/${params.feedbackToken}`;
  const text = [
    params.reviewBody,
    '',
    '---',
    'Please rate our service:',
    feedbackUrl,
  ].join('\n');

  await sgMail.send({
    to: params.toEmail,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: `[LEAGUE] Progress Report — ${params.studentName}, ${params.month}`,
    text,
  });
}
