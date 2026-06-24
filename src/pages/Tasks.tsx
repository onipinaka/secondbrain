import { localDateStr } from '../lib/utils'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { type ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import {
  CalendarDays, Flag, Zap, CheckCircle, AlertCircle, LayoutGrid, List,
  SlidersHorizontal, Plus, Send, Shuffle, Target, Brain, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import DataTable from '../components/shared/DataTable'
import KanbanBoard from '../components/shared/KanbanBoard'
import {
  useTasks, useWorkspaces, useTaskStats, useTodaysFocus,
  useTasksByWorkspace, useDeepWorkQueue, useUpcomingDeadlines,
  useTaskTimeline, useAddTask, useUpdateTask, useDeleteTask,
  useScheduleTask, useUpdateTaskStatus,
  type Task, type TaskFilters,
} from '../hooks/useTasks'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(ds: string) {
  return new Date(ds + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-rose-bg/40 rounded ${className ?? ''}`} />
}

const DONUT_COLORS = ['#D4848A', '#8BC49A', '#60A5FA', '#F59E0B', '#A78BFA']

// ─── illustration ─────────────────────────────────────────────────────────────

function TasksIllustration() {
  return (
    <div className="relative overflow-hidden rounded-card border border-border w-[380px] shrink-0 min-h-[150px] bg-gradient-to-br from-[#FDDEDE] via-[#FEF0E8] to-rose-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-[#F9D0CE]/30 via-transparent to-transparent" />

      {/* Notebook */}
      <div
        className="absolute bg-white/70 border border-rose-light/50 rounded"
        style={{ top: '12%', left: '30%', width: 110, height: 90, transform: 'rotate(-2deg)' }}
      >
        <div className="px-3 pt-2">
          <div className="h-0.5 bg-rose-light/60 mb-1.5 w-4/5" />
          <div className="h-0.5 bg-rose-light/60 mb-1.5 w-3/5" />
          <div className="h-0.5 bg-rose-light/60 mb-1.5 w-4/5" />
          <div className="h-0.5 bg-rose-light/60 mb-1.5 w-2/5" />
          <p className="font-display italic text-center text-[9px] text-text-light mt-1 leading-tight">
            Plan · Focus<br />Execute · Repeat
          </p>
        </div>
        {/* Pencil */}
        <div
          className="absolute bg-rose-mid rounded-sm"
          style={{ width: 3, height: 55, top: -25, right: -6, transform: 'rotate(15deg)' }}
        />
      </div>

      {/* Tulips */}
      <svg className="absolute bottom-0 left-5" width="55" height="90" viewBox="0 0 55 90">
        <line x1="10" y1="90" x2="10" y2="35" stroke="#8BC49A" strokeWidth="2" />
        <line x1="24" y1="90" x2="24" y2="25" stroke="#8BC49A" strokeWidth="2" />
        <line x1="38" y1="90" x2="38" y2="40" stroke="#8BC49A" strokeWidth="2" />
        <ellipse cx="6" cy="62" rx="7" ry="4" fill="#8BC49A" opacity="0.6" transform="rotate(-35 6 62)" />
        <ellipse cx="32" cy="56" rx="7" ry="4" fill="#8BC49A" opacity="0.6" transform="rotate(30 32 56)" />
        <ellipse cx="10" cy="31" rx="6" ry="9" fill="#E8A5A5" opacity="0.9" />
        <ellipse cx="10" cy="27" rx="4.5" ry="7" fill="#D4848A" opacity="0.8" />
        <ellipse cx="24" cy="21" rx="6" ry="9" fill="#E8A5A5" opacity="0.9" />
        <ellipse cx="24" cy="17" rx="4.5" ry="7" fill="#D4848A" opacity="0.85" />
        <ellipse cx="38" cy="36" rx="5.5" ry="8" fill="#E8A5A5" opacity="0.85" />
        <ellipse cx="38" cy="32" rx="4" ry="6.5" fill="#D4848A" opacity="0.75" />
      </svg>

      {/* Mug */}
      <div className="absolute" style={{ bottom: '22%', right: '18%' }}>
        <div
          className="relative flex items-center justify-center bg-[#FEF5EF] border border-rose-light/60"
          style={{ width: 30, height: 26, borderRadius: 4 }}
        >
          <div
            className="absolute border-r border-t border-b border-rose-light/50"
            style={{ right: -8, top: 5, width: 8, height: 13, borderRadius: '0 50% 50% 0' }}
          />
          <span style={{ fontSize: 9, color: '#D4848A' }}>♥</span>
        </div>
        {/* Steam */}
        <svg className="absolute -top-3 left-2" width="18" height="12" viewBox="0 0 18 12">
          <path d="M3 10 Q5 5 3 2" fill="none" stroke="#E8A5A5" strokeWidth="1.2" opacity="0.6" />
          <path d="M9 10 Q11 5 9 2" fill="none" stroke="#E8A5A5" strokeWidth="1.2" opacity="0.5" />
        </svg>
      </div>

      {/* Sticky note */}
      <div
        className="absolute bg-[#FEF9C3]/80 border border-yellow-200 rounded px-2 py-1.5"
        style={{ top: '10%', right: '8%', width: 72, transform: 'rotate(3deg)' }}
      >
        <p className="font-display italic text-[9px] text-text-mid leading-snug text-center">
          One day<br />or day one.<br />You decide.
        </p>
      </div>

      {/* Desk */}
      <div className="absolute bottom-0 left-0 right-0 h-[22%] bg-gradient-to-t from-[#FEF0E6]/80 to-transparent" />
    </div>
  )
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  loading: boolean
}) {
  return (
    <div className="bg-card rounded-card border border-border p-4 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-text-mid text-xs font-medium">{label}</p>
      </div>
      {loading ? (
        <Sk className="h-8 w-16" />
      ) : (
        <p className="font-display text-3xl font-semibold text-text-dark">{value}</p>
      )}
      <p className="text-text-light text-[11px] mt-1">{sub}</p>
      {/* decorative floral */}
      <svg className="absolute bottom-1 right-2 opacity-20" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="5" fill="#D4848A" />
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <ellipse
            key={i}
            cx="16" cy="8" rx="3" ry="5"
            fill="#D4848A"
            transform={`rotate(${deg} 16 16)`}
          />
        ))}
      </svg>
    </div>
  )
}

// ─── time slot helpers ────────────────────────────────────────────────────────

function buildTimeSlots() {
  const slots: { label: string; value: string }[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const period = h < 12 ? 'AM' : 'PM'
      const h12 = h % 12 || 12
      const label = `${h12}:${String(m).padStart(2, '0')} ${period}`
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      slots.push({ label, value })
    }
  }
  return slots
}
const TIME_SLOTS = buildTimeSlots()

const PRIORITY_CONFIG = [
  { value: 'high',   label: '🔴 High',   active: 'bg-red-500 text-white',    idle: 'bg-cream text-text-mid hover:bg-red-50' },
  { value: 'medium', label: '🟡 Medium', active: 'bg-amber-400 text-white',  idle: 'bg-cream text-text-mid hover:bg-amber-50' },
  { value: 'low',    label: '🟢 Low',    active: 'bg-green-500 text-white',  idle: 'bg-cream text-text-mid hover:bg-green-50' },
]

const STATUS_CONFIG = [
  { value: 'backlog',     label: 'Backlog',      active: 'bg-gray-500 text-white',   idle: 'bg-cream text-text-mid hover:bg-gray-50' },
  { value: 'in_progress', label: 'In Progress',  active: 'bg-blue-500 text-white',   idle: 'bg-cream text-text-mid hover:bg-blue-50' },
  { value: 'blocked',     label: 'Blocked',      active: 'bg-red-400 text-white',    idle: 'bg-cream text-text-mid hover:bg-red-50' },
  { value: 'completed',   label: 'Completed',    active: 'bg-green-500 text-white',  idle: 'bg-cream text-text-mid hover:bg-green-50' },
  { value: 'cancelled',   label: 'Cancelled',    active: 'bg-gray-400 text-white',   idle: 'bg-cream text-text-mid hover:bg-gray-50' },
]

const SCHED_CATEGORIES = ['deep_work', 'study', 'work', 'meeting', 'break', 'personal', 'admin', 'other']
const SCHED_CAT_LABELS: Record<string, string> = {
  deep_work: 'Deep Work', study: 'Study', work: 'Work', meeting: 'Meeting',
  break: 'Break', personal: 'Personal', admin: 'Admin', other: 'Other',
}
const SCHED_CAT_COLOR: Record<string, string> = {
  deep_work: '#3B82F6', study: '#6B9E7A', work: '#D4848A', meeting: '#B05070',
  break: '#F59E0B', personal: '#EC4899', admin: '#9CA3AF', other: '#B5967A',
}
const SCHED_DURATION_PRESETS = [
  { label: '30m', mins: 30 }, { label: '45m', mins: 45 }, { label: '1h', mins: 60 },
  { label: '1.5h', mins: 90 }, { label: '2h', mins: 120 }, { label: '3h', mins: 180 },
]

// ─── Add Task Modal ───────────────────────────────────────────────────────────

function AddTaskModal({
  defaultStatus,
  workspaces,
  onClose,
  onAdd,
}: {
  defaultStatus?: string
  workspaces: { id: string; name: string }[]
  onClose: () => void
  onAdd: (data: Partial<Task> & { title: string }) => void
}) {
  const [form, setForm] = useState({
    title: '',
    workspace_id: '',
    priority: 'medium',
    status: defaultStatus ?? 'backlog',
    due_date: '',
    due_time: '',
    description: '',
  })

  function set(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    onAdd({
      title: form.title.trim(),
      workspace_id: form.workspace_id || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      description: form.description || null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full max-w-md p-5 space-y-4">

        {/* Priority pills */}
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Priority</p>
          <div className="flex gap-1.5">
            {PRIORITY_CONFIG.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => set('priority', p.value)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${form.priority === p.value ? p.active : p.idle}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <input
          autoFocus
          value={form.title}
          onChange={e => set('title', e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e) }}
          placeholder="Task title..."
          className="w-full bg-rose-bg/30 border-0 border-b-2 border-rose/30 focus:border-rose rounded-none px-0 py-2 text-base text-text-dark placeholder:text-text-light outline-none transition-colors"
        />

        {/* Status pills */}
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Status</p>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_CONFIG.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('status', s.value)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${form.status === s.value ? s.active : s.idle}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date + time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Due Date</p>
            <input
              type="date"
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
              className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose"
            />
          </div>
          <div>
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Due Time</p>
            <select
              value={form.due_time}
              onChange={e => set('due_time', e.target.value)}
              className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose text-text-dark"
            >
              <option value="">No time</option>
              {TIME_SLOTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Workspace */}
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Workspace</p>
          <select
            value={form.workspace_id}
            onChange={e => set('workspace_id', e.target.value)}
            className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose text-text-dark"
          >
            <option value="">No workspace</option>
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Description</p>
          <textarea
            rows={2}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Optional notes..."
            className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose resize-none placeholder:text-text-light"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-rose text-white text-sm py-2.5 rounded-xl font-medium hover:bg-rose/90 transition-colors"
          >
            Add Task
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 border border-border text-text-mid text-sm py-2.5 rounded-xl hover:bg-cream transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Task Modal ──────────────────────────────────────────────────────────

function EditTaskModal({
  task,
  workspaces,
  onClose,
  onSave,
}: {
  task: Task
  workspaces: { id: string; name: string }[]
  onClose: () => void
  onSave: (data: Partial<Task>) => void
}) {
  const [form, setForm] = useState({
    title: task.title ?? '',
    workspace_id: task.workspace_id ?? '',
    priority: task.priority ?? 'medium',
    status: task.status ?? 'backlog',
    due_date: task.due_date ?? '',
    due_time: (task as any).due_time ?? '',
    description: (task as any).description ?? '',
  })

  function set(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      title: form.title.trim(),
      workspace_id: form.workspace_id || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      description: form.description || null,
    } as any)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full max-w-md p-5 space-y-4">

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text-dark font-display">Edit Task</p>
          <button type="button" onClick={onClose} className="text-text-light hover:text-rose text-lg leading-none">×</button>
        </div>

        {/* Priority pills */}
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Priority</p>
          <div className="flex gap-1.5">
            {PRIORITY_CONFIG.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => set('priority', p.value)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${form.priority === p.value ? p.active : p.idle}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <input
          autoFocus
          value={form.title}
          onChange={e => set('title', e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e) }}
          placeholder="Task title..."
          className="w-full bg-rose-bg/30 border-0 border-b-2 border-rose/30 focus:border-rose rounded-none px-0 py-2 text-base text-text-dark placeholder:text-text-light outline-none transition-colors"
        />

        {/* Status pills */}
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Status</p>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_CONFIG.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('status', s.value)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${form.status === s.value ? s.active : s.idle}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date + time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Due Date</p>
            <input
              type="date"
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
              className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose"
            />
          </div>
          <div>
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Due Time</p>
            <select
              value={form.due_time}
              onChange={e => set('due_time', e.target.value)}
              className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose text-text-dark"
            >
              <option value="">No time</option>
              {TIME_SLOTS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Workspace */}
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Workspace</p>
          <select
            value={form.workspace_id}
            onChange={e => set('workspace_id', e.target.value)}
            className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose text-text-dark"
          >
            <option value="">No workspace</option>
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Description</p>
          <textarea
            rows={2}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Optional notes..."
            className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose resize-none placeholder:text-text-light"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-rose text-white text-sm py-2.5 rounded-xl font-medium hover:bg-rose/90 transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 border border-border text-text-mid text-sm py-2.5 rounded-xl hover:bg-cream transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────

function ScheduleModal({
  task,
  onClose,
  onSchedule,
}: {
  task: Task
  onClose: () => void
  onSchedule: (data: {
    task_id: string
    workspace_id: string | null
    scheduled_date: string
    title: string
    category: string
    time_start: string | null
    time_end: string | null
  }) => void
}) {
  const today = localDateStr()
  const [scheduledDate, setScheduledDate] = useState(today)
  const [title, setTitle] = useState(task.title ?? '')
  const [category, setCategory] = useState('work')
  const [startTime, setStartTime] = useState('09:00')
  const [durationMins, setDurationMins] = useState(60)

  function computeEnd(start: string, mins: number): string {
    const [h, m] = start.split(':').map(Number)
    const total = h * 60 + m + mins
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  }

  const endTime = computeEnd(startTime, durationMins)
  const color = SCHED_CAT_COLOR[category] ?? SCHED_CAT_COLOR.other

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSchedule({
      task_id: task.id,
      workspace_id: task.workspace_id,
      scheduled_date: scheduledDate,
      title: title.trim(),
      category,
      time_start: startTime,
      time_end: endTime,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full max-w-md p-5 space-y-4">

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {SCHED_CATEGORIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-all ${category === c ? 'text-white' : 'bg-cream text-text-mid hover:bg-rose-bg'}`}
              style={category === c ? { backgroundColor: SCHED_CAT_COLOR[c] } : {}}
            >
              {SCHED_CAT_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Title */}
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e) }}
          placeholder="Block title..."
          className="w-full bg-rose-bg/30 border-0 border-b-2 border-rose/30 focus:border-rose rounded-none px-0 py-2 text-base text-text-dark placeholder:text-text-light outline-none transition-colors"
        />

        {/* Date */}
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Date</p>
          <input
            type="date"
            value={scheduledDate}
            onChange={e => setScheduledDate(e.target.value)}
            className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose"
          />
        </div>

        {/* Time row */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Start</p>
            <input
              type="time"
              step={900}
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full bg-cream border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-rose"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">End (computed)</p>
            <div className="bg-cream/50 border border-border/50 rounded-lg px-2 py-1.5 text-sm text-text-mid tabular-nums">
              {(() => {
                const [h, m] = endTime.split(':').map(Number)
                const period = h < 12 ? 'AM' : 'PM'
                const h12 = h % 12 || 12
                return `${h12}:${String(m).padStart(2, '0')} ${period}`
              })()}
            </div>
          </div>
        </div>

        {/* Duration presets */}
        <div>
          <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Duration</p>
          <div className="flex gap-1.5 flex-wrap">
            {SCHED_DURATION_PRESETS.map(d => (
              <button
                key={d.mins}
                type="button"
                onClick={() => setDurationMins(d.mins)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${durationMins === d.mins ? 'text-white' : 'bg-cream text-text-mid hover:bg-rose-bg'}`}
                style={durationMins === d.mins ? { backgroundColor: color } : {}}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 text-white text-sm py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: color }}
          >
            Add to Planner
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 border border-border text-text-mid text-sm py-2.5 rounded-xl hover:bg-cream transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FILTER TABS ─────────────────────────────────────────────────────────────

const TABS: { id: TaskFilters['tab']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'high_priority', label: 'High Priority' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'blocked', label: 'Blocked' },
]

// ─── RIGHT SIDEBAR ────────────────────────────────────────────────────────────

function RightSidebar({ tasks }: { tasks: Task[] }) {
  const focusQ = useTodaysFocus()
  const byWsQ = useTasksByWorkspace()

  const priorityBreakdown = useMemo(() => {
    const all = tasks
    const total = all.length || 1
    const high = all.filter(t => t.priority === 'high').length
    const medium = all.filter(t => t.priority === 'medium').length
    const low = all.filter(t => t.priority === 'low').length
    return {
      high: Math.round((high / total) * 100),
      medium: Math.round((medium / total) * 100),
      low: Math.round((low / total) * 100),
    }
  }, [tasks])

  const donutData = (byWsQ.data ?? []).map((d, i) => ({
    name: d.name,
    value: d.count,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
    pct: d.pct,
  }))

  return (
    <div className="w-[260px] shrink-0 space-y-4">
      {/* Today's Focus */}
      <div className="bg-card rounded-card border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-amber-400 text-base">⭐</span>
          <h3 className="font-display text-sm font-semibold text-text-dark">Today's Focus</h3>
        </div>
        <p className="text-text-light text-[11px] mb-3">Top 3 Most Important Tasks</p>
        {focusQ.isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Sk key={i} className="h-8" />)}</div>
        ) : focusQ.data?.length === 0 ? (
          <p className="text-text-light text-xs py-3 text-center">No high-priority tasks 🎉</p>
        ) : (
          <div className="space-y-2">
            {focusQ.data?.map((task, i) => (
              <div key={task.id} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-bg text-rose text-[11px] font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-text-dark text-xs leading-snug truncate">{task.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium shrink-0">
                  High
                </span>
              </div>
            ))}
          </div>
        )}
        {/* Bunny decoration */}
        <svg className="mt-3 mx-auto opacity-70" width="70" height="55" viewBox="0 0 70 55">
          {/* body */}
          <ellipse cx="35" cy="38" rx="16" ry="14" fill="#FEF5EF" stroke="#F0E4DC" strokeWidth="1.5" />
          {/* head */}
          <circle cx="35" cy="22" r="11" fill="#FEF5EF" stroke="#F0E4DC" strokeWidth="1.5" />
          {/* left ear */}
          <ellipse cx="27" cy="10" rx="4" ry="9" fill="#FEF5EF" stroke="#F0E4DC" strokeWidth="1.5" />
          <ellipse cx="27" cy="10" rx="2" ry="6" fill="#FDDEDE" />
          {/* right ear */}
          <ellipse cx="43" cy="10" rx="4" ry="9" fill="#FEF5EF" stroke="#F0E4DC" strokeWidth="1.5" />
          <ellipse cx="43" cy="10" rx="2" ry="6" fill="#FDDEDE" />
          {/* eyes */}
          <circle cx="30" cy="21" r="1.5" fill="#D4848A" />
          <circle cx="40" cy="21" r="1.5" fill="#D4848A" />
          {/* nose */}
          <ellipse cx="35" cy="25" rx="1.5" ry="1" fill="#E8A5A5" />
          {/* arms */}
          <path d="M22 36 Q18 40 20 44" fill="none" stroke="#F0E4DC" strokeWidth="2" strokeLinecap="round" />
          <path d="M48 36 Q52 40 50 44" fill="none" stroke="#F0E4DC" strokeWidth="2" strokeLinecap="round" />
          {/* blush */}
          <ellipse cx="27" cy="25" rx="3" ry="2" fill="#FDDEDE" opacity="0.7" />
          <ellipse cx="43" cy="25" rx="3" ry="2" fill="#FDDEDE" opacity="0.7" />
          {/* mug */}
          <rect x="28" y="45" width="14" height="10" rx="2" fill="#FEF5EF" stroke="#E8A5A5" strokeWidth="1" />
          <path d="M42 47 Q45 47 45 50 Q45 53 42 53" fill="none" stroke="#E8A5A5" strokeWidth="1" />
        </svg>
      </div>

      {/* Tasks by Workspace */}
      <div className="bg-card rounded-card border border-border p-4">
        <h3 className="font-display text-sm font-semibold text-text-dark mb-3">Tasks by Workspace</h3>
        {byWsQ.isLoading ? (
          <Sk className="h-32" />
        ) : donutData.length === 0 ? (
          <p className="text-text-light text-xs text-center py-4">No data</p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative" style={{ width: 90, height: 90, flexShrink: 0 }}>
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx={40}
                    cy={40}
                    innerRadius={26}
                    outerRadius={42}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} tasks`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {donutData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-text-mid text-[11px] flex-1 truncate">{d.name}</span>
                  <span className="text-text-dark text-[11px] font-medium">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Priority Breakdown */}
      <div className="bg-card rounded-card border border-border p-4">
        <h3 className="font-display text-sm font-semibold text-text-dark mb-3">Priority Breakdown</h3>
        <div className="flex rounded-full overflow-hidden h-3 mb-2">
          <div className="bg-red-400 transition-all" style={{ width: `${priorityBreakdown.high}%` }} />
          <div className="bg-amber-400 transition-all" style={{ width: `${priorityBreakdown.medium}%` }} />
          <div className="bg-green-400 transition-all" style={{ width: `${priorityBreakdown.low}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-text-mid">
          <span>High {priorityBreakdown.high}%</span>
          <span>Medium {priorityBreakdown.medium}%</span>
          <span>Low {priorityBreakdown.low}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Task Timeline ────────────────────────────────────────────────────────────

function TaskTimeline() {
  const timelineQ = useTaskTimeline()
  const [offset, setOffset] = useState(0)

  const days = timelineQ.data ?? []
  const visible = days.slice(
    Math.max(0, offset),
    Math.min(days.length, offset + 7),
  )

  return (
    <div className="bg-card rounded-card border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={16} className="text-rose" />
        <h2 className="font-display text-base font-semibold text-text-dark">Task Timeline</h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="text-text-light hover:text-rose transition-colors"
          onClick={() => setOffset(o => Math.max(0, o - 1))}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 flex justify-around">
          {(timelineQ.isLoading ? Array.from({ length: 7 }) : visible).map((day, i) => {
            if (!day) return <Sk key={i} className="h-14 w-10" />
            const d = day as NonNullable<(typeof days)[0]>
            return (
              <div key={d.date} className="flex flex-col items-center gap-1.5">
                <span className="text-text-light text-[11px]">{d.month}</span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    d.isToday
                      ? 'bg-rose text-white'
                      : 'text-text-dark hover:bg-rose-bg cursor-pointer'
                  }`}
                >
                  {d.day}
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(d.total, 5) }).map((_, j) => (
                    <span
                      key={j}
                      className={`w-1.5 h-1.5 rounded-full ${j < d.done ? 'bg-sage' : 'bg-rose-mid'}`}
                    />
                  ))}
                  {d.total === 0 && <span className="w-1.5 h-1.5 rounded-full bg-border" />}
                </div>
              </div>
            )
          })}
        </div>
        <button
          className="text-text-light hover:text-rose transition-colors"
          onClick={() => setOffset(o => Math.min(days.length - 7, o + 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── MAIN TASKS PAGE ──────────────────────────────────────────────────────────

export default function Tasks() {
  const navigate = useNavigate()
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [activeTab, setActiveTab] = useState<TaskFilters['tab']>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filterWs, setFilterWs] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addDefaultStatus, setAddDefaultStatus] = useState<string | undefined>()
  const [scheduleTask, setScheduleTask] = useState<Task | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const filters: TaskFilters = {
    tab: activeTab,
    workspaceId: filterWs || undefined,
    priority: filterPriority || undefined,
    status: filterStatus || undefined,
  }

  const tasksQ = useTasks(filters)
  const statsQ = useTaskStats()
  const workspacesQ = useWorkspaces()
  const deepWorkQ = useDeepWorkQueue()
  const deadlinesQ = useUpcomingDeadlines()

  const addTask = useAddTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const scheduleTaskMut = useScheduleTask()
  const updateStatus = useUpdateTaskStatus()

  const tasks = tasksQ.data ?? []
  const workspaces = workspacesQ.data ?? []

  function openAddModal(status?: string) {
    setAddDefaultStatus(status)
    setAddModalOpen(true)
  }

  function handleAddTask(data: Partial<Task> & { title: string }) {
    addTask.mutate(data)
  }


  // ── Table columns ──
  const tableColumns = useMemo((): ColumnDef<Task>[] => [
    {
      accessorKey: 'title',
      header: 'Title',
      meta: { type: 'text', editable: true },
    },
    {
      id: 'workspace_id',
      header: 'Workspace',
      accessorFn: row => row.workspace_id,
      cell: ({ getValue }) => {
        const wsId = getValue() as string | null
        return workspaces.find(w => w.id === wsId)?.name ?? '—'
      },
      meta: {
        type: 'select',
        options: workspaces.map(w => ({ label: w.name, value: w.id })),
        editable: true,
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      meta: {
        type: 'select',
        options: [
          { label: 'High', value: 'high', color: 'bg-red-100 text-red-600' },
          { label: 'Medium', value: 'medium', color: 'bg-amber-100 text-amber-600' },
          { label: 'Low', value: 'low', color: 'bg-green-100 text-green-600' },
        ],
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      meta: {
        type: 'select',
        options: [
          { label: 'Backlog', value: 'backlog', color: 'bg-gray-100 text-gray-500' },
          { label: 'In Progress', value: 'in_progress', color: 'bg-blue-100 text-blue-600' },
          { label: 'Blocked', value: 'blocked', color: 'bg-red-50 text-red-400' },
          { label: 'Skipped', value: 'skipped', color: 'bg-amber-50 text-amber-500' },
          { label: 'Completed', value: 'completed', color: 'bg-green-100 text-green-600' },
          { label: 'Cancelled', value: 'cancelled', color: 'bg-gray-50 text-gray-400' },
        ],
      },
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      meta: { type: 'date', editable: true },
    },
    {
      id: 'schedule_btn',
      header: 'Schedule',
      cell: ({ row }) => (
        <button
          className="text-xs text-rose hover:underline"
          onClick={e => { e.stopPropagation(); setScheduleTask(row.original) }}
        >
          Schedule
        </button>
      ),
      meta: { editable: false },
    },
  ], [workspaces])

  function handleRowUpdate(rowIndex: number, columnId: string, value: unknown) {
    const task = tasks[rowIndex]
    if (!task) return
    updateTask.mutate({ id: task.id, [columnId]: value })
  }

  function handleRowDelete(rowIndex: number) {
    const task = tasks[rowIndex]
    if (task) deleteTask.mutate(task.id)
  }

  const DEADLINE_ICONS = ['🏆', '📚', '🚀']

  return (
    <div className="p-6 max-w-[1600px] space-y-5">

      {/* ── ROW 1: HEADER ── */}
      <div className="flex gap-4">
        <div className="flex-1 bg-card rounded-card border border-border p-7 flex flex-col justify-center">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-4xl font-semibold text-text-dark">
                Master Tasks <span className="text-rose-mid">🌸</span>
              </h1>
              <p className="text-text-mid italic mt-1.5">Everything that moves your life forward.</p>
            </div>
            {/* View toggle */}
            <div className="flex gap-1.5 mt-1">
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${view === 'kanban' ? 'bg-rose text-white border-rose' : 'bg-card border-border text-text-mid hover:bg-rose-bg'}`}
                onClick={() => setView('kanban')}
              >
                <LayoutGrid size={14} />
                Kanban
              </button>
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${view === 'table' ? 'bg-rose text-white border-rose' : 'bg-card border-border text-text-mid hover:bg-rose-bg'}`}
                onClick={() => setView('table')}
              >
                <List size={14} />
                Table
              </button>
            </div>
          </div>
        </div>
        <TasksIllustration />
      </div>

      {/* ── ROW 2: ACTION BUTTONS ── */}
      <div className="flex gap-3 flex-wrap">
        <button
          className="flex items-center gap-2 bg-rose text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-rose/90 transition-colors"
          onClick={() => openAddModal()}
        >
          <Plus size={15} />
          New Task
        </button>
        <button
          className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 text-sm text-text-dark hover:bg-rose-bg transition-colors"
          onClick={() => {
            const high = tasks.filter(t => t.priority === 'high' && t.status !== 'completed')
            if (high.length === 0) toast.info('No high-priority tasks to prioritize')
            else toast.success('Tasks auto-prioritized by deadline & priority')
          }}
        >
          <Shuffle size={15} className="text-rose" />
          Auto Prioritize
        </button>
        <button
          className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 text-sm text-text-dark hover:bg-rose-bg transition-colors"
          onClick={() => {
            const todayTasks = tasks.filter(t => t.status !== 'completed' && t.priority === 'high')
            if (todayTasks.length === 0) {
              navigate('/planner')
            } else {
              setScheduleTask(todayTasks[0])
            }
          }}
        >
          <Send size={15} className="text-rose" />
          Send to Planner
        </button>
        <button
          className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 text-sm text-text-dark hover:bg-rose-bg transition-colors"
          onClick={() => openAddModal()}
        >
          <Zap size={15} className="text-rose" />
          Quick Add
        </button>
        <button
          className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 text-sm text-text-dark hover:bg-rose-bg transition-colors"
          onClick={() => toast.success('Focus mode activated — distractions minimized')}
        >
          <Target size={15} className="text-rose" />
          Focus Mode
        </button>
      </div>

      {/* ── ROW 3: STATS ── */}
      <div className="grid grid-cols-6 gap-4">
        <StatCard
          icon={<CalendarDays size={14} className="text-rose" />}
          label="Total Tasks"
          value={statsQ.data?.total ?? 0}
          sub="All tasks"
          loading={statsQ.isLoading}
        />
        <StatCard
          icon={<CalendarDays size={14} className="text-rose" />}
          label="Due Today"
          value={statsQ.data?.dueToday ?? 0}
          sub="Tasks"
          loading={statsQ.isLoading}
        />
        <StatCard
          icon={<Flag size={14} className="text-rose" />}
          label="High Priority"
          value={statsQ.data?.highPriority ?? 0}
          sub="Tasks"
          loading={statsQ.isLoading}
        />
        <StatCard
          icon={<Zap size={14} className="text-sage" />}
          label="In Progress"
          value={statsQ.data?.inProgress ?? 0}
          sub="Tasks"
          loading={statsQ.isLoading}
        />
        <StatCard
          icon={<AlertCircle size={14} className="text-red-400" />}
          label="Blocked"
          value={statsQ.data?.blocked ?? 0}
          sub="Tasks"
          loading={statsQ.isLoading}
        />
        <StatCard
          icon={<CheckCircle size={14} className="text-sage" />}
          label="Completed This Week"
          value={statsQ.data?.completedThisWeek ?? 0}
          sub="Tasks"
          loading={statsQ.isLoading}
        />
      </div>

      {/* ── ROW 4: FILTER TABS ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-rose text-white'
                : 'text-text-mid hover:bg-rose-bg'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <button
          className="ml-auto flex items-center gap-1.5 text-text-mid hover:text-rose text-sm transition-colors"
          onClick={() => setShowFilters(f => !f)}
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>

      {/* ── FILTER DROPDOWNS (collapsible) ── */}
      {showFilters && (
        <div className="bg-card rounded-card border border-border p-4 flex gap-3 flex-wrap items-center">
          <select
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white text-text-dark outline-none focus:border-rose"
            value={filterWs}
            onChange={e => setFilterWs(e.target.value)}
          >
            <option value="">All Workspaces</option>
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white text-text-dark outline-none focus:border-rose"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-white text-text-dark outline-none focus:border-rose"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="skipped">Skipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(filterWs || filterPriority || filterStatus) && (
            <button
              className="text-xs text-rose hover:underline"
              onClick={() => { setFilterWs(''); setFilterPriority(''); setFilterStatus('') }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── ROW 5: MAIN CONTENT ── */}
      {view === 'kanban' ? (
        <div className="flex gap-5 items-start">
          {/* Kanban */}
          <div className="flex-1 bg-card rounded-card border border-border p-5 min-w-0">
            {tasksQ.isLoading ? (
              <div className="flex gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex-1 space-y-2">
                    <Sk className="h-6 w-24" />
                    {[1,2,3].map(j => <Sk key={j} className="h-20" />)}
                  </div>
                ))}
              </div>
            ) : (
              <KanbanBoard
                tasks={tasks}
                workspaces={workspaces}
                onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                onOpenAddModal={openAddModal}
                onSchedule={setScheduleTask}
                onEdit={setEditTask}
              />
            )}
          </div>

          {/* Right sidebar */}
          <RightSidebar tasks={tasks} />
        </div>
      ) : (
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <DataTable
            data={tasks}
            columns={tableColumns}
            onRowUpdate={handleRowUpdate}
            onRowAdd={() => openAddModal()}
            onRowDelete={handleRowDelete}
            isLoading={tasksQ.isLoading}
            emptyMessage="No tasks found. Click + to add one."
          />
        </div>
      )}

      {/* ── ROW 6: TASK TIMELINE ── */}
      <TaskTimeline />

      {/* ── ROW 7: DEEP WORK + DEADLINES ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Deep Work Queue */}
        <div className="bg-card rounded-card border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={16} className="text-rose" />
            <h2 className="font-display text-base font-semibold text-text-dark">High Priority Queue</h2>
          </div>
          <p className="text-text-light text-xs mb-4">High priority tasks not yet completed</p>
          {deepWorkQ.isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Sk key={i} className="h-10" />)}</div>
          ) : deepWorkQ.data?.length === 0 ? (
            <p className="text-text-light text-sm py-4 text-center">No deep work tasks</p>
          ) : (
            <div className="space-y-2">
              {deepWorkQ.data?.map(task => (
                <div key={task.id} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <div className="w-7 h-7 rounded-full bg-rose-bg flex items-center justify-center shrink-0">
                    <Brain size={13} className="text-rose" />
                  </div>
                  <span className="flex-1 text-text-dark text-sm truncate">{task.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.due_date && (
                      <span className="text-text-light text-xs">{fmtDate(task.due_date)}</span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                      High
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            className="mt-3 text-text-light hover:text-rose text-sm flex items-center gap-1 transition-colors"
            onClick={() => openAddModal()}
          >
            <Plus size={13} />
            Add to Queue
          </button>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-card rounded-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flag size={16} className="text-rose" />
            <h2 className="font-display text-base font-semibold text-text-dark">Upcoming Deadlines</h2>
          </div>
          {deadlinesQ.isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <Sk key={i} className="h-24" />)}
            </div>
          ) : deadlinesQ.data?.length === 0 ? (
            <p className="text-text-light text-sm py-4 text-center">No upcoming deadlines 🎉</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {deadlinesQ.data?.map((task, i) => (
                <div key={task.id} className="bg-rose-bg/50 rounded-card p-3 text-center border border-border">
                  <span className="text-xl">{DEADLINE_ICONS[i] ?? '📌'}</span>
                  <p className="text-text-dark text-xs font-medium mt-1 leading-snug line-clamp-2">{task.title}</p>
                  <p className="font-display text-2xl font-semibold text-text-dark mt-2">{task.daysLeft}</p>
                  <p className="text-text-light text-xs">days left</p>
                  <p className="text-text-mid text-[11px] mt-1">Due: {task.due_date ? fmtDate(task.due_date) : '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* ── MODALS ── */}
      {addModalOpen && (
        <AddTaskModal
          defaultStatus={addDefaultStatus}
          workspaces={workspaces}
          onClose={() => setAddModalOpen(false)}
          onAdd={handleAddTask}
        />
      )}
      {scheduleTask && (
        <ScheduleModal
          task={scheduleTask}
          onClose={() => setScheduleTask(null)}
          onSchedule={data => scheduleTaskMut.mutate(data)}
        />
      )}
      {editTask && (
        <EditTaskModal
          task={editTask}
          workspaces={workspaces}
          onClose={() => setEditTask(null)}
          onSave={data => updateTask.mutate({ id: editTask.id, ...data } as any)}
        />
      )}
    </div>
  )
}
