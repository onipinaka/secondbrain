import { useState } from 'react'
import { Plus, ExternalLink, Trash2, CheckCircle } from 'lucide-react'
import {
  useArticles, useAddArticle, useUpdateArticle, useDeleteArticle,
  type Article,
} from '../../../../hooks/useReading'
import { safeUrl } from '../../../../lib/utils'

type Props = { workspaceId: string }

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  saved: { label: 'Saved', color: 'bg-amber-100 text-amber-600' },
  read: { label: 'Read', color: 'bg-green-100 text-green-700' },
}

function EditCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  if (!editing) {
    return (
      <span
        className="cursor-text block px-1 py-0.5 rounded hover:bg-rose-bg/20 min-h-[1.5rem]"
        onClick={() => { setVal(value); setEditing(true) }}
      >
        {value || <span className="text-text-light text-xs">—</span>}
      </span>
    )
  }

  return (
    <input
      autoFocus
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { onSave(val); setEditing(false) }}
      onKeyDown={e => {
        if (e.key === 'Enter') { onSave(val); setEditing(false) }
        if (e.key === 'Escape') { setVal(value); setEditing(false) }
      }}
      className="border border-rose rounded px-2 py-0.5 text-sm outline-none w-full bg-card"
    />
  )
}

export default function ArticlesTab({ workspaceId: _workspaceId }: Props) {
  const { data: articles = [], isLoading } = useArticles()
  const addArticle = useAddArticle()
  const updateArticle = useUpdateArticle()
  const deleteArticle = useDeleteArticle()

  function update(id: string, patch: Partial<Article>) {
    updateArticle.mutate({ id, ...patch })
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      <div>
        <button
          onClick={() => addArticle.mutate({ title: 'New Article', status: 'saved' })}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90"
        >
          <Plus size={13} /> Add Article
        </button>
      </div>

      <div className="bg-card rounded-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-rose-bg/20">
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Title</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Source</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid w-10">URL</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Tags</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Notes</th>
              <th className="px-3 py-2 w-24" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-text-light text-xs">Loading...</td></tr>
            ) : articles.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-text-light text-xs">No articles yet. Click + to add.</td></tr>
            ) : (
              articles.map(a => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-rose-bg/10">
                  <td className="px-3 py-2 max-w-[200px]">
                    <EditCell value={a.title} onSave={v => update(a.id, { title: v })} />
                  </td>
                  <td className="px-3 py-2">
                    <EditCell value={a.source ?? ''} onSave={v => update(a.id, { source: v || null })} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {a.url ? (
                      <a href={safeUrl(a.url)} target="_blank" rel="noopener noreferrer" className="text-rose hover:opacity-70">
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <EditCell value={''} onSave={v => update(a.id, { url: v || null })} />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={a.status ?? 'saved'}
                      onChange={e => update(a.id, { status: e.target.value })}
                      className={`text-xs px-2 py-0.5 rounded-full border-0 outline-none cursor-pointer ${
                        STATUS_CFG[a.status ?? '']?.color ?? 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {Object.entries(STATUS_CFG).map(([v, c]) => (
                        <option key={v} value={v}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <EditCell
                      value={Array.isArray(a.tags) ? a.tags.join(', ') : ''}
                      onSave={v => update(a.id, { tags: v ? v.split(',').map(t => t.trim()).filter(Boolean) : null })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <EditCell value={a.notes ?? ''} onSave={v => update(a.id, { notes: v || null })} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {a.status !== 'read' && (
                        <button
                          onClick={() => update(a.id, { status: 'read' })}
                          title="Mark Read"
                          className="text-green-500 hover:text-green-600"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteArticle.mutate(a.id)} className="text-text-light hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
