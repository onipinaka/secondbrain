import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
  AreaChart, Area,
  PieChart, Pie, Cell,
} from 'recharts'
import { useHabits, useHabitLogs } from '../hooks/useHabits'
import {
  type DateRangeKey, getFromDate,
  useGlobalStats, useTasksByWorkspace, useTasksByStatus,
  useProjectsByStatus, useCSTopicsProgress,
  useGymWorkoutsPerWeek, useGymWorkoutsByMuscle,
  useQuestionsSolvedOverTime, useOpportunitiesByStatus, useLeadsByStatus,
  useWeeklyDeepWork, useHabitConsistency,
} from '../hooks/useAnalytics'

const ROSE = '#D4848A'
const SAGE = '#7EA58A'
const BLUE = '#6B8FD4'
const AMBER = '#D4A84B'
const PURPLE = '#8B7EC8'
const GRAY = '#9CA3AF'
const TIP = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }

const RANGE_OPTS: { key: DateRangeKey; label: string }[] = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'Last 3 Months' },
  { key: 'all', label: 'All Time' },
]

// ─── Shared components ────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <h2 className="font-display text-sm font-semibold text-text-light uppercase tracking-wider col-span-2 mt-2">{title}</h2>
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-card border border-border p-5 ${className}`}>
      <h3 className="font-display text-base font-semibold text-text-dark mb-4">{title}</h3>
      {children}
    </div>
  )
}

function Empty({ loading = false }: { loading?: boolean }) {
  return (
    <div className="flex items-center justify-center h-40 text-text-light text-sm">
      {loading ? 'Loading…' : 'No data yet'}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card rounded-card border border-border p-4">
      <p className="text-xs text-text-light mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-rose">{value}</p>
      {sub && <p className="text-xs text-text-light mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Habit Heatmap ────────────────────────────────────────────────────────────

function HabitHeatmap() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const { data: habits = [], isLoading: habitsLoading } = useHabits()
  const { data: logs = [], isLoading: logsLoading } = useHabitLogs(year, month)

  const daysInMonth = new Date(year, month, 0).getDate()
  const logSet = new Set(logs.filter(l => l.status === 'done').map(l => `${l.habit_id}_${l.date}`))
  const active = habits.filter(h => h.is_active)
  const monthStr = String(month).padStart(2, '0')

  if (habitsLoading || logsLoading) return <Empty loading />
  if (active.length === 0) return <Empty />

  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="text-left pr-3 pb-1 text-text-light font-normal w-32" />
            {Array.from({ length: daysInMonth }, (_, i) => (
              <th key={i} className="w-5 pb-1 text-center text-text-light font-normal">{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.map(habit => (
            <tr key={habit.id}>
              <td className="py-0.5 pr-3 text-text-mid truncate max-w-[8rem]">{habit.name}</td>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = String(i + 1).padStart(2, '0')
                const done = logSet.has(`${habit.id}_${year}-${monthStr}-${day}`)
                return (
                  <td key={i} className="p-0.5">
                    <div className={`w-4 h-4 rounded-sm ${done ? 'bg-rose' : 'bg-border/40'}`} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ data, title }: { data: { name: string; value: number; color: string }[]; title: string }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const filtered = data.filter(d => d.value > 0)
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-semibold text-text-dark">{title}</p>
      {total === 0 ? (
        <div className="h-[160px] flex items-center justify-center text-text-light text-xs">No data</div>
      ) : (
        <PieChart width={160} height={160}>
          <Pie data={filtered} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
            {filtered.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={TIP} formatter={(v: any) => [v, '']} />
        </PieChart>
      )}
      <div className="flex flex-col gap-1">
        {filtered.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-text-mid">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
            <span>{d.name}: <span className="font-medium text-text-dark">{d.value}</span></span>
          </div>
        ))}
        <p className="text-xs text-text-light mt-1">Total: {total}</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [range, setRange] = useState<DateRangeKey>('month')
  const from = getFromDate(range)

  const stats = useGlobalStats()
  const tasksByWS = useTasksByWorkspace(from)
  const tasksByStatus = useTasksByStatus(from)
  const projectsByStatus = useProjectsByStatus(from)
  const csTopics = useCSTopicsProgress()
  const gymTrend = useGymWorkoutsPerWeek(from)
  const gymMuscle = useGymWorkoutsByMuscle(from)
  const questionsSolved = useQuestionsSolvedOverTime(from)
  const opps = useOpportunitiesByStatus(from)
  const leads = useLeadsByStatus(from)
  const deepWork = useWeeklyDeepWork(from)
  const habitConsistency = useHabitConsistency()

  const taskStatusDonut = useMemo(() => {
    return (tasksByStatus.data ?? []).map(d => ({ name: d.label, value: d.count, color: d.color }))
  }, [tasksByStatus.data])

  const s = stats.data

  return (
    <div className="p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-dark">Master Analytics</h1>
        <div className="flex gap-0.5 bg-card border border-border rounded-lg p-0.5">
          {RANGE_OPTS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                range === key ? 'bg-rose text-white' : 'text-text-mid hover:text-text-dark'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-6 gap-4">
        <StatCard label="Tasks Done" value={s?.tasksDone ?? '—'} />
        <StatCard label="Habits Logged" value={s?.habitsLogged ?? '—'} />
        <StatCard label="Deep Work Hrs" value={s?.deepWorkHours ?? '—'} sub="from planner" />
        <StatCard label="Gym Sessions" value={s?.gymSessions ?? '—'} />
        <StatCard label="PRs Merged" value={s?.prsMerged ?? '—'} />
        <StatCard label="Qs Solved" value={s?.questionsSolved ?? '—'} />
      </div>

      <div className="grid grid-cols-2 gap-5">

        {/* ── TASKS ── */}
        <SectionHeader title="Tasks" />

        <ChartCard title="Tasks by Workspace" className="col-span-2">
          {tasksByWS.isLoading ? <Empty loading /> : !tasksByWS.data?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tasksByWS.data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip contentStyle={TIP} />
                <Bar dataKey="count" fill={ROSE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Tasks by Status">
          {tasksByStatus.isLoading ? <Empty loading /> : !tasksByStatus.data?.length ? <Empty /> : (
            <div className="flex items-center justify-center py-2">
              <DonutChart data={taskStatusDonut} title="" />
            </div>
          )}
        </ChartCard>

        <ChartCard title="Projects Pipeline">
          {projectsByStatus.isLoading ? <Empty loading /> : !projectsByStatus.data?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={projectsByStatus.data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={90} />
                <Tooltip contentStyle={TIP} />
                <Bar dataKey="count" fill={BLUE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── CORE SUBJECTS ── */}
        <SectionHeader title="Core Subjects" />

        <ChartCard title="Topics Progress by Subject" className="col-span-2">
          {csTopics.isLoading ? <Empty loading /> : !csTopics.data?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={csTopics.data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
                <Tooltip contentStyle={TIP} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="done" name="Done" stackId="a" fill={SAGE} />
                <Bar dataKey="in_progress" name="In Progress" stackId="a" fill={BLUE} />
                <Bar dataKey="not_started" name="Not Started" stackId="a" fill={GRAY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Questions Solved Over Time">
          {questionsSolved.isLoading ? <Empty loading /> : !questionsSolved.data?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={questionsSolved.data} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TIP} />
                <Line type="monotone" dataKey="total" stroke={ROSE} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── DEEP WORK ── */}
        <SectionHeader title="Deep Work" />

        <ChartCard title="Weekly Deep Work Hours (Planner)" className="col-span-2">
          {deepWork.isLoading ? <Empty loading /> : !deepWork.data?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={deepWork.data} margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TIP} formatter={(v: any) => [`${v}h`, 'Hours']} />
                <Area type="monotone" dataKey="hours" stroke={SAGE} fill={SAGE} fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── HABITS ── */}
        <SectionHeader title="Habits" />

        <ChartCard title="Habit Consistency — This Month" className="col-span-2">
          <HabitHeatmap />
        </ChartCard>

        <ChartCard title="Habit Consistency % (Last 30 days)" className="col-span-2">
          {habitConsistency.isLoading ? <Empty loading /> : !habitConsistency.data?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={Math.max(160, (habitConsistency.data.length * 28) + 20)}>
              <BarChart data={habitConsistency.data} layout="vertical" margin={{ top: 4, right: 50, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip
                  contentStyle={TIP}
                  formatter={(v: any, _: any, p: any) => [`${v}% (${p.payload.done}/${p.payload.total} days)`, 'Done']}
                />
                <Bar dataKey="pct" fill={ROSE} radius={[0, 4, 4, 0]}>
                  {(habitConsistency.data ?? []).map((entry, i) => (
                    <Cell key={i} fill={entry.pct >= 80 ? SAGE : entry.pct >= 50 ? AMBER : ROSE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── GYM ── */}
        <SectionHeader title="Gym" />

        <ChartCard title="Workout Frequency (per Week)">
          {gymTrend.isLoading ? <Empty loading /> : !gymTrend.data?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={gymTrend.data} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TIP} formatter={(v: any) => [v, 'Sessions']} />
                <Area type="monotone" dataKey="count" stroke={SAGE} fill={SAGE} fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Workouts by Muscle Group">
          {gymMuscle.isLoading ? <Empty loading /> : !gymMuscle.data?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={gymMuscle.data} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TIP} />
                <Bar dataKey="count" fill={PURPLE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── BUSINESS & OPPORTUNITIES ── */}
        <SectionHeader title="Business & Opportunities" />

        <ChartCard title="Opportunities Pipeline">
          {opps.isLoading ? <Empty loading /> : !opps.data?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={opps.data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={TIP} />
                <Bar dataKey="count" fill={PURPLE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Leads by Follow-up Status">
          {leads.isLoading ? <Empty loading /> : !leads.data?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={leads.data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 11 }} width={110} />
                <Tooltip contentStyle={TIP} />
                <Bar dataKey="count" fill={AMBER} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>
    </div>
  )
}
