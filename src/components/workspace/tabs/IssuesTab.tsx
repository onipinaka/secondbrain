import { useState } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import {
  useIssues, useAddIssue, useUpdateIssue, useDeleteIssue,
  useRepos,
  type OsIssue,
} from '../../../hooks/useOpenSource'
import { safeUrl } from '../../../lib/utils'

type Props = { workspaceId: string }
type EC = { id: number; field: string; value: string }
type Opt = { value: string; label: string; cls: string }

const STATUS_OPTS: Opt[] = [
  { value: 'open',        label: 'Open',        cls: 'bg-blue-100 text-blue-600' },
  { value: 'assigned',    label: 'Assigned',    cls: 'bg-purple-100 text-purple-600' },
  { value: 'in_progress', label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  { value: 'solved',      label: 'Solved',      cls: 'bg-green-100 text-green-700' },
  { value: 'abandoned',   label: 'Abandoned',   cls: 'bg-gray-100 text-gray-400' },
]

const DIFFICULTY_OPTS: Opt[] = [
  { value: 'easy',   label: 'Easy',   cls: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', cls: 'bg-amber-100 text-amber-700' },
  { value: 'hard',   label: 'Hard',   cls: 'bg-red-100 text-red-600' },
]

function Bdg({ val, opts }: { val: string | null | undefined; opts: Opt[] }) {
  if (!val) return <span className="text-text-light text-xs">—</span>
  const o = opts.find(x => x.value === val)
  return o
    ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${o.cls}`}>{o.label}</span>
    : <span className="text-text-dark text-xs">{val}</span>
}

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'
const INPUT = 'w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none'
const SEL = 'bg-white border border-rose rounded px-1.5 py-1 text-xs outline-none'

export default function IssuesTab({ workspaceId: _workspaceId }: Props) {
  const [ec, setEc] = useState<EC | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newRepoId, setNewRepoId] = useState<number | ''>('')

  const { data: issues = [], isLoading } = useIssues()
  const { data: repos = [] } = useRepos()
  const addIssue = useAddIssue()
  const updateIssue = useUpdateIssue()
  const deleteIssue = useDeleteIssue()

  function commit(id: number, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    updateIssue.mutate({ id, [field]: v || null } as any)
  }

  const isE = (id: number, f: string) => ec?.id === id && ec?.field === f

  function txt(issue: OsIssue, f: keyof OsIssue, bold = false) {
    const val = (issue[f] ?? '') as string
    return isE(issue.id, f as string) ? (
      <input
        autoFocus
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
        onBlur={() => commit(issue.id, f as string)}
        onKeyDown={e => { if (e.key === 'Enter') commit(issue.id, f as string); if (e.key === 'Escape') setEc(null) }}
        onClick={e => e.stopPropagation()}
      />
    ) : (
      <span
        className={`cursor-text ${bold ? 'text-text-dark font-medium' : 'text-text-dark text-xs'}`}
        onClick={e => { e.stopPropagation(); setEc({ id: issue.id, field: f as string, value: val }) }}
      >
        {val || <span className="text-text-light">—</span>}
      </span>
    )
  }

  function sel(issue: OsIssue, f: keyof OsIssue, opts: Opt[]) {
    const val = (issue[f] ?? '') as string
    return isE(issue.id, f as string) ? (
      <select
        autoFocus
        className={SEL}
        value={ec!.value}
        onChange={e => commit(issue.id, f as string, e.target.value)}
        onBlur={() => setEc(null)}
        onClick={e => e.stopPropagation()}
      >
        <option value="">—</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <span
        className="cursor-pointer"
        onClick={e => { e.stopPropagation(); setEc({ id: issue.id, field: f as string, value: val }) }}
      >
        <Bdg val={val} opts={opts} />
      </span>
    )
  }

  function handleAdd() {
    if (!newTitle.trim() || !newRepoId) return
    addIssue.mutate({ title: newTitle.trim(), repo_id: newRepoId as number }, {
      onSuccess: () => { setNewTitle(''); setNewRepoId(''); setShowAdd(false) },
    })
  }

  return (
    <div className="space-y-0">
      <div className="px-5 py-3 border-b border-border flex items-center justify-end bg-rose-bg/10">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={13} /> Add Issue
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3 flex-wrap">
          <select
            value={newRepoId}
            onChange={e => setNewRepoId(e.target.value ? Number(e.target.value) : '')}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          >
            <option value="">Select repo *</option>
            {repos.map(r => <option key={r.id} value={r.id}>{r.repo_name}</option>)}
          </select>
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Issue title *"
            className="flex-1 min-w-48 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || !newRepoId}
            className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >Add</button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">Cancel</button>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              <th className={TH}>Title</th>
              <th className={TH}>Repo</th>
              <th className={`${TH} w-20`}>Issue #</th>
              <th className={`${TH} w-28`}>Difficulty</th>
              <th className={`${TH} w-32`}>Status</th>
              <th className={`${TH} w-10`}>Assigned</th>
              <th className={`${TH} w-8`}>URL</th>
              <th className={`${TH} w-36`}>Notes</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-4 bg-rose-bg/40 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : issues.length === 0
              ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-text-light text-sm">
                    No issues yet.
                  </td>
                </tr>
              )
              : issues.map(issue => (
                <tr key={issue.id} className="border-b border-border hover:bg-rose-bg/20 group">
                  <td className="px-3 py-2 min-w-48">{txt(issue, 'title', true)}</td>
                  <td className="px-3 py-2 min-w-28">
                    {isE(issue.id, 'repo_id') ? (
                      <select
                        autoFocus
                        className={SEL}
                        value={ec!.value}
                        onChange={e => {
                          const val = e.target.value
                          setEc(null)
                          updateIssue.mutate({ id: issue.id, repo_id: val ? Number(val) : issue.repo_id })
                        }}
                        onBlur={() => setEc(null)}
                        onClick={e => e.stopPropagation()}
                      >
                        {repos.map(r => <option key={r.id} value={r.id}>{r.repo_name}</option>)}
                      </select>
                    ) : (
                      <span
                        className="cursor-pointer text-xs text-text-dark"
                        onClick={e => { e.stopPropagation(); setEc({ id: issue.id, field: 'repo_id', value: String(issue.repo_id) }) }}
                      >
                        {issue.os_repos?.repo_name ?? <span className="text-text-light">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 w-20">
                    {isE(issue.id, 'issue_number') ? (
                      <input
                        autoFocus
                        type="number"
                        className={INPUT}
                        style={{ width: 64 }}
                        value={ec!.value}
                        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                        onBlur={() => {
                          const v = ec?.value
                          setEc(null)
                          updateIssue.mutate({ id: issue.id, issue_number: v ? parseInt(v) : null })
                        }}
                        onKeyDown={e => { if (e.key === 'Escape') setEc(null) }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="cursor-text text-text-dark text-xs"
                        onClick={e => { e.stopPropagation(); setEc({ id: issue.id, field: 'issue_number', value: String(issue.issue_number ?? '') }) }}
                      >
                        {issue.issue_number != null ? `#${issue.issue_number}` : <span className="text-text-light">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 w-28">{sel(issue, 'difficulty', DIFFICULTY_OPTS)}</td>
                  <td className="px-3 py-2 w-32">{sel(issue, 'status', STATUS_OPTS)}</td>
                  <td className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={!!issue.is_assigned}
                      onChange={e => {
                        e.stopPropagation()
                        updateIssue.mutate({ id: issue.id, is_assigned: e.target.checked })
                      }}
                      onClick={e => e.stopPropagation()}
                      className="cursor-pointer accent-rose"
                    />
                  </td>
                  <td className="px-3 py-2 w-8">
                    {issue.link ? (
                      <a
                        href={safeUrl(issue.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-mid hover:text-rose transition-colors"
                      >
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span className="text-text-light opacity-30"><ExternalLink size={13} /></span>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-[144px]">
                    <div className="line-clamp-1">{txt(issue, 'notes')}</div>
                  </td>
                  <td className="relative w-10">
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      onClick={() => deleteIssue.mutate(issue.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            }
            <tr>
              <td colSpan={9} className="p-0">
                <button
                  className="w-full py-2 bg-rose-bg/30 hover:bg-rose-bg text-text-light hover:text-rose transition-colors flex items-center justify-center"
                  onClick={() => setShowAdd(true)}
                >
                  <Plus size={14} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
