import { useState, useMemo, useRef } from 'react'
import {
  Search, Plus, Trash2, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, ArrowUpDown,
  Brain, List, Link2, Layers, Inbox, GitBranch, Share2, Hash, LayoutGrid, Code2, BookOpen,
  Triangle, type LucideIcon,
} from 'lucide-react'
import {
  useCsTopics, useAddCsTopic, useUpdateCsTopic, useDeleteCsTopic,
  type CsTopic,
} from '../../../hooks/useCoreSubject'
import TopicDetail from './TopicDetail'

type Props = { coreSubjectId: number; workspaceId: string; workspaceName?: string; onViewProblems?: () => void }
type EC = { id: number; field: string; value: string }

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Completed' },
  { key: 'not_started', label: 'Not Started' },
]

const SORT_OPTIONS = [
  { key: 'default', label: 'Default' },
  { key: 'az', label: 'A → Z' },
  { key: 'progress', label: 'Progress' },
  { key: 'status', label: 'Status' },
]

type DiffCfg = { label: string; color: string; dotCls: string; barCls: string; badgeCls: string; ringColor: string }

const DIFF_CONFIG: Record<string, DiffCfg> = {
  easy:   { label: 'Easy',    color: '#5CA970', dotCls: 'bg-sage',      barCls: 'bg-sage',      badgeCls: 'bg-green-50 text-sage border-sage/40',        ringColor: '#5CA970' },
  medium: { label: 'Medium',  color: '#F59E0B', dotCls: 'bg-amber-400', barCls: 'bg-amber-400', badgeCls: 'bg-amber-50 text-amber-600 border-amber-200',  ringColor: '#F59E0B' },
  hard:   { label: 'Hard',    color: '#D4848A', dotCls: 'bg-rose',      barCls: 'bg-rose',      badgeCls: 'bg-red-50 text-rose border-rose/40',           ringColor: '#D4848A' },
  other:  { label: 'General', color: '#B0B0B0', dotCls: 'bg-border',    barCls: 'bg-text-light', badgeCls: 'bg-gray-50 text-text-light border-border',    ringColor: '#B0B0B0' },
}

function isDone(t: CsTopic) { return t.status === 'done' }

function getTopicIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes('array')) return List
  if (n.includes('link')) return Link2
  if (n.includes('stack')) return Layers
  if (n.includes('queue')) return Inbox
  if (n.includes('tree')) return GitBranch
  if (n.includes('graph')) return Share2
  if (n.includes('hash')) return Hash
  if (n.includes('dynamic') || n.includes(' dp') || n === 'dp') return LayoutGrid
  if (n.includes('bit')) return Code2
  if (n.includes('heap') || n.includes('priority')) return Triangle
  return BookOpen
}

function CircleProgress({ completed, total, color }: { completed: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const r = 26; const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={68} height={68} className="shrink-0">
      <circle cx={34} cy={34} r={r} fill="none" stroke="#E8E0D8" strokeWidth={5} />
      <circle cx={34} cy={34} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 34 34)" />
      <text x={34} y={39} textAnchor="middle" fontSize={13} fontWeight="700" fill="#2C2C2C">{pct}%</text>
    </svg>
  )
}

type CardProps = {
  topic: CsTopic
  index: number
  cfg: DiffCfg
  onSelect: () => void
  ec: EC | null
  setEc: (ec: EC | null) => void
  isE: (id: number, f: string) => boolean
  onCommit: (id: number, field: string, val: string, numeric?: boolean) => void
  onDelete: (id: number) => void
}

