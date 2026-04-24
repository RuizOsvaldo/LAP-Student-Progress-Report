# UI Specification

## Overview

The frontend is a React 19 single-page application served by Vite, styled
with Tailwind CSS v4. It targets two user roles — **instructor** and **admin**
— each with a dedicated layout and route namespace. A single public route
handles guardian feedback submission.

---

## Technology Stack

| Concern | Library | Version |
|---------|---------|---------|
| Framework | React | 19.2.0 |
| Routing | Wouter | 3.9.0 |
| Server state | TanStack React Query | 5.x |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Styling | Tailwind CSS v4 | 4.2.x |
| Build tool | Vite | 7.x |
| Icons | Lucide React | 0.575.0 |
| CV variants | class-variance-authority | 0.7.x |

---

## Directory Layout

```
client/src/
├── App.tsx                 # Router root, layout wrappers, route table
├── main.tsx                # React root, QueryClientProvider
├── index.css               # Tailwind base import, global resets
├── App.css                 # Legacy card/button/counter utility classes
├── pages/                  # Route-level components (one file per page)
├── components/
│   ├── ui/                 # Generic, reusable UI primitives
│   ├── AdminLayout.tsx     # Sidebar + shell for admin routes
│   ├── InstructorLayout.tsx# Sidebar + shell for instructor routes
│   ├── MonthPicker.tsx     # Month select, syncs with URL ?month=
│   └── ProtectedRoute.tsx  # Role-based auth guard
├── hooks/
│   └── useAuth.ts          # React Query hook → GET /api/auth/me
├── types/                  # Shared TypeScript interfaces (DTOs)
│   ├── auth.ts
│   ├── review.ts
│   ├── template.ts
│   ├── checkin.ts
│   ├── feedback.ts
│   ├── admin.ts
│   └── pike13.ts
└── lib/                    # Utility functions (e.g., cn() class merger)
```

---

## Routing

Wouter's `<Switch>` drives all routing. There is no nested router — routes are
flat, wrapped by layout components passed as children.

### Route Table

| Path | Component | Layout | Auth |
|------|-----------|--------|------|
| `/` | → redirect `/login` | — | — |
| `/login` | `LoginPage` | none | none |
| `/pending-activation` | `PendingActivationPage` | none | any |
| `/dashboard` | `DashboardPage` | Instructor | instructor |
| `/reviews` | `ReviewListPage` | Instructor | instructor |
| `/reviews/:id` | `ReviewEditorPage` | Instructor | instructor |
| `/templates` | `TemplateListPage` | Instructor | instructor |
| `/templates/new` | `TemplateEditorPage` | Instructor | instructor |
| `/templates/:id` | `TemplateEditorPage` | Instructor | instructor |
| `/checkin` | `CheckinPage` | Instructor | instructor |
| `/admin` | `AdminDashboardPage` | Admin | admin |
| `/admin/instructors` | `InstructorListPage` | Admin | admin |
| `/admin/compliance` | `CompliancePage` | Admin | admin |
| `/admin/volunteer-hours` | `VolunteerHoursPage` | Admin | admin |
| `/admin/feedback` | `AdminFeedbackPage` | Admin | admin |
| `/feedback/:token` | `FeedbackPage` | none | none (public) |
| `*` | `NotFoundPage` | none | — |

### Auth Guard

`ProtectedRoute` reads from `useAuth()`. If the user is not loaded yet it
renders nothing (prevents flash). If the user is unauthenticated it redirects
to `/login`. Role checks (`isAdmin`, `isActiveInstructor`) redirect to the
appropriate fallback when violated.

---

## Layouts

### InstructorLayout

Renders a fixed left sidebar (`w-64`) and a scrollable main content area.

**Sidebar contents:**
- App logo / name
- Navigation links: Dashboard, Reviews, Templates, Check-in
- Pike13 Sync button with spinner, success/error message, and timestamp
- Conditional "Admin Panel" link (visible only when `user.isAdmin`)

### AdminLayout

Same shell structure. Sidebar navigation links: Dashboard, Instructors,
Compliance, Volunteer Hours, Feedback. Footer link back to instructor view.

---

## Pages

### LoginPage

Renders a centered card with a single "Sign in with Pike13" button that
initiates the OAuth 2.0 redirect to `/api/auth/pike13`. Displays a note
that only `@jointheleague.org` accounts are accepted.

