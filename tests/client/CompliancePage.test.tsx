import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { CompliancePage } from '../../client/src/pages/CompliancePage'
import type { ComplianceRow } from '../../client/src/types/admin'

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

function renderPage(path = '/admin/compliance') {
  const { hook } = memoryLocation({ path })
  return render(
    <QueryClientProvider client={makeClient()}>
      <Router hook={hook}>
        <CompliancePage />
      </Router>
    </QueryClientProvider>,
  )
}

const ROWS: ComplianceRow[] = [
  { instructorId: 1, name: 'Alice Smith', pending: 2, draft: 1, sent: 3, recentCheckinSubmitted: true },
  { instructorId: 2, name: 'Bob Jones', pending: 0, draft: 0, sent: 5, recentCheckinSubmitted: false },
]

function mockFetch(rows: ComplianceRow[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if ((url as string).includes('/api/admin/compliance')) {
        const month = new URL(url, 'http://localhost').searchParams.get('month') ?? '2026-03'
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ month, rows }),
        })
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`))
    }),
  )
}

describe('CompliancePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders compliance table rows from mocked API response', async () => {
    mockFetch(ROWS)
    renderPage()

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()

    // Check numeric columns for Alice: pending=2, draft=1, sent=3
    const twos = screen.getAllByText('2')
    expect(twos.length).toBeGreaterThan(0)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows check-in status icons', async () => {
    mockFetch(ROWS)
    renderPage()

    await screen.findByText('Alice Smith')
    // ✓ for submitted, ✗ for not submitted
    expect(screen.getByTitle('Submitted')).toBeInTheDocument()
    expect(screen.getByTitle('Not submitted')).toBeInTheDocument()
  })

  it('month picker select changes query parameter', async () => {
    mockFetch(ROWS)
    const { hook, navigate } = memoryLocation({ path: '/admin/compliance' })
    render(
      <QueryClientProvider client={makeClient()}>
        <Router hook={hook}>
          <CompliancePage />
        </Router>
      </QueryClientProvider>,
    )

    await screen.findByText('Alice Smith')

    const select = screen.getByRole('combobox', { name: /Select month/i })
    // Pick an option that differs from the current selected value
    const options = Array.from(select.querySelectorAll('option'))
    const altOption = options.find((o) => o.value !== (select as HTMLSelectElement).value)!

    await userEvent.selectOptions(select, altOption.value)

    await waitFor(() => {
      // fetch should have been called with the new month param
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as [[string]]
      const monthCalls = calls.filter(([url]) => url.includes('month='))
      expect(monthCalls.length).toBeGreaterThan(0)
    })
  })
})
