import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AdminInstructorDto } from '../types/admin'

async function fetchInstructors(): Promise<AdminInstructorDto[]> {
  const res = await fetch('/api/admin/instructors')
  if (!res.ok) throw new Error('Failed to load instructors')
  return res.json()
}

async function toggleInstructor(id: number, isActive: boolean): Promise<AdminInstructorDto> {
  const res = await fetch(`/api/admin/instructors/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  })
  if (!res.ok) throw new Error('Failed to update instructor')
  return res.json()
}

const BADGE_CLASS: Record<string, string> = {
  ok: '',
  warning: 'bg-yellow-100 text-yellow-800',
  alert: 'bg-red-100 text-red-800',
}

export function InstructorListPage() {
  const queryClient = useQueryClient()

  const { data: instructors = [], isLoading, error } = useQuery<AdminInstructorDto[]>({
    queryKey: ['admin', 'instructors'],
    queryFn: fetchInstructors,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleInstructor(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] }),
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Instructors</h1>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-red-600">Failed to load instructors.</p>}

      {!isLoading && instructors.length === 0 && (
        <p className="text-slate-500">No instructors found.</p>
      )}

      {instructors.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Students</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Ratio</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {instructors.map((instr) => (
                <tr key={instr.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{instr.name}</td>
                  <td className="px-4 py-3 text-slate-600">{instr.email}</td>
                  <td className="px-4 py-3 text-slate-700">{instr.studentCount}</td>
                  <td className="px-4 py-3">
                    {instr.ratioBadge !== 'ok' ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_CLASS[instr.ratioBadge]}`}
                      >
                        {instr.ratioBadge}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        instr.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {instr.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        toggleMutation.mutate({ id: instr.id, isActive: !instr.isActive })
                      }
                      disabled={toggleMutation.isPending}
                      className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    >
                      {instr.isActive ? 'Deactivate' : 'Activate'}
                    </button>
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
