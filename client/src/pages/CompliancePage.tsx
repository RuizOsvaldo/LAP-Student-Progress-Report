import { useQuery } from '@tanstack/react-query'
import { useSearch } from 'wouter'
import { MonthPicker } from '../components/MonthPicker'
import type { ComplianceRow } from '../types/admin'

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

interface ComplianceResponse {
  month: string
  rows: ComplianceRow[]
}

async function fetchCompliance(month: string): Promise<ComplianceResponse> {
  const res = await fetch(`/api/admin/compliance?month=${encodeURIComponent(month)}`)
  if (!res.ok) throw new Error('Failed to load compliance data')
  return res.json()
}

export function CompliancePage() {
  const search = useSearch()
  const params = new URLSearchParams(search)
  const month = params.get('month') ?? getCurrentMonth()

  const { data, isLoading, error } = useQuery<ComplianceResponse>({
    queryKey: ['admin', 'compliance', month],
    queryFn: () => fetchCompliance(month),
  })

  const rows = data?.rows ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Compliance</h1>
        <MonthPicker />
      </div>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-red-600">Failed to load compliance data.</p>}

      {!isLoading && rows.length === 0 && (
        <p className="text-slate-500">No active instructors found.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Instructor</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Pending</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Draft</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Sent</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.instructorId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.pending}</td>
                  <td className="px-4 py-3 text-slate-700">{row.draft}</td>
                  <td className="px-4 py-3 text-slate-700">{row.sent}</td>
                  <td className="px-4 py-3">
                    {row.recentCheckinSubmitted ? (
                      <span className="text-green-600" title="Submitted">✓</span>
                    ) : (
                      <span className="text-red-500" title="Not submitted">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
