import { useState, useMemo, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Settings2,
  GripVertical,
  Plus,
  Trash2,
  X,
  Calendars as CalendarIcon,
  ChartSpline,
  Tally5,
  ClipboardClock,
  Swords
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { DndContext, closestCenter, useSensors, useSensor, PointerSensor } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  useHabits,
  useHabitLogs,
  useAddHabit,
  useUpdateHabit,
  useDeleteHabit,
  useToggleHabitLog,
} from '../hooks/useHabits'
import type { Habit } from '../hooks/useHabits'
import { useWorkspaces } from '../hooks/useWorkspace'
import type { Workspace } from '../hooks/useWorkspace'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const COLOR_OPTIONS = [
  { value: 'sage',   cls: 'bg-sage',      label: 'Sage'   },
  { value: 'rose',   cls: 'bg-rose',      label: 'Rose'   },
  { value: 'blue',   cls: 'bg-blue-400',  label: 'Blue'   },
  { value: 'amber',  cls: 'bg-amber-400', label: 'Amber'  },
  { value: 'purple', cls: 'bg-purple-400',label: 'Purple' },
  { value: 'gray',   cls: 'bg-gray-400',  label: 'Gray'   },
]

function colorCls(color: string | null | undefined): string {
  return COLOR_OPTIONS.find(c => c.value === color)?.cls ?? 'bg-sage'
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ─── Sortable Habit Row ───────────────────────────────────────────────────────

function SortableHabitItem({
  habit,
  workspaces,
  onToggleActive,
  onDelete,
}: {
  habit: Habit
  workspaces: Workspace[]
  onToggleActive: (id: number, active: boolean) => void
  onDelete: (id: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: habit.id,
  })

  const isActive = habit.is_active !== false
  const linkedWs = workspaces.find(w => w.id === habit.workspace_id)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-text-light hover:text-text-mid cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colorCls(habit.color)}`} />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-text-dark truncate block">{habit.name}</span>
        {linkedWs && (
          <span className="text-[10px] text-text-light bg-rose-bg px-1.5 py-0.5 rounded-full">
            {linkedWs.icon ? `${linkedWs.icon} ` : ''}{linkedWs.name}
          </span>
        )}
      </div>
      <button
        onClick={() => onToggleActive(habit.id, !isActive)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
          isActive ? 'bg-sage' : 'bg-border'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
            isActive ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
      <button
        onClick={() => onDelete(habit.id)}
        className="text-text-light hover:text-rose transition-colors flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Manage Habits Drawer ─────────────────────────────────────────────────────

function ManageHabitsModal({
  habits,
  onClose,
}: {
  habits: Habit[]
  onClose: () => void
}) {
  const [sorted, setSorted] = useState<Habit[]>(habits)
  const [name, setName] = useState('')
  const [color, setColor] = useState('sage')
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)

  useEffect(() => {
    setSorted(habits)
  }, [habits])

  const sensors = useSensors(useSensor(PointerSensor))
  const addHabit = useAddHabit()
  const updateHabit = useUpdateHabit()
  const deleteHabit = useDeleteHabit()
  const { data: workspaces = [] } = useWorkspaces()

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldI = sorted.findIndex(h => h.id === active.id)
    const newI = sorted.findIndex(h => h.id === over.id)
    const next = arrayMove(sorted, oldI, newI)
    setSorted(next)
    next.forEach((h, i) => updateHabit.mutate({ id: h.id, sort_order: i }))
  }

  const handleAdd = () => {
    if (!name.trim()) return
    addHabit.mutate({
      name: name.trim(),
      color,
      sort_order: sorted.length,
      workspace_id: workspaceId,
    })
    setName('')
    setColor('sage')
    setWorkspaceId(null)
  }

  const handleToggleActive = (id: number, active: boolean) => {
    updateHabit.mutate({ id, is_active: active })
  }

  const handleDelete = (id: number) => {
    if (!confirm('Delete this habit? All logs will also be removed.')) return
    deleteHabit.mutate(id)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-text-dark/20" onClick={onClose} />
      <div className="w-80 bg-card h-full overflow-hidden shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-lg text-text-dark">Manage Habits</h2>
          <button onClick={onClose} className="text-text-light hover:text-text-mid">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sorted.map(h => h.id)} strategy={verticalListSortingStrategy}>
              {sorted.map(habit => (
                <SortableHabitItem
                  key={habit.id}
                  habit={habit}
                  workspaces={workspaces}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
          {sorted.length === 0 && (
            <p className="text-text-light text-sm text-center py-8">No habits yet.</p>
          )}
        </div>

        <div className="border-t border-border p-4 space-y-3">
          <p className="text-xs text-text-mid font-medium">Add Habit</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Habit name..."
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-cream focus:outline-none focus:border-rose"
          />
          <div className="flex gap-2">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`w-6 h-6 rounded-full ${c.cls} transition-all ${
                  color === c.value ? 'ring-2 ring-offset-1 ring-rose scale-110' : ''
                }`}
              />
            ))}
          </div>
          <select
            value={workspaceId ?? ''}
            onChange={e => setWorkspaceId(e.target.value ? Number(e.target.value) : null)}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-cream focus:outline-none focus:border-rose text-text-dark"
          >
            <option value="">No workspace link</option>
            {workspaces.filter(w => w.is_active).map(w => (
              <option key={w.id} value={w.id}>
                {w.icon ? `${w.icon} ` : ''}{w.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || addHabit.isPending}
            className="w-full bg-rose text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Habit
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Calendar Grid (Table View) ───────────────────────────────────────────────

type DayInfo = {
  day: number
  date: string
  dayName: string
  isWeekend: boolean
  isToday: boolean
  isFuture: boolean
}

type HabitStat = {
  habitId: number
  monthPct: number
  streak: number
  doneDays: number
}

function CalendarGrid({
  activeHabits,
  days,
  logMap,
  habitStats,
  onToggle,
}: {
  activeHabits: Habit[]
  days: DayInfo[]
  logMap: Map<string, boolean>
  habitStats: HabitStat[]
  onToggle: (habitId: number, date: string, currentlyDone: boolean) => void
}) {
  return (
    <div className="bg-card rounded-card border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-text-mid font-medium text-xs py-3 px-4 sticky left-0 bg-card z-10 min-w-36">
                Habit
              </th>
              {days.map(d => (
                <th
                  key={d.day}
                  className={`text-center py-2 w-8 min-w-8 ${d.isWeekend ? 'bg-rose-bg' : ''} ${
                    d.isToday ? 'bg-rose-light' : ''
                  }`}
                >
                  <div
                    className={`text-xs font-semibold ${d.isToday ? 'text-rose' : 'text-text-dark'}`}
                  >
                    {d.day}
                  </div>
                  <div className="text-[10px] text-text-light">{d.dayName}</div>
                </th>
              ))}
              <th className="text-center text-text-mid font-medium text-xs py-3 px-3 sticky right-0 bg-card min-w-14 z-10">
                Streak
              </th>
            </tr>
          </thead>
          <tbody>
            {activeHabits.length === 0 && (
              <tr>
                <td
                  colSpan={days.length + 2}
                  className="py-12 text-center text-text-light text-sm"
                >
                  No active habits. Click "Manage Habits" to add some.
                </td>
              </tr>
            )}
            {activeHabits.map((habit, hi) => {
              const stats = habitStats[hi]
              return (
                <tr key={habit.id} className="border-b border-border/50 hover:bg-rose-bg group">
                  <td className="sticky left-0 bg-card group-hover:bg-rose-bg z-10 py-2 px-4">
                    <div className="flex items-center gap-2 min-w-32">
                      {habit.icon ? (
                        <span className="text-base leading-none flex-shrink-0">{habit.icon}</span>
                      ) : (
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorCls(habit.color)}`}
                        />
                      )}
                      <span className="text-text-dark font-medium text-sm truncate max-w-24">
                        {habit.name}
                      </span>
                    </div>
                  </td>
                  {days.map(d => {
                    const done = logMap.get(`${habit.id}_${d.date}`) ?? false
                    return (
                      <td
                        key={d.day}
                        className={`text-center py-2 ${d.isWeekend ? 'bg-rose-bg' : ''} ${
                          d.isToday ? 'bg-rose-light' : ''
                        }`}
                      >
                        <button
                          onClick={() => !d.isFuture && onToggle(habit.id, d.date, done)}
                          disabled={d.isFuture}
                          className={`w-5 h-5 rounded-full inline-flex items-center justify-center transition-all ${
                            done
                              ? `${colorCls(habit.color)} opacity-80 hover:opacity-100 scale-100`
                              : d.isFuture
                              ? 'border border-border/30 opacity-20 cursor-not-allowed'
                              : 'border-2 border-border hover:border-rose-mid hover:scale-110'
                          }`}
                        />
                      </td>
                    )
                  })}
                  <td className="sticky right-0 bg-card group-hover:bg-rose-bg z-10 text-center px-3 py-2">
                    <span
                      className={`text-sm font-bold ${
                        stats?.streak > 0 ? 'text-rose' : 'text-text-light'
                      }`}
                    >
                      {stats?.streak ?? 0}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Monthly Calendar ─────────────────────────────────────────────────────────

