---
id: '005'
title: FeedbackPage and AdminFeedbackPage client pages and tests
status: done
use-cases:
- SUC-002
- SUC-003
depends-on:
- '003'
- '004'
---

# FeedbackPage and AdminFeedbackPage client pages and tests

## Description

Add two new React pages. `FeedbackPage` is a public (no-auth) page at
`/feedback/:token` where guardians submit their 1–5 star rating and optional
comment. `AdminFeedbackPage` is an admin-only page at `/admin/feedback` that
lists all submitted feedback. Wire both into `App.tsx` and add the Feedback
nav link to `AdminLayout`.

## Acceptance Criteria

- [ ] `client/src/types/feedback.ts` created with `FeedbackContextDto`
      (`{ studentName: string; month: string; alreadySubmitted: boolean }`)
- [ ] `AdminFeedbackDto` added to `client/src/types/admin.ts`
      (`{ id, reviewId, studentName, instructorName, month, rating, comment, submittedAt }`)
- [ ] `client/src/pages/FeedbackPage.tsx` created with five render states:
  - **loading** — spinner / "Loading…" text while GET is in-flight
  - **not-found** — "Feedback link not found" message when API returns 404
  - **already-submitted** — "Feedback already submitted" message when
    `alreadySubmitted: true`
  - **form** — star selector (1–5 buttons), optional comment textarea,
    and Submit button (disabled while submitting)
  - **confirmed** — "Thank you for your feedback!" message after 201
- [ ] `FeedbackPage` calls `GET /api/feedback/:token` on mount
- [ ] `FeedbackPage` submits `POST /api/feedback/:token` with `{ rating, comment }`
      (comment omitted when blank)
- [ ] `POST` returns 409 → show "Feedback already submitted" (transition to
      already-submitted state)
- [ ] `client/src/pages/AdminFeedbackPage.tsx` created; renders a table with
      columns: Student, Instructor, Month, Rating, Comment, Submitted
- [ ] `AdminFeedbackPage` calls `GET /api/admin/feedback` via `useQuery`
- [ ] Route `/feedback/:token` added to `App.tsx` without `ProtectedRoute`
      (public page)
- [ ] Route `/admin/feedback` added to `App.tsx` wrapped in
      `ProtectedRoute role="admin"` and `AdminLayout`
- [ ] `{ href: '/admin/feedback', label: 'Feedback' }` added to `NAV_LINKS`
      in `AdminLayout.tsx`
- [ ] All existing tests pass

## Implementation Notes

### Types (`client/src/types/feedback.ts`)

```ts
export interface FeedbackContextDto {
  studentName: string
  month: string
  alreadySubmitted: boolean
}
```

Add to `client/src/types/admin.ts`:
```ts
export interface AdminFeedbackDto {
  id: number
  reviewId: number
  studentName: string
  instructorName: string
  month: string
  rating: number
  comment: string | null
  submittedAt: string
}
```

### FeedbackPage skeleton (`client/src/pages/FeedbackPage.tsx`)

