// screens.jsx — the individual page components
function LoginPage({ onLogin }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <BrandMark />
        <h1>League Review Tool</h1>
        <p>Monthly student reviews, TA check-ins, and guardian feedback — all in one place.</p>
        <button className="btn primary lg" onClick={onLogin}><I.Key size={15}/> Sign in with Pike13</button>
        <div className="legal">Only <code>@jointheleague.org</code> accounts are accepted.</div>
      </div>
    </div>
  );
}

function DashboardPage({ go, month, setMonth, badgeStyle }) {
  const { dashboardStats, students, months } = DATA;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Instructor</div>
          <h2>Good afternoon, Alex.</h2>
          <p>April 2026 · 18 students across 3 classes</p>
        </div>
        <div className="actions">
          <MonthPicker value={month} onChange={setMonth} months={months} />
          <button className="btn outline"><I.RefreshCw size={15}/> Sync Pike13</button>
          <button className="btn primary" onClick={() => go('review')}><I.Plus size={15}/> New review</button>
        </div>
      </div>

      <div className="checkin-banner">
        <I.Bell className="bell" />
        <div className="msg"><strong>TA check-in is due this week.</strong> Record attendance for your Tuesday class.</div>
        <button className="btn sm outline">Open check-in</button>
      </div>

      <div className="grid stats" style={{ marginBottom: 20 }}>
        {dashboardStats.map(s => (
          <div key={s.lbl} className="card stat">
            <div className="lbl">{s.lbl}</div>
            <div className="num" style={s.small ? { fontSize: 18, marginTop: 4 } : null}>{s.num}</div>
            {s.delta && <div className={`delta ${s.dir==='down'?'down':''}`}>{s.delta}</div>}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Your students</h3>
            <div className="muted">Click a student to open their review</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Search…" style={{ width: 200 }} />
            <button className="btn outline sm"><I.Download size={14}/> Export</button>
          </div>
        </div>
        <table className="tbl">
          <thead><tr><th>Student</th><th>GitHub</th><th>Class</th><th>Grade</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {students.map(s => (
              <tr key={s.name} className="hover-row" onClick={() => go('review')}>
                <td><span className="name">{s.name}</span></td>
                <td className="muted">@{s.gh}</td>
                <td>{s.class}</td>
                <td className="muted">{s.grade}</td>
                <td><StatusBadge status={s.status} style={badgeStyle} /></td>
                <td style={{ textAlign: 'right' }}><I.ChevronRight className="muted" size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewEditorPage({ go, badgeStyle }) {
  const r = DATA.draftReview;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow"><a href="#" onClick={e=>{e.preventDefault(); go('dashboard');}} style={{color:'inherit'}}>Reviews</a> / {r.studentName}</div>
          <h2>{r.studentName} <span style={{ marginLeft: 8 }}><StatusBadge status={r.status} style={badgeStyle}/></span></h2>
          <p>Java Journeyman · {r.month}</p>
        </div>
        <div className="actions">
          <button className="btn ghost"><I.Mail size={15}/> Send test note</button>
          <button className="btn outline"><I.Save size={15}/> Save draft</button>
          <button className="btn primary"><I.Send size={15}/> Send to guardian</button>
        </div>
      </div>

      <div className="editor-grid">
        <div>
          <div className="form-row">
            <label>Subject</label>
            <input className="input" defaultValue={r.subject} />
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <label>Body</label>
            <div className="editor-toolbar">
              <select className="select" style={{ width: 'auto' }}><option>Apply template…</option>{DATA.templates.map(t=><option key={t.name}>{t.name}</option>)}</select>
              <button className="btn outline sm"><I.GitCommit size={14}/> Generate commit</button>
              <button className="btn outline sm"><I.Sparkles size={14}/> Suggest rewrite</button>
              <div style={{ flex:1 }} />
              <span className="var-chip">{'{{studentName}}'}</span>
              <span className="var-chip">{'{{month}}'}</span>
            </div>
            <textarea className="textarea" defaultValue={r.body} />
          </div>
        </div>
        <div>
          <div className="card">
            <h3>About this review</h3>
            <div className="divider" />
            <div className="kv"><span className="k">Student</span><span className="v">{r.studentName}</span></div>
            <div className="kv"><span className="k">GitHub</span><span className="v">@devono</span></div>
            <div className="kv"><span className="k">Class</span><span className="v">Java Journeyman</span></div>
            <div className="kv"><span className="k">Month</span><span className="v">{r.month}</span></div>
            <div className="kv"><span className="k">Updated</span><span className="v">12 min ago</span></div>
            <div className="kv"><span className="k">Guardian</span><span className="v">parent@okafor.fam</span></div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Recent commits</h3>
            <div className="divider" />
            <div className="sidebar-note">
              <strong>devono / bank-project</strong>
              Add retry logic to FileLoader · 2 days ago
            </div>
            <div className="divider" />
            <div className="sidebar-note">
              <strong>devono / pig-latin</strong>
              Finalize exception handling · 5 days ago
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatesPage({ go }) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Instructor</div>
          <h2>Templates</h2>
          <p>Reusable skeletons for monthly reviews. Variables <span className="var-chip">{'{{studentName}}'}</span> and <span className="var-chip">{'{{month}}'}</span> are replaced on apply.</p>
        </div>
        <div className="actions">
          <button className="btn primary"><I.Plus size={15}/> New template</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Subject</th><th>Preview</th><th>Updated</th><th></th></tr></thead>
          <tbody>
            {DATA.templates.map(t => (
              <tr key={t.name} className="hover-row">
                <td><span className="name">{t.name}</span></td>
                <td className="muted">{t.subject}</td>
                <td className="muted" style={{ maxWidth: 340, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.snippet}</td>
                <td className="muted">{t.updated}</td>
                <td style={{ textAlign:'right', whiteSpace:'nowrap' }}>
                  <button className="btn ghost sm"><I.Edit size={13}/></button>
                  <button className="btn ghost sm" style={{ color: 'var(--color-danger)' }}><I.Trash size={13}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDashboardPage({ go, badgeStyle }) {
  const { adminStats, notifications } = DATA;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Admin</div>
          <h2>Program overview</h2>
          <p>April 2026 · 9 active instructors</p>
        </div>
        <div className="actions">
          <div className="pike-status"><span className="ok"/> Pike13 connected · synced 14m ago</div>
          <button className="btn outline"><I.RefreshCw size={15}/> Sync now</button>
          <button className="btn primary"><I.Send size={15}/> Send review reminders</button>
        </div>
      </div>
      <div className="grid stats" style={{ marginBottom: 20 }}>
        {adminStats.map(s => (
          <div key={s.lbl} className="card stat">
            <div className="lbl">{s.lbl}</div>
            <div className="num" style={s.small ? { fontSize: 18, marginTop: 6 } : null}>{s.num}</div>
            {s.delta && <div className="delta">{s.delta}</div>}
          </div>
        ))}
      </div>
      <div className="grid split-2-1">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0 }}>Compliance snapshot</h3>
            <div className="muted">Reviews + TA check-ins by instructor</div>
          </div>
          <table className="tbl">
            <thead><tr><th>Instructor</th><th>Students</th><th>Pending</th><th>Draft</th><th>Sent</th><th>Check-in</th></tr></thead>
            <tbody>
              {[
                ['Alex Rivera', 18, 7, 4, 7, true],
                ['Lauren Pham', 16, 0, 3, 13, true],
                ['Miguel Ortiz', 12, 4, 2, 6, false],
                ['Sara Hollis',  9, 1, 1, 7, true],
                ['Dana Kwan',    7, 0, 0, 7, true],
              ].map(r => (
                <tr key={r[0]}>
                  <td><span className="name">{r[0]}</span></td>
                  <td className="muted">{r[1]}</td>
                  <td>{r[2]>0 ? <StatusBadge status="pending" style={badgeStyle}/> : <span className="muted">—</span>}</td>
                  <td>{r[3]>0 ? <StatusBadge status="draft" style={badgeStyle}/> : <span className="muted">—</span>}</td>
                  <td><StatusBadge status="sent" style={badgeStyle}/> <span className="muted" style={{marginLeft:6}}>×{r[4]}</span></td>
                  <td>{r[5] ? <span style={{color:'var(--color-success)',display:'inline-flex',alignItems:'center',gap:4}}><I.CheckCircle size={14}/> Done</span> : <span style={{color:'var(--color-danger)'}}>Missing</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Recent activity</h3>
          <div className="divider" />
          {notifications.map(n => (
            <div key={n.msg} style={{ padding: '10px 0', borderBottom: '1px solid var(--slate-100)' }}>
              <div style={{ fontSize: 13, color: 'var(--color-ink)' }}>{n.msg}</div>
              <div className="muted" style={{ fontSize: 12 }}>{n.when}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedbackPage() {
  const [rating, setRating] = React.useState(4);
  const [submitted, setSubmitted] = React.useState(false);
  if (submitted) return (
    <div className="public-page">
      <div className="public-wrap">
        <div className="public-head"><BrandMark/><h1>Thank you!</h1><p>Your feedback was submitted. It goes straight to Alex and the program team.</p></div>
      </div>
    </div>
  );
  return (
    <div className="public-page">
      <div className="public-wrap">
        <div className="public-head">
          <BrandMark />
          <h1>How was Maya's April?</h1>
          <p>Quick feedback for The LEAGUE of Amazing Programmers · Python Apprentice · Alex Rivera</p>
        </div>
        <div className="public-card">
          <div className="form-row">
            <label>Overall, how are things going?</label>
            <div className="star-rating">
              {[1,2,3,4,5].map(n => (
                <button key={n} className={n<=rating?'on':''} onClick={()=>setRating(n)} aria-label={`${n} stars`}>
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
                </button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <label>What would make next month better?</label>
            <select className="select">
              <option>Choose one…</option>
              <option>More hands-on projects</option>
              <option>More practice time</option>
              <option>Slower pace</option>
              <option>Faster pace</option>
              <option>More 1:1 attention</option>
              <option>Different topic focus</option>
            </select>
          </div>
          <div className="form-row">
            <label>Anything else to share? <span className="muted" style={{fontWeight:400}}>(optional)</span></label>
            <textarea className="textarea" style={{minHeight: 120, fontFamily:'inherit', fontSize: 14}} placeholder="Tell us what you're seeing at home…"/>
          </div>
          <button className="btn primary lg" style={{ width: '100%' }} onClick={()=>setSubmitted(true)}>Submit feedback</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginPage, DashboardPage, ReviewEditorPage, TemplatesPage, AdminDashboardPage, FeedbackPage });