function MonthlyCalendar({
  year,
  month,
  activeHabits,
  logMap,
  daysInMonth,
  today,
}: {
  year: number
  month: number
  activeHabits: Habit[]
  logMap: Map<string, boolean>
  daysInMonth: number
  today: string
}) {
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()

  const cells = useMemo(() => {
    const arr: (number | null)[] = [
      ...Array<null>(firstDayOfWeek).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
    const rem = arr.length % 7
    if (rem !== 0) arr.push(...Array<null>(7 - rem).fill(null))
    return arr
  }, [firstDayOfWeek, daysInMonth])

  return (
    <div className="bg-card rounded-card border border-border p-5">
      <div className="grid grid-cols-7 mb-2">
        {DAY_ABBRS.map(d => (
          <div key={d} className="text-center text-xs text-text-light font-medium py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day)
            return <div key={`e-${i}`} className="min-h-20 rounded-lg" />
          const ds = toDateStr(year, month, day)
          const doneHabits = activeHabits.filter(h => logMap.get(`${h.id}_${ds}`))
          const isToday = ds === today
          return (
            <div
              key={day}
              className={`min-h-20 p-1.5 rounded-lg border ${
                isToday
                  ? 'border-rose bg-rose-light'
                  : 'border-border/40 hover:border-border'
              }`}
            >
              <div
                className={`text-xs font-semibold mb-1 ${isToday ? 'text-rose' : 'text-text-dark'}`}
              >
                {day}
              </div>
              <div className="flex flex-wrap gap-1">
                {doneHabits.slice(0, 8).map(h => (
                  <div
                    key={h.id}
                    className={`w-2 h-2 rounded-full ${colorCls(h.color)}`}
                  />
                ))}
                {doneHabits.length > 8 && (
                  <span className="text-[9px] text-text-light">+{doneHabits.length - 8}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Table View ───────────────────────────────────────────────────────────────

function HabitTableView({
  activeHabits,
  habitStats,
}: {
  activeHabits: Habit[]
  habitStats: HabitStat[]
}) {
  return (
    <div className="bg-card rounded-card border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-rose-bg">
            <th className="text-left py-3 px-4 text-text-mid font-medium text-xs">Habit</th>
            <th className="text-center py-3 px-4 text-text-mid font-medium text-xs">This Month</th>
            <th className="text-center py-3 px-4 text-text-mid font-medium text-xs">Streak</th>
            <th className="text-center py-3 px-4 text-text-mid font-medium text-xs">Days Done</th>
          </tr>
        </thead>
        <tbody>
          {activeHabits.length === 0 && (
            <tr>
              <td colSpan={4} className="py-12 text-center text-text-light">
                No active habits to display.
              </td>
            </tr>
          )}
          {activeHabits.map((habit, i) => {
            const stats = habitStats[i]
            return (
              <tr key={habit.id} className="border-b border-border/50 hover:bg-rose-bg">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 text-text-dark font-medium">
                    {habit.icon && <span>{habit.icon}</span>}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colorCls(habit.color)}`} />
                    {habit.name}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-20 h-1.5 bg-rose-light rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sage rounded-full transition-all"
                        style={{ width: `${stats?.monthPct ?? 0}%` }}
                      />
                    </div>
                    <span className="text-text-dark font-medium w-10 text-right">
                      {stats?.monthPct ?? 0}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`font-semibold ${
                      (stats?.streak ?? 0) > 0 ? 'text-rose' : 'text-text-light'
                    }`}
                  >
                    {stats?.streak ?? 0} days
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-text-mid">{stats?.doneDays ?? 0}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Bottom Stats ─────────────────────────────────────────────────────────────

type OverallStats = {
  thisMonthPct: number
  bestStreak: number
  daysTracked: number
  vsLastMonthPct: number
}

function BottomStats({
  stats,
  trendData,
  top5,
}: {
  stats: OverallStats
  trendData: { day: number; pct: number }[]
  top5: { habit: Habit; monthPct: number; streak: number; doneDays: number }[]
}) {
  const vsSign = stats.vsLastMonthPct >= 0 ? '+' : ''

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Overall Summary */}
      <div className="bg-card rounded-card border border-border p-5 relative overflow-hidden">
        <h3 className="font-display text-base text-text-dark mb-4">Overall Summary</h3>
        <div className="grid grid-cols-2 gap-5">
          <div className="text-center">
            <div className="flex justify-center mb-1"><CalendarIcon className="w-6 h-6 text-rose" /></div>
            <div className="text-3xl font-bold font-display text-text-dark">
              {stats.thisMonthPct}%
            </div>
            <div className="text-xs text-text-mid mt-1">This Month</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1"><Tally5 className="w-6 h-6 text-rose" /></div>
            <div className="text-3xl font-bold font-display text-text-dark">
              {stats.bestStreak}
            </div>
            <div className="text-xs text-text-mid mt-1">Best Streak</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1"><ClipboardClock className="w-6 h-6 text-rose" /></div>
            <div className="text-3xl font-bold font-display text-text-dark">
              {stats.daysTracked}
            </div>
            <div className="text-xs text-text-mid mt-1">Days Tracked</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1"><ChartSpline className="w-6 h-6 text-rose" /></div>
            <div
              className={`text-3xl font-bold font-display ${
                stats.vsLastMonthPct >= 0 ? 'text-sage' : 'text-rose'
              }`}
            >
              {vsSign}{stats.vsLastMonthPct}%
            </div>
            <div className="text-xs text-text-mid mt-1">vs Last Month</div>
          </div>
        </div>
        <div className="absolute bottom-3 right-4 text-3xl opacity-20 select-none">🌸</div>
      </div>

      {/* Trend Chart */}
      <div className="bg-card rounded-card border border-border p-5">
        <h3 className="font-display text-base text-text-dark mb-4">Habit Completion Trend</h3>
        {trendData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-text-light text-sm">
            No data yet this month
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0E4DC" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#B0B0B0' }}
                interval={5}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#B0B0B0' }}
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                formatter={(v) => [`${v ?? 0}%`, 'Completion']}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #F0E4DC',
                  background: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#D4848A"
                fill="#FDDEDE"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top 5 */}
      <div className="bg-card rounded-card border border-border p-5 relative overflow-hidden">
        <h3 className="font-display text-base text-text-dark mb-4">Top 5 Consistent Habits</h3>
        <div className="space-y-3">
          {top5.map((item, i) => (
            <div key={item.habit.id} className="flex items-center gap-3">
              <span className="text-xs text-text-light w-4 flex-shrink-0">{i + 1}.</span>
              <span className="text-sm text-text-dark flex-1 truncate">{item.habit.name}</span>
              <div className="w-24 h-1.5 bg-rose-light rounded-full overflow-hidden flex-shrink-0">
                <div
                  className="h-full bg-sage rounded-full"
                  style={{ width: `${item.monthPct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-text-mid w-8 text-right flex-shrink-0">
                {item.monthPct}%
              </span>
            </div>
          ))}
          {top5.length === 0 && (
            <p className="text-text-light text-sm text-center py-4">No data yet</p>
          )}
        </div>
        <div className="absolute bottom-3 right-4 text-3xl opacity-20 select-none">🏆</div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Calendar() {
  const [view, setView] = useState<'calendar' | 'table' | 'monthly'>('calendar')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [showManage, setShowManage] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const todayDate = useMemo(() => {
    const d = new Date()
    return {
      str: d.toISOString().split('T')[0],
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    }
  }, [])

  const isCurrentMonth = year === todayDate.year && month === todayDate.month
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysSoFar = isCurrentMonth ? todayDate.day : daysInMonth

  const prevYear = month === 1 ? year - 1 : year
  const prevMonth = month === 1 ? 12 : month - 1
  const prevDaysInMonth = new Date(prevYear, prevMonth, 0).getDate()

  const { data: habits = [] } = useHabits()
  const { data: logs = [] } = useHabitLogs(year, month)
  const { data: prevLogs = [] } = useHabitLogs(prevYear, prevMonth)

  const activeHabits = useMemo(
    () => habits.filter(h => h.is_active !== false),
    [habits],
  )

  const logMap = useMemo(() => {
    const map = new Map<string, boolean>()
    logs.forEach(l => {
      if (l.status === 'done' && l.habit_id) map.set(`${l.habit_id}_${l.date}`, true)
    })
    return map
  }, [logs])

  const prevLogMap = useMemo(() => {
    const map = new Map<string, boolean>()
    prevLogs.forEach(l => {
      if (l.status === 'done' && l.habit_id) map.set(`${l.habit_id}_${l.date}`, true)
    })
    return map
  }, [prevLogs])

  const days = useMemo<DayInfo[]>(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      const ds = toDateStr(year, month, d)
      const date = new Date(year, month - 1, d)
      return {
        day: d,
        date: ds,
        dayName: DAY_ABBRS[date.getDay()],
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday: ds === todayDate.str,
        isFuture: isCurrentMonth && d > todayDate.day,
      }
    })
  }, [year, month, daysInMonth, todayDate, isCurrentMonth])

  const habitStats = useMemo<HabitStat[]>(() => {
    return activeHabits.map(habit => {
      let doneDays = 0
      for (let d = 1; d <= daysSoFar; d++) {
        if (logMap.get(`${habit.id}_${toDateStr(year, month, d)}`)) doneDays++
      }
      const monthPct = daysSoFar > 0 ? Math.round((doneDays / daysSoFar) * 100) : 0

      let streak = 0
      if (isCurrentMonth) {
        for (let d = todayDate.day; d >= 1; d--) {
          if (logMap.get(`${habit.id}_${toDateStr(year, month, d)}`)) streak++
          else break
        }
      }

      return { habitId: habit.id, monthPct, streak, doneDays }
    })
  }, [activeHabits, logMap, year, month, daysSoFar, isCurrentMonth, todayDate])

  const overallStats = useMemo<OverallStats>(() => {
    const totalDone = habitStats.reduce((s, h) => s + h.doneDays, 0)
    const maxPossible = activeHabits.length * daysSoFar
    const thisMonthPct = maxPossible > 0 ? Math.round((totalDone / maxPossible) * 100) : 0
    const bestStreak = habitStats.reduce((m, h) => Math.max(m, h.streak), 0)

    let prevDone = 0
    const prevMax = activeHabits.length * prevDaysInMonth
    if (prevMax > 0) {
      activeHabits.forEach(h => {
        for (let d = 1; d <= prevDaysInMonth; d++) {
          if (prevLogMap.get(`${h.id}_${toDateStr(prevYear, prevMonth, d)}`)) prevDone++
        }
      })
    }
    const prevMonthPct = prevMax > 0 ? Math.round((prevDone / prevMax) * 100) : 0

    return {
      thisMonthPct,
      bestStreak,
      daysTracked: daysSoFar,
      vsLastMonthPct: thisMonthPct - prevMonthPct,
    }
  }, [habitStats, activeHabits, daysSoFar, prevDaysInMonth, prevLogMap, prevYear, prevMonth])

  const trendData = useMemo(() => {
    return Array.from({ length: daysSoFar }, (_, i) => {
      const d = i + 1
      const ds = toDateStr(year, month, d)
      const done = activeHabits.filter(h => logMap.get(`${h.id}_${ds}`)).length
      const pct = activeHabits.length > 0 ? Math.round((done / activeHabits.length) * 100) : 0
      return { day: d, pct }
    })
  }, [activeHabits, logMap, year, month, daysSoFar])

  const top5 = useMemo(() => {
    return activeHabits
      .map((h, i) => ({ habit: h, ...habitStats[i] }))
      .sort((a, b) => b.monthPct - a.monthPct)
      .slice(0, 5)
  }, [activeHabits, habitStats])

  const toggleLog = useToggleHabitLog()

  const handleToggle = (habitId: number, date: string, currentlyDone: boolean) => {
    toggleLog.mutate({ habitId, logDate: date, currentlyDone, year, month })
  }

  const prevMonthNav = () =>
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonthNav = () =>
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  return (
    <div className="p-6 space-y-5 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-text-dark">
            Consistency Calendar{' '}
            <span role="img" aria-label="flower">🌸</span>
          </h1>
          <p className="text-text-mid mt-1 text-sm">Small habits. Big identity.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setShowManage(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text-mid hover:bg-rose-bg transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Manage Habits
          </button>
          <div className="text-3xl opacity-50 hidden xl:block select-none" aria-hidden>
            🌿 📅 🕯️ ☕
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonthNav}
            className="p-1.5 rounded-lg border border-border hover:bg-rose-bg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-text-mid" />
          </button>
          <span className="font-medium text-text-dark min-w-36 text-center text-sm">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={nextMonthNav}
            className="p-1.5 rounded-lg border border-border hover:bg-rose-bg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-text-mid" />
          </button>
        </div>

        <div className="flex border border-border rounded-lg overflow-hidden text-sm">
          {(['table', 'calendar', 'monthly'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 transition-colors ${
                view === v
                  ? 'bg-rose-light text-rose font-medium'
                  : 'text-text-mid hover:bg-rose-bg'
              }`}
            >
              {v === 'table' ? 'Table View' : v === 'calendar' ? 'Calendar View' : 'Monthly View'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-text-mid">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sage inline-block" /> Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-mid inline-block" /> Partial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-border inline-block" /> Missed
          </span>
        </div>
      </div>

      {/* Main view */}
      {view === 'calendar' && (
        <CalendarGrid
          activeHabits={activeHabits}
          days={days}
          logMap={logMap}
          habitStats={habitStats}
          onToggle={handleToggle}
        />
      )}
      {view === 'monthly' && (
        <MonthlyCalendar
          year={year}
          month={month}
          activeHabits={activeHabits}
          logMap={logMap}
          daysInMonth={daysInMonth}
          today={todayDate.str}
        />
      )}
      {view === 'table' && (
        <HabitTableView activeHabits={activeHabits} habitStats={habitStats} />
      )}

      {/* Bottom stats */}
      <BottomStats stats={overallStats} trendData={trendData} top5={top5} />

      {/* Quote footer */}
      <div className="flex items-center gap-3 text-sm text-text-mid bg-card rounded-card border border-border px-5 py-3">
        <span className="text-rose" role="img" aria-label="heart"><Swords/></span>
        <span className="font-medium text-text-dark">Remember</span>
        <span>BE. CONSISTENT.</span>
      </div>

      {/* Manage drawer */}
      {showManage && (
        <ManageHabitsModal habits={habits} onClose={() => setShowManage(false)} />
      )}
    </div>
  )
}
