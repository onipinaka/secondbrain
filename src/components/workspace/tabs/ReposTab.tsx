import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, ExternalLink, GitPullRequest, Bug, ChevronRight } from 'lucide-react'
import {
  useRepos, useAddRepo, useUpdateRepo, useDeleteRepo,
  useIssues, useUpdateIssue, useAddIssue,
  usePullRequests, useUpdatePullRequest, useAddPullRequest,
  type OsRepo, type OsIssue, type OsPr,
} from '../../../hooks/useOpenSource'
import BlockEditor from '../../shared/BlockEditor'
import { safeUrl } from '../../../lib/utils'

type Props = { workspaceId: string }
type EC = { id: number; field: string; value: string }
type Opt = { value: string; label: string; cls: string }

const STATUS_OPTS: Opt[] = [
  { value: 'exploring',    label: 'Exploring',    cls: 'bg-gray-100 text-gray-500' },
  { value: 'contributing', label: 'Contributing', cls: 'bg-green-100 text-green-700' },
  { value: 'paused',       label: 'Paused',       cls: 'bg-amber-100 text-amber-600' },
  { value: 'done',         label: 'Done',         cls: 'bg-blue-100 text-blue-600' },
]

const DIFFICULTY_OPTS: Opt[] = [
  { value: 'easy',   label: 'Easy',   cls: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', cls: 'bg-amber-100 text-amber-700' },
  { value: 'hard',   label: 'Hard',   cls: 'bg-red-100 text-red-600' },
]

const PRIORITY_OPTS: Opt[] = [
  { value: 'low',    label: 'Low',    cls: 'bg-gray-100 text-gray-500' },
  { value: 'medium', label: 'Medium', cls: 'bg-amber-100 text-amber-700' },
  { value: 'high',   label: 'High',   cls: 'bg-red-100 text-red-600' },
]

const ISSUE_STATUS_OPTS: Opt[] = [
  { value: 'open',        label: 'Open',        cls: 'bg-blue-100 text-blue-600' },
  { value: 'assigned',    label: 'Assigned',    cls: 'bg-purple-100 text-purple-600' },
  { value: 'in_progress', label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  { value: 'solved',      label: 'Solved',      cls: 'bg-green-100 text-green-700' },
  { value: 'abandoned',   label: 'Abandoned',   cls: 'bg-gray-100 text-gray-400' },
]

const PR_STATUS_OPTS: Opt[] = [
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

// ─── Add Repo Modal ────────────────────────────────────────────────────────────

const EMPTY_ADD = {
  repo_name: '', owner: '', github_link: '', theme: '',
  tech_stack: '', stars: '', status: '', difficulty: '', priority: '', notes: '',
}

function AddRepoModal({ onClose, onAdd }: { onClose: () => void; onAdd: (f: typeof EMPTY_ADD) => void }) {
  const [form, setForm] = useState(EMPTY_ADD)
  const f = (k: keyof typeof EMPTY_ADD) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-card rounded-card border border-border shadow-xl w-[520px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-display text-base text-text-dark">Add Repository</h2>
          <button onClick={onClose} className="text-text-light hover:text-text-dark text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs text-text-mid font-medium mb-1">Repo Name <span className="text-rose">*</span></label>
            <input autoFocus value={form.repo_name} onChange={f('repo_name')} placeholder="e.g. Next.js"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">Owner / Org</label>
              <input value={form.owner} onChange={f('owner')} placeholder="e.g. vercel"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
            </div>
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">GitHub URL</label>
              <input value={form.github_link} onChange={f('github_link')} placeholder="https://github.com/..."
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">Theme / Domain</label>
              <input value={form.theme} onChange={f('theme')} placeholder="e.g. devtools / ai"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
            </div>
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">Stars</label>
              <input type="number" value={form.stars} onChange={f('stars')} placeholder="0"
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-mid font-medium mb-1">Tech Stack (comma-separated)</label>
            <input value={form.tech_stack} onChange={f('tech_stack')} placeholder="e.g. TypeScript, React, Node.js"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">Status</label>
              <select value={form.status} onChange={f('status')}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose">
                <option value="">—</option>
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={f('difficulty')}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose">
                <option value="">—</option>
                {DIFFICULTY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-mid font-medium mb-1">Priority</label>
              <select value={form.priority} onChange={f('priority')}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose">
                <option value="">—</option>
                {PRIORITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-mid font-medium mb-1">Notes</label>
            <textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Quick note..."
              className="w-full resize-none text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-3 sticky bottom-0 bg-card">
          <button
            onClick={() => onAdd(form)}
            disabled={!form.repo_name.trim()}
            className="flex-1 bg-rose text-white text-sm py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >Add Repository</button>
          <button onClick={onClose} className="px-4 text-sm text-text-mid border border-border rounded-lg hover:bg-rose-bg">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Repo Detail Panel ────────────────────────────────────────────────────────

function IssueRow({
  issue,
  onUpdateStatus,
  onUpdateNotes,
}: {
  issue: OsIssue
  onUpdateStatus: (id: number, status: string) => void
  onUpdateNotes: (id: number, notes: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-rose-bg/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <ChevronRight size={13} className={`text-text-light flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        <div className="flex-1 min-w-0">
          <span className="text-sm text-text-dark font-medium truncate">
            {issue.title}
            {issue.issue_number != null && <span className="text-text-light font-normal ml-1.5 text-xs">#{issue.issue_number}</span>}
          </span>
        </div>
        <select
          value={issue.status ?? ''}
          onClick={e => e.stopPropagation()}
          onChange={e => onUpdateStatus(issue.id, e.target.value)}
          className="text-[10px] bg-transparent border border-border rounded px-1.5 py-0.5 outline-none text-text-mid"
        >
          <option value="">Status</option>
          {ISSUE_STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Bdg val={issue.difficulty} opts={DIFFICULTY_OPTS} />
        {issue.link && (
          <a href={safeUrl(issue.link)} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-text-light hover:text-rose flex-shrink-0">
            <ExternalLink size={12} />
          </a>
        )}
      </div>
      {expanded && (
        <div className="border-t border-border px-3 py-2.5 bg-rose-bg/5">
          <label className="block text-[10px] text-text-mid font-medium mb-1">Notes</label>
          <textarea
            key={`issue-notes-${issue.id}`}
            defaultValue={issue.notes ?? ''}
            onBlur={e => onUpdateNotes(issue.id, e.target.value)}
            rows={3}
            placeholder="Notes on this issue..."
            className="w-full resize-none text-xs bg-card border border-border rounded-lg px-2.5 py-2 outline-none focus:border-rose"
          />
        </div>
      )}
    </div>
  )
}

function PRRow({ pr, onUpdateStatus }: { pr: OsPr; onUpdateStatus: (id: number, status: string) => void }) {
  return (
    <div className="flex items-center gap-3 border border-border rounded-lg px-3 py-2.5 hover:bg-rose-bg/10 transition-colors">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-text-dark font-medium truncate">
          {pr.title}
          {pr.pr_number != null && <span className="text-text-light font-normal ml-1.5 text-xs">#{pr.pr_number}</span>}
        </span>
      </div>
      <select
        value={pr.status ?? ''}
        onChange={e => onUpdateStatus(pr.id, e.target.value)}
        className="text-[10px] bg-transparent border border-border rounded px-1.5 py-0.5 outline-none text-text-mid"
      >
        <option value="">Status</option>
        {PR_STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Bdg val={pr.status} opts={PR_STATUS_OPTS} />
      {pr.link && (
        <a href={safeUrl(pr.link)} target="_blank" rel="noopener noreferrer"
          className="text-text-light hover:text-rose flex-shrink-0">
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  )
}

function RepoDetailPanel({
  repo,
  workspaceId,
  allIssues,
  allPRs,
  onClose,
  onUpdateRepo,
  onUpdateIssue,
  onUpdatePR,
  onAddIssue,
  onAddPR,
}: {
  repo: OsRepo
  workspaceId: string
  allIssues: OsIssue[]
  allPRs: OsPr[]
  onClose: () => void
  onUpdateRepo: (id: number, field: string, val: unknown) => void
  onUpdateIssue: (id: number, patch: Partial<OsIssue>) => void
  onUpdatePR: (id: number, patch: Partial<OsPr>) => void
  onAddIssue: (title: string) => void
  onAddPR: (title: string) => void
}) {
  const issues = useMemo(() => allIssues.filter(i => i.repo_id === repo.id), [allIssues, repo.id])
  const prs = useMemo(() => allPRs.filter(p => p.repo_id === repo.id), [allPRs, repo.id])
  const [newIssueTitle, setNewIssueTitle] = useState('')
  const [newPRTitle, setNewPRTitle] = useState('')
  const [addingIssue, setAddingIssue] = useState(false)
  const [addingPR, setAddingPR] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[600px] bg-card border-l border-border flex flex-col h-full shadow-xl">
        {/* Header */}
        <div className="p-5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl text-text-dark truncate">{repo.repo_name}</h3>
              {repo.owner && <p className="text-xs text-text-mid mt-0.5">{repo.owner} / {repo.repo_name}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Bdg val={repo.status} opts={STATUS_OPTS} />
                <Bdg val={repo.priority} opts={PRIORITY_OPTS} />
                <Bdg val={repo.difficulty} opts={DIFFICULTY_OPTS} />
                {repo.github_link && (
                  <a href={safeUrl(repo.github_link)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-rose hover:underline">
                    <ExternalLink size={11} /> GitHub
                  </a>
                )}
              </div>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-text-light hover:text-text-dark hover:bg-rose-bg transition-colors text-xl leading-none">
              ×
            </button>
          </div>
          {/* Quick meta */}
          <div className="flex items-center gap-4 mt-3 text-[11px] text-text-mid flex-wrap">
            {repo.theme && <span>Theme: <span className="text-text-dark">{repo.theme}</span></span>}
            {repo.tech_stack?.length ? <span>Stack: <span className="text-text-dark">{repo.tech_stack.join(', ')}</span></span> : null}
            {repo.stars != null && <span>Stars: <span className="text-text-dark">⭐ {repo.stars.toLocaleString()}</span></span>}
            <span>Issues: <span className="text-text-dark">{issues.length}</span></span>
            <span>PRs: <span className="text-text-dark">{prs.length}</span></span>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Description */}
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <label className="block text-xs text-text-mid font-medium mb-1.5">Description</label>
            <textarea
              key={`desc-${repo.id}`}
              defaultValue={repo.description ?? ''}
              onBlur={e => onUpdateRepo(repo.id, 'description', e.target.value || null)}
              rows={2}
              placeholder="What do you want to learn or contribute?"
              className="w-full resize-none bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
            />
          </div>

          {/* Issues */}
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bug size={14} className="text-amber-500" />
                <span className="text-sm font-medium text-text-dark">Issues</span>
                <span className="text-xs text-text-light bg-rose-bg/50 rounded-full px-1.5 py-0.5">{issues.length}</span>
              </div>
              <button
                onClick={() => setAddingIssue(true)}
                className="flex items-center gap-1 text-xs text-rose hover:underline"
              >
                <Plus size={11} /> Add Issue
              </button>
            </div>
            {addingIssue && (
              <div className="flex gap-2 mb-3">
                <input
                  autoFocus
                  value={newIssueTitle}
                  onChange={e => setNewIssueTitle(e.target.value)}
                  placeholder="Issue title"
                  className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-rose"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newIssueTitle.trim()) { onAddIssue(newIssueTitle.trim()); setNewIssueTitle(''); setAddingIssue(false) }
                    if (e.key === 'Escape') { setAddingIssue(false); setNewIssueTitle('') }
                  }}
                />
                <button
                  onClick={() => { if (newIssueTitle.trim()) { onAddIssue(newIssueTitle.trim()); setNewIssueTitle(''); setAddingIssue(false) } }}
                  className="text-xs bg-rose text-white px-3 py-1.5 rounded-lg hover:opacity-90"
                >Add</button>
                <button onClick={() => { setAddingIssue(false); setNewIssueTitle('') }}
                  className="text-xs text-text-mid border border-border px-2 py-1.5 rounded-lg">×</button>
              </div>
            )}
            {issues.length === 0 ? (
              <p className="text-xs text-text-light text-center py-4">No issues for this repo yet.</p>
            ) : (
              <div className="space-y-2">
                {issues.map(issue => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    onUpdateStatus={(id, status) => onUpdateIssue(id, { status })}
                    onUpdateNotes={(id, notes) => onUpdateIssue(id, { notes: notes || null })}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pull Requests */}
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GitPullRequest size={14} className="text-blue-500" />
                <span className="text-sm font-medium text-text-dark">Pull Requests</span>
                <span className="text-xs text-text-light bg-rose-bg/50 rounded-full px-1.5 py-0.5">{prs.length}</span>
              </div>
              <button
                onClick={() => setAddingPR(true)}
                className="flex items-center gap-1 text-xs text-rose hover:underline"
              >
                <Plus size={11} /> Add PR
              </button>
            </div>
            {addingPR && (
              <div className="flex gap-2 mb-3">
                <input
                  autoFocus
                  value={newPRTitle}
                  onChange={e => setNewPRTitle(e.target.value)}
                  placeholder="PR title"
                  className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-rose"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newPRTitle.trim()) { onAddPR(newPRTitle.trim()); setNewPRTitle(''); setAddingPR(false) }
                    if (e.key === 'Escape') { setAddingPR(false); setNewPRTitle('') }
                  }}
                />
                <button
                  onClick={() => { if (newPRTitle.trim()) { onAddPR(newPRTitle.trim()); setNewPRTitle(''); setAddingPR(false) } }}
                  className="text-xs bg-rose text-white px-3 py-1.5 rounded-lg hover:opacity-90"
                >Add</button>
                <button onClick={() => { setAddingPR(false); setNewPRTitle('') }}
                  className="text-xs text-text-mid border border-border px-2 py-1.5 rounded-lg">×</button>
              </div>
            )}
            {prs.length === 0 ? (
              <p className="text-xs text-text-light text-center py-4">No PRs for this repo yet.</p>
            ) : (
              <div className="space-y-2">
                {prs.map(pr => (
                  <PRRow
                    key={pr.id}
                    pr={pr}
                    onUpdateStatus={(id, status) => onUpdatePR(id, { status })}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Block Notes */}
          <div className="px-5 pt-4 pb-6">
            <label className="block text-xs text-text-mid font-medium mb-2">Notes</label>
            <BlockEditor entityType="repo" entityId={String(repo.id)} workspaceId={workspaceId} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReposTab({ workspaceId }: Props) {
  const [ec, setEc] = useState<EC | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [panelRepo, setPanelRepo] = useState<OsRepo | null>(null)

  const { data: repos = [], isLoading } = useRepos()
  const { data: allIssues = [] } = useIssues()
  const { data: allPRs = [] } = usePullRequests()
  const addRepo = useAddRepo()
  const updateRepo = useUpdateRepo()
  const deleteRepo = useDeleteRepo()
  const updateIssue = useUpdateIssue()
  const updatePR = useUpdatePullRequest()
  const addIssue = useAddIssue()
  const addPR = useAddPullRequest()

  function commit(id: number, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    updateRepo.mutate({ id, [field]: v || null } as any)
  }

  const isE = (id: number, f: string) => ec?.id === id && ec?.field === f

  function txt(repo: OsRepo, f: keyof OsRepo) {
    const val = (repo[f] ?? '') as string
    return isE(repo.id, f as string) ? (
      <input
        autoFocus
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
        onBlur={() => commit(repo.id, f as string)}
        onKeyDown={e => { if (e.key === 'Enter') commit(repo.id, f as string); if (e.key === 'Escape') setEc(null) }}
      />
    ) : (
      <span
        className="cursor-text text-text-dark text-xs"
        onClick={() => setEc({ id: repo.id, field: f as string, value: val })}
      >
        {val || <span className="text-text-light">—</span>}
      </span>
    )
  }

  function sel(repo: OsRepo, f: keyof OsRepo, opts: Opt[]) {
    const val = (repo[f] ?? '') as string
    return isE(repo.id, f as string) ? (
      <select
        autoFocus
        className={SEL}
        value={ec!.value}
        onChange={e => commit(repo.id, f as string, e.target.value)}
        onBlur={() => setEc(null)}
      >
        <option value="">—</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <span className="cursor-pointer" onClick={() => setEc({ id: repo.id, field: f as string, value: val })}>
        <Bdg val={val} opts={opts} />
      </span>
    )
  }

  function handleAdd(form: typeof EMPTY_ADD) {
    if (!form.repo_name.trim()) return
    const techArr = form.tech_stack
      ? form.tech_stack.split(',').map(s => s.trim()).filter(Boolean)
      : null
    addRepo.mutate({
      repo_name: form.repo_name.trim(),
      owner: form.owner || null,
      github_link: form.github_link || null,
      theme: form.theme || null,
      stars: form.stars ? parseInt(form.stars) : null,
      tech_stack: techArr,
      status: form.status || null,
      difficulty: form.difficulty || null,
      priority: form.priority || null,
      notes: form.notes || null,
    }, { onSuccess: () => setShowAdd(false) })
  }

  return (
    <div className="space-y-0">
      {/* Stats bar */}
      <div className="px-5 py-3 border-b border-border bg-rose-bg/20 flex items-center gap-6 flex-wrap">
        {[
          { label: 'Total repos',  val: repos.length,                                          color: 'text-text-dark' },
          { label: 'Contributing', val: repos.filter(r => r.status === 'contributing').length, color: 'text-green-600' },
          { label: 'Exploring',    val: repos.filter(r => r.status === 'exploring').length,    color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`font-display text-xl ${s.color}`}>{s.val}</span>
            <span className="text-xs text-text-light">{s.label}</span>
          </div>
        ))}
        <div className="ml-auto">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90">
            <Plus size={13} /> Add Repo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              <th className={TH}>Name</th>
              <th className={TH}>Owner</th>
              <th className={TH}>Theme</th>
              <th className={`${TH} w-24`}>Stars</th>
              <th className={`${TH} w-32`}>Status</th>
              <th className={`${TH} w-28`}>Difficulty</th>
              <th className={`${TH} w-28`}>Priority</th>
              <th className={`${TH} w-10`}>Active</th>
              <th className={`${TH} w-8`}>URL</th>
              <th className={`${TH} w-36`}>Notes</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-4 bg-rose-bg/40 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : repos.length === 0
              ? (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center text-text-light text-sm">
                    No repos yet. Click "Add Repo" to start.
                  </td>
                </tr>
              )
              : repos.map(repo => (
                <tr key={repo.id} className="border-b border-border hover:bg-rose-bg/10 group">
                  {/* Name — links to full repo detail page */}
                  <td className="px-3 py-2 min-w-36">
                    <Link
                      to={`/os/repo/${repo.id}`}
                      className="text-sm font-medium text-text-dark hover:text-rose transition-colors"
                    >
                      {repo.repo_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 min-w-24">{txt(repo, 'owner')}</td>
                  <td className="px-3 py-2 min-w-24">{txt(repo, 'theme')}</td>
                  <td className="px-3 py-2 w-24">
                    {isE(repo.id, 'stars') ? (
                      <input
                        autoFocus
                        type="number"
                        className={INPUT}
                        style={{ width: 80 }}
                        value={ec!.value}
                        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                        onBlur={() => {
                          const v = ec?.value
                          setEc(null)
                          updateRepo.mutate({ id: repo.id, stars: v ? parseInt(v) : null })
                        }}
                        onKeyDown={e => { if (e.key === 'Escape') setEc(null) }}
                      />
                    ) : (
                      <span
                        className="cursor-text text-text-dark text-xs flex items-center gap-1"
                        onClick={() => setEc({ id: repo.id, field: 'stars', value: String(repo.stars ?? '') })}
                      >
                        {repo.stars != null
                          ? <><span className="text-yellow-500">⭐</span>{repo.stars.toLocaleString()}</>
                          : <span className="text-text-light">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 w-32">{sel(repo, 'status', STATUS_OPTS)}</td>
                  <td className="px-3 py-2 w-28">{sel(repo, 'difficulty', DIFFICULTY_OPTS)}</td>
                  <td className="px-3 py-2 w-28">{sel(repo, 'priority', PRIORITY_OPTS)}</td>
                  <td className="px-3 py-2 w-10">
                    <input
                      type="checkbox"
                      checked={!!repo.is_assigned}
                      onChange={e => updateRepo.mutate({ id: repo.id, is_assigned: e.target.checked })}
                      className="cursor-pointer accent-rose"
                    />
                  </td>
                  <td className="px-3 py-2 w-8">
                    {repo.github_link ? (
                      <a href={safeUrl(repo.github_link)} target="_blank" rel="noopener noreferrer"
                        className="text-text-mid hover:text-rose transition-colors">
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span className="text-text-light opacity-30 cursor-pointer hover:opacity-60"
                        onClick={() => setEc({ id: repo.id, field: 'github_link', value: '' })}>
                        <ExternalLink size={13} />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-[128px]">
                    <div className="line-clamp-1">{txt(repo, 'notes')}</div>
                  </td>
                  <td className="px-3 py-2 w-20">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => deleteRepo.mutate(repo.id)}
                        className="text-text-light hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
            <tr>
              <td colSpan={11} className="p-0">
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

      {showAdd && (
        <AddRepoModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}

      {panelRepo && (
        <RepoDetailPanel
          repo={panelRepo}
          workspaceId={workspaceId}
          allIssues={allIssues}
          allPRs={allPRs}
          onClose={() => setPanelRepo(null)}
          onUpdateRepo={(id, field, val) => updateRepo.mutate({ id, [field]: val } as any)}
          onUpdateIssue={(id, patch) => updateIssue.mutate({ id, ...patch } as any)}
          onUpdatePR={(id, patch) => updatePR.mutate({ id, ...patch } as any)}
          onAddIssue={title => addIssue.mutate({ title, repo_id: panelRepo.id })}
          onAddPR={title => addPR.mutate({ title, repo_id: panelRepo.id })}
        />
      )}
    </div>
  )
}