```tsx
import { useState, useEffect } from 'react'
import { useParams } from 'wouter'
import type { FeedbackContextDto } from '../types/feedback'

type State = 'loading' | 'not-found' | 'already-submitted' | 'form' | 'confirmed'

export function FeedbackPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<State>('loading')
  const [context, setContext] = useState<FeedbackContextDto | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/feedback/${token}`)
      .then(async (res) => {
        if (res.status === 404) { setState('not-found'); return }
        const data: FeedbackContextDto = await res.json()
        setContext(data)
        setState(data.alreadySubmitted ? 'already-submitted' : 'form')
      })
      .catch(() => setState('not-found'))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const body: Record<string, unknown> = { rating }
    if (comment.trim()) body.comment = comment.trim()
    const res = await fetch(`/api/feedback/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSubmitting(false)
    if (res.status === 409) { setState('already-submitted'); return }
    if (res.ok) setState('confirmed')
  }

  if (state === 'loading') return <p>Loading…</p>
  if (state === 'not-found') return <p>Feedback link not found.</p>
  if (state === 'already-submitted') return <p>Feedback already submitted.</p>
  if (state === 'confirmed') return <p>Thank you for your feedback!</p>

  // form state
  return (
    <form onSubmit={handleSubmit}>
      <p>Review for {context?.studentName} — {context?.month}</p>
      <div>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} star`}
            onClick={() => setRating(n)}
            className={rating === n ? 'selected' : ''}>
            {n}
          </button>
        ))}
      </div>
      <textarea
        aria-label="Comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="submit" disabled={submitting || rating === 0}>
        Submit
      </button>
    </form>
  )
}
```

### AdminFeedbackPage skeleton (`client/src/pages/AdminFeedbackPage.tsx`)

```tsx
import { useQuery } from '@tanstack/react-query'
import type { AdminFeedbackDto } from '../types/admin'

async function fetchFeedback(): Promise<AdminFeedbackDto[]> {
  const res = await fetch('/api/admin/feedback')
  if (!res.ok) throw new Error('Failed to load feedback')
  return res.json()
}

export function AdminFeedbackPage() {
  const { data: rows = [], isLoading, error } = useQuery<AdminFeedbackDto[]>({
    queryKey: ['admin', 'feedback'],
    queryFn: fetchFeedback,
  })

  return (
    <div className="max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Guardian Feedback</h1>
      {isLoading && <p>Loading…</p>}
      {error && <p className="text-red-600">Failed to load feedback.</p>}
      {!isLoading && rows.length === 0 && <p>No feedback yet.</p>}
      {rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Student</th><th>Instructor</th><th>Month</th>
              <th>Rating</th><th>Comment</th><th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.studentName}</td>
                <td>{r.instructorName}</td>
                <td>{r.month}</td>
                <td>{r.rating}</td>
                <td>{r.comment ?? '—'}</td>
                <td>{new Date(r.submittedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

### Routing (`client/src/App.tsx`)

```tsx
// Add imports:
import { FeedbackPage } from './pages/FeedbackPage'
import { AdminFeedbackPage } from './pages/AdminFeedbackPage'

// Add public route (no ProtectedRoute) before the NotFoundPage catch-all:
<Route path="/feedback/:token" component={FeedbackPage} />

// Add admin route alongside the other /admin/* routes:
<Route path="/admin/feedback">
  <ProtectedRoute role="admin">
    <AdminLayout>
      <AdminFeedbackPage />
    </AdminLayout>
  </ProtectedRoute>
</Route>
```

### Nav link (`client/src/components/AdminLayout.tsx`)

```ts
const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/instructors', label: 'Instructors' },
  { href: '/admin/compliance', label: 'Compliance' },
  { href: '/admin/volunteer-hours', label: 'Volunteer Hours' },
  { href: '/admin/feedback', label: 'Feedback' },   // add this line
]
```

## Testing

- **Existing**: `npm run test:client` — all must pass
- **New** (`tests/client/FeedbackPage.test.tsx`):
  - GET 404 → renders "Feedback link not found"
  - GET 200 `alreadySubmitted: true` → renders "Feedback already submitted"
  - GET 200 `alreadySubmitted: false` → renders star buttons and Submit
  - Submit with rating 4 → POST called with `{ rating: 4 }`, renders "Thank you"
  - POST 409 → transitions to "Feedback already submitted"
- **New** (`tests/client/AdminFeedbackPage.test.tsx`):
  - Renders table rows with studentName, instructorName, month, rating
  - Shows "No feedback yet." when array is empty
- **New** (`tests/client/routing.test.tsx` additions):
  - `/feedback/some-token` renders `FeedbackPage` (no auth required)
  - `/admin/feedback` renders `AdminFeedbackPage` within `AdminLayout`
- **Verification**: `npm run test:client`
