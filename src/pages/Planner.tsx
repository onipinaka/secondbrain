import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar, Sparkles,
  Plus, Trash2, Lock, Bell, X, CalendarRange,  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { useDebounce } from '../hooks/useDebounce'
import { useWorkspaces } from '../hooks/useTasks'
import {
  useDailyPlannerDay, useUpsertDailyPlannerDay,
  useTopPriorities, useUpsertTopPriority, useToggleTopPriorityDone, useClearTopPriority,
  usePlannerSchedule, useAddPlannerScheduleItem, useUpdatePlannerScheduleItem, useDeletePlannerScheduleItem,
  useTasksForDate,
  useQcRemindersForDate,
  type PlannerScheduleItem, type PlannerTask, type TopPriority,
} from '../hooks/usePlanner'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateDisplay(d: Date): string {
  const day = d.getDate()
  const month = d.toLocaleString('en-US', { month: 'long' })
  const year = d.getFullYear()
  const weekday = d.toLocaleString('en-US', { weekday: 'long' })
  return `${day} ${month} ${year} (${weekday})`
}

function fmt12(t: string | null | undefined): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minsToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function snapTo15(mins: number) {
  return Math.round(mins / 15) * 15
}

function clampVal(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// Timeline constants
const DAY_START = 5 * 60    // 5:00 AM
const DAY_END   = 23 * 60   // 11:00 PM
const ZOOM_LEVELS = [0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0] // px per min

const CATEGORIES = ['deep_work', 'study', 'work', 'meeting', 'break', 'personal', 'health', 'admin', 'other']

const CAT_LABELS: Record<string, string> = {
  deep_work: 'Deep Work', study: 'Study', work: 'Work', meeting: 'Meeting',
  break: 'Break', personal: 'Personal', health: 'Health', admin: 'Admin', other: 'Other',
}

const CAT_ICONS: Record<string, string> = {
  deep_work: '🖥️', study: '📚', work: '💼', meeting: '🤝',
  break: '☕', personal: '🌸', health: '💪', admin: '📋', other: '📌',
}

const CAT_COLOR: Record<string, string> = {
  deep_work: '#3B82F6',
  study:     '#6B9E7A',
  work:      '#D4848A',
  meeting:   '#B05070',
  break:     '#F59E0B',
  personal:  '#EC4899',
  health:    '#C47B60',
  admin:     '#9CA3AF',
  other:     '#B5967A',
}

const DURATION_PRESETS = [
  { label: '15m', mins: 15 },
  { label: '30m', mins: 30 },
  { label: '45m', mins: 45 },
  { label: '1h',  mins: 60 },
  { label: '1.5h', mins: 90 },
  { label: '2h',  mins: 120 },
  { label: '3h',  mins: 180 },
]

const MOODS = ['😫', '😕', '😐', '🙂', '🔥']
const MOOD_VALUES = ['terrible', 'bad', 'okay', 'good', 'great']



const STATUS_CYCLE: Record<string, string> = { planned: 'done', done: 'skipped', skipped: 'planned' }

// ─── Top Priority Slot ────────────────────────────────────────────────────────

function PrioritySlot({
  position, priority, tasks, onUpsert, onToggle, onClear,
}: {
  position: 1 | 2 | 3
  priority: TopPriority | undefined
  tasks: PlannerTask[]
  onUpsert: (pos: 1 | 2 | 3, taskId: string | null, customTitle: string | null) => void
  onToggle: (p: TopPriority) => void
  onClear: (p: TopPriority) => void
}) {
  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState<'task' | 'custom'>('custom')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [customText, setCustomText] = useState('')

  function save() {
    if (mode === 'task') {
      if (!selectedTaskId) { toast.error('Pick a task'); return }
      onUpsert(position, selectedTaskId, null)
    } else {
      if (!customText.trim()) { toast.error('Enter title'); return }
      onUpsert(position, null, customText.trim())
    }
    setEditing(false)
    setSelectedTaskId('')
    setCustomText('')
  }

  const label = priority?.task_title ?? priority?.custom_title

  if (!priority) {
    return editing ? (
      <div className="p-3 bg-rose-bg/30 rounded-lg space-y-2 border border-border">
        <div className="flex gap-1.5">
          <button onClick={() => setMode('custom')} className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${mode === 'custom' ? 'bg-rose text-white' : 'bg-cream text-text-mid'}`}>Custom</button>
          <button onClick={() => setMode('task')} className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${mode === 'task' ? 'bg-rose text-white' : 'bg-cream text-text-mid'}`}>From Tasks</button>
        </div>
        {mode === 'task' ? (
          <select autoFocus value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-text-dark outline-none focus:border-rose">
            <option value="">Pick a task...</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        ) : (
          <input autoFocus value={customText} onChange={e => setCustomText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            placeholder="Priority title..."
            className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-text-dark outline-none focus:border-rose" />
        )}
        <div className="flex gap-1.5">
          <button onClick={save} className="text-[10px] bg-rose text-white px-3 py-1 rounded-full">Set</button>
          <button onClick={() => setEditing(false)} className="text-[10px] text-text-mid hover:text-rose">Cancel</button>
        </div>
      </div>
    ) : (
      <button onClick={() => setEditing(true)}
        className="w-full flex items-center gap-2 text-xs text-text-light italic hover:text-rose transition-colors py-1.5">
        <span className="w-4 h-4 rounded-full border border-dashed border-text-light flex items-center justify-center text-[9px]">{position}</span>
        Add priority #{position}
      </button>
    )
  }

  return (
    <div className={`flex items-center gap-2.5 py-1.5 group ${priority.is_done ? 'opacity-50' : ''}`}>
      <button onClick={() => onToggle(priority)}
        className="shrink-0 w-4 h-4 rounded-full border-2 border-rose/50 flex items-center justify-center transition-colors hover:border-rose">
        {priority.is_done && <span className="w-2 h-2 rounded-full bg-rose" />}
      </button>
      <span className={`flex-1 text-xs text-text-dark leading-snug ${priority.is_done ? 'line-through' : ''}`}>{label}</span>
      <button onClick={() => onClear(priority)} className="opacity-0 group-hover:opacity-100 text-text-light hover:text-rose transition-all">
        <X size={10} />
      </button>
    </div>
  )
}

// ─── Quick-Add Modal ──────────────────────────────────────────────────────────

function QuickAddModal({
  startMins,
  workspaces,
  tasks,
  onAdd,
  onClose,
}: {
  startMins: number
  workspaces: { id: string; name: string }[]
  tasks: PlannerTask[]
  onAdd: (payload: {
    start_time: string; end_time: string; title: string;
    category: string; workspace_id: string | null; task_id: string | null; is_hard_block: boolean
  }) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('work')
  const [durationMins, setDurationMins] = useState(60)
  const [wsId, setWsId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [isHard, setIsHard] = useState(false)
  const [customStart, setCustomStart] = useState(minsToTime(clampVal(startMins, DAY_START, DAY_END - 30)))

  const endMins = clampVal(timeToMins(customStart) + durationMins, DAY_START + 15, DAY_END)
  const endTime = minsToTime(endMins)

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title required'); return }
    onAdd({
      start_time: customStart,
      end_time: endTime,
      title: title.trim(),
      category,
      workspace_id: wsId || null,
      task_id: taskId || null,
      is_hard_block: isHard,
    })
  }

  const color = CAT_COLOR[category] ?? CAT_COLOR.other

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full max-w-md p-5 space-y-4">

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-all ${category === c ? 'text-white' : 'bg-cream text-text-mid hover:bg-rose-bg'}`}
              style={category === c ? { backgroundColor: CAT_COLOR[c] } : {}}>
              {CAT_ICONS[c]} {CAT_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Title */}
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Block title..."
          className="w-full bg-rose-bg/30 border-0 border-b-2 border-rose/30 focus:border-rose rounded-none px-0 py-2 text-base text-text-dark placeholder:text-text-light outline-none transition-colors" />

        {/* Time row */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] text-text-light uppercase tracking-wide block mb-1">Start</label>
            <input type="time" step={900} value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-text-light uppercase tracking-wide block mb-1">End (computed)</label>
            <div className="bg-cream/50 border border-border/50 rounded-lg px-2 py-1.5 text-sm text-text-mid tabular-nums">
              {fmt12(endTime)}
            </div>
          </div>
        </div>

        {/* Duration pills */}
        <div>
          <label className="text-[10px] text-text-light uppercase tracking-wide block mb-1.5">Duration</label>
          <div className="flex gap-1.5 flex-wrap">
            {DURATION_PRESETS.map(d => (
              <button key={d.mins} onClick={() => setDurationMins(d.mins)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${durationMins === d.mins ? 'text-white' : 'bg-cream text-text-mid hover:bg-rose-bg'}`}
                style={durationMins === d.mins ? { backgroundColor: color } : {}}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional: workspace + task link */}
        <div className="grid grid-cols-2 gap-2">
          <select value={wsId} onChange={e => setWsId(e.target.value)}
            className="bg-cream border border-border rounded-lg px-2 py-1.5 text-xs text-text-dark outline-none focus:border-rose">
            <option value="">No workspace</option>
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {tasks.length > 0 && (
            <select value={taskId} onChange={e => setTaskId(e.target.value)}
              className="bg-cream border border-border rounded-lg px-2 py-1.5 text-xs text-text-dark outline-none focus:border-rose">
              <option value="">No task link</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-text-mid cursor-pointer select-none">
          <input type="checkbox" checked={isHard} onChange={e => setIsHard(e.target.checked)} className="accent-rose" />
          🔒 Hard block (protected time)
        </label>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button onClick={handleSubmit}
            className="flex-1 text-white text-sm py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: color }}>
            Add Block
          </button>
          <button onClick={onClose}
            className="px-4 border border-border text-text-mid text-sm py-2.5 rounded-xl hover:bg-cream transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Schedule Timeline ────────────────────────────────────────────────────────

type DragState = {
  type: 'move' | 'resize'
  id: string
  clientY: number
  origStart: number
  origEnd: number
  date: string
}

function ScheduleTimeline({
  items,
  date,
  isToday,
  workspaceMap,
  workspaces,
  tasks,
  onAdd,
  onUpdate,
  onDelete,
  onStatusCycle,
  onEdit,
}: {
  items: PlannerScheduleItem[]
  date: string
  isToday: boolean
  workspaceMap: Map<string, { name: string; color: string | null }>
  workspaces: { id: string; name: string }[]
  tasks: PlannerTask[]
  onAdd: (payload: {
    date: string; start_time: string; end_time: string; title: string;
    category: string; workspace_id: string | null; task_id: string | null; is_hard_block: boolean
  }) => void
  onUpdate: (payload: Partial<PlannerScheduleItem> & { id: string; date: string }) => void
  onDelete: (item: PlannerScheduleItem) => void
  onStatusCycle: (item: PlannerScheduleItem) => void
  onEdit: (item: PlannerScheduleItem) => void
}) {
  const [zoomIdx, setZoomIdx] = useState(3) // default index → 1.5 px/min
  const pxPerMin = ZOOM_LEVELS[zoomIdx]

  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const dragOverrideRef = useRef<{ id: string; s: number; e: number } | null>(null)
  const [dragOverride, setDragOverride] = useState<{ id: string; s: number; e: number } | null>(null)
  const [quickAddMins, setQuickAddMins] = useState<number | null>(null)
  const didDragRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  // Current time for indicator
  const [nowMins, setNowMins] = useState(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })
  useEffect(() => {
    if (!isToday) return
    const id = setInterval(() => {
      const n = new Date()
      setNowMins(n.getHours() * 60 + n.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [isToday])

  // Scroll to current time on mount
  useEffect(() => {
    if (!containerRef.current) return
    const scrollTo = Math.max(0, (nowMins - DAY_START - 60) * pxPerMin)
    containerRef.current.scrollTop = scrollTo
  }, [])

  const onUpdateRef = useRef(onUpdate)
  useEffect(() => { onUpdateRef.current = onUpdate }, [onUpdate])

  const onMove = useCallback((e: MouseEvent) => {
    const d = dragRef.current
    if (!d) return
    const deltaY = e.clientY - d.clientY
    if (Math.abs(deltaY) > 3) didDragRef.current = true
    const deltaMins = snapTo15(deltaY / pxPerMin)
    let s: number, end: number
    if (d.type === 'move') {
      const dur = d.origEnd - d.origStart
      s = clampVal(snapTo15(d.origStart + deltaMins), DAY_START, DAY_END - 15)
      end = s + dur
    } else {
      s = d.origStart
      end = clampVal(snapTo15(d.origEnd + deltaMins), s + 15, DAY_END)
    }
    const ov = { id: d.id, s, e: end }
    dragOverrideRef.current = ov
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => setDragOverride({ ...ov }))
  }, [pxPerMin])

  const onUp = useCallback(() => {
    const d = dragRef.current
    const ov = dragOverrideRef.current
    if (d && ov?.id === d.id) {
      onUpdateRef.current({
        id: d.id,
        date: d.date,
        start_time: minsToTime(ov.s),
        end_time: minsToTime(ov.e),
      })
    }
    dragRef.current = null
    dragOverrideRef.current = null
    setDragOverride(null)
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [onMove, onUp])

  function startDrag(e: React.MouseEvent, item: PlannerScheduleItem, type: 'move' | 'resize') {
    e.preventDefault()
    e.stopPropagation()
    didDragRef.current = false
    const eff = getEffective(item)
    dragRef.current = { type, id: item.id, clientY: e.clientY, origStart: eff.s, origEnd: eff.e, date: item.date }
  }

  function getEffective(item: PlannerScheduleItem) {
    if (dragOverride?.id === item.id) return { s: dragOverride.s, e: dragOverride.e }
    return { s: timeToMins(item.start_time), e: timeToMins(item.end_time) }
  }

  function handleBgClick(e: React.MouseEvent) {
    if ((e.target as Element).closest('[data-block]')) return
    const rect = containerRef.current!.getBoundingClientRect()
    const y = e.clientY - rect.top + containerRef.current!.scrollTop
    const clickMins = Math.round(y / pxPerMin) + DAY_START
    const snapped = clampVal(snapTo15(clickMins), DAY_START, DAY_END - 30)
    setQuickAddMins(snapped)
  }

  const sorted = useMemo(() =>
    [...items].sort((a, b) => {
      const aS = dragOverride?.id === a.id ? dragOverride.s : timeToMins(a.start_time)
      const bS = dragOverride?.id === b.id ? dragOverride.s : timeToMins(b.start_time)
      return aS - bS
    }),
    [items, dragOverride],
  )

  const totalHeight = (DAY_END - DAY_START) * pxPerMin

  const hourSlots = useMemo(() => {
    const slots = []
    for (let h = Math.floor(DAY_START / 60); h <= Math.floor(DAY_END / 60); h++) {
      slots.push(h)
    }
    return slots
  }, [])

  const deepWorkMins = useMemo(() =>
    items.filter(s => s.category === 'deep_work').reduce((sum, s) => {
      if (!s.start_time || !s.end_time) return sum
      return sum + timeToMins(s.end_time) - timeToMins(s.start_time)
    }, 0),
    [items],
  )

  const focusScore = useMemo(() => {
    if (!items.length) return 0
    const done = items.filter(s => s.status === 'done' || s.is_done).length
    return Math.round((done / items.length) * 100)
  }, [items])

  return (
    <div className="bg-card rounded-card border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base"><Clock/></span>
          <h3 className="font-display text-sm text-text-dark">Today's Schedule</h3>
          {items.length > 0 && (
            <div className="flex items-center gap-3 ml-2">
              <span className="text-[10px] text-text-light">{items.length} blocks</span>
              {deepWorkMins > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                  {(deepWorkMins / 60).toFixed(1)}h deep work
                </span>
              )}
              {focusScore > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage/20 text-sage">
                  {focusScore}% done
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomIdx(i => Math.max(0, i - 1))}
              className="w-6 h-6 rounded flex items-center justify-center text-text-mid hover:text-rose hover:bg-rose-bg transition-colors text-sm font-bold"
              title="Zoom out">−</button>
            <span className="text-[10px] text-text-light w-8 text-center tabular-nums">
              {pxPerMin === 0.75 ? '24h' : pxPerMin === 1.0 ? '18h' : pxPerMin === 1.25 ? '14h' : pxPerMin === 1.5 ? '12h' : pxPerMin === 2.0 ? '9h' : pxPerMin === 2.5 ? '7h' : '6h'}
            </span>
            <button
              onClick={() => setZoomIdx(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
              className="w-6 h-6 rounded flex items-center justify-center text-text-mid hover:text-rose hover:bg-rose-bg transition-colors text-sm font-bold"
              title="Zoom in">+</button>
          </div>
          <button
            onClick={() => setQuickAddMins(clampVal(snapTo15(nowMins), DAY_START, DAY_END - 30))}
            className="flex items-center gap-1.5 text-[11px] text-white bg-rose hover:bg-rose/90 px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={11} /> Add Block
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={containerRef}
        className="relative overflow-y-auto select-none"
        style={{ height: 560 }}
        onClick={handleBgClick}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>

          {/* Hour grid */}
          {hourSlots.map(h => {
            const top = (h * 60 - DAY_START) * pxPerMin
            const label = h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`
            return (
              <div key={h}>
                <div style={{ position: 'absolute', top, left: 0, right: 0 }}
                  className="flex items-start pointer-events-none">
                  <span style={{ width: 44, flexShrink: 0 }}
                    className="text-[10px] text-text-light text-right pr-2 -mt-2.5 tabular-nums select-none">
                    {label}
                  </span>
                  <div className="flex-1 border-t border-border/30" />
                </div>
                {h < Math.floor(DAY_END / 60) && (
                  <div style={{ position: 'absolute', top: top + 30 * pxPerMin, left: 44, right: 0 }}
                    className="border-t border-border/15 pointer-events-none" />
                )}
              </div>
            )
          })}

          {/* Current time indicator */}
          {isToday && nowMins >= DAY_START && nowMins <= DAY_END && (
            <div
              style={{ position: 'absolute', top: (nowMins - DAY_START) * pxPerMin, left: 44, right: 0 }}
              className="pointer-events-none z-10 flex items-center">
              <div className="w-2 h-2 rounded-full bg-rose -ml-1 shrink-0" />
              <div className="flex-1 border-t-2 border-rose/70" />
            </div>
          )}

          {/* Blocks + gap labels */}
          {sorted.map((item, idx) => {
            const { s, e } = getEffective(item)
            const top = (s - DAY_START) * pxPerMin
            const rawH = (e - s) * pxPerMin
            const height = Math.max(30, rawH)
            const color = CAT_COLOR[item.category ?? ''] ?? CAT_COLOR.other
            const isDragging = dragRef.current?.id === item.id

            // Gap before this block
            let gapMins = 0
            if (idx > 0) {
              const prev = sorted[idx - 1]
              const prevE = getEffective(prev).e
              gapMins = s - prevE
            }

            const ws = item.workspace_id ? workspaceMap.get(item.workspace_id) : null
            const statusLabel = item.status === 'done' ? 'Done' : item.status === 'skipped' ? 'Skip' : 'Todo'
            const statusCls = item.status === 'done'
              ? 'bg-green-100 text-green-700'
              : item.status === 'skipped'
              ? 'bg-gray-100 text-gray-500'
              : 'bg-rose-bg text-rose'
            const blockBg = item.status === 'done'
              ? { borderLeft: '3px solid #22c55e', backgroundColor: '#22c55e1a' }
              : item.status === 'skipped'
              ? { borderLeft: '3px solid #9ca3af', backgroundColor: '#9ca3af1a' }
              : { borderLeft: `3px solid ${color}`, backgroundColor: color + '1a' }

            return (
              <div key={item.id}>
                {/* Gap label */}
                {gapMins >= 20 && idx > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: (getEffective(sorted[idx - 1]).e - DAY_START) * pxPerMin + 4,
                      left: 52,
                      right: 8,
                      height: Math.max(16, gapMins * pxPerMin - 8),
                    }}
                    className="flex items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 border-t border-dashed border-border/40 w-8" />
                      <span className="text-[9px] text-text-mid/80 px-2 py-0.5 bg-cream/80 rounded-full">
                        {gapMins >= 60
                          ? `${Math.floor(gapMins / 60)}h${gapMins % 60 > 0 ? ` ${gapMins % 60}m` : ''} free`
                          : `${gapMins}m free`}
                      </span>
                      <div className="flex-1 border-t border-dashed border-border/40 w-8" />
                    </div>
                  </div>
                )}

                {/* Block */}
                <div
                  data-block="1"
                  style={{
                    position: 'absolute',
                    top,
                    left: 52,
                    right: 8,
                    height,
                    ...blockBg,
                    zIndex: isDragging ? 20 : 1,
                  }}
                  className={`rounded-md overflow-hidden group transition-shadow ${isDragging ? 'shadow-xl ring-1 ring-rose/30 cursor-grabbing' : 'hover:shadow-md cursor-pointer'}`}
                  onClick={e => { e.stopPropagation(); if (!didDragRef.current) onEdit(item) }}>

                  {/* Move area */}
                  <div
                    data-block="1"
                    className="px-2 pt-1.5 pb-1 cursor-grab active:cursor-grabbing"
                    style={{ height: Math.max(height - 8, 22) }}
                    onMouseDown={e => startDrag(e, item, 'move')}>
                    <div className="flex items-start gap-1.5">
                      {/* Category icon */}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] mt-0.5"
                        style={{ backgroundColor: item.status === 'done' ? '#22c55e' : item.status === 'skipped' ? '#9ca3af' : color, opacity: 0.9 }}>
                        {CAT_ICONS[item.category ?? ''] ?? '📌'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-snug truncate ${item.status === 'done' ? 'text-green-700 line-through' : item.status === 'skipped' ? 'text-text-light line-through' : 'text-text-dark'}`}>
                          {item.title}
                          {item.is_hard_block && <Lock size={8} className="inline ml-1 text-text-light" />}
                        </p>
                        {height > 40 && (
                          <p className="text-[10px] text-text-mid mt-0.5">
                            {fmt12(minsToTime(s))} – {fmt12(minsToTime(e))}
                            {' '}({e - s}m)
                            {ws && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/60 text-[9px]">{ws.name}</span>}
                          </p>
                        )}
                        {height > 55 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                            style={{ backgroundColor: color + '30', color }}>
                            {CAT_LABELS[item.category ?? ''] ?? 'Other'}
                          </span>
                        )}
                      </div>

                      {/* Status + delete — show on hover */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button data-block="1" title="Cycle status"
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium leading-none ${statusCls}`}
                          onClick={e => { e.stopPropagation(); onStatusCycle(item) }}>
                          {statusLabel}
                        </button>
                        <button data-block="1" title="Delete"
                          className="text-text-light hover:text-rose p-0.5 transition-colors"
                          onClick={e => { e.stopPropagation(); onDelete(item) }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Resize handle */}
                  <div
                    data-block="1"
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/10 transition-colors"
                    onMouseDown={e => startDrag(e, item, 'resize')}
                    title="Drag to resize"
                  />
                </div>
              </div>
            )
          })}

          {/* Empty state */}
          {items.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <span className="text-3xl"><CalendarRange/></span>
              <p className="text-text-light text-xs italic">Click anywhere to add a time block</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick-add modal */}
      {quickAddMins !== null && (
        <QuickAddModal
          startMins={quickAddMins}
          workspaces={workspaces}
          tasks={tasks}
          onClose={() => setQuickAddMins(null)}
          onAdd={payload => {
            onAdd({ date, ...payload })
            setQuickAddMins(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Block Edit Modal ─────────────────────────────────────────────────────────

function BlockEditModal({
  item,
  workspaces,
  onClose,
  onSave,
}: {
  item: PlannerScheduleItem
  workspaces: { id: string; name: string }[]
  onClose: () => void
  onSave: (data: Partial<PlannerScheduleItem> & { id: string; date: string }) => void
}) {
  const [form, setForm] = useState({
    title: item.title,
    category: item.category ?? 'work',
    start_time: item.start_time,
    end_time: item.end_time,
    workspace_id: item.workspace_id ?? '',
    is_hard_block: item.is_hard_block ?? false,
    notes: item.notes ?? '',
  })
  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) { setForm(p => ({ ...p, [k]: v })) }
  function save() {
    if (!form.title.trim()) return
    onSave({
      id: item.id,
      date: item.date,
      title: form.title.trim(),
      category: form.category,
      start_time: form.start_time,
      end_time: form.end_time,
      workspace_id: form.workspace_id || null,
      is_hard_block: form.is_hard_block,
      notes: form.notes || null,
    })
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full max-w-md p-5 space-y-4">
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Category</p>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => set('category', c)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${form.category === c ? 'text-white' : 'bg-cream text-text-mid hover:opacity-80'}`}
                style={form.category === c ? { backgroundColor: CAT_COLOR[c] } : {}}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
        <input
          autoFocus
          value={form.title}
          onChange={e => set('title', e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save() }}
          placeholder="Block title..."
          className="w-full bg-rose-bg/30 border-0 border-b-2 border-rose/30 focus:border-rose rounded-none px-0 py-2 text-base text-text-dark placeholder:text-text-light outline-none transition-colors"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Start</p>
            <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)}
              className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose" />
          </div>
          <div>
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">End</p>
            <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)}
              className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose" />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Workspace</p>
          <select value={form.workspace_id} onChange={e => set('workspace_id', e.target.value)}
            className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose text-text-dark">
            <option value="">No workspace</option>
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Notes</p>
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Optional notes..."
            className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose resize-none placeholder:text-text-light" />
        </div>
        <label className="flex items-center gap-2 text-xs text-text-mid cursor-pointer">
          <input type="checkbox" checked={form.is_hard_block} onChange={e => set('is_hard_block', e.target.checked)} className="accent-rose" />
          🔒 Protected time (hard block)
        </label>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={save}
            className="flex-1 bg-rose text-white text-sm py-2.5 rounded-xl font-medium hover:bg-rose/90 transition-colors">
            Save
          </button>
          <button type="button" onClick={onClose}
            className="px-4 border border-border text-text-mid text-sm py-2.5 rounded-xl hover:bg-cream transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Planner() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const dateStr = useMemo(() => toDateStr(selectedDate), [selectedDate])
  const todayStr = useMemo(() => toDateStr(new Date()), [])
  const isToday = dateStr === todayStr

  // Auto-save state
  const [intention, setIntention] = useState('')
  const [dayFocus, setDayFocus] = useState('')
  const [endOfDay, setEndOfDay] = useState({ wins: '', improvements: '', reflection: '', gratitude: '' })
  const [mood, setMood] = useState<string | null>(null)
  const [energyLevel, setEnergyLevel] = useState<number | null>(null)
  const [productivityScore, setProductivityScore] = useState<number | null>(null)
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const intentionDirty = useRef(false)
  const dayFocusDirty = useRef(false)
  const eodDirty = useRef(false)

  // Block edit
  const [editBlock, setEditBlock] = useState<PlannerScheduleItem | null>(null)


  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: dayRow } = useDailyPlannerDay(dateStr)
  const { data: topPriorities = [] } = useTopPriorities(dateStr)
  const { data: scheduleItems = [] } = usePlannerSchedule(dateStr)
  const { data: tasks = [] } = useTasksForDate(dateStr)
  const { data: qcReminders = [] } = useQcRemindersForDate(dateStr)
  const { data: workspaces = [] } = useWorkspaces()

  const workspaceMap = useMemo(() => new Map(workspaces.map(w => [w.id, w])), [workspaces])

  const upsertDay = useUpsertDailyPlannerDay()
  const upsertPriority = useUpsertTopPriority()
  const togglePriority = useToggleTopPriorityDone()
  const clearPriority = useClearTopPriority()
  const addBlock = useAddPlannerScheduleItem()
  const updateBlock = useUpdatePlannerScheduleItem()
  const deleteBlock = useDeletePlannerScheduleItem()

  // ── Sync from DB ──────────────────────────────────────────────────────────
  useEffect(() => {
    intentionDirty.current = false
    dayFocusDirty.current = false
    eodDirty.current = false
    setIntention('')
    setDayFocus('')
    setEndOfDay({ wins: '', improvements: '', reflection: '', gratitude: '' })
    setMood(null)
    setEnergyLevel(null)
    setProductivityScore(null)
  }, [dateStr])

  useEffect(() => {
    if (!dayRow) return
    intentionDirty.current = false
    dayFocusDirty.current = false
    eodDirty.current = false
    setIntention(dayRow.intention ?? '')
    setDayFocus(dayRow.day_focus ?? '')
    setMood(dayRow.mood)
    setEnergyLevel(dayRow.energy_level)
    setProductivityScore(dayRow.productivity_score)
    setEndOfDay({
      wins: dayRow.wins ?? '',
      improvements: dayRow.improvements ?? '',
      reflection: dayRow.reflection ?? '',
      gratitude: dayRow.gratitude ?? '',
    })
  }, [dayRow?.id])

  // ── Auto-save debounce ────────────────────────────────────────────────────
  const debouncedIntention = useDebounce(intention, 500)
  const debouncedDayFocus = useDebounce(dayFocus, 500)
  const debouncedEod = useDebounce(endOfDay, 500)

  useEffect(() => {
    if (!intentionDirty.current) return
    setSavingState('saving')
    upsertDay.mutate(
      { date: dateStr, existingId: dayRow?.id, intention: debouncedIntention },
      { onSettled: () => { setSavingState('saved'); setTimeout(() => setSavingState('idle'), 1500) } },
    )
  }, [debouncedIntention])

  useEffect(() => {
    if (!dayFocusDirty.current) return
    upsertDay.mutate({ date: dateStr, existingId: dayRow?.id, day_focus: debouncedDayFocus })
  }, [debouncedDayFocus])

  useEffect(() => {
    if (!eodDirty.current) return
    setSavingState('saving')
    upsertDay.mutate(
      { date: dateStr, existingId: dayRow?.id, ...debouncedEod },
      { onSettled: () => { setSavingState('saved'); setTimeout(() => setSavingState('idle'), 1500) } },
    )
  }, [debouncedEod])

  // ── Computed ──────────────────────────────────────────────────────────────
  const priorityMap = useMemo(
    () => new Map(topPriorities.map(p => [p.position, p])),
    [topPriorities],
  )

  // ── Handlers ──────────────────────────────────────────────────────────────
  function navDate(delta: number) {
    setSelectedDate(d => {
      const n = new Date(d)
      n.setDate(n.getDate() + delta)
      return n
    })
  }

  function handleMood(m: string) {
    setMood(m)
    upsertDay.mutate({ date: dateStr, existingId: dayRow?.id, mood: m })
  }

  function handleEnergy(v: number) {
    setEnergyLevel(v)
    upsertDay.mutate({ date: dateStr, existingId: dayRow?.id, energy_level: v })
  }

  function handleProductivity(v: number) {
    setProductivityScore(v)
    upsertDay.mutate({ date: dateStr, existingId: dayRow?.id, productivity_score: v })
  }

  function handleStatusCycle(item: PlannerScheduleItem) {
    const next = STATUS_CYCLE[item.status ?? 'planned'] ?? 'planned'
    updateBlock.mutate({ id: item.id, date: item.date, status: next, is_done: next === 'done' })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream p-6 space-y-5">

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-2xl">🌸</span>
              <h1 className="font-display text-3xl text-text-dark">Daily Planner</h1>
            </div>
            <p className="text-text-mid text-sm italic pl-9">"Plan your day. Own your time."</p>
          </div>
          {savingState !== 'idle' && (
            <span className="text-[11px] text-text-light mt-1 bg-card border border-border px-2 py-1 rounded-lg">
              {savingState === 'saving' ? 'Saving...' : 'Saved ✓'}
            </span>
          )}
        </div>

        {/* Date nav */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border rounded-card px-4 py-2">
            <Calendar size={13} className="text-text-light" />
            <span className="font-display text-sm text-text-dark">{formatDateDisplay(selectedDate)}</span>
          </div>
          <button onClick={() => navDate(-1)} className="p-2 rounded-lg hover:bg-card border border-transparent hover:border-border text-text-mid transition-colors">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => navDate(1)} className="p-2 rounded-lg hover:bg-card border border-transparent hover:border-border text-text-mid transition-colors">
            <ChevronRight size={15} />
          </button>
          {!isToday && (
            <button onClick={() => setSelectedDate(new Date())} className="text-[11px] text-rose border border-rose/30 rounded-lg px-3 py-1.5 hover:bg-rose-light/30 transition-colors">
              Today
            </button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-5 gap-5 items-start">

        {/* ── LEFT COL ──────────────────────────────────────────────────── */}
        <div className="col-span-3 space-y-4">

          {/* Timeline schedule — now first */}
          <ScheduleTimeline
            items={scheduleItems}
            date={dateStr}
            isToday={isToday}
            workspaceMap={workspaceMap}
            workspaces={workspaces}
            tasks={tasks}
            onAdd={payload => addBlock.mutate(payload)}
            onUpdate={payload => updateBlock.mutate(payload)}
            onDelete={item => deleteBlock.mutate({ id: item.id, date: item.date })}
            onStatusCycle={handleStatusCycle}
            onEdit={setEditBlock}
          />

          {/* End of Day */}
          <div className="bg-card rounded-card border border-border p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <span className="text-base">🌿</span>
              <h3 className="font-display text-sm text-text-dark">End of Day Review</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-text-light text-[10px] uppercase tracking-wide mb-2">Mood</p>
                <div className="flex gap-1.5">
                  {MOODS.map((emoji, i) => (
                    <button key={i} onClick={() => handleMood(MOOD_VALUES[i])}
                      className={`text-xl transition-all hover:scale-110 ${mood === MOOD_VALUES[i] ? 'scale-125' : 'opacity-30 grayscale'}`}
                      title={MOOD_VALUES[i]}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-text-light text-[10px] uppercase tracking-wide mb-2">Energy {energyLevel ? `(${energyLevel}/10)` : ''}</p>
                <input type="range" min={1} max={10} value={energyLevel ?? 5}
                  onChange={e => handleEnergy(Number(e.target.value))}
                  className="w-full accent-rose h-1.5" />
              </div>
              <div>
                <p className="text-text-light text-[10px] uppercase tracking-wide mb-2">Productivity {productivityScore ? `(${productivityScore}/10)` : ''}</p>
                <input type="range" min={1} max={10} value={productivityScore ?? 5}
                  onChange={e => handleProductivity(Number(e.target.value))}
                  className="w-full accent-sage h-1.5" />
              </div>
            </div>

            <div>
              <p className="text-text-light text-[10px] uppercase tracking-wide mb-1.5">🏆 Wins</p>
              <textarea value={endOfDay.wins}
                onChange={e => { eodDirty.current = true; setEndOfDay(r => ({ ...r, wins: e.target.value })) }}
                placeholder="What did you accomplish today?"
                className="w-full resize-none bg-rose-bg/30 rounded-lg p-3 text-sm placeholder:text-text-light border-none outline-none min-h-[56px]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-text-light text-[10px] uppercase tracking-wide mb-1.5">🔧 Improvements</p>
                <textarea value={endOfDay.improvements}
                  onChange={e => { eodDirty.current = true; setEndOfDay(r => ({ ...r, improvements: e.target.value })) }}
                  placeholder="What could be better?"
                  className="w-full resize-none bg-rose-bg/30 rounded-lg p-3 text-sm placeholder:text-text-light border-none outline-none min-h-[56px]" />
              </div>
              <div>
                <p className="text-text-light text-[10px] uppercase tracking-wide mb-1.5">💡 Reflection</p>
                <textarea value={endOfDay.reflection}
                  onChange={e => { eodDirty.current = true; setEndOfDay(r => ({ ...r, reflection: e.target.value })) }}
                  placeholder="Key insight or lesson..."
                  className="w-full resize-none bg-rose-bg/30 rounded-lg p-3 text-sm placeholder:text-text-light border-none outline-none min-h-[56px]" />
              </div>
            </div>

            <div>
              <p className="text-text-light text-[10px] uppercase tracking-wide mb-1.5">🙏 Grateful for</p>
              <textarea value={endOfDay.gratitude}
                onChange={e => { eodDirty.current = true; setEndOfDay(r => ({ ...r, gratitude: e.target.value })) }}
                placeholder="..."
                className="w-full resize-none bg-rose-bg/30 rounded-lg p-3 text-sm placeholder:text-text-light border-none outline-none min-h-[56px]" />
            </div>
          </div>
        </div>

        {/* ── RIGHT COL ─────────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-4">

          {/* Morning Intention */}
          <div className="bg-card rounded-card border border-border p-4 flex flex-col gap-2">
            <p className="text-text-light text-[10px] uppercase tracking-widest font-medium">🌅 Morning Intention</p>
            <textarea
              value={intention}
              onChange={e => { intentionDirty.current = true; setIntention(e.target.value) }}
              placeholder="I will show up with focus, patience and energy..."
              className="resize-none bg-rose-bg/40 rounded-lg p-3 text-sm text-text-dark placeholder:text-text-light/70 placeholder:italic border-none outline-none min-h-[80px]"
            />
            <div className="flex justify-end text-rose-mid text-sm select-none">🤍</div>
          </div>

          {/* Top 3 Priorities */}
          <div className="bg-card rounded-card border border-border p-4">
            <p className="text-text-light text-[10px] uppercase tracking-widest font-medium mb-3">⭐ Top 3 Priorities</p>
            <div className="space-y-1">
              {([1, 2, 3] as (1 | 2 | 3)[]).map(pos => (
                <PrioritySlot
                  key={pos}
                  position={pos}
                  priority={priorityMap.get(pos)}
                  tasks={tasks}
                  onUpsert={(p, tid, ct) => upsertPriority.mutate({ date: dateStr, position: p, task_id: tid, custom_title: ct })}
                  onToggle={p => togglePriority.mutate({ id: p.id, is_done: !p.is_done, date: dateStr })}
                  onClear={p => clearPriority.mutate({ id: p.id, date: dateStr })}
                />
              ))}
            </div>
          </div>

          {/* Day Focus */}
          <div className="bg-rose-bg/60 rounded-card border border-border p-4 flex flex-col gap-2">
            <p className="text-text-light text-[10px] uppercase tracking-widest font-medium">⏰ Day Focus</p>
            <textarea
              value={dayFocus}
              onChange={e => { dayFocusDirty.current = true; setDayFocus(e.target.value) }}
              placeholder="Today's focus theme..."
              className="resize-none bg-white/40 rounded-lg p-2 text-xs text-text-dark placeholder:text-text-light/60 border-none outline-none min-h-[80px]"
            />
            <span className="text-xl text-center">🌿</span>
          </div>

          {/* Reminders */}
          <div className="bg-card rounded-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Bell size={12} className="text-text-mid" />
              <h3 className="font-display text-sm text-text-dark">Reminders</h3>
              {qcReminders.length > 0 && (
                <span className="ml-auto text-[10px] text-text-light">Add from Quick Capture</span>
              )}
            </div>
            <div className="divide-y divide-border/50">
              {qcReminders.length === 0 && (
                <p className="px-4 py-5 text-xs text-text-light italic text-center">No reminders for this date — add from Quick Capture</p>
              )}
              {qcReminders.map(r => (
                <div key={r.id} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="text-base shrink-0 mt-0.5">🔔</span>
                  <p className="text-xs text-text-dark flex-1 truncate">{r.title}</p>
                  {r.time && <span className="text-[10px] text-text-light tabular-nums shrink-0">{r.time.slice(0, 5)}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* At a Glance */}
          <div className="bg-card rounded-card border border-border p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-text-mid" />
              <h3 className="font-display text-sm text-text-dark">Today at a Glance</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-cream rounded-xl p-3">
                <p className="font-display text-2xl text-text-dark">{scheduleItems.length}</p>
                <p className="text-[9px] text-text-light mt-0.5">Blocks</p>
              </div>
              <div className="bg-cream rounded-xl p-3">
                <p className="font-display text-2xl text-text-dark">{tasks.length}</p>
                <p className="text-[9px] text-text-light mt-0.5">Tasks</p>
              </div>
              <div className="bg-cream rounded-xl p-3">
                <p className="font-display text-2xl text-text-dark">{qcReminders.length}</p>
                <p className="text-[9px] text-text-light mt-0.5">Reminders</p>
              </div>
            </div>

            <p className="text-[10px] text-text-light italic text-center border-t border-border pt-3 leading-relaxed">
              "Discipline is choosing between what you want now and what you want most."
            </p>
          </div>
        </div>
      </div>

      {editBlock && (
        <BlockEditModal
          item={editBlock}
          workspaces={workspaces}
          onClose={() => setEditBlock(null)}
          onSave={payload => updateBlock.mutate(payload)}
        />
      )}
    </div>
  )
}
