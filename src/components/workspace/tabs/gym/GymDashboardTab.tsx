import { localDateStr } from '../../../../lib/utils'
import { useMemo } from 'react'
import { Flame, Trophy, Activity, Clock, Dumbbell, Plus, ChevronRight } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  useWorkoutLogs,
  usePRTrackers,
  useGymPushupLogs,
  useGymPushupGoals,
  useBodyMetrics,
} from '../../../../hooks/useGym'

type Props = { workspaceId: string; onTabChange: (key: string) => void }

function SmallRing({ value, goal }: { value: number; goal: number }) {
  const r = 42
  const C = 2 * Math.PI * r
  const pct = Math.min(value / (goal || 1), 1)
  return (
    <svg viewBox="0 0 108 108" className="w-28 h-28">
      <circle cx="54" cy="54" r={r} fill="none" stroke="var(--color-border)" strokeWidth="10" />
      <circle
        cx="54" cy="54" r={r} fill="none" stroke="#D4848A" strokeWidth="10"
        strokeDasharray={C} strokeDashoffset={C * (1 - pct)} strokeLinecap="round"
        transform="rotate(-90 54 54)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x="54" y="47" textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fill: 'var(--color-text-dark)', fontFamily: 'Playfair Display, serif' }}>
        {value}
      </text>
      <text x="54" y="60" textAnchor="middle" style={{ fontSize: 9, fill: 'var(--color-text-mid)' }}>/{goal}</text>
      <text x="54" y="73" textAnchor="middle" style={{ fontSize: 8, fill: 'var(--color-text-light)' }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

function todayISO() { return localDateStr() }

function fmtDateMD(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TYPE_COLOR: Record<string, string> = {
  push: '#D4848A', pull: '#8BC49A', legs: '#8BACC4',
  cardio: '#F59E0B', calisthenics: '#A78BFA', mobility: '#6EE7B7', rest: '#D1D5DB',
}
const PIE_COLORS = ['#D4848A', '#8BC49A', '#8BACC4', '#F59E0B', '#A78BFA', '#6EE7B7']

export default function GymDashboardTab({ workspaceId: _workspaceId, onTabChange }: Props) {
  const { data: workouts = [] } = useWorkoutLogs()
  const { data: prs = [] } = usePRTrackers()
  const { data: pushupLogs = [] } = useGymPushupLogs()
  const { data: pushupGoals = [] } = useGymPushupGoals()
  const { data: bodyMetrics = [] } = useBodyMetrics()

  const today = todayISO()

  // Week/month bounds
  const weekStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1))
    return d.toISOString().split('T')[0]
  }, [])
  const monthPrefix = today.slice(0, 7)

  const thisWeekWorkouts = workouts.filter(w => w.log_date >= weekStart && w.type !== 'rest')
  const thisMonthWorkouts = workouts.filter(w => w.log_date.startsWith(monthPrefix) && w.type !== 'rest')

  const avgDuration = useMemo(() => {
    const withDur = workouts.filter(w => w.duration_mins != null).slice(0, 20)
    if (!withDur.length) return 0
    return Math.round(withDur.reduce((s, w) => s + (w.duration_mins ?? 0), 0) / withDur.length)
  }, [workouts])

  // Pushup goal + today total
  const currentGoal = useMemo(() => {
    const valid = pushupGoals.filter(g => g.effective_from <= today)
    return valid.length ? valid[0].daily_goal : 100
  }, [pushupGoals, today])

  const todayPushups = useMemo(
    () => pushupLogs.filter(l => l.logged_at.split('T')[0] === today).reduce((s, l) => s + l.count, 0),
    [pushupLogs, today],
  )

  const pushupStreak = useMemo(() => {
    const dates = new Set(pushupLogs.map(l => l.logged_at.split('T')[0]))
    let streak = 0
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 0; i <= 365; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      if (dates.has(iso)) streak++
      else if (i === 0) continue
      else break
    }
    return streak
  }, [pushupLogs])

  // Today's workout + last 3
  const todayWorkout = workouts.find(w => w.log_date === today)
  const last3 = workouts.filter(w => w.type !== 'rest').slice(0, 3)

  // Week type breakdown for donut
  const weekTypeData = useMemo(() => {
    const map = new Map<string, number>()
    thisWeekWorkouts.forEach(w => { if (w.type) map.set(w.type, (map.get(w.type) ?? 0) + 1) })
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [thisWeekWorkouts])

  // Weight trend last 30 days
  const weightChartData = useMemo(() =>
    [...bodyMetrics]
      .filter(m => m.weight_kg != null)
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
      .slice(-30)
      .map(m => ({ date: fmtDateMD(m.logged_at.split('T')[0]), weight: m.weight_kg })),
    [bodyMetrics],
  )

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-dark"><Dumbbell/> Fitness</h1>
          <p className="text-sm text-text-mid mt-0.5">Track. Train. Transform.</p>
        </div>
        <p className="text-sm text-text-mid">
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {/* This Week Sessions */}
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-4 h-4 text-rose" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">This Week Sessions</p>
          </div>
          <p className="font-display text-3xl font-semibold text-text-dark">
            {thisWeekWorkouts.length} <span className="text-sm text-text-light font-normal">/ 6 planned</span>
          </p>
          <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-rose rounded-full transition-all" style={{ width: `${Math.min(100, (thisWeekWorkouts.length / 6) * 100)}%` }} />
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Current Streak</p>
          </div>
          <p className="font-display text-3xl font-semibold text-text-dark">
            {pushupStreak} <span className="text-sm text-text-mid font-normal">days</span>
          </p>
          {pushupStreak > 0 && <p className="text-xs text-rose mt-1">Keep it up! 🔥</p>}
        </div>

        {/* This Month Sessions */}
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-rose" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">This Month Sessions</p>
          </div>
          <p className="font-display text-3xl font-semibold text-text-dark">
            {thisMonthWorkouts.length} <span className="text-sm text-text-light font-normal">/ 20 planned</span>
          </p>
          <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-rose rounded-full transition-all" style={{ width: `${Math.min(100, (thisMonthWorkouts.length / 20) * 100)}%` }} />
          </div>
        </div>

        {/* Avg Duration */}
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-rose" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Avg Duration</p>
          </div>
          <p className="font-display text-3xl font-semibold text-text-dark">
            {avgDuration || '—'} {avgDuration ? <span className="text-sm text-text-mid font-normal">mins</span> : null}
          </p>
        </div>
      </div>

      {/* Today */}
      <div>
        <h2 className="text-sm font-semibold text-text-dark mb-3">Today</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Today's workout */}
          <div className="bg-card rounded-card border border-border p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-bg flex items-center justify-center text-3xl shrink-0">
                <Dumbbell/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-text-light uppercase tracking-wide font-medium mb-1">Today's Workout</p>
                {todayWorkout ? (
                  <>
                    <h3 className="font-display text-2xl font-semibold text-text-dark truncate">{todayWorkout.workout_name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {todayWorkout.type && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: (TYPE_COLOR[todayWorkout.type] ?? '#D4848A') + '22', color: TYPE_COLOR[todayWorkout.type] ?? '#D4848A' }}>
                          {todayWorkout.type}
                        </span>
                      )}
                      {todayWorkout.duration_mins && (
                        <span className="text-xs text-text-mid">⏱ {todayWorkout.duration_mins} mins</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-display text-xl font-semibold text-text-dark">No workout logged</p>
                    <p className="text-xs text-text-mid mt-0.5">Time to hit the gym!</p>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => onTabChange('workout_log')}
              className="mt-4 w-full flex items-center justify-center gap-1.5 bg-rose text-white py-2.5 rounded-lg text-sm font-medium hover:bg-rose/90 transition-colors"
            >
              <Dumbbell className="w-4 h-4" />
              Log Workout
            </button>
          </div>

          {/* Pushup goal */}
          <div className="bg-card rounded-card border border-border p-5 flex items-center gap-6">
            <div className="flex flex-col items-center">
              <p className="text-[10px] text-text-light uppercase tracking-wide font-medium mb-2">Pushup Goal</p>
              <SmallRing value={todayPushups} goal={currentGoal} />
              <p className="text-[10px] text-text-mid mt-1">Pushups Today</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-text-light uppercase tracking-wide font-medium mb-1">Daily Goal</p>
              <p className="font-display text-4xl font-semibold text-text-dark">{currentGoal}</p>
              <p className="text-sm text-text-mid">pushups</p>
              <button
                onClick={() => onTabChange('pushups')}
                className="mt-4 w-full flex items-center justify-center gap-1.5 border border-rose text-rose py-2 rounded-lg text-sm font-medium hover:bg-rose-bg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Log Pushups
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent */}
      <div>
        <h2 className="text-sm font-semibold text-text-dark mb-3">Recent</h2>
        <div className="grid grid-cols-4 gap-3">
          {/* Last 3 workouts */}
          <div className="bg-card rounded-card border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-text-mid font-medium">Last 3 Workouts</p>
              <button onClick={() => onTabChange('workout_log')} className="text-[10px] text-rose hover:underline">View All</button>
            </div>
            {last3.length === 0 ? (
              <p className="text-sm text-text-light text-center py-6">No workouts yet</p>
            ) : (
              <div className="flex flex-col">
                {last3.map(w => (
                  <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <p className="text-[9px] text-text-light uppercase font-medium">{fmtDateMD(w.log_date)}</p>
                      <p className="text-sm font-medium text-text-dark leading-tight truncate">{w.workout_name}</p>
                      {w.type && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 inline-block"
                          style={{ background: (TYPE_COLOR[w.type] ?? '#D4848A') + '22', color: TYPE_COLOR[w.type] ?? '#D4848A' }}>
                          {w.type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {w.duration_mins && <span className="text-[10px] text-text-light">{w.duration_mins}m</span>}
                      <ChevronRight className="w-3 h-3 text-text-light" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent PRs */}
          <div className="bg-card rounded-card border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-text-mid font-medium">Recent PRs</p>
              <button onClick={() => onTabChange('prs')} className="text-[10px] text-rose hover:underline">View All</button>
            </div>
            {prs.length === 0 ? (
              <p className="text-sm text-text-light text-center py-6">No PRs yet</p>
            ) : (
              <div className="flex flex-col">
                {prs.slice(0, 4).map(pr => (
                  <div key={pr.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-dark leading-tight truncate">{pr.exercise_name}</p>
                      {pr.current_max && <p className="text-xs text-text-mid">{pr.current_max}</p>}
                    </div>
                    <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* This week workout types donut */}
          <div className="bg-card rounded-card border border-border p-4">
            <p className="text-xs text-text-mid font-medium mb-3">This Week Workout Types</p>
            {weekTypeData.length === 0 ? (
              <p className="text-sm text-text-light text-center py-8">No workouts this week</p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-[110px] h-[110px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={weekTypeData}
                        cx="50%" cy="50%"
                        innerRadius={28} outerRadius={48}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {weekTypeData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-display text-lg font-bold text-text-dark">{thisWeekWorkouts.length}</span>
                    <span className="text-[8px] text-text-light">Sessions</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 w-full mt-1">
                  {weekTypeData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[10px] text-text-mid capitalize flex-1">{d.name}</span>
                      <span className="text-[10px] text-text-light">{Math.round((d.value / thisWeekWorkouts.length) * 100)}% ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Weight trend */}
          <div className="bg-card rounded-card border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-text-mid font-medium">
                Weight Trend <span className="font-normal text-text-light">(Last 30 Days)</span>
              </p>
              <button onClick={() => onTabChange('body_metrics')} className="text-[10px] text-rose hover:underline">View All</button>
            </div>
            {weightChartData.length < 2 ? (
              <p className="text-sm text-text-light text-center py-8">Not enough data</p>
            ) : (
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={weightChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4848A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#D4848A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'var(--color-text-light)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 8, fill: 'var(--color-text-light)' }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="weight" name="kg" stroke="#D4848A" strokeWidth={1.5} fill="url(#wGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
