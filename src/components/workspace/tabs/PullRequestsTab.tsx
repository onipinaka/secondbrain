import { useState } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import {
  usePullRequests, useAddPullRequest, useUpdatePullRequest, useDeletePullRequest,
  useRepos,
  type OsPr,
} from '../../../hooks/useOpenSource'
import { safeUrl } from '../../../lib/utils'

type Props = { workspaceId: string }
type EC = { id: number; field: string; value: string }
type Opt = { value: string; label: string; cls: string }

const STATUS_OPTS: Opt[] = [
  { value: 'draft',  label: 'Draft',  cls: 'bg-gray-100 text-gray-500' },
  { value: 'open',   label: 'Open',   cls: 'bg-blue-100 text-blue-600' },
  { value: 'merged', label: 'Merged', cls: 'bg-green-100 text-green-700' },
  { value: 'closed', label: 'Closed', cls: 'bg-red-100 text-red-500' },
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

// ─── PR Detail Panel ──────────────────────────────────────────────────────────

function PRPanel({
  pr,
  onClose,
  onUpdate,
}: {
  pr: OsPr
  onClose: () => void
  onUpdate: (id: number, field: string, val: string | null) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[480px] bg-card border-l border-border flex flex-col h-full overflow-y-auto shadow-xl">
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div>
            <h3 className="font-display text-lg text-text-dark">{pr.title}</h3>
            {pr.os_repos?.repo_name && <p className="text-xs text-text-mid mt-0.5">{pr.os_repos.repo_name}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-light hover:text-text-dark hover:bg-rose-bg transition-colors text-lg leading-none"
          >×</button>
        </div>
        <div className="p-5 space-y-5">
          {pr.link && (
            <a
              href={safeUrl(pr.link)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-rose hover:underline"
            >
              <ExternalLink size={12} /> View on GitHub
            </a>
          )}
          <div>
            <label className="block text-xs text-text-mid font-medium mb-1.5">Notes</label>
            <textarea
              key={`n-${pr.id}`}
              defaultValue={pr.notes ?? ''}
              onBlur={e => onUpdate(pr.id, 'notes', e.target.value || null)}
              rows={5}
              placeholder="Additional notes..."
              className="w-full resize-none bg-cream border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PullRequestsTab({ workspaceId: _workspaceId }: Props) {
  const [ec, setEc] = useState<EC | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newRepoId, setNewRepoId] = useState<number | ''>('')
  const [panelPR, setPanelPR] = useState<OsPr | null>(null)

  const { data: prs = [], isLoading } = usePullRequests()
  const { data: repos = [] } = useRepos()
  const addPR = useAddPullRequest()
  const updatePR = useUpdatePullRequest()
  const deletePR = useDeletePullRequest()

  const stats = {
    total: prs.length,
    merged: prs.filter(p => p.status === 'merged').length,
    open: prs.filter(p => p.status === 'open').length,
    draft: prs.filter(p => p.status === 'draft').length,
  }

  function commit(id: number, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    updatePR.mutate({ id, [field]: v || null } as any)
  }

  const isE = (id: number, f: string) => ec?.id === id && ec?.field === f

  function txt(pr: OsPr, f: keyof OsPr, bold = false) {
    const val = (pr[f] ?? '') as string
    return isE(pr.id, f as string) ? (
      <input
        autoFocus
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
        onBlur={() => commit(pr.id, f as string)}
        onKeyDown={e => { if (e.key === 'Enter') commit(pr.id, f as string); if (e.key === 'Escape') setEc(null) }}
        onClick={e => e.stopPropagation()}
      />
    ) : (
      <span
        className={`cursor-text ${bold ? 'text-text-dark font-medium' : 'text-text-dark text-xs'}`}
        onClick={e => { e.stopPropagation(); setEc({ id: pr.id, field: f as string, value: val }) }}
      >
        {val || <span className="text-text-light">—</span>}
      </span>
    )
  }

  function dt(pr: OsPr, f: keyof OsPr) {
    const val = (pr[f] ?? '') as string
    return isE(pr.id, f as string) ? (
      <input
        autoFocus
        type="date"
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
        onBlur={() => commit(pr.id, f as string)}
        onKeyDown={e => { if (e.key === 'Enter') commit(pr.id, f as string); if (e.key === 'Escape') setEc(null) }}
        onClick={e => e.stopPropagation()}
      />
    ) : (
      <span
        className="cursor-text text-text-dark text-xs"
        onClick={e => { e.stopPropagation(); setEc({ id: pr.id, field: f as string, value: val }) }}
      >
        {val
          ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
          : <span className="text-text-light">—</span>}
      </span>
    )
  }

  function sel(pr: OsPr, f: keyof OsPr, opts: Opt[]) {
    const val = (pr[f] ?? '') as string
    return isE(pr.id, f as string) ? (
      <select
        autoFocus
        className={SEL}
        value={ec!.value}
        onChange={e => commit(pr.id, f as string, e.target.value)}
        onBlur={() => setEc(null)}
        onClick={e => e.stopPropagation()}
      >
        <option value="">—</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <span
        className="cursor-pointer"
        onClick={e => { e.stopPropagation(); setEc({ id: pr.id, field: f as string, value: val }) }}
      >
        <Bdg val={val} opts={opts} />
      </span>
    )
  }

  function handleAdd() {
    if (!newTitle.trim() || !newRepoId) return
    addPR.mutate({ title: newTitle.trim(), repo_id: newRepoId as number }, {
      onSuccess: () => { setNewTitle(''); setNewRepoId(''); setShowAdd(false) },
    })
  }

  return (
    <div className="space-y-0">
      {/* Stats */}
      <div className="px-5 py-3 border-b border-border bg-rose-bg/20 flex items-center gap-5 flex-wrap">
        {[
          { label: 'Total', val: stats.total, color: 'text-text-dark' },
          { label: 'Merged', val: stats.merged, color: 'text-green-600' },
          { label: 'Open', val: stats.open, color: 'text-blue-600' },
          { label: 'Draft', val: stats.draft, color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`font-display text-xl ${s.color}`}>{s.val}</span>
            <span className="text-xs text-text-light">{s.label}</span>
          </div>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
          >
            <Plus size={13} /> Add PR
          </button>
        </div>
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
            placeholder="PR title *"
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
              <th className={`${TH} w-20`}>PR #</th>
              <th className={`${TH} w-36`}>Status</th>
              <th className={`${TH} w-28`}>Opened</th>
              <th className={`${TH} w-28`}>Merged</th>
              <th className={`${TH} w-8`}>URL</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-4 bg-rose-bg/40 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : prs.length === 0
              ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-text-light text-sm">
                    No pull requests yet.
                  </td>
                </tr>
              )
              : prs.map(pr => (
                <tr
                  key={pr.id}
                  className="border-b border-border hover:bg-rose-bg/20 group cursor-pointer"
                  onClick={() => setPanelPR(pr)}
                >
                  <td className="px-3 py-2 min-w-48">{txt(pr, 'title', true)}</td>
                  <td className="px-3 py-2 min-w-28">
                    {isE(pr.id, 'repo_id') ? (
                      <select
                        autoFocus
                        className={SEL}
                        value={ec!.value}
                        onChange={e => {
                          const val = e.target.value
                          setEc(null)
                          updatePR.mutate({ id: pr.id, repo_id: val ? Number(val) : pr.repo_id })
                        }}
                        onBlur={() => setEc(null)}
                        onClick={e => e.stopPropagation()}
                      >
                        {repos.map(r => <option key={r.id} value={r.id}>{r.repo_name}</option>)}
                      </select>
                    ) : (
                      <span
                        className="cursor-pointer text-xs text-text-dark"
                        onClick={e => { e.stopPropagation(); setEc({ id: pr.id, field: 'repo_id', value: String(pr.repo_id) }) }}
                      >
                        {pr.os_repos?.repo_name ?? <span className="text-text-light">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 w-20">
                    {isE(pr.id, 'pr_number') ? (
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
                          updatePR.mutate({ id: pr.id, pr_number: v ? parseInt(v) : null })
                        }}
                        onKeyDown={e => { if (e.key === 'Escape') setEc(null) }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="cursor-text text-text-dark text-xs"
                        onClick={e => { e.stopPropagation(); setEc({ id: pr.id, field: 'pr_number', value: String(pr.pr_number ?? '') }) }}
                      >
                        {pr.pr_number != null ? `#${pr.pr_number}` : <span className="text-text-light">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 w-36">{sel(pr, 'status', STATUS_OPTS)}</td>
                  <td className="px-3 py-2 w-28">{dt(pr, 'opened_at')}</td>
                  <td className="px-3 py-2 w-28">{dt(pr, 'merged_at')}</td>
                  <td className="px-3 py-2 w-8">
                    {pr.link ? (
                      <a
                        href={safeUrl(pr.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-text-mid hover:text-rose transition-colors"
                      >
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span className="text-text-light opacity-30"><ExternalLink size={13} /></span>
                    )}
                  </td>
                  <td className="relative w-10">
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      onClick={e => { e.stopPropagation(); deletePR.mutate(pr.id) }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            }
            <tr>
              <td colSpan={8} className="p-0">
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

      {panelPR && (
        <PRPanel
          pr={panelPR}
          onClose={() => setPanelPR(null)}
          onUpdate={(id, field, val) => updatePR.mutate({ id, [field]: val } as any)}
        />
      )}
    </div>
  )
}
