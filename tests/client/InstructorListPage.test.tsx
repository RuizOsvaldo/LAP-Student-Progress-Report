import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { InstructorListPage } from '../../client/src/pages/InstructorListPage'
import type { AdminInstructorDto } from '../../client/src/types/admin'

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

function renderPage() {
  const { hook } = memoryLocation({ path: '/admin/instructors' })
  return render(
    <QueryClientProvider client={makeClient()}>
      <Router hook={hook}>
        <InstructorListPage />
      </Router>
    </QueryClientProvider>,
  )
}

const INSTRUCTORS: AdminInstructorDto[] = [
  { id: 1, userId: 10, name: 'Alice Smith', email: 'alice@example.com', isActive: true, studentCount: 8, ratioBadge: 'ok' },
  { id: 2, userId: 11, name: 'Bob Jones', email: 'bob@example.com', isActive: false, studentCount: 15, ratioBadge: 'warning' },
  { id: 3, userId: 12, name: 'Carol Lee', email: 'carol@example.com', isActive: true, studentCount: 25, ratioBadge: 'alert' },
]

function mockFetch(instructors: AdminInstructorDto[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, opts?: RequestInit) => {
      if (opts?.method === 'PATCH' && (url as string).includes('/api/admin/instructors/')) {
        const body = JSON.parse(opts.body as string)
        const id = parseInt((url as string).split('/').pop()!)
        const instr = instructors.find((i) => i.id === id)!
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...instr, ...body }) })
      }
      if ((url as string).includes('/api/admin/instructors')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(instructors) })
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`))
    }),
  )
}

describe('InstructorListPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders instructor rows with name, email, active badge', async () => {
    mockFetch(INSTRUCTORS)
    renderPage()

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()

    // Active badges
    const activeBadges = screen.getAllByText('Active')
    expect(activeBadges.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('ratio badge shows yellow class for warning', async () => {
    mockFetch(INSTRUCTORS)
    renderPage()

    await screen.findByText('Bob Jones')
    const warningBadge = screen.getByText('warning')
    expect(warningBadge.className).toContain('bg-yellow-100')
    expect(warningBadge.className).toContain('text-yellow-800')
  })

  it('ratio badge shows red class for alert', async () => {
    mockFetch(INSTRUCTORS)
    renderPage()

    await screen.findByText('Carol Lee')
    const alertBadge = screen.getByText('alert')
    expect(alertBadge.className).toContain('bg-red-100')
    expect(alertBadge.className).toContain('text-red-800')
  })

  it('Deactivate button fires PATCH /api/admin/instructors/:id with isActive false', async () => {
    const patchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ ...INSTRUCTORS[0], isActive: false }) }),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, opts?: RequestInit) => {
        if (opts?.method === 'PATCH') return patchMock(url, opts)
        return Promise.resolve({ ok: true, json: () => Promise.resolve(INSTRUCTORS) })
      }),
    )

    renderPage()
    // Alice (id=1) is active — button says "Deactivate"
    const buttons = await screen.findAllByRole('button', { name: /Deactivate/i })
    await userEvent.click(buttons[0])

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalled()
      const [[calledUrl, calledOpts]] = patchMock.mock.calls as [[string, RequestInit]]
      expect(calledUrl).toMatch(/\/api\/admin\/instructors\/1/)
      expect(JSON.parse(calledOpts.body as string)).toEqual({ isActive: false })
    })
  })

  it('Activate button fires PATCH /api/admin/instructors/:id with isActive true', async () => {
    const patchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ ...INSTRUCTORS[1], isActive: true }) }),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, opts?: RequestInit) => {
        if (opts?.method === 'PATCH') return patchMock(url, opts)
        return Promise.resolve({ ok: true, json: () => Promise.resolve(INSTRUCTORS) })
      }),
    )

    renderPage()
    // Bob (id=2) is inactive — button says "Activate"
    const btn = await screen.findByRole('button', { name: /^Activate$/ })
    await userEvent.click(btn)

    await waitFor(() => {
      expect(patchMock).toHaveBeenCalled()
      const [[calledUrl, calledOpts]] = patchMock.mock.calls as [[string, RequestInit]]
      expect(calledUrl).toMatch(/\/api\/admin\/instructors\/2/)
      expect(JSON.parse(calledOpts.body as string)).toEqual({ isActive: true })
    })
  })
})
