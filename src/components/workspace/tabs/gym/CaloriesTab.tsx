import { localDateStr } from '../../../../lib/utils'
import { useState, useMemo } from 'react'
import { Trash2, Plus, Pencil, Check, X, Flame, Beef, Droplets, Wheat } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useGymDietLogs, useAddGymDietLog, useDeleteGymDietLog } from '../../../../hooks/useGym'

type Props = { workspaceId: string }

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout', 'Other']

const MEAL_COLORS: Record<string, string> = {
  breakfast: '#F59E0B', lunch: '#8BC49A', dinner: '#8BACC4',
  snack: '#D4848A', 'pre-workout': '#A78BFA', 'post-workout': '#6EE7B7', other: '#D1D5DB',
}

const GOAL_KEY = 'gym_diet_goals'
const DEFAULT_GOALS = { calories: 2000, protein_g: 150, fat_g: 65, carbs_g: 250 }

function loadGoals() {
  try { return { ...DEFAULT_GOALS, ...JSON.parse(localStorage.getItem(GOAL_KEY) ?? '{}') } }
  catch { return DEFAULT_GOALS }
}

function todayISO() { return localDateStr() }
function nowLocal() {
  const d = new Date()
  d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function fmtDateShort(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtDateFull(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function MacroBar({ value, goal, color }: { value: number; goal: number; color: string }) {
  const pct = Math.min(100, Math.round((value / (goal || 1)) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] text-text-light w-7 text-right">{pct}%</span>
    </div>
  )
}

function MealChip({ type }: { type: string }) {
  const color = MEAL_COLORS[type.toLowerCase()] ?? '#D1D5DB'
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
      style={{ background: color + '33', color }}>
      {type}
    </span>
  )
}

export default function CaloriesTab({ workspaceId: _workspaceId }: Props) {
  const { data: logs = [], isLoading } = useGymDietLogs()
  const addLog = useAddGymDietLog()
  const deleteLog = useDeleteGymDietLog()

  const [goals, setGoals] = useState(loadGoals)
  const [editingGoals, setEditingGoals] = useState(false)
  const [goalDraft, setGoalDraft] = useState(goals)

  const [loggedAt, setLoggedAt] = useState(nowLocal)
  const [mealType, setMealType] = useState('Breakfast')
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carbs, setCarbs] = useState('')
  const [notes, setNotes] = useState('')

  const today = todayISO()

  const todayLogs = useMemo(() =>
    [...logs].filter(l => l.logged_at.split('T')[0] === today)
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at)),
    [logs, today]
  )

  const todayTotals = useMemo(() => todayLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories ?? 0),
      protein_g: acc.protein_g + (l.protein_g ?? 0),
      fat_g: acc.fat_g + (l.fat_g ?? 0),
      carbs_g: acc.carbs_g + (l.carbs_g ?? 0),
    }),
    { calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 }
  ), [todayLogs])

  // Chart: last 30 days calorie totals
  const chartData = useMemo(() => {
    const byDate = new Map<string, number>()
    logs.forEach(l => {
      const d = l.logged_at.split('T')[0]
      byDate.set(d, (byDate.get(d) ?? 0) + (l.calories ?? 0))
    })
    const result = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      result.push({ date: fmtDateShort(iso), calories: byDate.get(iso) ?? 0 })
    }
    return result
  }, [logs])

  function handleLog() {
    if (!calories && !protein && !fat && !carbs) return
    addLog.mutate({
      logged_at: new Date(loggedAt).toISOString(),
      meal_type: mealType,
      name: name || null,
      calories: calories ? Number(calories) : null,
      protein_g: protein ? Number(protein) : null,
      fat_g: fat ? Number(fat) : null,
      carbs_g: carbs ? Number(carbs) : null,
      notes: notes || null,
    }, {
      onSuccess: () => {
        setCalories(''); setProtein(''); setFat(''); setCarbs('')
        setName(''); setNotes('')
        setLoggedAt(nowLocal())
      },
    })
  }

  function saveGoals() {
    localStorage.setItem(GOAL_KEY, JSON.stringify(goalDraft))
    setGoals(goalDraft)
    setEditingGoals(false)
  }

  if (isLoading) return <div className="p-8 text-center text-text-light text-sm">Loading…</div>

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-text-dark">Diet Tracker</h2>
          <p className="text-sm text-text-mid mt-0.5">Track your daily nutrition.</p>
        </div>
        <button
          onClick={() => { setGoalDraft(goals); setEditingGoals(v => !v) }}
          className="flex items-center gap-1.5 text-xs text-text-mid hover:text-rose transition-colors border border-border rounded-lg px-3 py-1.5"
        >
          <Pencil className="w-3 h-3" />
          {editingGoals ? 'Cancel' : 'Edit Goals'}
        </button>
      </div>

      {/* Goals editor */}
      {editingGoals && (
        <div className="bg-card rounded-card border border-border p-4">
          <p className="text-xs text-text-mid font-medium mb-3">Daily Goals</p>
          <div className="flex gap-3 flex-wrap items-end">
            {([
              { key: 'calories', label: 'Calories', suffix: 'kcal' },
              { key: 'protein_g', label: 'Protein', suffix: 'g' },
              { key: 'fat_g', label: 'Fat', suffix: 'g' },
              { key: 'carbs_g', label: 'Carbs', suffix: 'g' },
            ] as const).map(({ key, label, suffix }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[10px] text-text-light uppercase tracking-wide font-medium">{label}</label>
                <div className="flex items-center gap-1 border border-border rounded-lg px-2 py-1.5 bg-cream focus-within:border-rose">
                  <input
                    type="number"
                    value={goalDraft[key]}
                    onChange={e => setGoalDraft(g => ({ ...g, [key]: Number(e.target.value) }))}
                    className="w-16 text-sm focus:outline-none bg-transparent"
                  />
                  <span className="text-xs text-text-light">{suffix}</span>
                </div>
              </div>
            ))}
            <button
              onClick={saveGoals}
              className="flex items-center gap-1 bg-rose text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-rose/90 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
            <button onClick={() => setEditingGoals(false)} className="text-text-light hover:text-rose">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Today summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Calories', value: todayTotals.calories, goal: goals.calories, unit: 'kcal', icon: Flame, color: '#D4848A' },
          { label: 'Protein', value: todayTotals.protein_g, goal: goals.protein_g, unit: 'g', icon: Beef, color: '#8BC49A' },
          { label: 'Fat', value: todayTotals.fat_g, goal: goals.fat_g, unit: 'g', icon: Droplets, color: '#F59E0B' },
          { label: 'Carbs', value: todayTotals.carbs_g, goal: goals.carbs_g, unit: 'g', icon: Wheat, color: '#8BACC4' },
        ].map(({ label, value, goal, unit, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">{label}</p>
            </div>
            <p className="font-display text-2xl font-semibold text-text-dark">
              {value > 0 ? (Number.isInteger(value) ? value : value.toFixed(1)) : '—'}
            </p>
            <p className="text-[10px] text-text-light mt-0.5">/ {goal} {unit}</p>
            {value > 0 && <MacroBar value={value} goal={goal} color={color} />}
          </div>
        ))}
      </div>

      {/* Log form */}
      <div className="bg-card rounded-card border border-border p-4">
        <p className="text-xs text-text-mid font-medium mb-3">Log Meal</p>
        <div className="flex flex-col gap-3">
          {/* Row 1: time + meal type + name */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-text-light uppercase tracking-wide font-medium">Time</label>
              <input
                type="datetime-local"
                value={loggedAt}
                onChange={e => setLoggedAt(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-text-light uppercase tracking-wide font-medium">Meal</label>
              <select
                value={mealType}
                onChange={e => setMealType(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
              >
                {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-40">
              <label className="text-[10px] text-text-light uppercase tracking-wide font-medium">Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Chicken Rice Bowl"
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
              />
            </div>
          </div>
          {/* Row 2: macros */}
          <div className="flex gap-3 flex-wrap items-end">
            {[
              { label: 'Calories', suffix: 'kcal', val: calories, set: setCalories, color: '#D4848A' },
              { label: 'Protein', suffix: 'g', val: protein, set: setProtein, color: '#8BC49A' },
              { label: 'Fat', suffix: 'g', val: fat, set: setFat, color: '#F59E0B' },
              { label: 'Carbs', suffix: 'g', val: carbs, set: setCarbs, color: '#8BACC4' },
            ].map(({ label, suffix, val, set, color }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wide font-medium" style={{ color }}>
                  {label}
                </label>
                <div className="flex items-center gap-1 border border-border rounded-lg px-3 py-2 bg-cream focus-within:border-rose">
                  <input
                    type="number"
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder="0"
                    className="w-16 text-sm focus:outline-none bg-transparent"
                  />
                  <span className="text-xs text-text-light">{suffix}</span>
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-1 flex-1 min-w-32">
              <label className="text-[10px] text-text-light uppercase tracking-wide font-medium">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
              />
            </div>
            <button
              onClick={handleLog}
              disabled={(!calories && !protein && !fat && !carbs) || addLog.isPending}
              className="flex items-center gap-1.5 bg-rose text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose/90 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Log Meal
            </button>
          </div>
        </div>
      </div>

      {/* Today's entries */}
      {todayLogs.length > 0 && (
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-text-mid font-medium">Today's Meals ({todayLogs.length})</p>
          </div>
          <div className="divide-y divide-border">
            {todayLogs.map(l => (
              <div key={l.id} className="flex items-center gap-4 px-4 py-3 hover:bg-cream/40 transition-colors group">
                <MealChip type={l.meal_type} />
                <div className="flex-1 min-w-0">
                  {l.name && <p className="text-sm font-medium text-text-dark truncate">{l.name}</p>}
                  <div className="flex items-center gap-3 flex-wrap mt-0.5">
                    {l.calories != null && (
                      <span className="text-xs text-text-mid">
                        <span className="font-medium text-rose">{l.calories}</span> kcal
                      </span>
                    )}
                    {l.protein_g != null && (
                      <span className="text-xs text-text-mid">
                        P: <span className="font-medium text-sage">{l.protein_g}g</span>
                      </span>
                    )}
                    {l.fat_g != null && (
                      <span className="text-xs text-text-mid">
                        F: <span className="font-medium" style={{ color: '#F59E0B' }}>{l.fat_g}g</span>
                      </span>
                    )}
                    {l.carbs_g != null && (
                      <span className="text-xs text-text-mid">
                        C: <span className="font-medium text-blue-400">{l.carbs_g}g</span>
                      </span>
                    )}
                    {l.notes && <span className="text-xs text-text-light italic">{l.notes}</span>}
                  </div>
                </div>
                <span className="text-xs text-text-light shrink-0">{fmtTime(l.logged_at)}</span>
                <button
                  onClick={() => deleteLog.mutate(l.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-light hover:text-rose transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 30-day calorie chart */}
      {logs.length > 1 && (
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-text-mid font-medium">Daily Calories (Last 30 Days)</p>
            <span className="text-[10px] text-text-light">Goal: {goals.calories} kcal</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(v: unknown) => [Number(v).toLocaleString(), 'kcal']}
              />
              <ReferenceLine y={goals.calories} stroke="#D4848A" strokeDasharray="6 3"
                label={{ value: 'Goal', fontSize: 10, fill: '#D4848A', position: 'insideTopRight' }} />
              <Area type="monotone" dataKey="calories" stroke="#D4848A" strokeWidth={2}
                fill="url(#calGrad)" dot={{ r: 3, fill: '#D4848A' }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      {logs.length > 0 && (
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-text-mid font-medium">All Entries ({logs.length})</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/50">
                {['Date', 'Time', 'Meal', 'Name', 'Cal', 'P', 'F', 'C', ''].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] text-text-light uppercase tracking-wide font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-cream/40 transition-colors group">
                  <td className="px-3 py-2.5 text-text-dark text-xs">{fmtDateFull(l.logged_at.split('T')[0])}</td>
                  <td className="px-3 py-2.5 text-text-light text-xs">{fmtTime(l.logged_at)}</td>
                  <td className="px-3 py-2.5"><MealChip type={l.meal_type} /></td>
                  <td className="px-3 py-2.5 text-text-mid text-xs max-w-32 truncate">{l.name ?? '—'}</td>
                  <td className="px-3 py-2.5 text-rose font-medium text-xs">{l.calories ?? '—'}</td>
                  <td className="px-3 py-2.5 text-sage font-medium text-xs">{l.protein_g != null ? `${l.protein_g}g` : '—'}</td>
                  <td className="px-3 py-2.5 font-medium text-xs" style={{ color: '#F59E0B' }}>{l.fat_g != null ? `${l.fat_g}g` : '—'}</td>
                  <td className="px-3 py-2.5 text-blue-400 font-medium text-xs">{l.carbs_g != null ? `${l.carbs_g}g` : '—'}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => deleteLog.mutate(l.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-light hover:text-rose transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logs.length === 0 && (
        <div className="text-center py-12 text-text-light text-sm">
          No meals logged yet. Add your first entry above.
        </div>
      )}
    </div>
  )
}
