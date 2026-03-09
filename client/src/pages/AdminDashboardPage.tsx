import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AdminNotificationDto } from '../types/admin'

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

export function AdminDashboardPage() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading, error } = useQuery<AdminNotificationDto[]>({
    queryKey: ['admin', 'notifications'],
    queryFn: () => fetchNotifications(),
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
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
    </div>
  )
}
