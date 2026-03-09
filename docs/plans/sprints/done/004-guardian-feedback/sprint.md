---
id: '004'
title: Guardian Feedback
status: done
branch: sprint/004-guardian-feedback
use-cases:
- SUC-001
- SUC-002
- SUC-003
- SUC-004
---

# Sprint 004 — Guardian Feedback

## Goals

Send monthly review emails to guardians via SendGrid containing a private
feedback link. When the guardian clicks the link, they see a simple web form
with a 1–5 star rating, an optional comment, and a Submit button. Feedback is
stored privately and admins are notified when it arrives.

## Problem

Progress reviews are currently only "sent" in the database — no email is
actually delivered and guardians have no structured channel to respond.
The LEAGUE has no feedback loop to identify guardian satisfaction or
instructor concerns.

## Solution

- When an instructor marks a review as "sent," the server sends the review
  body to the guardian's email via SendGrid. The email includes a unique,
  unguessable feedback link (`https://<app>/feedback/<token>`).
- The guardian clicks the link, arriving at a simple web page showing the
  student's name, the review month, a 1–5 star selector, and an optional
  comment field. No login required.
- On Submit, feedback is stored in `service_feedback` and an admin
  notification is created.
- Admins see all feedback on a private `/admin/feedback` page showing the
  review body + guardian rating/comment side by side.

## Success Criteria

- Marking a review as "sent" triggers a real email to the guardian via SendGrid
- Guardian can visit the feedback link, choose 1–5 stars, optionally add a
  comment, and submit
- The page prevents duplicate submissions (shows "already submitted" state)
- Admin sees all feedback on `/admin/feedback`
- Admin notification badge reflects new unread feedback
- All existing tests pass; new tests cover email trigger, public feedback
  routes, and admin page

## Scope

### In Scope

- `feedback_token uuid` column added to `monthly_reviews` (migration;
  backfill with `gen_random_uuid()`)
- Email service `server/src/services/email.ts` using `@sendgrid/mail`
- Review send route updated: `POST /api/reviews/:id/send` triggers
  `sendReviewEmail()` with the feedback link embedded in the email body
- Public API (no auth): `GET /api/feedback/:token` and
  `POST /api/feedback/:token`
- Public frontend page `FeedbackPage` at `/feedback/:token`:
  1–5 star selector, optional comment, Submit button, confirmation state,
  already-submitted state
- Admin API: `GET /api/admin/feedback` (admin-only)
- Admin frontend page `AdminFeedbackPage` at `/admin/feedback`
- "Feedback" nav link added to `AdminLayout` sidebar
- Admin notification created on each feedback submission
- New secrets: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`

### Out of Scope

- Email reply capture / inbound email parsing
- Guardian accounts or login
- Editing or deleting submitted feedback
- Aggregated analytics or rating charts
- DNS/MX record changes (no inbound email needed)

## Test Strategy

- **DB**: migration adds `feedback_token`; existing rows backfilled
- **Server**: Supertest for public GET/POST routes, admin list route, email
  trigger mocked with `@sendgrid/mail` spy
- **Client**: RTL for `FeedbackPage` (three states: form, confirmation,
  already-submitted) and `AdminFeedbackPage`; routing test updated

## Architecture Notes

- The `service_feedback` table already exists (Sprint 001); `rating` remains
  NOT NULL (guardian must choose 1–5 stars on the web form)
- No global auth gate in `index.ts`; public feedback router has no internal
  auth middleware
- Email failure is non-blocking: SendGrid error is logged but review is still
  marked sent

## Definition of Ready

Before tickets can be created, all of the following must be true:

- [x] Sprint planning documents are complete (sprint.md, use cases, technical plan)
- [ ] Architecture review passed
- [ ] Stakeholder has approved the sprint plan

## Tickets

(To be created after sprint approval.)
