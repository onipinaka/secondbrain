import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, GitBranch, Globe, LayoutGrid, List, Calendar } from 'lucide-react'
import {
  useProjects, useAllProjectFeatures, useAddProject,
  type Project,
} from '../../../hooks/useProjects'
import { safeUrl } from '../../../lib/utils'

type Props = { workspaceId: string }

type FilterKey = 'all' | 'active' | 'launched' | 'paused'

const CATEGORY_OPTS = [
  { value: 'web',        label: 'Web App' },
  { value: 'mobile',     label: 'Mobile App' },
  { value: 'saas',       label: 'SaaS' },
  { value: 'cli',        label: 'CLI Tool' },
  { value: 'library',    label: 'Library' },
  { value: 'automation', label: 'Automation' },
  { value: 'tool',       label: 'Tool' },
  { value: 'other',      label: 'Other' },
]

const STATUS_OPTS = [
  { value: 'ideation',  label: 'Ideation' },
  { value: 'building',  label: 'Building' },
  { value: 'testing',   label: 'Testing' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped',   label: 'Dropped' },
  { value: 'paused',    label: 'Paused' },
]

const FILTERS: { key: FilterKey; label: string; dot?: string; emoji?: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active',   dot: 'bg-green-500' },
  { key: 'launched', label: 'Launched', emoji: '🚀' },
  { key: 'paused',   label: 'Paused',   dot: 'bg-amber-400' },
]

function matchesFilter(status: string | null, filter: FilterKey): boolean {
  if (filter === 'all') return true
  if (filter === 'active') return status === 'building' || status === 'testing' || status === 'ideation'
  if (filter === 'launched') return status === 'completed'
  if (filter === 'paused') return status === 'paused' || status === 'dropped'
  return true
}

function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case 'building':
    case 'testing':
    case 'ideation':
      return (
        <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Active
        </span>
      )
    case 'completed':
      return <span className="text-[10px] font-medium text-purple-600">🚀 Launched</span>
    case 'paused':
      return (
        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Paused
        </span>
      )
    case 'dropped':
      return (
        <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
          Dropped
        </span>
      )
    default:
      return null
  }
}

