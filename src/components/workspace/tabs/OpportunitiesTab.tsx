import { useState, useMemo } from 'react'
import {
  Search, Plus, ChevronLeft, ChevronRight,
  Trophy, Target, Users, Calendar, Laptop, Star,
} from 'lucide-react'
import {
  useOpportunities, useAddOpportunity,
  type Opportunity,
} from '../../../hooks/useOpportunities'
import OpportunityDetailPanel from './OpportunityDetailPanel'

type TabKey = 'all' | 'hackathons' | 'competitions' | 'internships' | 'fellowships' | 'calendar'
type Props = { workspaceId: string; filter: TabKey }

// ─── Maps ─────────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  hackathon:   'bg-rose/15 text-rose border border-rose/20',
  competition: 'bg-purple-100 text-purple-600 border border-purple-200',
  internship:  'bg-blue-100 text-blue-600 border border-blue-200',
  fellowship:  'bg-green-100 text-green-700 border border-green-200',
}
const TYPE_LABEL: Record<string, string> = {
  hackathon: 'Hackathon', competition: 'Competition',
  internship: 'Internship', fellowship: 'Fellowship',
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  not_started: { label: 'Not Started', cls: 'text-gray-500' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  submitted:   { label: 'Submitted',   cls: 'bg-purple-100 text-purple-600 border border-purple-200' },
  accepted:    { label: 'Accepted',    cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  rejected:    { label: 'Rejected',    cls: 'bg-red-50 text-red-400 border border-red-200' },
  dropped:     { label: 'Dropped',     cls: 'bg-gray-100 text-gray-400 border border-gray-200' },
}

const PRIORITY_META: Record<string, { label: string; cls: string; pill: string }> = {
  high:   { label: 'High',   cls: 'text-rose font-semibold',        pill: 'bg-rose/15 text-rose' },
  medium: { label: 'Medium', cls: 'text-amber-600 font-semibold',   pill: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Low',    cls: 'text-gray-400 font-medium',      pill: 'bg-gray-100 text-gray-500' },
}

const ALL_STATUS_OPTS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted',   label: 'Submitted' },
  { value: 'accepted',    label: 'Accepted' },
  { value: 'rejected',    label: 'Rejected' },
  { value: 'dropped',     label: 'Dropped' },
]

const FILTER_TO_TYPE: Record<string, string> = {
  hackathons: 'hackathon', competitions: 'competition',
  internships: 'internship', fellowships: 'fellowship',
}

const TYPE_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'competition', label: 'Competition' },
  { value: 'internship', label: 'Internship' },
  { value: 'fellowship', label: 'Fellowship' },
]

const PAGE_SIZE = 8

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDeadline(op: Opportunity): string | null {
  return op.deadline ?? null
}

