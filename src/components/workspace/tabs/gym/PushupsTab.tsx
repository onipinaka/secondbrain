import { localDateStr } from '../../../../lib/utils'
import { useState, useMemo } from 'react'
import { Flame, Trophy, Pencil, Check, X, Trash2, Plus } from 'lucide-react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts'
import {
  useGymPushupLogs, useAddGymPushupLog, useDeleteGymPushupLog,
  useGymPushupGoals, useSetGymPushupGoal,
} from '../../../../hooks/useGym'

type Props = { workspaceId: string }

function todayISO() { return localDateStr() }

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDateShort(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function calcCurrentStreak(dailyDates: Set<string>): number {
  let streak = 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (let i = 0; i <= 365; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    if (dailyDates.has(iso)) {
      streak++
    } else if (i === 0) {
      continue // today empty, check yesterday
    } else {
      break
    }
  }
  return streak
}

function calcBestStreak(dailyDates: Set<string>): number {
  const sorted = [...dailyDates].sort()
  if (!sorted.length) return 0
  let best = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00')
    const next = new Date(sorted[i] + 'T00:00:00')
    const diff = (next.getTime() - prev.getTime()) / 86400000
    if (diff === 1) { cur++; if (cur > best) best = cur }
    else cur = 1
  }
  return best
}

// SVG progress ring
function ProgressRing({ value, goal }: { value: number; goal: number }) {
  const r = 44
  const C = 2 * Math.PI * r
  const pct = Math.min(value / (goal || 1), 1)
  const offset = C * (1 - pct)
  return (
    <svg viewBox="0 0 108 108" className="w-36 h-36">
      <circle cx="54" cy="54" r={r} fill="none" stroke="var(--color-border)" strokeWidth="9" />
      <circle
        cx="54" cy="54" r={r} fill="none"
        stroke="#D4848A" strokeWidth="9"
        strokeDasharray={C}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 54 54)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x="54" y="48" textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: 'var(--color-text-dark)', fontFamily: 'Playfair Display, serif' }}>
        {value}
      </text>
      <text x="54" y="62" textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-text-mid)' }}>
        /{goal}
      </text>
      <text x="54" y="76" textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-text-light)' }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

