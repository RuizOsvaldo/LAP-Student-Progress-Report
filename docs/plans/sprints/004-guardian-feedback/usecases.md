---
status: draft
---

# Sprint 004 Use Cases

## SUC-001: Review Email Sent to Guardian

- **Actor**: Instructor (authenticated)
- **Preconditions**: A `monthly_review` row exists with `status = 'draft'`;
  the student has a `guardianEmail`; SendGrid API key is configured
- **Main Flow**:
  1. Instructor clicks "Mark as Sent" on a review in the editor
  2. Frontend calls `POST /api/reviews/:id/send`
  3. Server updates `status` to `'sent'` and sets `sentAt`
  4. Server calls `sendReviewEmail(review, student)`:
     - To: student's `guardianEmail`
     - From: configured `SENDGRID_FROM_EMAIL`
     - Subject: `[LEAGUE] Progress Report — <studentName>, <month>`
     - Body: review body text + "Leave feedback:" link to
       `https://<app>/feedback/<feedbackToken>`
  5. SendGrid delivers the email
- **Postconditions**: Review status is `'sent'`; guardian receives email with
  feedback link
- **Acceptance Criteria**:
  - [ ] `POST /api/reviews/:id/send` calls `sendReviewEmail()` (verified via
        mock in tests)
  - [ ] Email body includes the feedback link with the correct `feedbackToken`
  - [ ] If the student has no `guardianEmail`, email send is skipped silently
        (review is still marked sent)
  - [ ] SendGrid API error does not block the review from being marked sent
        (error is logged; route returns success)

## SUC-002: Guardian Submits Feedback via Web Form

- **Actor**: Guardian (unauthenticated)
- **Preconditions**: Guardian received the review email with a feedback link;
  the review has not yet received feedback
- **Main Flow**:
  1. Guardian clicks the feedback link in the email
  2. Browser opens `/feedback/<token>`
  3. Page fetches `GET /api/feedback/:token` and displays:
     student name, review month, 1–5 star selector, optional comment
     field, and Submit button
  4. Guardian selects a star rating, optionally types a comment, and clicks
     Submit
  5. Frontend posts `{ rating, comment }` to `POST /api/feedback/:token`
  6. Server creates a `service_feedback` row and an `adminNotification`
  7. Page shows a "Thank you" confirmation; Submit button is disabled
- **Postconditions**: `service_feedback` row exists; admin notification created
- **Acceptance Criteria**:
  - [ ] `GET /api/feedback/:token` returns 200 with
        `{ studentName, month, alreadySubmitted: false }` for a valid token
  - [ ] `GET /api/feedback/:token` returns 200 with
        `{ studentName, month, alreadySubmitted: true }` when feedback exists
  - [ ] `GET /api/feedback/:token` returns 404 for an unknown token
  - [ ] `POST /api/feedback/:token` with `{ rating: 4 }` creates a
        `service_feedback` row and returns 201
  - [ ] `POST /api/feedback/:token` with a duplicate submission returns 409
  - [ ] `POST /api/feedback/:token` rejects `rating` outside 1–5 with 400
  - [ ] `FeedbackPage` renders the star selector, comment field, and Submit
  - [ ] Submitting the form calls `POST /api/feedback/:token`
  - [ ] After successful submit, confirmation is shown and form is disabled
  - [ ] When `alreadySubmitted: true`, the form is replaced with
        "Your feedback has been recorded" message

## SUC-003: Admin Views Guardian Feedback

- **Actor**: Admin (authenticated, role = admin)
- **Preconditions**: At least one `service_feedback` row exists
- **Main Flow**:
  1. Admin navigates to `/admin/feedback`
  2. Page calls `GET /api/admin/feedback`
  3. Admin sees a table: student name, instructor name, month,
     rating (★ × N), guardian comment (truncated), submitted date
- **Postconditions**: Read-only; no state change
- **Acceptance Criteria**:
  - [ ] `GET /api/admin/feedback` returns `AdminFeedbackDto[]` with
        `studentName`, `instructorName`, `month`, `rating`, `comment`,
        `submittedAt`
  - [ ] Route requires admin role (returns 403 otherwise)
  - [ ] `AdminFeedbackPage` renders a row per feedback entry
  - [ ] "Feedback" nav link appears in `AdminLayout` sidebar

## SUC-004: Feedback Token Present on All Reviews

- **Actor**: System (migration)
- **Preconditions**: Migration runs against the database
- **Main Flow**:
  1. Migration adds `feedback_token uuid NOT NULL DEFAULT gen_random_uuid()`
     to `monthly_reviews`
  2. All existing rows receive a unique UUID automatically
  3. New reviews created after migration also receive a UUID
- **Postconditions**: Every `monthly_reviews` row has a unique, non-null
  `feedback_token`
- **Acceptance Criteria**:
  - [ ] Migration applies without errors on a database with existing rows
  - [ ] Every `monthly_reviews` row has a unique, non-null `feedback_token`
  - [ ] New reviews created via API include a non-null `feedback_token`
