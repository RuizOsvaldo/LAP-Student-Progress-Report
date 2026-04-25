import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'wouter'
import { Plus, Edit, Trash } from 'lucide-react'
import type { TemplateDto } from '../types/template'

async function fetchTemplates(): Promise<TemplateDto[]> {
  const res = await fetch('/api/templates')
  if (!res.ok) throw new Error('Failed to load templates')
  return res.json()
}

export function TemplateListPage() {
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading, error } = useQuery<TemplateDto[]>({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete template')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })

  function handleDelete(id: number, name: string) {
    if (window.confirm(`Delete template "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Instructor</div>
          <h2>Templates</h2>
          <p>
            Reusable skeletons for monthly reviews. Variables{' '}
            <span className="var-chip">{'{{studentName}}'}</span> and{' '}
            <span className="var-chip">{'{{month}}'}</span> are replaced on apply.
          </p>
        </div>
        <div className="actions">
          <Link href="/templates/new" className="btn primary">
            <Plus size={15} /> New Template
          </Link>
        </div>
      </div>

      {isLoading && <p style={{ color: 'var(--color-muted)' }}>Loading…</p>}
      {error && <p style={{ color: 'var(--color-danger)' }}>Failed to load templates.</p>}

      {!isLoading && templates.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <p className="muted">No templates yet. Create one to get started.</p>
        </div>
      )}

      {templates.length > 0 && (
        <div className="card card-table">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td><span className="name">{t.name}</span></td>
                  <td className="muted" style={{ maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.subject}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/templates/${t.id}`} className="btn ghost sm">
                      <Edit size={13} />
                    </Link>
                    <button
                      className="btn ghost sm"
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => handleDelete(t.id, t.name)}
                    >
                      <Trash size={13} />
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