function TopicCard({ topic, index, cfg, onSelect, ec, setEc, isE, onCommit, onDelete }: CardProps) {
  const spent = topic.completed_hours ?? 0
  const total = topic.total_hours ?? 0
  const progress = total > 0 ? Math.min(Math.round((spent / total) * 100), 100) : (isDone(topic) ? 100 : 0)
  const Icon = getTopicIcon(topic.title)

  return (
    <div
      className="relative rounded-card border border-border hover:border-rose/40 hover:shadow-sm transition-all shrink-0 w-48 p-4 flex flex-col gap-3 group cursor-pointer select-none"
      style={{ backgroundColor: 'rgba(254, 245, 239, 0.55)' }}
      onClick={onSelect}
    >
      <button
        onClick={e => { e.stopPropagation(); onDelete(topic.id) }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400 z-10"
      >
        <Trash2 size={11} />
      </button>

      <div className="flex items-center gap-2 pr-4">
        <Icon size={14} className="shrink-0" style={{ color: cfg.color }} />
        {isE(topic.id, 'title') ? (
          <input
            autoFocus
            className="flex-1 text-xs font-medium bg-white border border-rose rounded px-1 py-0.5 outline-none"
            value={ec!.value}
            onChange={e => { if (ec) setEc({ ...ec, value: e.target.value }) }}
            onBlur={() => onCommit(topic.id, 'title', ec?.value ?? '')}
            onKeyDown={e => {
              e.stopPropagation()
              if (e.key === 'Enter') onCommit(topic.id, 'title', ec?.value ?? '')
              if (e.key === 'Escape') setEc(null)
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-xs font-semibold text-text-dark truncate hover:text-rose transition-colors leading-tight"
            onDoubleClick={e => { e.stopPropagation(); setEc({ id: topic.id, field: 'title', value: topic.title }) }}
            title="Double-click to edit"
          >
            {index + 1}. {topic.title}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold ${cfg.badgeCls}`}>
          {cfg.label}
        </span>
        <button
          className={`text-[9px] px-1.5 py-0.5 rounded transition-colors hover:opacity-80 font-medium ${
            isDone(topic) ? 'bg-sage/10 text-sage' : topic.status === 'in_progress' ? 'bg-rose-bg text-rose' : 'text-text-light hover:text-rose'
          }`}
          title="Click to cycle status"
          onClick={e => {
            e.stopPropagation()
            const next = isDone(topic) ? 'not_started' : topic.status === 'in_progress' ? 'done' : 'in_progress'
            onCommit(topic.id, 'status', next)
          }}
        >
          {isDone(topic) ? '✓' : topic.status === 'in_progress' ? '…' : '○'}
        </button>
      </div>

      <div className="space-y-1.5 mt-auto" onClick={e => e.stopPropagation()}>
        <div className="h-1.5 bg-border/60 rounded-full overflow-hidden">
          <div className={`h-full ${cfg.barCls} rounded-full transition-all`} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between">
          {isE(topic.id, 'completed_hours') ? (
            <input
              autoFocus type="number"
              className="w-14 text-[10px] bg-white border border-rose rounded px-1 py-0.5 outline-none text-center"
              value={ec!.value}
              onChange={e => { if (ec) setEc({ ...ec, value: e.target.value }) }}
              onBlur={() => onCommit(topic.id, 'completed_hours', ec?.value ?? '', true)}
              onKeyDown={e => {
                if (e.key === 'Enter') onCommit(topic.id, 'completed_hours', ec?.value ?? '', true)
                if (e.key === 'Escape') setEc(null)
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className="text-[10px] text-text-light tabular-nums cursor-text hover:text-rose transition-colors font-medium"
              onClick={e => { e.stopPropagation(); setEc({ id: topic.id, field: 'completed_hours', value: String(spent) }) }}
              title="Click to edit hours done"
            >
              {spent} / {total > 0 ? total : '—'}
            </span>
          )}
          <span className="text-[9px] text-text-light tabular-nums">{progress}%</span>
        </div>
      </div>
    </div>
  )
}

type SectionProps = {
  filtered: CsTopic[]
  allOfDiff: CsTopic[]
  cfg: DiffCfg
  collapsed: boolean
  onToggleCollapse: () => void
  onSelectTopic: (id: number) => void
  ec: EC | null
  setEc: (ec: EC | null) => void
  isE: (id: number, f: string) => boolean
  onCommit: (id: number, field: string, val: string, numeric?: boolean) => void
  onDelete: (id: number) => void
  onAdd: () => void
}

function DiffSection({ filtered, allOfDiff, cfg, collapsed, onToggleCollapse, onSelectTopic, ec, setEc, isE, onCommit, onDelete, onAdd }: SectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const completedCount = allOfDiff.filter(isDone).length

  function scrollBy(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 220 : -220, behavior: 'smooth' })
  }

  return (
    <div>
      <button
        className="w-full flex items-center justify-between mb-3 group"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotCls}`} />
          <h3 className="font-semibold text-text-dark text-sm">{cfg.label} Topics</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-light tabular-nums">
            {completedCount} / {allOfDiff.length} Completed
          </span>
          <span className="text-text-light group-hover:text-text-dark transition-colors">
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </span>
        </div>
      </button>

      {!collapsed && (
        <div className="relative px-4">
          <button
            onClick={() => scrollBy('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 border border-border rounded-full flex items-center justify-center text-text-mid hover:border-rose hover:text-rose transition-colors shadow-sm"
            style={{ backgroundColor: 'rgba(254, 245, 239, 0.8)' }}
          >
            <ChevronLeft size={13} />
          </button>
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-smooth mx-4" style={{ scrollbarWidth: 'none' }}>
            {filtered.length === 0 ? (
              <p className="py-6 text-xs text-text-light italic">No {cfg.label.toLowerCase()} topics match the current filter.</p>
            ) : (
              filtered.map((t, i) => (
                <TopicCard key={t.id} topic={t} index={i} cfg={cfg}
                  onSelect={() => onSelectTopic(t.id)}
                  ec={ec} setEc={setEc} isE={isE} onCommit={onCommit} onDelete={onDelete}
                />
              ))
            )}
            <button
              onClick={onAdd}
              className="w-36 shrink-0 flex flex-col items-center justify-center gap-2 bg-rose-bg/20 border border-dashed border-border rounded-card p-4 hover:border-rose hover:bg-rose-bg/40 transition-colors text-text-light hover:text-rose"
            >
              <Plus size={18} />
              <span className="text-[10px]">Add Topic</span>
            </button>
          </div>
          <button
            onClick={() => scrollBy('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 border border-border rounded-full flex items-center justify-center text-text-mid hover:border-rose hover:text-rose transition-colors shadow-sm"
            style={{ backgroundColor: 'rgba(254, 245, 239, 0.8)' }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function TopicsTab({ coreSubjectId, workspaceId, workspaceName, onViewProblems }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [sortOpen, setSortOpen] = useState(false)
  const [ec, setEc] = useState<EC | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)

  const { data: topics = [], isLoading } = useCsTopics(coreSubjectId)
  const addTopic = useAddCsTopic()
  const updateTopic = useUpdateCsTopic()
  const deleteTopic = useDeleteCsTopic()

  function commit(id: number, field: string, val: string, numeric = false) {
    setEc(null)
    updateTopic.mutate({
      id,
      core_subject_id: coreSubjectId,
      [field]: numeric ? (val !== '' ? Number(val) : null) : (val || null),
    })
  }

  const isE = (id: number, f: string) => ec?.id === id && ec?.field === f

  const toggleCollapse = (key: string) => {
    setCollapsed(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  const sortFn = useMemo(() => {
    if (sortBy === 'az') return (a: CsTopic, b: CsTopic) => a.title.localeCompare(b.title)
    if (sortBy === 'progress') {
      return (a: CsTopic, b: CsTopic) => {
        const pctA = (a.total_hours ?? 0) > 0 ? (a.completed_hours ?? 0) / (a.total_hours ?? 1) : (isDone(a) ? 1 : 0)
        const pctB = (b.total_hours ?? 0) > 0 ? (b.completed_hours ?? 0) / (b.total_hours ?? 1) : (isDone(b) ? 1 : 0)
        return pctB - pctA
      }
    }
    if (sortBy === 'status') {
      const order: Record<string, number> = { done: 0, in_progress: 1, not_started: 2 }
      return (a: CsTopic, b: CsTopic) => (order[a.status ?? 'not_started'] ?? 2) - (order[b.status ?? 'not_started'] ?? 2)
    }
    return null
  }, [sortBy])

  const filtered = useMemo(() => {
    let arr = topics.filter(t => {
      if (!t.title.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter === 'all') return true
      if (statusFilter === 'done') return isDone(t)
      return t.status === statusFilter
    })
    if (sortFn) arr = [...arr].sort(sortFn)
    return arr
  }, [topics, search, statusFilter, sortFn])

  const easyAll   = useMemo(() => topics.filter(t => t.difficulty === 'easy'),   [topics])
  const mediumAll = useMemo(() => topics.filter(t => t.difficulty === 'medium'), [topics])
  const hardAll   = useMemo(() => topics.filter(t => t.difficulty === 'hard'),   [topics])
  const otherAll  = useMemo(() => topics.filter(t => !t.difficulty),             [topics])

  const easyF   = useMemo(() => filtered.filter(t => t.difficulty === 'easy'),   [filtered])
  const mediumF = useMemo(() => filtered.filter(t => t.difficulty === 'medium'), [filtered])
  const hardF   = useMemo(() => filtered.filter(t => t.difficulty === 'hard'),   [filtered])
  const otherF  = useMemo(() => filtered.filter(t => !t.difficulty),             [filtered])

  const totalDone = useMemo(() => topics.filter(isDone).length, [topics])

  const selectedTopic = topics.find(t => t.id === selectedTopicId)
  if (selectedTopic) {
    return (
      <TopicDetail
        topic={selectedTopic}
        coreSubjectId={coreSubjectId}
        workspaceId={workspaceId}
        onBack={() => setSelectedTopicId(null)}
      />
    )
  }

  function addFor(diff?: string) {
    addTopic.mutate({
      title: 'New Topic',
      core_subject_id: coreSubjectId,
      status: 'not_started',
      difficulty: diff ?? null,
    })
  }

  const STATS = [
    { label: 'Total Topics',  completed: totalDone,                       total: topics.length,    color: '#5CA970' },
    { label: 'Easy Topics',   completed: easyAll.filter(isDone).length,   total: easyAll.length,   color: '#5CA970' },
    { label: 'Medium Topics', completed: mediumAll.filter(isDone).length, total: mediumAll.length, color: '#F59E0B' },
    { label: 'Hard Topics',   completed: hardAll.filter(isDone).length,   total: hardAll.length,   color: '#D4848A' },
  ]

  const sortLabel = SORT_OPTIONS.find(o => o.key === sortBy)?.label ?? 'Default'

  return (
    <div className="min-h-screen bg-cream" onClick={() => setSortOpen(false)}>

      {/* Header */}
      <div>
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Brain size={26} className="text-rose shrink-0" />
              <h1 className="font-display text-3xl text-text-dark">
                {workspaceName ? `${workspaceName} ` : ''}Topics
              </h1>
            </div>
            <p className="text-sm text-text-mid">Master each topic. Build strong foundations.</p>
          </div>
          <BookOpen size={52} className="text-rose/20 hidden sm:block shrink-0" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 pb-4 flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 min-w-48 flex-1 max-w-64"
          style={{ backgroundColor: 'rgba(254, 245, 239, 0.7)' }}
        >
          <Search size={13} className="text-text-light shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics..."
            className="flex-1 text-sm bg-transparent outline-none text-text-dark placeholder:text-text-light" />
        </div>

        <div
          className="flex items-center gap-1 border border-border rounded-lg p-1"
          style={{ backgroundColor: 'rgba(254, 245, 239, 0.7)' }}
        >
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === f.key ? 'bg-rose text-white' : 'text-text-mid hover:bg-rose-bg/40'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 text-xs text-text-mid hover:border-rose/50 hover:text-text-dark transition-colors"
            style={{ backgroundColor: 'rgba(254, 245, 239, 0.7)' }}
          >
            <ArrowUpDown size={12} />
            Sort By: {sortLabel}
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 bg-cream border border-border rounded-lg shadow-md z-20 w-40 py-1">
              {SORT_OPTIONS.map(o => (
                <button key={o.key} onClick={() => { setSortBy(o.key); setSortOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${sortBy === o.key ? 'text-rose font-medium bg-rose-bg/30' : 'text-text-mid hover:bg-rose-bg/20 hover:text-text-dark'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-card border border-border p-4 flex items-center justify-between"
            style={{ backgroundColor: 'rgba(254, 245, 239, 0.55)' }}
          >
            <div className="min-w-0">
              <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5 font-medium">{s.label}</p>
              <p className="font-display text-2xl text-text-dark font-bold leading-none mb-1">
                {s.completed} / {s.total}
              </p>
              <p className="text-[10px] text-text-light">
                {s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0}% Completed
              </p>
            </div>
            <CircleProgress completed={s.completed} total={s.total} color={s.color} />
          </div>
        ))}
      </div>

      {/* Topic sections */}
      <div className="px-8 space-y-6 pb-8">
        {isLoading ? (
          <p className="text-center py-12 text-text-light text-sm">Loading topics...</p>
        ) : (
          <>
            <DiffSection filtered={easyF} allOfDiff={easyAll} cfg={DIFF_CONFIG.easy}
              collapsed={collapsed.has('easy')} onToggleCollapse={() => toggleCollapse('easy')}
              onSelectTopic={setSelectedTopicId} ec={ec} setEc={setEc} isE={isE} onCommit={commit}
              onDelete={id => deleteTopic.mutate({ id, coreSubjectId })} onAdd={() => addFor('easy')} />
            <DiffSection filtered={mediumF} allOfDiff={mediumAll} cfg={DIFF_CONFIG.medium}
              collapsed={collapsed.has('medium')} onToggleCollapse={() => toggleCollapse('medium')}
              onSelectTopic={setSelectedTopicId} ec={ec} setEc={setEc} isE={isE} onCommit={commit}
              onDelete={id => deleteTopic.mutate({ id, coreSubjectId })} onAdd={() => addFor('medium')} />
            <DiffSection filtered={hardF} allOfDiff={hardAll} cfg={DIFF_CONFIG.hard}
              collapsed={collapsed.has('hard')} onToggleCollapse={() => toggleCollapse('hard')}
              onSelectTopic={setSelectedTopicId} ec={ec} setEc={setEc} isE={isE} onCommit={commit}
              onDelete={id => deleteTopic.mutate({ id, coreSubjectId })} onAdd={() => addFor('hard')} />
            {otherAll.length > 0 && (
              <DiffSection filtered={otherF} allOfDiff={otherAll} cfg={DIFF_CONFIG.other}
                collapsed={collapsed.has('other')} onToggleCollapse={() => toggleCollapse('other')}
                onSelectTopic={setSelectedTopicId} ec={ec} setEc={setEc} isE={isE} onCommit={commit}
                onDelete={id => deleteTopic.mutate({ id, coreSubjectId })} onAdd={() => addFor(undefined)} />
            )}
            {topics.length === 0 && (
              <div className="text-center py-16">
                <BookOpen size={40} className="text-rose/30 mx-auto mb-3" />
                <p className="font-display text-xl text-text-dark mb-1">No topics yet</p>
                <p className="text-sm text-text-light mb-4">Start building your topic map</p>
                <button onClick={() => addFor(undefined)}
                  className="flex items-center gap-2 text-sm text-rose border border-rose px-4 py-2 rounded-lg hover:bg-rose hover:text-white transition-colors mx-auto">
                  <Plus size={14} /> Add First Topic
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mx-8 mb-8 bg-rose-bg/30 rounded-card border border-border p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl select-none">🐰</span>
          <div>
            <p className="font-display text-sm text-text-dark font-semibold mb-0.5">Keep going, Vivek! 🌱</p>
            <p className="text-xs text-text-mid">Consistency is the real superpower. Solve. Learn. Level Up.</p>
          </div>
        </div>
        {onViewProblems && (
          <button
            onClick={onViewProblems}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-rose border border-rose/50 px-4 py-2 rounded-lg hover:bg-rose hover:text-white hover:border-rose transition-colors"
          >
            View Problem List <ChevronRight size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