function fmtDate(d: string | null) {
  if (!d) return null
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getCategoryLabel(category: string | null) {
  if (!category) return null
  return CATEGORY_OPTS.find(o => o.value === category)?.label ?? category
}

function ProjectCard({
  project,
  progress,
}: {
  project: Project
  progress: number
}) {
  const navigate = useNavigate()
  const categoryLabel = getCategoryLabel(project.category)
  const techPills = (project.tech_stack ?? []).slice(0, 5)
  const startDate = fmtDate(project.start_date)
  const targetDate = fmtDate(project.target_date)

  return (
    <div
      className="bg-card rounded-card border border-border p-5 flex flex-col gap-3 hover:shadow-sm hover:border-rose/30 transition-all cursor-pointer"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      {/* Category + Status row */}
      <div className="flex items-center justify-between">
        {categoryLabel ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-bg text-rose">
            {categoryLabel}
          </span>
        ) : <span />}
        <StatusBadge status={project.status} />
      </div>

      {/* Name */}
      <div>
        <h3 className="font-display text-xl font-bold text-text-dark leading-tight">{project.name}</h3>
        {project.description && (
          <p className="text-text-light text-xs mt-1.5 line-clamp-2 leading-relaxed">{project.description}</p>
        )}
      </div>

      {/* Tech stack pills */}
      {techPills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {techPills.map(t => (
            <span key={t} className="inline-block px-2 py-0.5 rounded-full bg-rose-bg/50 text-text-mid text-[10px]">
              {t}
            </span>
          ))}
          {(project.tech_stack?.length ?? 0) > 5 && (
            <span className="text-[10px] text-text-light">+{(project.tech_stack?.length ?? 0) - 5}</span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-2 mt-auto">
        <div className="flex-1 h-[5px] bg-rose/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-text-dark shrink-0 min-w-[36px] text-right">
          {progress}%
        </span>
      </div>

      {/* Footer: dates + links */}
      <div className="flex items-end justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-4">
          {startDate && (
            <div>
              <div className="flex items-center gap-1 text-text-mid text-[11px] font-medium">
                <Calendar size={10} className="text-text-light" />
                {startDate}
              </div>
              <div className="text-[9px] text-text-light uppercase tracking-wide mt-0.5">Start Date</div>
            </div>
          )}
          {targetDate && (
            <div>
              <div className="flex items-center gap-1 text-text-mid text-[11px] font-medium">
                <Calendar size={10} className="text-text-light" />
                {targetDate}
              </div>
              <div className="text-[9px] text-text-light uppercase tracking-wide mt-0.5">Target Date</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {project.github_link && (
            <a
              href={safeUrl(project.github_link)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-text-light hover:text-text-dark transition-colors"
              title="GitHub"
            >
              <GitBranch size={13} />
            </a>
          )}
          {project.deployed_link && (
            <a
              href={safeUrl(project.deployed_link)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-text-light hover:text-text-dark transition-colors"
              title="Live"
            >
              <Globe size={13} />
            </a>
          )}
          <button
            className="text-rose text-[11px] font-semibold hover:underline"
            onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}`) }}
          >
            Open →
          </button>
        </div>
      </div>
    </div>
  )
}

function NewProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-card rounded-card border-2 border-dashed border-border hover:border-rose/40 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 min-h-[260px] group"
    >
      <div className="w-12 h-12 rounded-full bg-rose flex items-center justify-center group-hover:scale-105 transition-transform">
        <Plus size={22} className="text-white" />
      </div>
      <div className="text-center">
        <p className="font-display text-base font-semibold text-text-dark">New Project</p>
        <p className="text-text-light text-xs mt-0.5">Start building something amazing.</p>
      </div>
    </button>
  )
}

export default function ProjectsTab({ workspaceId: _workspaceId }: Props) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [listView, setListView] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTagline, setNewTagline] = useState('')
  const [newCategory, setNewCategory] = useState('web')
  const [newStatus, setNewStatus] = useState('building')

  const { data: projects = [], isLoading } = useProjects()
  const { data: allFeatures = [] } = useAllProjectFeatures()
  const addProject = useAddProject()

  const progressMap = useMemo(() => {
    const map: Record<string, number> = {}
    const grouped: Record<string, { total: number; completed: number }> = {}
    for (const f of allFeatures) {
      const pid = String(f.project_id)
      if (!grouped[pid]) grouped[pid] = { total: 0, completed: 0 }
      grouped[pid].total++
      if (f.status === 'completed') grouped[pid].completed++
    }
    for (const [pid, { total, completed }] of Object.entries(grouped)) {
      map[pid] = total > 0 ? Math.round((completed / total) * 100) : 0
    }
    return map
  }, [allFeatures])

  const filtered = useMemo(
    () => projects.filter(p => matchesFilter(p.status, filter)),
    [projects, filter],
  )

  function handleAdd() {
    if (!newName.trim()) return
    addProject.mutate(
      { name: newName.trim(), tagline: newTagline.trim() || null, category: newCategory, status: newStatus },
      {
        onSuccess: (project) => {
          setNewName('')
          setNewTagline('')
          setNewCategory('web')
          setNewStatus('building')
          setShowModal(false)
          navigate(`/projects/${project.id}`)
        },
      },
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 border-b border-border bg-card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-dark flex items-center gap-2">
              🔨 Projects
            </h1>
            <p className="text-text-mid text-sm mt-0.5">Build. Ship. Repeat.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90 font-medium"
            >
              <Plus size={13} /> New Project
            </button>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setListView(false)}
                className={`p-2 transition-colors ${!listView ? 'bg-rose text-white' : 'text-text-light hover:text-text-dark'}`}
                title="Grid view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setListView(true)}
                className={`p-2 transition-colors ${listView ? 'bg-rose text-white' : 'text-text-light hover:text-text-dark'}`}
                title="List view"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 mt-4">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.key
                  ? 'bg-rose text-white shadow-sm'
                  : 'bg-rose-bg/40 text-text-mid hover:bg-rose-bg hover:text-text-dark'
              }`}
            >
              {f.dot && filter !== f.key && (
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${f.dot}`} />
              )}
              {f.emoji && <span>{f.emoji}</span>}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-card border border-border p-5 h-56 animate-pulse">
                <div className="h-3 bg-rose-bg/40 rounded w-1/4 mb-4" />
                <div className="h-5 bg-rose-bg/40 rounded w-3/4 mb-2" />
                <div className="h-3 bg-rose-bg/40 rounded w-full mb-1" />
                <div className="h-3 bg-rose-bg/40 rounded w-5/6 mb-4" />
                <div className="h-2 bg-rose-bg/40 rounded w-full mt-auto" />
              </div>
            ))}
          </div>
        ) : listView ? (
          <div className="bg-card rounded-card border border-border overflow-hidden">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-rose-bg/30 border-b border-border">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-text-mid uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-text-mid uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-text-mid uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-text-mid uppercase tracking-wide">Progress</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-text-mid uppercase tracking-wide">Target</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-light text-sm">
                      No projects yet.
                    </td>
                  </tr>
                ) : (
                  filtered.map(p => (
                    <tr
                      key={p.id}
                      className="border-b border-border hover:bg-rose-bg/20 cursor-pointer group"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-dark">{p.name}</div>
                        {p.tagline && <div className="text-[11px] text-text-light mt-0.5">{p.tagline}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {getCategoryLabel(p.category) ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-bg text-rose font-medium">
                            {getCategoryLabel(p.category)}
                          </span>
                        ) : <span className="text-text-light text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-rose/15 rounded-full overflow-hidden">
                            <div className="h-full bg-rose rounded-full" style={{ width: `${progressMap[String(p.id)] ?? 0}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-text-dark shrink-0">
                            {progressMap[String(p.id)] ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-text-mid">{fmtDate(p.target_date) ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="text-rose text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => { e.stopPropagation(); navigate(`/projects/${p.id}`) }}
                        >
                          Open →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                <tr>
                  <td colSpan={6} className="p-0">
                    <button
                      className="w-full py-2.5 bg-rose-bg/30 hover:bg-rose-bg text-text-light hover:text-rose transition-colors flex items-center justify-center gap-1 text-xs"
                      onClick={() => setShowModal(true)}
                    >
                      <Plus size={13} /> New Project
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                progress={progressMap[String(p.id)] ?? 0}
              />
            ))}
            <NewProjectCard onClick={() => setShowModal(true)} />
          </div>
        )}
      </div>

      {/* New project modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-text-dark">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-text-light hover:text-text-dark">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-text-mid uppercase tracking-wide font-semibold mb-1">
                  Name *
                </label>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Project name"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card"
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowModal(false) }}
                />
              </div>
              <div>
                <label className="block text-[10px] text-text-mid uppercase tracking-wide font-semibold mb-1">
                  Tagline
                </label>
                <input
                  value={newTagline}
                  onChange={e => setNewTagline(e.target.value)}
                  placeholder="One-line summary"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-text-mid uppercase tracking-wide font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card"
                  >
                    {CATEGORY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-text-mid uppercase tracking-wide font-semibold mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card"
                  >
                    {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm text-text-mid px-4 py-2 rounded-lg border border-border hover:bg-rose-bg/20"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || addProject.isPending}
                className="bg-rose text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
