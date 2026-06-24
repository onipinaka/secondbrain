import { localDateStr } from '../../../../lib/utils'
import { useState, useMemo } from 'react'
import { Droplets, Pencil, Check, X, Trash2, Flame, Trophy } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  useGymWaterLogs, useAddGymWaterLog, useDeleteGymWaterLog,
  useGymWaterGoals, useSetGymWaterGoal,
} from '../../../../hooks/useGym'

type Props = { workspaceId: string }

const DEFAULT_GOAL_ML = 2500

function todayISO() { return localDateStr() }

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDateShort(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDateFull(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function mlToDisplay(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`
}

function calcStreak(dailyMap: Map<string, number>, goal: number): number {
  let streak = 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (let i = 0; i <= 365; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    if ((dailyMap.get(iso) ?? 0) >= goal) streak++
    else if (i === 0) continue
    else break
  }
  return streak
}

function ProgressRing({ value, goal }: { value: number; goal: number }) {
  const r = 44
  const C = 2 * Math.PI * r
  const pct = Math.min(value / (goal || 1), 1)
  const offset = C * (1 - pct)
  const met = value >= goal
  return (
    <svg viewBox="0 0 108 108" className="w-36 h-36">
      <circle cx="54" cy="54" r={r} fill="none" stroke="var(--color-border)" strokeWidth="9" />
      <circle
        cx="54" cy="54" r={r} fill="none"
        stroke={met ? '#8BC49A' : '#8BACC4'}
        strokeWidth="9"
        strokeDasharray={C}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 54 54)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x="54" y="46" textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: 'var(--color-text-dark)', fontFamily: 'Playfair Display, serif' }}>
        {mlToDisplay(value)}
      </text>
      <text x="54" y="62" textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-text-mid)' }}>
        /{mlToDisplay(goal)}
      </text>
      <text x="54" y="76" textAnchor="middle" style={{ fontSize: 10, fill: met ? '#8BC49A' : 'var(--color-text-light)' }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  )
}

const QUICK_AMOUNTS = [
  { label: '100ml', ml: 100 },
  { label: '250ml', ml: 250 },
  { label: '500ml', ml: 500 },
  { label: '750ml', ml: 750 },
  { label: '1L', ml: 1000 },
]

export default function WaterTab({ workspaceId: _workspaceId }: Props) {
  const { data: logs = [], isLoading } = useGymWaterLogs()
  const { data: goals = [] } = useGymWaterGoals()
  const addLog = useAddGymWaterLog()
  const deleteLog = useDeleteGymWaterLog()
  const setGoal = useSetGymWaterGoal()

  const [customAmount, setCustomAmount] = useState('')
  const [customNotes, setCustomNotes] = useState('')
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const today = todayISO()

  const currentGoal = useMemo(() => {
    const valid = goals.filter(g => g.effective_from <= today)
    return valid.length ? valid[0].daily_goal_ml : DEFAULT_GOAL_ML
  }, [goals, today])

  const dailyMap = useMemo(() => {
    const map = new Map<string, number>()
    logs.forEach(l => {
      const date = l.logged_at.split('T')[0]
      map.set(date, (map.get(date) ?? 0) + l.amount_ml)
    })
    return map
  }, [logs])

  const todayLogs = useMemo(() =>
    [...logs]
      .filter(l => l.logged_at.split('T')[0] === today)
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at)),
    [logs, today]
  )
  const todayTotal = dailyMap.get(today) ?? 0

  const streak = useMemo(() => calcStreak(dailyMap, currentGoal), [dailyMap, currentGoal])

  const { pbMl, pbDate } = useMemo(() => {
    let pbMl = 0, pbDate = ''
    dailyMap.forEach((ml, date) => {
      if (ml > pbMl) { pbMl = ml; pbDate = date }
    })
    return { pbMl, pbDate }
  }, [dailyMap])

  const chartData = useMemo(() => {
    const result = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      result.push({ date: fmtDateShort(iso), ml: dailyMap.get(iso) ?? 0 })
    }
    return result
  }, [dailyMap])

  // All days sorted newest first
  const historyDays = useMemo(() => {
    return [...dailyMap.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, total]) => ({
        date,
        total,
        sessions: logs.filter(l => l.logged_at.split('T')[0] === date).length,
        metGoal: total >= currentGoal,
      }))
  }, [dailyMap, logs, currentGoal])

  function logWater(ml: number, notes?: string) {
    addLog.mutate({ amount_ml: ml, notes })
  }

  function handleCustomLog() {
    const ml = Number(customAmount)
    if (!ml || ml < 1) return
    logWater(ml, customNotes || undefined)
    setCustomAmount('')
    setCustomNotes('')
  }

  function handleGoalSave() {
    const val = Number(goalInput)
    if (!val || val < 1) return
    setGoal.mutate(val, { onSuccess: () => setEditingGoal(false) })
  }

  if (isLoading) return <div className="p-8 text-center text-text-light text-sm">Loading…</div>

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-text-dark">Water Tracker</h2>
          <p className="text-sm text-text-mid mt-0.5">Stay hydrated, stay focused.</p>
        </div>
        <p className="text-sm text-text-mid italic text-right max-w-xs">
          "Water is the driving force of all nature."
        </p>
      </div>

      {/* Stats row */}
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
                  className="w-20 text-xs border border-border rounded px-1.5 py-0.5 focus:outline-none focus:border-rose bg-cream"
                  autoFocus
                  placeholder="2500"
                />
                <span className="text-xs text-text-mid">ml/day</span>
                <button onClick={handleGoalSave} className="text-rose"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingGoal(false)} className="text-text-light"><X className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <>
                <span className="text-xs text-text-mid">Goal: {mlToDisplay(currentGoal)}/day</span>
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

        {/* Streak */}
        <div className="bg-card rounded-card border border-border p-4 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-orange-400" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Goal Streak</p>
          </div>
          <p className="font-display text-5xl font-semibold text-text-dark">{streak}</p>
          <p className="text-sm text-text-mid">days</p>
          {streak === 0 && <p className="text-xs text-text-light mt-1">Log today to start!</p>}
        </div>

        {/* Personal best */}
        <div className="bg-card rounded-card border border-border p-4 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Best Day</p>
          </div>
          <p className="font-display text-4xl font-semibold text-text-dark">
            {pbMl > 0 ? mlToDisplay(pbMl) : '—'}
          </p>
          {pbDate && <p className="text-xs text-rose mt-1">on {fmtDateShort(pbDate)}</p>}
        </div>
      </div>

      {/* Log + Today's log row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Log water */}
        <div className="bg-card rounded-card border border-border p-4 flex flex-col gap-3">
          <p className="text-xs text-text-mid font-medium">Log Water</p>

          {/* Quick buttons */}
          <div>
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-2">Quick Add</p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_AMOUNTS.map(({ label, ml }) => (
                <button
                  key={ml}
                  onClick={() => logWater(ml)}
                  disabled={addLog.isPending}
                  className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm text-text-mid hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-colors disabled:opacity-50"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  +{label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="border-t border-border pt-3">
            <p className="text-[10px] text-text-light uppercase tracking-wide mb-2">Custom Amount</p>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-cream focus-within:border-blue-400 flex-1">
                <Droplets className="w-4 h-4 text-text-light shrink-0" />
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomLog()}
                  placeholder="350ml"
                  className="w-full text-sm focus:outline-none bg-transparent"
                />
                <span className="text-xs text-text-light shrink-0">ml</span>
              </div>
              <button
                onClick={handleCustomLog}
                disabled={!customAmount || addLog.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors shrink-0"
              >
                Log
              </button>
            </div>
            <input
              type="text"
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="mt-2 w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-cream"
            />
          </div>
        </div>

        {/* Today's log */}
        <div className="bg-card rounded-card border border-border p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-mid font-medium">Today's Log</p>
            {todayTotal > 0 && (
              <span className="text-xs font-semibold text-blue-500">
                Total: {mlToDisplay(todayTotal)}
                {todayTotal >= currentGoal && ' ✓'}
              </span>
            )}
          </div>

          {todayLogs.length === 0 ? (
            <p className="text-sm text-text-light text-center py-8">No logs yet today.</p>
          ) : (
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-56">
              {todayLogs.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-cream/60 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-sm font-medium text-text-dark">{mlToDisplay(l.amount_ml)}</span>
                    {l.notes && <span className="text-xs text-text-light italic">{l.notes}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-light">{fmtTime(l.logged_at)}</span>
                    <button
                      onClick={() => deleteLog.mutate(l.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-light hover:text-rose transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {logs.length > 1 && (
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-text-mid font-medium">Daily Water (Last 30 Days)</p>
            <span className="text-[10px] text-text-light">Goal: {mlToDisplay(currentGoal)}</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8BACC4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8BACC4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} tickFormatter={v => mlToDisplay(Number(v))} />
              <Tooltip
                contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-text-dark)', fontSize: 12 }}
                formatter={(v: unknown) => [mlToDisplay(Number(v)), 'Water']}
              />
              <ReferenceLine
                y={currentGoal}
                stroke="#8BC49A"
                strokeDasharray="6 3"
                label={{ value: 'Goal', fontSize: 10, fill: '#8BC49A', position: 'insideTopRight' }}
              />
              <Area
                type="monotone"
                dataKey="ml"
                name="Water"
                stroke="#8BACC4"
                strokeWidth={2}
                fill="url(#waterGrad)"
                dot={{ r: 3, fill: '#8BACC4' }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {historyDays.length > 0 && (
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-cream/40 transition-colors"
          >
            <p className="text-xs text-text-mid font-medium">
              History ({historyDays.length} {historyDays.length === 1 ? 'day' : 'days'})
            </p>
            <span className="text-xs text-text-light">{showHistory ? 'Hide ↑' : 'Show ↓'}</span>
          </button>
          {showHistory && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  {['Date', 'Total', 'Sessions', 'Progress', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] text-text-light uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historyDays.map(({ date, total, sessions, metGoal }) => {
                  const pct = Math.min(100, Math.round((total / currentGoal) * 100))
                  return (
                    <tr key={date} className="border-b border-border last:border-0 hover:bg-cream/40 transition-colors">
                      <td className="px-4 py-3 text-text-dark">{fmtDateFull(date)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${metGoal ? 'text-blue-500' : 'text-text-dark'}`}>
                          {mlToDisplay(total)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-mid">{sessions} {sessions === 1 ? 'log' : 'logs'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: metGoal ? '#8BACC4' : '#8BACC466' }}
                            />
                          </div>
                          <span className={`text-xs ${metGoal ? 'text-blue-500' : 'text-text-mid'}`}>{pct}%</span>
                          {metGoal && <span className="text-xs">✓</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {logs.length === 0 && (
        <div className="text-center py-12 text-text-light text-sm">
          No entries yet. Log your first water above.
        </div>
      )}
    </div>
  )
}