// GitHub-style heatmap
function Heatmap({ dailyMap }: { dailyMap: Map<string, number> }) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  const weeks = useMemo(() => {
    const result: { date: string; count: number }[][] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Go back 52 weeks to Monday
    const start = new Date(today)
    start.setDate(start.getDate() - 364)
    const dow = start.getDay()
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1))
    const cur = new Date(start)
    while (cur <= today) {
      const week: { date: string; count: number }[] = []
      for (let d = 0; d < 7; d++) {
        const iso = cur.toISOString().split('T')[0]
        week.push({ date: iso, count: dailyMap.get(iso) ?? 0 })
        cur.setDate(cur.getDate() + 1)
      }
      result.push(week)
    }
    return result
  }, [dailyMap])

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      const d = new Date(week[0].date + 'T00:00:00')
      const m = d.getMonth()
      if (m !== lastMonth) {
        labels.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), col: wi })
        lastMonth = m
      }
    })
    return labels
  }, [weeks])

  const CELL = 10
  const GAP = 2
  const COL_W = CELL + GAP

  return (
    <div className="overflow-x-auto relative">
      {/* Month labels */}
      <div className="flex mb-1" style={{ paddingLeft: 20 }}>
        {monthLabels.map(({ label, col }) => (
          <div
            key={`${label}-${col}`}
            className="text-[9px] text-text-light absolute"
            style={{ left: 20 + col * COL_W }}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="flex mt-3" style={{ gap: GAP }}>
        {/* Day labels */}
        <div className="flex flex-col shrink-0" style={{ gap: GAP, marginRight: 2 }}>
          {['M', '', 'W', '', 'F', '', 'S'].map((d, i) => (
            <div key={i} style={{ width: 12, height: CELL, fontSize: 8, color: 'var(--color-text-light)', display: 'flex', alignItems: 'center' }}>
              {d}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display: 'flex', gap: GAP, position: 'relative' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {week.map((day) => {
                const bg = day.count === 0 ? 'var(--color-border)'
                  : day.count < 50 ? '#FDDEDE'
                  : day.count < 100 ? '#E8A5A5'
                  : '#D4848A'
                return (
                  <div
                    key={day.date}
                    style={{ width: CELL, height: CELL, borderRadius: 2, background: bg, cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect()
                      setTooltip({ date: day.date, count: day.count, x: rect.left, y: rect.top })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[9px] text-text-light">Least</span>
        {[
          { label: '0', bg: 'var(--color-border)' },
          { label: '1-49', bg: '#FDDEDE' },
          { label: '50-99', bg: '#E8A5A5' },
          { label: '100+', bg: '#D4848A' },
        ].map(({ label, bg }) => (
          <div key={label} className="flex items-center gap-1">
            <div style={{ width: CELL, height: CELL, borderRadius: 2, background: bg }} />
            <span className="text-[9px] text-text-light">{label}</span>
          </div>
        ))}
        <span className="text-[9px] text-text-light ml-1">Most</span>
      </div>
      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg px-2 py-1 text-xs shadow-sm pointer-events-none"
          style={{ left: tooltip.x - 60, top: tooltip.y - 36 }}
        >
          <span className="text-text-dark font-medium">{fmtDateShort(tooltip.date)}</span>
          <span className="text-text-mid ml-2">{tooltip.count} pushups</span>
        </div>
      )}
    </div>
  )
}

export default function PushupsTab({ workspaceId: _workspaceId }: Props) {
  const { data: logs = [], isLoading } = useGymPushupLogs()
  const { data: goals = [] } = useGymPushupGoals()
  const addLog = useAddGymPushupLog()
  const deleteLog = useDeleteGymPushupLog()
  const setGoal = useSetGymPushupGoal()

  const [sets, setSets] = useState(3)
  const [repsPerSet, setRepsPerSet] = useState(20)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  const today = todayISO()

  // Current goal: most recent goal with effective_from <= today
  const currentGoal = useMemo(() => {
    const valid = goals.filter(g => g.effective_from <= today)
    return valid.length ? valid[0].daily_goal : 100
  }, [goals, today])

  // Aggregate daily totals
  const dailyMap = useMemo(() => {
    const map = new Map<string, number>()
    logs.forEach(l => {
      const date = l.logged_at.split('T')[0]
      map.set(date, (map.get(date) ?? 0) + l.count)
    })
    return map
  }, [logs])

  const dailyDates = useMemo(() => new Set(dailyMap.keys()), [dailyMap])

  const todayLogs = useMemo(() =>
    [...logs]
      .filter(l => l.logged_at.split('T')[0] === today)
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at)),
    [logs, today]
  )
  const todayTotal = dailyMap.get(today) ?? 0

  const currentStreak = useMemo(() => calcCurrentStreak(dailyDates), [dailyDates])
  const bestStreak = useMemo(() => calcBestStreak(dailyDates), [dailyDates])

  // Personal best day
  const { pbCount, pbDate } = useMemo(() => {
    let pbCount = 0, pbDate = ''
    dailyMap.forEach((count, date) => {
      if (count > pbCount) { pbCount = count; pbDate = date }
    })
    return { pbCount, pbDate }
  }, [dailyMap])

  // Chart: last 30 days
  const chartData = useMemo(() => {
    const result = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      result.push({ date: fmtDateShort(iso), pushups: dailyMap.get(iso) ?? 0 })
    }
    return result
  }, [dailyMap])

  function logNow(count: number) {
    addLog.mutate({ count, logged_at: new Date().toISOString() })
  }

  function handleAddSets() {
    const total = sets * repsPerSet
    if (total <= 0) return
    logNow(total)
  }

  function handleGoalSave() {
    const val = Number(goalInput)
    if (!val || val < 1) return
    setGoal.mutate(val, { onSuccess: () => setEditingGoal(false) })
  }

  if (isLoading) {
    return <div className="p-8 text-center text-text-light text-sm">Loading...</div>
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-text-dark">Pushup Tracker</h2>
          <p className="text-sm text-text-mid mt-0.5">Consistency today, strength forever.</p>
        </div>
        <p className="text-sm text-text-mid italic text-right max-w-xs">
          "Discipline is doing it even when you don't feel like it."
        </p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Progress ring */}
        <div className="bg-card rounded-card border border-border p-4 flex flex-col items-center gap-2">
          <ProgressRing value={todayTotal} goal={currentGoal} />
          <div className="flex items-center gap-1.5">
            {editingGoal ? (
              <>
                <input
                  type="number"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGoalSave()}
                  className="w-16 text-xs border border-border rounded px-1.5 py-0.5 focus:outline-none focus:border-rose bg-cream"
                  autoFocus
                />
                <span className="text-xs text-text-mid">pushups/day</span>
                <button onClick={handleGoalSave} className="text-rose"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingGoal(false)} className="text-text-light"><X className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <>
                <span className="text-xs text-text-mid">Goal: {currentGoal} pushups/day</span>
                <button
                  onClick={() => { setGoalInput(String(currentGoal)); setEditingGoal(true) }}
                  className="text-text-light hover:text-rose transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Current streak */}
        <div className="bg-card rounded-card border border-border p-4 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-orange-400" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Current Streak</p>
          </div>
          <p className="font-display text-5xl font-semibold text-text-dark">{currentStreak}</p>
          <p className="text-sm text-text-mid">days</p>
          <p className="text-xs text-rose mt-1">Best: {bestStreak} days</p>
        </div>

        {/* Personal best day */}
        <div className="bg-card rounded-card border border-border p-4 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Personal Best Day</p>
          </div>
          <p className="font-display text-5xl font-semibold text-text-dark">{pbCount || '—'}</p>
          {pbCount > 0 && <p className="text-sm text-text-mid">pushups</p>}
          {pbDate && <p className="text-xs text-rose mt-1">on {fmtDateShort(pbDate)}</p>}
        </div>
      </div>

      {/* Middle row: Log + Today's Log + Heatmap */}
      <div className="grid grid-cols-3 gap-3">
        {/* Log pushups */}
        <div className="bg-card rounded-card border border-border p-4 flex flex-col gap-3">
          <p className="text-xs text-text-mid font-medium">Log Pushups</p>

          {/* Sets × Reps = Total */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-text-light uppercase">Sets</span>
              <input
                type="number"
                min={1}
                value={sets}
                onChange={e => setSets(Math.max(1, Number(e.target.value)))}
                className="w-14 text-center text-sm border border-border rounded-lg py-1.5 focus:outline-none focus:border-rose bg-cream"
              />
            </div>
            <span className="text-text-light mt-4">×</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-text-light uppercase">Reps/set</span>
              <input
                type="number"
                min={1}
                value={repsPerSet}
                onChange={e => setRepsPerSet(Math.max(1, Number(e.target.value)))}
                className="w-14 text-center text-sm border border-border rounded-lg py-1.5 focus:outline-none focus:border-rose bg-cream"
              />
            </div>
            <span className="text-text-light mt-4">=</span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-text-light uppercase">Total</span>
              <div className="w-14 text-center text-sm font-semibold text-rose py-1.5">
                {sets * repsPerSet}
              </div>
            </div>
          </div>

          <button
            onClick={handleAddSets}
            disabled={addLog.isPending}
            className="w-full flex items-center justify-center gap-1.5 bg-rose text-white py-2 rounded-lg text-sm font-medium hover:bg-rose/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add to Today
          </button>

          {/* Quick log */}
          <div>
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-2">Quick Log</p>
            <div className="flex gap-2 flex-wrap">
              {[10, 20, 30, 50].map(n => (
                <button
                  key={n}
                  onClick={() => logNow(n)}
                  disabled={addLog.isPending}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-mid hover:border-rose hover:text-rose transition-colors disabled:opacity-50"
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Today's log */}
        <div className="bg-card rounded-card border border-border p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-mid font-medium">Today's Log</p>
            {todayTotal > 0 && (
              <span className="text-xs font-semibold text-rose">Total: {todayTotal} pushups</span>
            )}
          </div>

          {todayLogs.length === 0 ? (
            <p className="text-sm text-text-light text-center py-6">No logs yet today.</p>
          ) : (
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-52">
              {todayLogs.map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-cream/60 transition-colors group"
                >
                  <span className="text-xs text-text-mid">Set {i + 1}</span>
                  <span className="text-sm font-medium text-text-dark">{l.count} reps</span>
                  <span className="text-xs text-text-light">{fmtTime(l.logged_at)}</span>
                  <button
                    onClick={() => deleteLog.mutate(l.id)}
                    className="opacity-0 group-hover:opacity-100 text-text-light hover:text-rose transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div className="bg-card rounded-card border border-border p-4">
          <p className="text-xs text-text-mid font-medium mb-3">Pushup Heatmap (52 Weeks)</p>
          <Heatmap dailyMap={dailyMap} />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-text-mid font-medium">Daily Pushups (Last 30 Days)</p>
          <span className="text-[10px] text-text-light">Goal: {currentGoal}</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="pushupGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4848A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#D4848A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} />
            <Tooltip
              contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
              labelStyle={{ color: 'var(--color-text-dark)', fontSize: 12 }}
            />
            <ReferenceLine
              y={currentGoal}
              stroke="#D4848A"
              strokeDasharray="6 3"
              label={{ value: 'Goal', fontSize: 10, fill: '#D4848A', position: 'insideTopRight' }}
            />
            <Area
              type="monotone"
              dataKey="pushups"
              name="Pushups"
              stroke="#D4848A"
              strokeWidth={2}
              fill="url(#pushupGrad)"
              dot={{ r: 3, fill: '#D4848A' }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-text-light text-center mt-2">
          Stay consistent! Even small daily efforts lead to massive results.
        </p>
      </div>

      {/* History */}
      {dailyMap.size > 0 && (
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-text-mid font-medium">
              History ({dailyMap.size} {dailyMap.size === 1 ? 'day' : 'days'})
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/50">
                {['Date', 'Total', 'Sessions', 'vs Goal', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[10px] text-text-light uppercase tracking-wide font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...dailyMap.entries()]
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, total]) => {
                  const sessions = logs.filter(l => l.logged_at.split('T')[0] === date).length
                  const metGoal = total >= currentGoal
                  const pct = Math.min(100, Math.round((total / currentGoal) * 100))
                  return (
                    <tr key={date} className="border-b border-border last:border-0 hover:bg-cream/40 transition-colors">
                      <td className="px-4 py-3 text-text-dark">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${metGoal ? 'text-rose' : 'text-text-dark'}`}>
                          {total}
                        </span>
                        <span className="text-xs text-text-light ml-1">reps</span>
                      </td>
                      <td className="px-4 py-3 text-text-mid">{sessions} {sessions === 1 ? 'set' : 'sets'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: metGoal ? '#D4848A' : '#D4848A66' }}
                            />
                          </div>
                          <span className={`text-xs ${metGoal ? 'text-rose' : 'text-text-mid'}`}>{pct}%</span>
                          {metGoal && <span className="text-xs">✓</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
