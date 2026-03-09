import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import App from '../../client/src/App'
import type { AuthUser } from '../../client/src/types/auth'

function renderAt(path: string, mockUser: AuthUser | null = null) {
  const { hook, navigate } = memoryLocation({ path, static: false })
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  if (mockUser !== null) {
    qc.setQueryData(['auth', 'me'], mockUser)
  } else {
    qc.setQueryData(['auth', 'me'], null)
  }
  const view = render(
    <QueryClientProvider client={qc}>
      <Router hook={hook}>
        <App />
      </Router>
    </QueryClientProvider>,
  )
  return { view, navigate, qc }
}

const ADMIN: AuthUser = {
  id: 0, name: 'Admin', email: 'a@t', isAdmin: true, isActiveInstructor: false,
}
const INSTRUCTOR: AuthUser = {
  id: 1, name: 'Instr', email: 'i@t', isAdmin: false, isActiveInstructor: true, instructorId: 1,
}

describe('Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('unauthenticated /dashboard renders login page', () => {
    renderAt('/dashboard', null)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('authenticated instructor /dashboard renders dashboard page', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) })))
    renderAt('/dashboard', INSTRUCTOR)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('authenticated admin /admin renders admin dashboard', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve([]) })))
    renderAt('/admin', ADMIN)
    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('404 for unknown route', () => {
    renderAt('/totally-unknown-route', null)
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})
