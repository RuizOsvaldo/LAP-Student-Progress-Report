import { Link, useLocation } from 'wouter'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/instructors', label: 'Instructors' },
  { href: '/admin/compliance', label: 'Compliance' },
  { href: '/admin/volunteer-hours', label: 'Volunteer Hours' },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation()

  return (
    <div className="flex min-h-screen">
      <nav className="w-52 shrink-0 border-r border-slate-200 bg-white p-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Admin
        </p>
        <ul className="space-y-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = location === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`block rounded px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