### PendingActivationPage

Static message indicating the account is awaiting admin activation, plus
a logout button.

### DashboardPage

**API**: `GET /api/instructor/dashboard?month=YYYY-MM`

Displays:
- Summary stat cards: total students, pending reviews, draft reviews, sent reviews
- `MonthPicker` synced to URL `?month=` param
- Student list table with columns: name, GitHub username, review status badge, action link
- Sortable by name or status
- Check-in banner (shown when a TA check-in is due this week)
- Pike13 Sync button (duplicated from sidebar for visibility)

### ReviewListPage

**API**: `GET /api/reviews?month=YYYY-MM`

Table of all students for the month. Each row shows: student name, status
badge, "Start a Review" button (for pending students) or a link to the editor.

### ReviewEditorPage

**API**: `GET /api/reviews/:id`, `PUT /api/reviews/:id`,
`POST /api/reviews/:id/send`, `POST /api/reviews/:id/test-note`

Full review composer:
- Subject line text input
- Body `<textarea>` (monospace, resizable)
- "Apply Template" dropdown — selects from saved templates, merges
  `{{studentName}}` and `{{month}}` placeholders
- "Generate GitHub Commit" button — calls a service to produce a commit
  message based on review content
- Save (draft) and Send buttons; Send transitions status to `sent`
- "Send Test Note" button — sends a test Pike13 note to the instructor's own
  account for preview
- Status badge shows current state: `pending | draft | sent`

### TemplateListPage

**API**: `GET /api/templates`

Table of saved templates with name, preview snippet, edit link, and delete
button. "New Template" button navigates to `/templates/new`.

### TemplateEditorPage

**API**: `GET /api/templates/:id` (edit), `POST /api/templates` (create),
`PUT /api/templates/:id` (update)

Form fields: Template name, subject, body. Supports template variables
`{{studentName}}` and `{{month}}`. Save button with optimistic navigation
back to the list on success.

### CheckinPage

**API**: `GET /api/checkin/pending`, `POST /api/checkin`

Displays TAs scheduled for the current week from Pike13. Each row has the
TA name and a present/absent radio pair. An "Add Unlisted TA" input allows
adding additional names. On submit, sends attendance data and notifies admin.
Shows a "already submitted" message if the check-in for this week was
previously submitted.

### AdminDashboardPage

**API**: `GET /api/admin/stats`, `GET /api/admin/notifications`,
`GET /api/admin/pike13/status`, `POST /api/admin/sync/pike13`

Metric cards: reviews sent this month, guardian feedback rate, average
rating, top suggestion category. Unread notification panel. Pike13 connection
status with a Sync button.

### InstructorListPage

**API**: `GET /api/admin/instructors`, `PUT /api/admin/instructors/:id/active`,
`POST /api/admin/reminders`

Sortable, searchable table of instructors. Columns: name, email, student
count, ratio badge, active toggle. Bulk action: "Send Review Reminders" to
all active instructors.

### CompliancePage

**API**: `GET /api/admin/compliance?month=YYYY-MM`

Table per instructor showing counts of pending / draft / sent reviews for
the selected month, plus whether they submitted a TA check-in that week.
Color-coded cells highlight compliance gaps.

### VolunteerHoursPage

**API**: Multiple endpoints under `/api/admin/volunteer-hours`

Three tab views:
1. **Summary** — Year-to-date hours per volunteer, sorted descending
2. **Detail** — Filterable log of individual hour records; supports add/edit/delete
3. **Schedule** — Week view of Pike13 classes; each event block shows
   assigned instructors in green and flags events needing a volunteer in red

### AdminFeedbackPage

**API**: `GET /api/admin/feedback`

Sortable table of guardian feedback submissions: student name, instructor,
month, star rating (1–5), suggestion category, free-text comment, and
submission timestamp.

### FeedbackPage (public)

**API**: `GET /api/feedback/:token`, `POST /api/feedback/:token`

No auth. Token identifies the specific review. Collects:
- Star rating (1–5 clickable stars)
- Suggestion dropdown (pre-defined categories)
- Free-text comment textarea