function fmtDeadline(dl: string | null): { text: string; rel: string; urgent: boolean; today: boolean } {
  if (!dl) return { text: '', rel: '', urgent: false, today: false }
  const d = new Date(dl + 'T00:00:00')
  const now = new Date()
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dlDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((dlDay.getTime() - nowDay.getTime()) / 86400000)
  const isToday = diff === 0
  const urgent = diff <= 7 && diff >= 0
  const text = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const rel = isToday ? 'Today' : diff > 0 ? `${diff} days left` : diff < 0 ? `${Math.abs(diff)} days ago` : ''
  return { text, rel, urgent, today: isToday }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string | null }) {
  const t = type ?? ''
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${TYPE_BADGE[t] ?? 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
      {TYPE_LABEL[t] ?? (t || '—')}
    </span>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>
  const m = STATUS_META[status]
  if (!m) return <span className="text-gray-400 text-xs">{status}</span>
  const hasBg = m.cls.includes('bg-')
  return (
    <span className={`inline-block text-[11px] font-medium ${hasBg ? 'px-2.5 py-0.5 rounded-full' : ''} ${m.cls}`}>
      {m.label}
    </span>
  )
}

function DeadlineCell({ op }: { op: Opportunity }) {
  const dl = getDeadline(op)
  if (!dl) {
    return (
      <span className="text-gray-400 text-sm">
        {op.type === 'internship' ? 'Rolling Deadline' : '—'}
      </span>
    )
  }
  const { text, rel, urgent, today } = fmtDeadline(dl)
  return (
    <span className={`flex items-center gap-1.5 text-[13px] ${urgent ? 'font-semibold text-rose' : 'text-text-dark'}`}>
      {urgent && <span className="w-2 h-2 rounded-full bg-rose shrink-0" />}
      {text}
      {rel && <span className={`text-[11px] font-normal ${today ? 'text-rose' : urgent ? 'text-rose/70' : 'text-text-light'}`}>
        ({rel})
      </span>}
    </span>
  )
}

function PriorityCell({ priority }: { priority: string | null }) {
  if (!priority) return <span className="text-gray-400 text-xs">—</span>
  const m = PRIORITY_META[priority]
  if (!m) return <span className="text-gray-400 text-xs">{priority}</span>
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${m.pill}`}>
      {m.label}
    </span>
  )
}

// ─── Calendar ────────────────────────────────────────────────────────────────

function CalendarView({ items }: { items: Opportunity[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [popDate, setPopDate] = useState<string | null>(null)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()

  const byDate = useMemo(() => {
    const map: Record<string, Opportunity[]> = {}
    items.forEach(item => {
      const dl = getDeadline(item)
      if (!dl) return
      const key = dl.slice(0, 10)
      ;(map[key] = map[key] ?? []).push(item)
    })
    return map
  }, [items])

  const cells = [
    ...Array.from({ length: firstDow }, () => null as null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function prev() { month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1) }
  function next() { month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1) }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-rose-bg transition-colors"><ChevronLeft size={16} /></button>
        <span className="font-display text-lg text-text-dark">{MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-rose-bg transition-colors"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => <div key={d} className="text-[10px] text-text-light text-center font-medium uppercase tracking-wide py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayItems = byDate[dateKey] ?? []
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
          return (
            <div
              key={dateKey}
              onClick={() => setPopDate(popDate === dateKey ? null : dayItems.length > 0 ? dateKey : null)}
              className={`min-h-[80px] rounded-lg border p-1.5 relative cursor-pointer transition-colors ${isToday ? 'border-rose bg-rose-bg/30' : 'border-border bg-card hover:bg-rose-bg/10'}`}
            >
              <span className={`text-xs font-medium block mb-1 ${isToday ? 'text-rose' : 'text-text-mid'}`}>{day}</span>
              <div className="space-y-0.5">
                {dayItems.slice(0, 2).map(item => (
                  <div key={item.id} className={`text-[9px] px-1 py-0.5 rounded truncate ${TYPE_BADGE[item.type ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                    {item.name}
                  </div>
                ))}
                {dayItems.length > 2 && <div className="text-[9px] text-text-light pl-1">+{dayItems.length - 2} more</div>}
              </div>
              {popDate === dateKey && dayItems.length > 0 && (
                <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-card border border-border rounded-lg shadow-xl p-2 space-y-1.5" onClick={e => e.stopPropagation()}>
                  {dayItems.map(item => (
                    <div key={item.id} className="flex items-start gap-1.5">
                      <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${(TYPE_BADGE[item.type ?? ''] ?? 'bg-gray-300 text-gray-500').split(' ')[0]}`} />
                      <div className="min-w-0">
                        <p className="text-xs text-text-dark font-medium truncate">{item.name}</p>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

type AddForm = {
  name: string; type: string; status: string; deadline: string
  priority: string; theme: string; notes: string; ps: string; solution: string
}

function AddModal({ defaultType, onClose, onAdd }: {
  defaultType: string
  onClose: () => void
  onAdd: (form: AddForm) => void
}) {
  const [form, setForm] = useState<AddForm>({
    name: '', type: FILTER_TO_TYPE[defaultType] ?? 'hackathon',
    status: 'not_started', deadline: '', priority: 'medium',
    theme: '', notes: '', ps: '', solution: '',
  })
  const set = (k: keyof AddForm, v: string) => setForm(f => ({ ...f, [k]: v }))

  const FLD = 'w-full text-sm bg-cream border border-border rounded-lg px-3 py-2.5 outline-none focus:border-rose'
  const LBL = 'text-[11px] font-medium text-text-mid mb-1 block'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl z-10 w-full max-w-[520px] max-h-[85vh] flex flex-col">
        <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <h3 className="font-display text-xl font-bold text-text-dark">Add Opportunity</h3>
          <p className="text-[12px] text-text-light mt-0.5">Fill in the details. You can always edit later.</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className={LBL}>Name <span className="text-rose">*</span></label>
            <input
              autoFocus
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onKeyDown={e => e.key === 'Escape' && onClose()}
              placeholder="e.g. Smart India Hackathon 2026"
              className={FLD}
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className={FLD}>
                <option value="hackathon">Hackathon</option>
                <option value="competition">Competition</option>
                <option value="internship">Internship</option>
                <option value="fellowship">Fellowship</option>
              </select>
            </div>
            <div>
              <label className={LBL}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={FLD}>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
          </div>

          {/* Deadline + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Deadline</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className={FLD} />
            </div>
            <div>
              <label className={LBL}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={FLD}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className={LBL}>Theme / Domain</label>
            <input value={form.theme} onChange={e => set('theme', e.target.value)} placeholder="e.g. AI/ML, FinTech, Sustainability" className={FLD} />
          </div>

          {/* Notes */}
          <div>
            <label className={LBL}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="General notes about this opportunity…" className={`${FLD} resize-none`} />
          </div>

          {/* PS */}
          <div>
            <label className={LBL}>Problem Statement</label>
            <textarea value={form.ps} onChange={e => set('ps', e.target.value)} rows={3} placeholder="Describe the problem statement…" className={`${FLD} resize-none`} />
          </div>

          {/* Solution */}
          <div>
            <label className={LBL}>Solution / Approach</label>
            <textarea value={form.solution} onChange={e => set('solution', e.target.value)} rows={3} placeholder="Your solution or approach…" className={`${FLD} resize-none`} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border shrink-0 flex gap-2 justify-end">
          <button onClick={onClose} className="text-sm text-text-mid px-4 py-2 rounded-lg border border-border hover:bg-rose-bg transition-colors">Cancel</button>
          <button
            onClick={() => { if (form.name.trim()) { onAdd({ ...form, name: form.name.trim() }); onClose() } }}
            className="text-sm bg-rose text-white px-5 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-40"
            disabled={!form.name.trim()}
          >Add Opportunity</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function OpportunitiesTab({ workspaceId: _workspaceId, filter }: Props) {
  const [showCalendar, setShowCalendar] = useState(filter === 'calendar')
  const [typeChip, setTypeChip] = useState('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hoverId, setHoverId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [detailOp, setDetailOp] = useState<Opportunity | null>(null)

  const { data: all = [], isLoading } = useOpportunities()
  const addOp = useAddOpportunity()

  // Stats over all data
  const stats = useMemo(() => {
    const today = new Date()
    const in7 = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10)
    const todayStr = today.toISOString().slice(0, 10)
    const active = all.filter(o => !['accepted', 'rejected', 'dropped'].includes(o.status ?? '')).length
    const registered = all.filter(o => o.status === 'in_progress' || o.status === 'submitted').length
    const dlThisWeek = all.filter(o => { const dl = getDeadline(o); return dl && dl >= todayStr && dl <= in7 }).length
    const won = all.filter(o => o.status === 'accepted').length
    return { active, registered, dlThisWeek, won }
  }, [all])

  // filter prop → type restriction (from workspace tab bar)
  const tabType = filter === 'all' || filter === 'calendar' ? null : FILTER_TO_TYPE[filter] ?? null

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return all.filter(o => {
      const matchTab = !tabType || o.type === tabType
      const matchChip = typeChip === 'all' || o.type === typeChip
      const matchStatus = !statusFilter || o.status === statusFilter
      const matchPriority = !priorityFilter || o.priority === priorityFilter
      const matchSearch = !q || (o.name ?? '').toLowerCase().includes(q) || (o.theme ?? '').toLowerCase().includes(q)
      return matchTab && matchChip && matchStatus && matchPriority && matchSearch
    }).sort((a, b) => {
      const da = getDeadline(a) ?? 'zzzz'
      const db = getDeadline(b) ?? 'zzzz'
      return da.localeCompare(db)
    })
  }, [all, tabType, typeChip, statusFilter, priorityFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function paginationPages(cur: number, total: number): (number | '...')[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
    if (cur < total - 2) pages.push('...')
    pages.push(total)
    return pages
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Hero Header ── */}
      <div className="bg-card border-b border-border px-8 pt-6 pb-0 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="pb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-rose-light/60 rounded-xl flex items-center justify-center">
                <Target size={20} className="text-rose" />
              </div>
              <h1 className="font-display text-[32px] font-bold text-text-dark leading-none">Opportunities</h1>
              <button
                onClick={() => setShowAdd(true)}
                className="ml-4 flex items-center gap-1.5 bg-rose text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={14} /> Add Opportunity
              </button>
              <button
                onClick={() => setShowCalendar(v => !v)}
                className={`flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-lg border transition-colors ${
                  showCalendar
                    ? 'bg-rose-bg border-rose text-rose'
                    : 'border-border text-text-mid hover:border-rose/40 hover:text-rose bg-white'
                }`}
              >
                <Calendar size={14} /> {showCalendar ? 'Back to List' : 'Calendar'}
              </button>
            </div>
            <p className="text-text-mid text-sm ml-[52px] mb-5">Compete. Apply. Win.</p>


            {/* Stats */}
            <div className="flex items-center gap-3 ml-[4px]">
              {[
                { icon: Users,    label: 'Active',               val: stats.active,     icls: 'text-rose' },
                { icon: Star,     label: 'Registered',           val: stats.registered, icls: 'text-blue-500' },
                { icon: Calendar, label: 'Deadlines This Week',  val: stats.dlThisWeek, icls: 'text-amber-500' },
                { icon: Trophy,   label: 'Won',                  val: stats.won,        icls: 'text-emerald-500' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 bg-cream border border-border rounded-xl px-5 py-3 min-w-[120px]">
                  <s.icon size={20} className={s.icls} />
                  <div>
                    <p className="text-[10px] text-text-light leading-tight">{s.label}</p>
                    <p className="font-display text-[28px] font-bold text-text-dark leading-none">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden lg:flex items-end self-end h-[160px] w-[340px] shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-light/30 via-amber-50/40 to-cream rounded-t-2xl" />
            <div className="absolute top-4 right-8 w-24 h-20 bg-white/80 rounded-xl border border-border shadow-sm p-2 flex flex-col gap-1">
              <div className="text-[8px] font-bold text-rose uppercase tracking-wider">Competition</div>
              <div className="h-1.5 bg-rose/30 rounded-full w-3/4" />
              <div className="h-1.5 bg-gray-200 rounded-full w-1/2" />
              <div className="h-1.5 bg-gray-200 rounded-full w-2/3" />
            </div>
            <div className="absolute top-2 left-6 w-20 h-16 bg-white/80 rounded-xl border border-border shadow-sm p-2 flex flex-col gap-1">
              <div className="text-[8px] font-bold text-purple-500 uppercase tracking-wider">Hackathon</div>
              <div className="h-1.5 bg-purple-200 rounded-full w-full" />
              <div className="h-1.5 bg-gray-200 rounded-full w-2/3" />
            </div>
            <div className="absolute top-8 right-4 w-12 h-12 bg-rose-light/60 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-rose" />
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <Trophy size={14} className="text-amber-600" />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 flex justify-center">
              <div className="flex items-end gap-1 pb-0">
                <Laptop size={60} className="text-text-mid opacity-20" />
              </div>
            </div>
            <div className="absolute top-1 right-0 w-6 h-6 rounded-full bg-rose/20 blur-lg" />
            <div className="absolute top-12 left-2 w-4 h-4 rounded-full bg-amber-200/60 blur-md" />
          </div>
        </div>
      </div>

      {/* Calendar view */}
      {showCalendar ? (
        <CalendarView items={all} />
      ) : (
        <div className="px-8 py-5 space-y-4">

          {/* ── Filter Bar ── */}
          <div className="bg-card rounded-card border border-border px-5 py-4">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Type chips */}
              <div>
                <p className="text-[10px] text-text-light uppercase tracking-wider mb-2">Type</p>
                <div className="flex items-center gap-1.5">
                  {TYPE_CHIPS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => { setTypeChip(c.value); setPage(1) }}
                      className={`px-3 py-1 rounded-lg text-[12px] font-medium border transition-colors ${
                        typeChip === c.value
                          ? 'bg-rose text-white border-rose'
                          : 'border-border text-text-mid hover:border-rose/40 hover:text-rose bg-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end gap-3 flex-1 flex-wrap">
                {/* Status */}
                <div>
                  <p className="text-[10px] text-text-light uppercase tracking-wider mb-2">Status</p>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                      className="appearance-none border border-border rounded-lg px-3 py-1.5 pr-8 text-[12px] bg-white text-text-dark outline-none hover:border-rose/40 transition-colors min-w-[130px]"
                    >
                      <option value="">All Status</option>
                      {ALL_STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronRight size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-light rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <p className="text-[10px] text-text-light uppercase tracking-wider mb-2">Priority</p>
                  <div className="relative">
                    <select
                      value={priorityFilter}
                      onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
                      className="appearance-none border border-border rounded-lg px-3 py-1.5 pr-8 text-[12px] bg-white text-text-dark outline-none hover:border-rose/40 transition-colors min-w-[130px]"
                    >
                      <option value="">All Priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <ChevronRight size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-light rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[10px] text-text-light uppercase tracking-wider mb-2 opacity-0">s</p>
                  <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 bg-white focus-within:border-rose/40 transition-colors">
                    <Search size={13} className="text-text-light shrink-0" />
                    <input
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1) }}
                      placeholder="Search opportunities..."
                      className="text-[12px] bg-transparent outline-none text-text-dark placeholder:text-text-light flex-1"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-card rounded-card border border-border overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-rose-bg/10">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-text-mid uppercase tracking-wide">
                    <span className="flex items-center gap-1">Name <ChevronLeft size={11} className="-rotate-90 opacity-50" /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-mid uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-mid uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-mid uppercase tracking-wide">Deadline</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-mid uppercase tracking-wide">Priority</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-mid uppercase tracking-wide">Notes</th>
                  <th className="w-32" />
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                  : paginated.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <p className="text-text-light text-sm mb-2">No opportunities found.</p>
                        <button onClick={() => setShowAdd(true)} className="text-xs text-rose hover:underline">Add your first opportunity →</button>
                      </td>
                    </tr>
                  )
                  : paginated.map(op => (
                    <tr
                      key={op.id}
                      className="border-b border-border hover:bg-rose-bg/10 transition-colors group cursor-pointer"
                      onMouseEnter={() => setHoverId(op.id)}
                      onMouseLeave={() => setHoverId(null)}
                      onClick={() => setDetailOp(op)}
                    >
                      {/* Name */}
                      <td className="px-5 py-4 min-w-[200px]">
                        <span className="text-[14px] font-semibold text-text-dark">{op.name}</span>
                        {op.theme && <p className="text-[11px] text-text-light mt-0.5 truncate max-w-[260px]">{op.theme}</p>}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <TypeBadge type={op.type} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={op.status} />
                      </td>

                      {/* Deadline */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <DeadlineCell op={op} />
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-4">
                        <PriorityCell priority={op.priority} />
                      </td>

                      {/* Notes indicator */}
                      <td className="px-4 py-4">
                        {op.notes
                          ? <span title={op.notes} className="text-[11px] text-text-light bg-rose-bg/40 border border-border rounded px-2 py-0.5">Notes</span>
                          : <span className="text-border text-xs">—</span>
                        }
                      </td>

                      {/* Open Details */}
                      <td className="px-3 py-4 text-right">
                        <span className={`text-[11px] text-rose font-medium transition-all ${hoverId === op.id ? 'opacity-100' : 'opacity-0'}`}>
                          Open Details →
                        </span>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-4">
              <p className="text-xs text-text-light">
                {filtered.length === 0
                  ? 'No results'
                  : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} opportunities`}
              </p>

              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-mid hover:border-rose/50 hover:text-rose disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={13} />
                </button>
                {paginationPages(page, totalPages).map((pg, i) =>
                  pg === '...'
                    ? <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-text-light">…</span>
                    : <button
                        key={pg}
                        onClick={() => setPage(pg as number)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs border transition-colors ${
                          page === pg ? 'bg-rose text-white border-rose' : 'border-border text-text-mid hover:border-rose/50 hover:text-rose'
                        }`}
                      >{pg}</button>
                )}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-mid hover:border-rose/50 hover:text-rose disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {showAdd && (
        <AddModal
          defaultType={filter}
          onClose={() => setShowAdd(false)}
          onAdd={form => addOp.mutate({
            name:     form.name,
            type:     form.type || null,
            status:   form.status || null,
            deadline: form.deadline || null,
            priority: form.priority || null,
            theme:    form.theme || null,
            notes:    form.notes || null,
            ps:       form.ps || null,
            solution: form.solution || null,
          })}
        />
      )}

      {detailOp && (
        <OpportunityDetailPanel
          opportunity={detailOp}
          onClose={() => setDetailOp(null)}
          onDeleted={() => setDetailOp(null)}
        />
      )}
    </div>
  )
}
