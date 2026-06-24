import { localDateStr } from '../../../../lib/utils'
import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Footprints, Flame, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  useGymStepsLogs, useAddGymStepsLog, useUpdateGymStepsLog, useDeleteGymStepsLog,
} from '../../../../hooks/useGym'

type Props = { workspaceId: string }

const DEFAULT_GOAL = 10000

function todayISO() { return localDateStr() }

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function fmtShort(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function calcStreak(logs: { log_date: string; steps: number; goal: number | null }[]): number {
  const met = new Set(logs.filter(l => l.steps >= (l.goal ?? DEFAULT_GOAL)).map(l => l.log_date))
  let streak = 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (let i = 0; i <= 365; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    if (met.has(iso)) streak++
    else if (i === 0) continue
    else break
  }
  return streak
}

export default function StepsTab({ workspaceId: _workspaceId }: Props) {
  const { data: logs = [], isLoading } = useGymStepsLogs()
  const addLog = useAddGymStepsLog()
  const updateLog = useUpdateGymStepsLog()
  const deleteLog = useDeleteGymStepsLog()

  const [logDate, setLogDate] = useState(todayISO())
  const [logSteps, setLogSteps] = useState('')
  const [logGoal, setLogGoal] = useState(String(DEFAULT_GOAL))
  const [logNotes, setLogNotes] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSteps, setEditSteps] = useState('')

  const today = todayISO()
  const todayEntry = logs.find(l => l.log_date === today)
  const todaySteps = todayEntry?.steps ?? 0
  const todayGoal = todayEntry?.goal ?? DEFAULT_GOAL
  const todayPct = Math.min(100, Math.round((todaySteps / todayGoal) * 100))

  const streak = calcStreak(logs)

  const last7 = logs.slice(0, 7)
  const avg7 = last7.length
    ? Math.round(last7.reduce((s, l) => s + l.steps, 0) / last7.length)
    : 0

  // Chart: last 30 days
  const chartData = (() => {
    const byDate = new Map(logs.map(l => [l.log_date, l]))
    const result = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      const entry = byDate.get(iso)
      result.push({
        date: fmtShort(iso),
        steps: entry?.steps ?? 0,
        goal: entry?.goal ?? DEFAULT_GOAL,
      })
    }
    return result
  })()

  function handleLog() {
    if (!logSteps) return
    addLog.mutate({
      log_date: logDate,
      steps: Number(logSteps),
      goal: logGoal ? Number(logGoal) : DEFAULT_GOAL,
      notes: logNotes || undefined,
    }, {
      onSuccess: () => { setLogSteps(''); setLogNotes('') },
    })
  }

  function startEdit(id: string, steps: number) {
    setEditingId(id)
    setEditSteps(String(steps))
  }

  function saveEdit(id: string) {
    if (!editSteps) return
    updateLog.mutate({ id, steps: Number(editSteps) }, {
      onSuccess: () => setEditingId(null),
    })
  }

  if (isLoading) return <div className="p-8 text-center text-text-light text-sm">Loading…</div>

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-text-dark">Steps Tracker</h2>
        <p className="text-sm text-text-mid mt-0.5">Every step counts. Stay consistent.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Today */}
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Footprints className="w-4 h-4 text-rose" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Today</p>
          </div>
          <p className="font-display text-3xl font-semibold text-text-dark">
            {todaySteps > 0 ? todaySteps.toLocaleString() : '—'}
          </p>
          <p className="text-xs text-text-light mt-1">
            Goal: {todayGoal.toLocaleString()} steps
          </p>
          {todaySteps > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-text-light mb-1">
                <span>{todayPct}%</span>
                {todayPct >= 100 && <span className="text-rose font-medium">Goal met! 🎉</span>}
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${todayPct}%`, background: todayPct >= 100 ? '#8BC49A' : '#D4848A' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 7-day avg */}
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-rose" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">7-Day Average</p>
          </div>
          <p className="font-display text-3xl font-semibold text-text-dark">
            {avg7 > 0 ? avg7.toLocaleString() : '—'}
          </p>
          <p className="text-xs text-text-light mt-1">steps/day</p>
        </div>

        {/* Streak */}
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Goal Streak</p>
          </div>
          <p className="font-display text-3xl font-semibold text-text-dark">{streak}</p>
          <p className="text-xs text-text-light mt-1">
            {streak === 1 ? 'day' : 'days'} hitting goal
          </p>
        </div>
      </div>

      {/* Log form */}
      <div className="bg-card rounded-card border border-border p-4">
        <p className="text-xs text-text-mid font-medium mb-3">Log Steps</p>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-light uppercase tracking-wide font-medium">Date</label>
            <input
              type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-light uppercase tracking-wide font-medium">Steps</label>
            <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-cream focus-within:border-rose">
              <Footprints className="w-4 h-4 text-text-light shrink-0" />
              <input
                type="number" value={logSteps} onChange={e => setLogSteps(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLog()}
                placeholder="8,500"
                className="w-24 text-sm focus:outline-none bg-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-light uppercase tracking-wide font-medium">Goal</label>
            <input
              type="number" value={logGoal} onChange={e => setLogGoal(e.target.value)}
              placeholder="10000"
              className="w-28 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] text-text-light uppercase tracking-wide font-medium">Notes (optional)</label>
            <input
              type="text" value={logNotes} onChange={e => setLogNotes(e.target.value)}
              placeholder="Morning walk, gym commute…"
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
            />
          </div>
          <button
            onClick={handleLog}
            disabled={!logSteps || addLog.isPending}
            className="flex items-center gap-1.5 bg-rose text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Steps
          </button>
        </div>
      </div>

      {/* Chart */}
      {logs.length > 1 && (
        <div className="bg-card rounded-card border border-border p-4">
          <p className="text-xs text-text-mid font-medium mb-3">Daily Steps (Last 30 Days)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--color-text-dark)', fontSize: 12 }}
                formatter={(v: unknown) => [Number(v).toLocaleString(), 'Steps']}
              />
              <ReferenceLine
                y={DEFAULT_GOAL}
                stroke="#8BC49A"
                strokeDasharray="6 3"
                label={{ value: 'Goal', fontSize: 10, fill: '#8BC49A', position: 'insideTopRight' }}
              />
              <Bar
                dataKey="steps"
                fill="#D4848A"
                radius={[3, 3, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {logs.length > 0 && (
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-text-mid font-medium">History ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/50">
                {['Date', 'Steps', 'Goal', 'Progress', 'Notes', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[10px] text-text-light uppercase tracking-wide font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(l => {
                const pct = Math.min(100, Math.round((l.steps / (l.goal ?? DEFAULT_GOAL)) * 100))
                const met = l.steps >= (l.goal ?? DEFAULT_GOAL)
                return (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-cream/40 transition-colors group">
                    <td className="px-4 py-3 text-text-dark">{fmtDate(l.log_date)}</td>
                    <td className="px-4 py-3">
                      {editingId === l.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editSteps}
                            onChange={e => setEditSteps(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveEdit(l.id)}
                            className="w-20 border border-rose rounded px-1.5 py-0.5 text-sm focus:outline-none bg-cream"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(l.id)} className="text-rose"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="text-text-light"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <span className={`font-semibold ${met ? 'text-sage' : 'text-text-dark'}`}>
                          {l.steps.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-mid">{(l.goal ?? DEFAULT_GOAL).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: met ? '#8BC49A' : '#D4848A' }}
                          />
                        </div>
                        <span className={`text-xs ${met ? 'text-sage' : 'text-text-mid'}`}>{pct}%</span>
                        {met && <span className="text-xs">✓</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-light text-xs">{l.notes ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(l.id, l.steps)}
                          className="text-text-light hover:text-rose transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteLog.mutate(l.id)}
                          className="text-text-light hover:text-rose transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {logs.length === 0 && (
        <div className="text-center py-12 text-text-light text-sm">
          No entries yet. Log your first steps above.
        </div>
      )}
    </div>
  )
}