Inline styles match the League brand colors (orange `#f37121`, dark slate
`#1e293b`). Shows a thank-you confirmation after submission; shows a
"already submitted" message for duplicate tokens.

---

## Shared Components

### `ProtectedRoute`

```tsx
<ProtectedRoute role="instructor"> ... </ProtectedRoute>
<ProtectedRoute role="admin"> ... </ProtectedRoute>
```

Reads `useAuth()`. Blocks render until auth resolves. Redirects on role
mismatch.

### `MonthPicker`

`<select>` listing the last 12 calendar months (`YYYY-MM` values). On
change, pushes `?month=YYYY-MM` into the URL using Wouter's `useLocation`.
Pages read the param with Wouter's `useSearch`.

### `Button` (UI primitive)

Built with `class-variance-authority`. Props:

| Prop | Values | Default |
|------|--------|---------|
| `variant` | `default \| destructive \| outline \| secondary \| ghost \| link` | `default` |
| `size` | `sm \| default \| lg \| icon` | `default` |
| `asChild` | boolean | `false` |

`asChild` uses `@radix-ui/react-slot` to forward props to the child element
(e.g., render as `<a>` without a wrapping `<button>`).

---

## Data Fetching Pattern

All server state is managed with React Query. Pages follow this pattern:

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['reviews', month],
  queryFn: () => fetch(`/api/reviews?month=${month}`).then(r => r.json()),
})
```

Mutations use `useMutation` with `onSuccess` calling
`queryClient.invalidateQueries(...)` to refresh affected queries.

There is no centralized API client; pages call `fetch()` directly at
`/api/*` paths, which Vite proxies to the backend in development.

---

## TypeScript Types

All API response shapes are declared in `client/src/types/`. Pages import
these interfaces directly; no code generation is used.

### `AuthUser`
```typescript
interface AuthUser {
  id: number
  name: string
  email: string
  isAdmin: boolean
  isActiveInstructor: boolean
  instructorId?: number
}
```

### `ReviewDto`
```typescript
type ReviewStatus = 'pending' | 'draft' | 'sent'

interface ReviewDto {
  id: number
  studentId: number
  studentName: string
  githubUsername: string | null
  month: string         // 'YYYY-MM'
  status: ReviewStatus
  subject: string | null
  body: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
}
```

### `TemplateDto`
```typescript
interface TemplateDto {
  id: number
  name: string
  subject: string
  body: string
  createdAt: string
  updatedAt: string
}
```

### `AdminInstructorDto`
```typescript
interface AdminInstructorDto {
  id: number
  name: string
  email: string
  isActive: boolean
  studentCount: number
  ratioBadge: string    // e.g. '1:8'
}
```

### `ComplianceRow`
```typescript
interface ComplianceRow {
  instructorId: number
  name: string
  pending: number
  draft: number
  sent: number
  recentCheckinSubmitted: boolean
}
```

See `client/src/types/` for the full set of DTOs.

---

## Styling Conventions

- **Tailwind CSS v4** is the primary styling mechanism. All layout, spacing,
  color, and typography is expressed as utility classes applied inline.
- **No CSS Modules**. Global `index.css` only imports Tailwind.
- **`App.css`** contains a small set of legacy utility classes (`.card`,
  `.btn-*`, `.counter`) retained for backward compatibility in older page
  components.
- **`FeedbackPage`** uses React inline styles for the public-facing guardian
  form to match League brand colors independent of the Tailwind theme.
- **Color palette:**
  - Primary action: `blue-600`
  - Success / sent: `green-*`
  - Warning / draft: `amber-*`
  - Error / destructive: `red-*`
  - Brand accent: orange `#f37121`
  - Neutral surfaces: `slate-*` grays
- **Responsive breakpoints**: `sm:` and `lg:` used for grid column counts
  and sidebar visibility. The app is desktop-first.

---

## Vite Configuration

```typescript
// vite.config.ts (summary)
plugins: [react(), tailwindcss()]

resolve.alias: { '@': './src' }

server.proxy: {
  '/api': {
    target: process.env.VITE_API_URL ?? 'http://localhost:3000',
    changeOrigin: true,
  }
}

test: {
  environment: 'jsdom',
  // test files resolved from ../tests/client/
}
```

In Docker dev, `VITE_API_URL` is set to `http://server:3000` so the proxy
targets the backend container by service name.
