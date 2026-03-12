import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AdminNotificationDto } from '../types/admin'
import type { Pike13StatusDto, Pike13SyncResultDto } from '../types/pike13'

async function fetchNotifications(unreadOnly = false): Promise<AdminNotificationDto[]> {
  const url = unreadOnly
    ? '/api/admin/notifications?unread=true'
    : '/api/admin/notifications'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load notifications')
  return res.json()
}

async function markRead(id: number): Promise<void> {
  const res = await fetch(`/api/admin/notifications/${id}/read`, { method: 'PATCH' })
  if (!res.ok) throw new Error('Failed to mark notification as read')
}

async function fetchPike13Status(): Promise<Pike13StatusDto> {
  const res = await fetch('/api/admin/pike13/status')
  if (!res.ok) throw new Error('Failed to load Pike13 status')
  return res.json()
}

async function triggerPike13Sync(): Promise<Pike13SyncResultDto> {
  const res = await fetch('/api/admin/sync/pike13', { method: 'POST' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error ?? 'Sync failed')
  }
  return res.json()
}

export function AdminDashboardPage() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading, error } = useQuery<AdminNotificationDto[]>({
    queryKey: ['admin', 'notifications'],
    queryFn: () => fetchNotifications(),
  })

  const { data: pike13Status } = useQuery<Pike13StatusDto>({
    queryKey: ['admin', 'pike13', 'status'],
    queryFn: fetchPike13Status,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
  })

  const syncMutation = useMutation({
    mutationFn: triggerPike13Sync,
  })

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        {unreadCount > 0 && (
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </div>

      {isLoading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-red-600">Failed to load notifications.</p>}

      {!isLoading && notifications.length === 0 && (
        <p className="text-slate-500">No notifications.</p>
      )}

      {notifications.length > 0 && (
        <ul className="space-y-3">
          {notifications
            .filter((n) => !n.isRead)
            .map((n) => (
              <li
                key={n.id}
                className="flex items-start justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{n.fromUserName}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => markReadMutation.mutate(n.id)}
                  disabled={markReadMutation.isPending}
                  className="ml-4 shrink-0 rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  Mark as Read
                </button>
              </li>
            ))}
        </ul>
      )}

      {/* Pike13 section */}
      {pike13Status !== undefined && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">Pike13</h2>

          {pike13Status.connected ? (
            <div className="space-y-3">
              <p className="font-medium text-green-600">Pike13: Connected</p>
              <button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {syncMutation.isPending ? 'Syncing…' : 'Sync Pike13'}
              </button>
              {syncMutation.isSuccess && syncMutation.data && (
                <p className="text-sm text-slate-700">
                  Synced: {syncMutation.data.studentsUpserted} students,{' '}
                  {syncMutation.data.assignmentsCreated} assignments,{' '}
                  {syncMutation.data.hoursCreated} hours
                </p>
              )}
              {syncMutation.isError && (
                <p className="text-sm text-red-600">
                  {(syncMutation.error as Error).message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600">Pike13: Not Connected</p>
              <button
                onClick={() => { window.location.href = '/api/admin/pike13/connect' }}
                className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Connect Pike13
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
