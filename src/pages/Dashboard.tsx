import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, Zap, Flame, Brain, ListTodo, Lightbulb, Users,
  FileText, CalendarDays, Activity, Dumbbell,BellRing,Astroid
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  useGreetingQuote, useHabitsStats, useTasksToday, useDeepWork,
  useHabitConsistency, useTasksOverview, useWeeklyProgress,
  useUpcomingReminders, useMotivationQuote, useFocusSession,
  useTodaysPriorities, useMarkPriorityDone,
} from '../hooks/useDashboard'

// ─── helpers ───────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function formatDate(ds: string): string {
  if (!ds) return ''
  return new Date(ds + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-rose-bg/40 rounded ${className ?? ''}`} />
}

// ─── illustration ──────────────────────────────────────────────────────────

function DeskIllustration() {
  return (
    <div className="relative overflow-hidden rounded-card border border-border w-[440px] shrink-0 min-h-[160px] bg-gradient-to-br from-[#FDDEDE] via-[#FEF0E8] to-rose-bg">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F9D0CE]/50 via-transparent to-transparent" />

      {/* Window background */}
      <div className="absolute top-4 left-1/3 right-4 bottom-[35%] rounded-lg bg-gradient-to-br from-[#FDE8E0]/60 to-[#FEF5EF]/40 border border-rose-light/20" />

      {/* Mountain silhouettes */}
      <svg className="absolute" style={{ top: '10%', left: '32%', width: '60%', height: '35%' }} viewBox="0 0 200 70" preserveAspectRatio="none">
        <polygon points="0,70 35,18 70,50 110,8 150,42 200,70" fill="#E8A5A5" opacity="0.25" />
        <polygon points="0,70 25,32 55,52 85,22 120,48 155,38 200,70" fill="#FDDEDE" opacity="0.4" />
      </svg>

      {/* Left plant */}
      <svg className="absolute bottom-0 left-6" width="72" height="100" viewBox="0 0 72 100">
        <line x1="36" y1="100" x2="36" y2="48" stroke="#8BC49A" strokeWidth="2.5" />
        <ellipse cx="20" cy="52" rx="17" ry="9" fill="#8BC49A" opacity="0.8" transform="rotate(-30 20 52)" />
        <ellipse cx="52" cy="48" rx="17" ry="9" fill="#8BC49A" opacity="0.7" transform="rotate(25 52 48)" />
        <ellipse cx="36" cy="30" rx="13" ry="7" fill="#8BC49A" opacity="0.85" transform="rotate(-5 36 30)" />
        <ellipse cx="16" cy="68" rx="11" ry="6" fill="#8BC49A" opacity="0.55" transform="rotate(-50 16 68)" />
      </svg>

      {/* Books stack */}
      <div className="absolute" style={{ bottom: '28%', right: '22%' }}>
        <div className="h-3 w-14 rounded-sm bg-[#D4848A]/50" style={{ transform: 'rotate(-1deg)' }} />
        <div className="h-3 w-12 rounded-sm bg-[#8BC49A]/50 mt-0.5" style={{ transform: 'rotate(1.5deg)' }} />
        <div className="h-3 w-13 rounded-sm bg-[#E8A5A5]/60 mt-0.5" style={{ transform: 'rotate(-0.5deg)' }} />
      </div>

      {/* Laptop */}
      <div className="absolute" style={{ bottom: '28%', left: '40%' }}>
        <div
          className="flex items-center justify-center bg-white/65 border border-rose-light/40 shadow-sm"
          style={{ width: 88, height: 58, borderRadius: '4px 4px 0 0' }}
        >
          <p className="font-display text-text-light text-center leading-snug" style={{ fontSize: 10 }}>
            Focus<br />Create<br />Grow ✓
          </p>
        </div>
        <div className="bg-[#E8A5A5]/30 rounded-sm" style={{ width: 96, height: 5, marginLeft: -4, borderRadius: '0 0 3px 3px' }} />
      </div>

      {/* Tulips */}
      <svg className="absolute bottom-0 right-6" width="60" height="95" viewBox="0 0 60 95">
        <line x1="12" y1="95" x2="12" y2="38" stroke="#8BC49A" strokeWidth="2" />
        <line x1="28" y1="95" x2="28" y2="28" stroke="#8BC49A" strokeWidth="2" />
        <line x1="44" y1="95" x2="44" y2="44" stroke="#8BC49A" strokeWidth="2" />
        <ellipse cx="8" cy="68" rx="8" ry="4" fill="#8BC49A" opacity="0.65" transform="rotate(-35 8 68)" />
        <ellipse cx="36" cy="62" rx="8" ry="4" fill="#8BC49A" opacity="0.65" transform="rotate(35 36 62)" />
        <ellipse cx="12" cy="34" rx="7" ry="10" fill="#E8A5A5" opacity="0.9" />
        <ellipse cx="12" cy="30" rx="5.5" ry="8" fill="#D4848A" opacity="0.8" />
        <ellipse cx="28" cy="24" rx="7" ry="10" fill="#E8A5A5" opacity="0.9" />
        <ellipse cx="28" cy="20" rx="5.5" ry="8" fill="#D4848A" opacity="0.85" />
        <ellipse cx="44" cy="40" rx="6" ry="9" fill="#E8A5A5" opacity="0.85" />
        <ellipse cx="44" cy="36" rx="5" ry="7" fill="#D4848A" opacity="0.75" />
      </svg>

      {/* Mug */}
      <div className="absolute" style={{ bottom: '28%', left: '28%' }}>
        <div
          className="relative flex items-center justify-center bg-[#FEF5EF] border border-rose-light/50"
          style={{ width: 28, height: 24, borderRadius: 4 }}
        >
          <div
            className="absolute border-r border-t border-b border-rose-light/40"
            style={{ right: -8, top: 4, width: 8, height: 12, borderRadius: '0 50% 50% 0' }}
          />
          <span style={{ fontSize: 8, color: '#D4848A' }}>♥</span>
        </div>
      </div>

      {/* Desk surface */}
      <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-gradient-to-t from-[#FEF0E6]/80 to-transparent" />
    </div>
  )
}

// ─── priority pill ─────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-600',
  low: 'bg-green-100 text-green-600',
}


// ─── donut chart colors ────────────────────────────────────────────────────

const DONUT_CONFIG = [
  { key: 'completed', label: 'Completed', color: '#8BC49A' },
  { key: 'in_progress', label: 'In Progress', color: '#60A5FA' },
  { key: 'backlog', label: 'Backlog', color: '#D1D5DB' },
  { key: 'blocked', label: 'Blocked', color: '#F87171' },
  { key: 'skipped', label: 'Skipped', color: '#FCD34D' },
  { key: 'cancelled', label: 'Cancelled', color: '#9CA3AF' },
]

// ─── main component ────────────────────────────────────────────────────────

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)

  const { activeSession, start: startSession, stop: stopSession } = useFocusSession()
  const focusMode = !!activeSession

  // Sync elapsed from DB session start (handles page refresh)
  useEffect(() => {
    if (!activeSession) { setElapsed(0); return }
    const base = new Date(activeSession.started_at).getTime()
    setElapsed(Math.floor((Date.now() - base) / 1000))
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - base) / 1000)), 1000)
    return () => clearInterval(id)
  }, [activeSession])

  const greetingQ = useGreetingQuote()
  const habitsQ = useHabitsStats()
  const tasksQ = useTasksToday()
  const deepWorkQ = useDeepWork()
  const consistencyQ = useHabitConsistency()
  const prioritiesQ = useTodaysPriorities()
  const markPriorityDone = useMarkPriorityDone()
  const overviewQ = useTasksOverview()
  const weeklyQ = useWeeklyProgress()
  const remindersQ = useUpcomingReminders()
  const motivationQ = useMotivationQuote()

  const greeting = getGreeting()

  async function toggleFocus() {
    if (!focusMode) {
      await startSession.mutateAsync()
    } else if (activeSession) {
      const durationMinutes = Math.max(1, Math.round(elapsed / 60))
      await stopSession.mutateAsync({ id: activeSession.id, durationMinutes })
    }
  }

  const focusSessionHours = focusMode ? elapsed / 3600 : 0

  // ── donut chart data ──
  const donutData = DONUT_CONFIG.map(c => ({
    ...c,
    value: overviewQ.data?.groups[c.key] ?? 0,
  })).filter(d => d.value > 0)
  const totalTasks = overviewQ.data?.total ?? 0

  // ── weekly chart data ──
  const weeklyData = weeklyQ.data ?? []

  return (
    <div className="p-6 max-w-[1400px] space-y-5">

      {/* ── ROW 1: HEADER ── */}
      <div className="flex gap-4">
        <div className="flex-1 bg-card rounded-card border border-border p-8 flex flex-col justify-center">
          <h1 className="font-display text-4xl font-semibold text-text-dark">
            {greeting},{' '}
            <span className="text-rose">Vivek ✦</span>
          </h1>
          <p className="text-text-mid text-base italic mt-2">
            {greetingQ.isLoading
              ? '"Discipline today, freedom tomorrow."'
              : greetingQ.data
                ? `"${greetingQ.data.quote}"`
                : '"Discipline today, freedom tomorrow."'}
          </p>
        </div>
        <DeskIllustration />
      </div>

      {/* ── ROW 2: STATS ── */}
      <div className="grid grid-cols-4 gap-4">
        {/* Tasks Today */}
        <div className="bg-card rounded-card border border-border px-4 py-4">
          <p className="text-text-mid text-xs font-medium mb-2">Tasks Today</p>
          {tasksQ.isLoading
            ? <Sk className="h-8 w-20 mt-1" />
            : (
              <div className="flex items-end gap-2">
                <span className="font-display text-3xl font-semibold text-text-dark">
                  {tasksQ.data?.remainingCount ?? 0}
                </span>
                <span className="text-text-light text-sm mb-1">/ {tasksQ.data?.total ?? 0}</span>
              </div>
            )}
          <CheckCircle className="text-rose-mid mt-2" size={18} />
        </div>

        {/* Deep Work */}
        <div className="bg-card rounded-card border border-border px-4 py-4">
          <p className="text-text-mid text-xs font-medium mb-2">Deep Work (Today)</p>
          {deepWorkQ.isLoading
            ? <Sk className="h-8 w-20 mt-1" />
            : (
              <div>
                <span className="font-display text-3xl font-semibold text-text-dark">
                  {((deepWorkQ.data ?? 0) + focusSessionHours).toFixed(1)} hrs
                </span>
                {focusSessionHours > 0 && (
                  <p className="text-sage text-xs mt-0.5">+{formatElapsed(elapsed)} focus</p>
                )}
              </div>
            )}
          <Zap className="text-sage mt-2" size={18} />
        </div>

        {/* Habits Done */}
        <div className="bg-card rounded-card border border-border px-4 py-4">
          <p className="text-text-mid text-xs font-medium mb-2">Habits Done</p>
          {habitsQ.isLoading
            ? <Sk className="h-8 w-20 mt-1" />
            : (
              <div className="flex items-end gap-2">
                <span className="font-display text-3xl font-semibold text-text-dark">
                  {habitsQ.data?.doneCount ?? 0}
                </span>
                <span className="text-text-light text-sm mb-1">/ {habitsQ.data?.total ?? 0}</span>
              </div>
            )}
          <Flame className="text-rose mt-2" size={18} />
        </div>

        {/* Focus Mode */}
        <div
          className={`bg-card rounded-card border border-border px-4 py-4 cursor-pointer transition-colors ${focusMode ? 'border-sage/50 bg-sage/5' : ''}`}
          onClick={() => void toggleFocus()}
        >
          <p className="text-text-mid text-xs font-medium mb-2">Focus Mode</p>
          <span className={`font-display text-3xl font-semibold ${focusMode ? 'text-sage' : 'text-text-light'}`}>
            {startSession.isPending || stopSession.isPending ? '…' : focusMode ? 'ON' : 'OFF'}
          </span>
          {focusMode && elapsed > 0
            ? <p className="text-sage text-xs font-mono mt-1">{formatElapsed(elapsed)}</p>
            : <p className="text-text-light text-xs mt-1">{focusMode ? "Let's build." : 'Click to start'}</p>}
          <Brain className={`mt-1 ${focusMode ? 'text-sage' : 'text-text-light'}`} size={18} />
        </div>
      </div>

      {/* ── ROW 3: FOCUS | ACTIONS ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Today's Focus */}
        <div className="bg-card rounded-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-rose" />
              <h2 className="font-display text-base font-semibold text-text-dark">Today's Focus</h2>
            </div>
            <span className="text-text-light text-xs">Top 3 from Planner</span>
          </div>
          {prioritiesQ.isLoading
            ? <div className="space-y-3">{[1,2,3].map(i => <Sk key={i} className="h-10" />)}</div>
            : (prioritiesQ.data ?? []).length === 0
              ? (
                <div className="py-6 text-center">
                  <p className="text-text-light text-sm">No priorities set for today.</p>
                  <button onClick={() => navigate('/planner')} className="mt-2 text-rose text-xs hover:underline">
                    Set priorities in Planner →
                  </button>
                </div>
              )
              : (
                <div className="space-y-3">
                  {(prioritiesQ.data ?? []).map(p => {
                    const title = p.custom_title ?? p.tasks?.title ?? 'Untitled'
                    const priority = p.tasks?.priority
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${p.is_done ? 'opacity-50' : 'hover:bg-rose-bg/30'}`}
                      >
                        <button
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${p.is_done ? 'bg-sage border-sage' : 'border-border hover:border-rose'}`}
                          onClick={() => markPriorityDone.mutate({ id: p.id, isDone: !p.is_done })}
                        >
                          {p.is_done && <CheckCircle size={12} className="text-white" />}
                        </button>
                        <span className={`flex-1 text-sm ${p.is_done ? 'line-through text-text-light' : 'text-text-dark'}`}>
                          {title}
                        </span>
                        {priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PRIORITY_STYLE[priority] ?? ''}`}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => navigate('/planner')} className="text-rose text-xs hover:underline">
              Open Planner →
            </button>
            {tasksQ.data && tasksQ.data.remainingCount > 0 && (
              <span className="text-text-light text-xs">{tasksQ.data.remainingCount} tasks due today</span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-rose" />
            <h2 className="font-display text-base font-semibold text-text-dark">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <ListTodo size={20} className="text-rose" />, label: 'New Task', action: () => navigate('/tasks?new=true') },
              { icon: <Lightbulb size={20} className="text-rose" />, label: 'New Idea', action: () => navigate('/inbox?type=idea') },
              { icon: <Users size={20} className="text-rose" />, label: 'New Lead', action: () => navigate('/chubs') },
              { icon: <FileText size={20} className="text-rose" />, label: 'New Note', action: () => navigate('/inbox') },
              { icon: <CalendarDays size={20} className="text-rose" />, label: 'Plan Day', action: () => navigate('/planner') },
              { icon: <Activity size={20} className="text-rose" />, label: 'Track Habit', action: () => navigate('/calendar') },
              { icon: <Dumbbell size={20} className="text-rose" />, label: 'Workout', action: () => navigate('/w/gym') },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                className="bg-rose-bg hover:bg-rose-light rounded-card p-3 flex flex-col items-center gap-1.5 transition-colors"
              >
                {btn.icon}
                <span className="text-text-mid text-[10px] leading-tight text-center">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ── ROW 4: HABITS | DONUT | LINE CHART ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Habit Consistency */}
        <div className="bg-card rounded-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-rose" />
            <h2 className="font-display text-base font-semibold text-text-dark">Habit Consistency</h2>
          </div>
          {consistencyQ.isLoading
            ? <Sk className="h-40" />
            : (() => {
              const { habits, weekDays, lookup, weekScore, bestStreak, today } = consistencyQ.data!
              const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
              return (
                <>
                  {/* Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-separate" style={{ borderSpacing: '2px' }}>
                      <thead>
                        <tr>
                          <th className="text-left text-text-light font-normal w-[100px]" />
                          {dayLabels.map((d, i) => (
                            <th key={i} className="text-center text-text-light font-normal w-7">{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {habits.map(habit => (
                          <tr key={habit.id}>
                            <td className="text-text-dark text-xs truncate pr-2 py-0.5 max-w-[100px]">
                              {habit.name}
                            </td>
                            {weekDays.map(dateStr => {
                              const done = lookup.get(`${habit.id}_${dateStr}`) ?? false
                              const isFuture = dateStr > today
                              return (
                                <td key={dateStr} className="text-center py-0.5">
                                  <span className={[
                                    'inline-block w-5 h-5 rounded-full',
                                    isFuture
                                      ? 'border border-dashed border-border opacity-40'
                                      : done
                                        ? 'bg-sage'
                                        : 'border border-border',
                                  ].join(' ')} />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-text-mid">This Week Score</span>
                        <span className="font-semibold text-text-dark">{weekScore}%</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1.5 mt-1">
                        <div className="bg-rose h-1.5 rounded-full" style={{ width: `${weekScore}%` }} />
                      </div>
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      <p className="text-text-mid">Best Streak</p>
                      <p className="font-semibold text-text-dark">{bestStreak} days</p>
                    </div>
                  </div>
                </>
              )
            })()}
        </div>

        {/* Tasks Overview donut */}
        <div className="bg-card rounded-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo size={16} className="text-rose" />
            <h2 className="font-display text-base font-semibold text-text-dark">Tasks Overview</h2>
          </div>
          {overviewQ.isLoading
            ? <Sk className="h-48" />
            : (
              <div className="flex items-center gap-4">
                {/* Donut */}
                <div className="relative" style={{ width: 160, height: 160, flexShrink: 0 }}>
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={donutData.length > 0 ? donutData : [{ key: 'empty', label: 'None', value: 1, color: '#F0E4DC' }]}
                        cx={75}
                        cy={75}
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={donutData.length > 1 ? 2 : 0}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {(donutData.length > 0 ? donutData : [{ color: '#F0E4DC' }]).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [v != null ? `${v} tasks` : '', '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-display text-2xl font-semibold text-text-dark">{totalTasks}</span>
                    <span className="text-text-light text-xs">Total</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {DONUT_CONFIG.map(c => {
                    const count = overviewQ.data?.groups[c.key] ?? 0
                    const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
                    return (
                      <div key={c.key} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                        <span className="text-text-mid text-xs flex-1">{c.label}</span>
                        <span className="text-text-dark text-xs font-medium">
                          {count} ({pct}%)
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
        </div>

        {/* Weekly Progress line chart */}
        <div className="bg-card rounded-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-amber-400"><Astroid/> </span>
            <h2 className="font-display text-base font-semibold text-text-dark">Weekly Progress</h2>
          </div>
          {weeklyQ.isLoading
            ? <Sk className="h-48" />
            : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weeklyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E4DC" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#6B6B6B', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={v => `${v}%`}
                    tick={{ fill: '#6B6B6B', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Line
                    type="monotone"
                    dataKey="pct"
                    stroke="#D4848A"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#D4848A', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* ── ROW 5: REMINDERS | MOTIVATION ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Upcoming Reminders */}
        <div className="bg-card rounded-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <span><BellRing/></span>
            <h2 className="font-display text-base font-semibold text-text-dark">Upcoming Reminders</h2>
          </div>
          {remindersQ.isLoading
            ? <div className="space-y-2">{[1,2,3,4].map(i => <Sk key={i} className="h-8" />)}</div>
            : remindersQ.data?.length === 0
              ? <p className="text-text-light text-sm">No upcoming reminders.</p>
              : (
                <div className="space-y-3">
                  {remindersQ.data?.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-sm shrink-0">🔸</span>
                      <span className="flex-1 text-text-dark text-xs truncate">{item.name}</span>
                      <span className="text-text-light text-xs shrink-0">{formatDate(item.date)}</span>
                    </div>
                  ))}
                </div>
              )}
          <button onClick={() => navigate('/calendar')} className="mt-4 text-rose text-xs hover:underline">
            View Calendar →
          </button>
        </div>

        {/* Motivation Boost */}
        <div className="bg-card rounded-card border border-border p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400"><Astroid/></span>
            <h2 className="font-display text-base font-semibold text-text-dark">Motivation Boost</h2>
          </div>

          {motivationQ.isLoading
            ? <Sk className="h-32" />
            : (
              <>
                <span className="font-display text-6xl leading-none text-rose-light select-none">"</span>
                <p className="font-display text-lg italic text-text-dark -mt-4 pr-12">
                  {motivationQ.data?.quote ?? 'The secret of getting ahead is getting started.'}
                </p>
                <p className="text-text-mid text-sm mt-3">
                  — {motivationQ.data?.author ?? 'Mark Twain'}
                </p>
              </>
            )}

          {/* Decorative bottom-right illustration */}
          <svg
            className="absolute bottom-0 right-0 opacity-60"
            width="100" height="80"
            viewBox="0 0 100 80"
          >
            {/* Vase */}
            <path d="M52 75 Q48 60 46 52 Q55 48 64 52 Q62 60 58 75 Z" fill="#E8A5A5" opacity="0.7" />
            <ellipse cx="55" cy="52" rx="10" ry="3" fill="#D4848A" opacity="0.6" />
            {/* Flower stems */}
            <line x1="55" y1="50" x2="48" y2="28" stroke="#8BC49A" strokeWidth="1.5" />
            <line x1="55" y1="50" x2="55" y2="22" stroke="#8BC49A" strokeWidth="1.5" />
            <line x1="55" y1="50" x2="63" y2="30" stroke="#8BC49A" strokeWidth="1.5" />
            {/* Flowers */}
            <circle cx="48" cy="26" r="5" fill="#D4848A" opacity="0.8" />
            <circle cx="48" cy="26" r="2" fill="#FEF5EF" opacity="0.9" />
            <circle cx="55" cy="20" r="5" fill="#E8A5A5" opacity="0.8" />
            <circle cx="55" cy="20" r="2" fill="#FEF5EF" opacity="0.9" />
            <circle cx="63" cy="28" r="4" fill="#D4848A" opacity="0.75" />
            <circle cx="63" cy="28" r="1.5" fill="#FEF5EF" opacity="0.9" />
            {/* Mug */}
            <rect x="30" y="60" width="14" height="12" rx="2" fill="#FEF5EF" stroke="#E8A5A5" strokeWidth="1" />
            <path d="M44 63 Q48 63 48 66 Q48 69 44 69" fill="none" stroke="#E8A5A5" strokeWidth="1" />
            {/* Books */}
            <rect x="72" y="62" width="22" height="5" rx="1" fill="#8BC49A" opacity="0.6" />
            <rect x="74" y="57" width="20" height="5" rx="1" fill="#D4848A" opacity="0.5" />
            <rect x="72" y="52" width="22" height="5" rx="1" fill="#E8A5A5" opacity="0.6" />
            {/* Desk */}
            <rect x="20" y="73" width="78" height="7" rx="2" fill="#FEF0E6" opacity="0.8" />
          </svg>
        </div>
      </div>
    </div>
  )
}
