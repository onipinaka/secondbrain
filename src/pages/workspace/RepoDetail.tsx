import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Plus, ChevronDown, ChevronRight, GitPullRequest, Bug, Star, GitBranch } from 'lucide-react'
import {
  useRepo, useUpdateRepo,
  useIssues, useAddIssue, useUpdateIssue, useDeleteIssue,
  usePullRequests, useAddPullRequest, useUpdatePullRequest, useDeletePullRequest,
  type OsIssue, type OsPr,
} from '../../hooks/useOpenSource'
import BlockEditor from '../../components/shared/BlockEditor'
import { safeUrl } from '../../lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

type Opt = { value: string; label: string; cls: string }

const REPO_STATUS_OPTS: Opt[] = [
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

function Bdg({ val, opts, onChange }: { val: string | null | undefined; opts: Opt[]; onChange?: (v: string) => void }) {
  const o = opts.find(x => x.value === val)
  if (!onChange) {
    if (!val) return <span className="text-text-light text-xs">—</span>
    return o
      ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${o.cls}`}>{o.label}</span>
      : <span className="text-text-dark text-xs">{val}</span>
  }
  return (
    <select
      value={val ?? ''}
      onChange={e => onChange(e.target.value)}
      className={`text-[11px] font-medium rounded-full px-2 py-0.5 border-0 outline-none cursor-pointer ${o ? o.cls : 'bg-gray-100 text-gray-500'}`}
    >
      <option value="">—</option>
      {opts.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
    </select>
  )
}

// ─── Issue Card ───────────────────────────────────────────────────────────────

function IssueCard({ issue, onUpdate, onDelete }: {
  issue: OsIssue
  onUpdate: (patch: Partial<OsIssue>) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(v => !v)} className="text-text-light hover:text-text-dark flex-shrink-0">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="flex-1 min-w-0">
          <input
            defaultValue={issue.title}
            onBlur={e => onUpdate({ title: e.target.value || issue.title })}
            className="w-full text-sm font-medium text-text-dark bg-transparent outline-none focus:bg-rose-bg/20 rounded px-1 -ml-1"
          />
          {issue.issue_number != null && (
            <span className="text-[11px] text-text-light">#{issue.issue_number}</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <Bdg val={issue.status} opts={ISSUE_STATUS_OPTS} onChange={v => onUpdate({ status: v || null })} />
          <Bdg val={issue.difficulty} opts={DIFFICULTY_OPTS} onChange={v => onUpdate({ difficulty: v || null })} />
          {issue.link ? (
            <a href={safeUrl(issue.link)} target="_blank" rel="noopener noreferrer"
              className="text-text-light hover:text-rose transition-colors">
              <ExternalLink size={13} />
            </a>
          ) : null}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="text-[11px] text-text-light hover:text-red-400">✕</button>
          ) : (
            <span className="flex items-center gap-1">
              <button onClick={onDelete} className="text-[11px] text-red-500 font-medium">Delete?</button>
              <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-text-light">Cancel</button>
            </span>
          )}
        </div>
      </div>

      {/* Expanded: link + notes block editor */}
      {open && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-background/50">
          {/* Issue URL */}
          <div>
            <label className="block text-[11px] text-text-mid font-medium mb-1">Issue URL</label>
            <input
              defaultValue={issue.link ?? ''}
              onBlur={e => onUpdate({ link: e.target.value || null })}
              placeholder="https://github.com/.../issues/..."
              className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
            />
          </div>
          {/* Number + Assigned */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-text-mid font-medium">Issue #</label>
              <input
                type="number"
                defaultValue={issue.issue_number ?? ''}
                onBlur={e => onUpdate({ issue_number: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="—"
                className="w-20 text-xs bg-card border border-border rounded-lg px-2 py-1.5 outline-none focus:border-rose"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-text-mid font-medium">Assigned</label>
              <input
                type="checkbox"
                checked={!!issue.is_assigned}
                onChange={e => onUpdate({ is_assigned: e.target.checked })}
                className="cursor-pointer accent-rose"
              />
            </div>
          </div>
          {/* Block editor for this issue's notes */}
          <div>
            <label className="block text-[11px] text-text-mid font-medium mb-2">Notes</label>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <BlockEditor entityType="os_issue" entityId={String(issue.id)} workspaceId={String(issue.repo_id)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PR Card ──────────────────────────────────────────────────────────────────

function PRCard({ pr, onUpdate, onDelete }: {
  pr: OsPr
  onUpdate: (patch: Partial<OsPr>) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setOpen(v => !v)} className="text-text-light hover:text-text-dark flex-shrink-0">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className="flex-1 min-w-0">
          <input
            defaultValue={pr.title}
            onBlur={e => onUpdate({ title: e.target.value || pr.title })}
            className="w-full text-sm font-medium text-text-dark bg-transparent outline-none focus:bg-rose-bg/20 rounded px-1 -ml-1"
          />
          {pr.pr_number != null && <span className="text-[11px] text-text-light">#{pr.pr_number}</span>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Bdg val={pr.status} opts={PR_STATUS_OPTS} onChange={v => onUpdate({ status: v || null })} />
          {pr.link ? (
            <a href={safeUrl(pr.link)} target="_blank" rel="noopener noreferrer"
              className="text-text-light hover:text-rose transition-colors">
              <ExternalLink size={13} />
            </a>
          ) : null}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="text-[11px] text-text-light hover:text-red-400">✕</button>
          ) : (
            <span className="flex items-center gap-1">
              <button onClick={onDelete} className="text-[11px] text-red-500 font-medium">Delete?</button>
              <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-text-light">Cancel</button>
            </span>
          )}
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-background/50">
          {/* PR URL */}
          <div>
            <label className="block text-[11px] text-text-mid font-medium mb-1">PR URL</label>
            <input
              defaultValue={pr.link ?? ''}
              onBlur={e => onUpdate({ link: e.target.value || null })}
              placeholder="https://github.com/.../pull/..."
              className="w-full text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
            />
          </div>
          {/* PR number + dates */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-text-mid font-medium">PR #</label>
              <input
                type="number"
                defaultValue={pr.pr_number ?? ''}
                onBlur={e => onUpdate({ pr_number: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="—"
                className="w-20 text-xs bg-card border border-border rounded-lg px-2 py-1.5 outline-none focus:border-rose"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-text-mid font-medium">Opened</label>
              <input
                type="date"
                defaultValue={pr.opened_at?.slice(0, 10) ?? ''}
                onBlur={e => onUpdate({ opened_at: e.target.value || null })}
                className="text-xs bg-card border border-border rounded-lg px-2 py-1.5 outline-none focus:border-rose"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-text-mid font-medium">Merged</label>
              <input
                type="date"
                defaultValue={pr.merged_at?.slice(0, 10) ?? ''}
                onBlur={e => onUpdate({ merged_at: e.target.value || null })}
                className="text-xs bg-card border border-border rounded-lg px-2 py-1.5 outline-none focus:border-rose"
              />
            </div>
          </div>
          {/* Block editor */}
          <div>
            <label className="block text-[11px] text-text-mid font-medium mb-2">Notes</label>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <BlockEditor entityType="os_pr" entityId={String(pr.id)} workspaceId={String(pr.repo_id)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RepoDetail() {
  const { repoId } = useParams<{ repoId: string }>()
  const navigate = useNavigate()
  const id = Number(repoId)

  const { data: repo, isLoading } = useRepo(id)
  const { data: allIssues = [] } = useIssues()
  const { data: allPRs = [] } = usePullRequests()

  const updateRepo = useUpdateRepo()
  const addIssue = useAddIssue()
  const updateIssue = useUpdateIssue()
  const deleteIssue = useDeleteIssue()
  const addPR = useAddPullRequest()
  const updatePR = useUpdatePullRequest()
  const deletePR = useDeletePullRequest()

  const issues = useMemo(() => allIssues.filter(i => i.repo_id === id), [allIssues, id])
  const prs = useMemo(() => allPRs.filter(p => p.repo_id === id), [allPRs, id])

  const [newIssueTitle, setNewIssueTitle] = useState('')
  const [addingIssue, setAddingIssue] = useState(false)
  const [newPRTitle, setNewPRTitle] = useState('')
  const [addingPR, setAddingPR] = useState(false)
  const [activeTab, setActiveTab] = useState<'issues' | 'prs' | 'notes'>('issues')

  const openIssues = issues.filter(i => !['solved', 'abandoned'].includes(i.status ?? ''))
  const openPRs = prs.filter(p => ['draft', 'open'].includes(p.status ?? ''))

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-8 bg-rose-bg/30 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (!repo) {
    return (
      <div className="p-8 text-center text-text-light">
        <p>Repo not found.</p>
        <button onClick={() => navigate('/w/open-source')} className="mt-3 text-rose text-sm hover:underline">← Back to Open Source</button>
      </div>
    )
  }

  function patch(field: string, val: unknown) {
    updateRepo.mutate({ id: repo!.id, [field]: val } as any)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="border-b border-border bg-card px-6 py-5">
        {/* Back */}
        <button
          onClick={() => navigate('/w/open-source')}
          className="flex items-center gap-1.5 text-xs text-text-mid hover:text-rose transition-colors mb-4"
        >
          <ArrowLeft size={13} /> Open Source
        </button>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-rose-bg/60 flex items-center justify-center flex-shrink-0">
            <GitBranch size={22} className="text-rose" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Name */}
            <input
              key={`name-${repo.id}`}
              defaultValue={repo.repo_name}
              onBlur={e => patch('repo_name', e.target.value || repo.repo_name)}
              className="font-display text-2xl text-text-dark bg-transparent outline-none focus:bg-rose-bg/20 rounded px-1 -ml-1 w-full"
            />
            {/* Owner path */}
            <div className="flex items-center gap-2 mt-1">
              <input
                key={`owner-${repo.id}`}
                defaultValue={repo.owner ?? ''}
                onBlur={e => patch('owner', e.target.value || null)}
                placeholder="owner"
                className="text-xs text-text-mid bg-transparent outline-none focus:bg-rose-bg/20 rounded px-1 -ml-1 w-32"
              />
              {repo.owner && <span className="text-text-light text-xs">/</span>}
              <span className="text-xs text-text-mid">{repo.repo_name}</span>
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Bdg val={repo.status} opts={REPO_STATUS_OPTS} onChange={v => patch('status', v || null)} />
              <Bdg val={repo.priority} opts={PRIORITY_OPTS} onChange={v => patch('priority', v || null)} />
              <Bdg val={repo.difficulty} opts={DIFFICULTY_OPTS} onChange={v => patch('difficulty', v || null)} />
              {repo.github_link && (
                <a href={safeUrl(repo.github_link)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-rose hover:underline">
                  <ExternalLink size={11} /> GitHub
                </a>
              )}
            </div>
          </div>

          {/* Right meta column */}
          <div className="flex-shrink-0 text-right space-y-1.5 min-w-[160px]">
            <div className="flex items-center gap-2 justify-end">
              <Star size={12} className="text-yellow-500" />
              <input
                type="number"
                key={`stars-${repo.id}`}
                defaultValue={repo.stars ?? ''}
                onBlur={e => patch('stars', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Stars"
                className="w-24 text-xs text-right text-text-dark bg-transparent outline-none focus:bg-rose-bg/20 rounded px-1"
              />
            </div>
            <div className="text-[11px] text-text-mid">
              <span className="text-green-600 font-medium">{openIssues.length}</span> open issues ·{' '}
              <span className="text-blue-600 font-medium">{openPRs.length}</span> open PRs
            </div>
          </div>
        </div>

        {/* Theme / Tech / GitHub URL row */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div>
            <label className="block text-[10px] text-text-mid font-medium uppercase tracking-wide mb-1">Theme / Domain</label>
            <input
              key={`theme-${repo.id}`}
              defaultValue={repo.theme ?? ''}
              onBlur={e => patch('theme', e.target.value || null)}
              placeholder="e.g. devtools / ai / web"
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-rose"
            />
          </div>
          <div>
            <label className="block text-[10px] text-text-mid font-medium uppercase tracking-wide mb-1">Tech Stack</label>
            <input
              key={`ts-${repo.id}`}
              defaultValue={repo.tech_stack?.join(', ') ?? ''}
              onBlur={e => {
                const arr = e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : null
                patch('tech_stack', arr)
              }}
              placeholder="TypeScript, React, ..."
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-rose"
            />
          </div>
          <div>
            <label className="block text-[10px] text-text-mid font-medium uppercase tracking-wide mb-1">GitHub URL</label>
            <input
              key={`gh-${repo.id}`}
              defaultValue={repo.github_link ?? ''}
              onBlur={e => patch('github_link', e.target.value || null)}
              placeholder="https://github.com/..."
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-rose"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-[10px] text-text-mid font-medium uppercase tracking-wide mb-1">Description / Why Interested</label>
          <textarea
            key={`desc-${repo.id}`}
            defaultValue={repo.description ?? ''}
            onBlur={e => patch('description', e.target.value || null)}
            rows={2}
            placeholder="What do you want to learn or contribute?"
            className="w-full resize-none text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-1">
          {([
            { key: 'issues', label: `Issues (${issues.length})`, Icon: Bug },
            { key: 'prs',    label: `Pull Requests (${prs.length})`, Icon: GitPullRequest },
            { key: 'notes',  label: 'Notes', Icon: null },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors ${
                activeTab === t.key
                  ? 'border-rose text-rose font-medium'
                  : 'border-transparent text-text-mid hover:text-text-dark'
              }`}
            >
              {t.Icon && <t.Icon size={13} />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="px-6 py-6 max-w-4xl">

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base text-text-dark">Issues</h2>
                <p className="text-xs text-text-mid">{openIssues.length} active · {issues.filter(i => i.status === 'solved').length} solved</p>
              </div>
              <button
                onClick={() => setAddingIssue(true)}
                className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
              >
                <Plus size={13} /> Add Issue
              </button>
            </div>

            {addingIssue && (
              <div className="flex gap-2 items-center">
                <input
                  autoFocus
                  value={newIssueTitle}
                  onChange={e => setNewIssueTitle(e.target.value)}
                  placeholder="Issue title *"
                  className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newIssueTitle.trim()) {
                      addIssue.mutate({ title: newIssueTitle.trim(), repo_id: id }, {
                        onSuccess: () => { setNewIssueTitle(''); setAddingIssue(false) },
                      })
                    }
                    if (e.key === 'Escape') { setAddingIssue(false); setNewIssueTitle('') }
                  }}
                />
                <button
                  onClick={() => {
                    if (newIssueTitle.trim()) {
                      addIssue.mutate({ title: newIssueTitle.trim(), repo_id: id }, {
                        onSuccess: () => { setNewIssueTitle(''); setAddingIssue(false) },
                      })
                    }
                  }}
                  className="bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
                >Add</button>
                <button onClick={() => { setAddingIssue(false); setNewIssueTitle('') }}
                  className="text-xs text-text-mid border border-border px-3 py-2 rounded-lg">Cancel</button>
              </div>
            )}

            {issues.length === 0 ? (
              <div className="py-16 text-center text-text-light">
                <Bug size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No issues yet. Add one to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {issues.map(issue => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onUpdate={patch => updateIssue.mutate({ id: issue.id, ...patch } as any)}
                    onDelete={() => deleteIssue.mutate(issue.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRs Tab */}
        {activeTab === 'prs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base text-text-dark">Pull Requests</h2>
                <p className="text-xs text-text-mid">
                  {openPRs.length} open · {prs.filter(p => p.status === 'merged').length} merged
                </p>
              </div>
              <button
                onClick={() => setAddingPR(true)}
                className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
              >
                <Plus size={13} /> Add PR
              </button>
            </div>

            {addingPR && (
              <div className="flex gap-2 items-center">
                <input
                  autoFocus
                  value={newPRTitle}
                  onChange={e => setNewPRTitle(e.target.value)}
                  placeholder="PR title *"
                  className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newPRTitle.trim()) {
                      addPR.mutate({ title: newPRTitle.trim(), repo_id: id }, {
                        onSuccess: () => { setNewPRTitle(''); setAddingPR(false) },
                      })
                    }
                    if (e.key === 'Escape') { setAddingPR(false); setNewPRTitle('') }
                  }}
                />
                <button
                  onClick={() => {
                    if (newPRTitle.trim()) {
                      addPR.mutate({ title: newPRTitle.trim(), repo_id: id }, {
                        onSuccess: () => { setNewPRTitle(''); setAddingPR(false) },
                      })
                    }
                  }}
                  className="bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
                >Add</button>
                <button onClick={() => { setAddingPR(false); setNewPRTitle('') }}
                  className="text-xs text-text-mid border border-border px-3 py-2 rounded-lg">Cancel</button>
              </div>
            )}

            {prs.length === 0 ? (
              <div className="py-16 text-center text-text-light">
                <GitPullRequest size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No PRs yet. Add one to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {prs.map(pr => (
                  <PRCard
                    key={pr.id}
                    pr={pr}
                    onUpdate={patch => updatePR.mutate({ id: pr.id, ...patch } as any)}
                    onDelete={() => deletePR.mutate(pr.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            <h2 className="font-display text-base text-text-dark mb-4">Repo Notes</h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <BlockEditor entityType="os_repo" entityId={String(repo.id)} workspaceId={String(repo.id)} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
