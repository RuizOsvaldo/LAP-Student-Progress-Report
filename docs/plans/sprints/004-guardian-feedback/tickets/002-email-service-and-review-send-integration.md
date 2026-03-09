---
id: "002"
title: email service and review send integration
status: todo
use-cases: [SUC-001]
depends-on: ["001"]
---

# email service and review send integration

## Description

Create `server/src/services/email.ts` with a `sendReviewEmail()` function
backed by the `@sendgrid/mail` SDK. Update `POST /api/reviews/:id/send` to
call this function after marking the review as sent, embedding the feedback
link in the email body.

## Acceptance Criteria

- [ ] `@sendgrid/mail` installed in `server/package.json`
- [ ] `server/src/services/email.ts` exports `sendReviewEmail(params)`:
      takes `{ toEmail, studentName, month, reviewBody, feedbackToken }`,
      sends via SendGrid with subject `[LEAGUE] Progress Report — <name>, <month>`,
      body contains review text + feedback link footer
- [ ] `POST /api/reviews/:id/send` calls `sendReviewEmail()` when
      `student.guardianEmail` is present
- [ ] If `student.guardianEmail` is null/empty, email send is skipped
      silently (review still marked sent)
- [ ] If `sendReviewEmail()` throws, the error is logged (`req.log.error`)
      and the route still returns success (non-blocking)
- [ ] `APP_URL`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` documented in
      `secrets/dev.env.example` and `secrets/prod.env.example`
- [ ] All existing server tests pass

## Implementation Notes

```ts
// server/src/services/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

export async function sendReviewEmail(params: {
  toEmail: string
  studentName: string
  month: string
  reviewBody: string
  feedbackToken: string
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
```

In `server/src/routes/reviews.ts`, after the DB update in the send handler:
```ts
if (student.guardianEmail) {
  sendReviewEmail({
    toEmail: student.guardianEmail,
    studentName: student.name,
    month: review.month,
    reviewBody: review.body ?? '',
    feedbackToken: review.feedbackToken,
  }).catch((err) => {
    req.log.error({ err }, 'SendGrid email failed');
  });
}
```

Use `.catch()` (fire-and-forget) rather than `await` + try/catch so the
email dispatch is truly non-blocking.

## Testing

- **Existing**: `npm run test:server` — all must pass
- **New** (`tests/server/reviews.test.ts` or new `tests/server/email.test.ts`):
  - `POST /api/reviews/:id/send` calls `sendReviewEmail` (mock `@sendgrid/mail`)
  - `POST /api/reviews/:id/send` returns success even when `sendReviewEmail` throws
  - `POST /api/reviews/:id/send` skips email when `guardianEmail` is null
- **Verification**: `npm run test:server`
