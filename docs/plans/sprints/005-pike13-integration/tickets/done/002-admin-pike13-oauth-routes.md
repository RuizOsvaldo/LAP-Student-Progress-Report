---
id: "002"
title: Admin Pike13 OAuth routes
status: done
use-cases:
- SUC-001
depends-on:
- "001"
---

# Admin Pike13 OAuth routes

## Description

Add three admin-only routes to `server/src/routes/admin.ts` to support the
one-time Pike13 OAuth connection flow. All routes require `isAdmin` middleware.

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/pike13/connect` | Redirect to Pike13 authorization URL |
| GET | `/api/admin/pike13/callback` | Exchange code for tokens; store; redirect to `/admin` |
| GET | `/api/admin/pike13/status` | Return `{ connected: boolean }` |

**Connect route:** redirect to:
```
https://pike13.com/oauth/authorize?client_id=PIKE13_CLIENT_ID&redirect_uri=PIKE13_CALLBACK_URL&response_type=code
```

**Callback route:**
1. Extract `code` from query string
2. POST to Pike13 token endpoint to exchange for `access_token`, `refresh_token`, `expires_in`
3. Delete any existing row in `pike13_admin_token`
4. Insert new row with tokens and computed `expiresAt`
5. Redirect to `/admin`

**Status route:** return `{ connected: true }` if a `pike13_admin_token` row
exists, `{ connected: false }` otherwise.

**Secrets** — add to `secrets/dev.env.example` and `secrets/prod.env.example`:
- `PIKE13_CLIENT_ID`
- `PIKE13_CLIENT_SECRET`
- `PIKE13_CALLBACK_URL` (dev: `http://localhost:3000/api/admin/pike13/callback`)

## Acceptance Criteria

- [ ] `GET /api/admin/pike13/connect` returns 302 to Pike13 URL with correct params
- [ ] `GET /api/admin/pike13/connect` returns 401 for non-admin users
- [ ] `GET /api/admin/pike13/callback` stores tokens and redirects to `/admin`
- [ ] `GET /api/admin/pike13/callback` replaces any existing token row (idempotent)
- [ ] `GET /api/admin/pike13/status` returns `{ connected: false }` when no token exists
- [ ] `GET /api/admin/pike13/status` returns `{ connected: true }` when token exists
- [ ] `PIKE13_CLIENT_ID`, `PIKE13_CLIENT_SECRET`, `PIKE13_CALLBACK_URL` added to both example files

## Testing

- **Existing tests to run**: `npm run test:server`
- **New tests to write**: `tests/server/pike13OAuth.test.ts`
  - `GET /api/admin/pike13/connect` as admin → 302, Location contains `pike13.com/oauth/authorize`
  - `GET /api/admin/pike13/connect` as non-admin → 401
  - `GET /api/admin/pike13/callback` with mocked token exchange → stores token, redirects to `/admin`
  - `GET /api/admin/pike13/callback` called twice → only one token row in DB
  - `GET /api/admin/pike13/status` with no token → `{ connected: false }`
  - `GET /api/admin/pike13/status` with token → `{ connected: true }`
- **Verification command**: `npm run test:server`
