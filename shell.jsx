// shell.jsx — Sidebar, TopBar, layout wrappers
function BrandMark({ size }) {
  return <div className="brand-mark" style={size ? { width: size, height: size, fontSize: size * .48, borderRadius: size * .24 } : null}>L</div>;
}

function Sidebar({ route, onNav, theme, user }) {
  const instructorLinks = [
    { id: 'dashboard',  label: 'Dashboard',  icon: 'Home' },
    { id: 'reviews',    label: 'Reviews',    icon: 'FileText' },
    { id: 'templates',  label: 'Templates',  icon: 'LayoutTemplate' },
    { id: 'checkin',    label: 'Check-in',   icon: 'ClipboardCheck' },
  ];
  const adminLinks = [
    { id: 'admin',            label: 'Overview',       icon: 'BarChart' },
    { id: 'admin-instructors',label: 'Instructors',    icon: 'Users' },
    { id: 'admin-compliance', label: 'Compliance',     icon: 'Shield' },
    { id: 'admin-feedback',   label: 'Feedback',       icon: 'MessageSquare' },
  ];
  const isAdminRoute = route.startsWith('admin');

  return (
    <aside className="sidebar" data-theme={theme}>
      <div className="brand">
        <BrandMark />
        <div>
          <div className="brand-name">League Review Tool</div>
          <div className="brand-sub">Instructor portal</div>
        </div>
      </div>

      <div className="side-section">
        <h5>Instructor</h5>
        {instructorLinks.map(l => (
          <button key={l.id} className="nav-item" aria-current={route === l.id ? 'page' : undefined} onClick={() => onNav(l.id)}>
            {I[l.icon] && React.createElement(I[l.icon], { className: 'nav-ico' })}
            {l.label}
          </button>
        ))}
      </div>

      {user.isAdmin && (
        <div className="side-section">
          <h5>Admin</h5>
          {adminLinks.map(l => (
            <button key={l.id} className="nav-item" aria-current={route === l.id ? 'page' : undefined} onClick={() => onNav(l.id)}>
              {I[l.icon] && React.createElement(I[l.icon], { className: 'nav-ico' })}
              {l.label}
            </button>
          ))}
        </div>
      )}

      <div className="sync-box">
        <div className="sync-head"><I.RefreshCw size={14} /> Pike13 sync</div>
        <small>Last synced 14 min ago · 18 students</small>
        <button className="sync-btn"><I.RefreshCw size={13} /> Sync now</button>
      </div>
    </aside>
  );
}

function TopBar({ title, crumb, user, onSignOut }) {
  return (
    <div className="topbar">
      <div>
        {crumb && <div className="crumb">{crumb}</div>}
        <h1>{title}</h1>
      </div>
      <div className="spacer" />
      <button className="btn ghost sm" title="Notifications"><I.Bell size={15} /></button>
      <div className="user-chip">
        <div className="avatar">{user.initials}</div>
        <span>{user.name}</span>
      </div>
    </div>
  );
}

function MonthPicker({ value, onChange, months }) {
  return (
    <select className="select" value={value} onChange={e => onChange(e.target.value)} style={{ width: 'auto' }}>
      {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
    </select>
  );
}

function StatusBadge({ status, style = 'soft' }) {
  const label = status[0].toUpperCase() + status.slice(1);
  const cls = style === 'solid' ? `badge solid ${status}` : style === 'outline' ? `badge outline ${status}` : `badge ${status}`;
  return <span className={cls}><span className="dot" />{label}</span>;
}

Object.assign(window, { Sidebar, TopBar, MonthPicker, StatusBadge, BrandMark });
