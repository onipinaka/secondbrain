import { localDateStr } from '../../../../lib/utils'
import { useState } from 'react'
import { Scale, TrendingDown, TrendingUp, Pencil, Check, X, Plus } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  useBodyMetrics, useAddBodyMetric, useDeleteBodyMetric,
  useGymProfile, useUpsertGymProfile,
} from '../../../../hooks/useGym'

type Props = { workspaceId: string }

function todayISO() { return localDateStr() }

function calcBMI(weightKg: number, heightCm: number) {
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}

function bmiLabel(bmi: number) {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

function fmtShort(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtFull(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function BodyMetricsTab({ workspaceId: _workspaceId }: Props) {
  const { data: metrics = [], isLoading } = useBodyMetrics()
  const { data: profile } = useGymProfile()
  const addMetric = useAddBodyMetric()
  const deleteMetric = useDeleteBodyMetric()
  const upsertProfile = useUpsertGymProfile()

  const [logDate, setLogDate] = useState(todayISO())
  const [logWeight, setLogWeight] = useState('')
  const [editingHeight, setEditingHeight] = useState(false)
  const [heightInput, setHeightInput] = useState('')

  const sorted = [...metrics].sort((a, b) => b.logged_at.localeCompare(a.logged_at))
  const heightCm = profile?.height_cm ?? null
  const latest = sorted[0]
  const latestWeight = latest?.weight_kg ?? null

  const thirtyAgo = new Date()
  thirtyAgo.setDate(thirtyAgo.getDate() - 30)
  const thirtyAgoISO = thirtyAgo.toISOString().split('T')[0]
  const thirtyDayOld = sorted.find(m => m.logged_at.split('T')[0] <= thirtyAgoISO)
  const weightChange =
    latestWeight != null && thirtyDayOld?.weight_kg != null
      ? Math.round((latestWeight - thirtyDayOld.weight_kg) * 10) / 10
      : null

  const ninetyAgo = new Date()
  ninetyAgo.setDate(ninetyAgo.getDate() - 90)
  const ninetyAgoISO = ninetyAgo.toISOString().split('T')[0]
  const chartData = [...metrics]
    .filter(m => m.logged_at.split('T')[0] >= ninetyAgoISO && m.weight_kg != null)
    .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
    .map(m => ({ date: fmtShort(m.logged_at.split('T')[0]), weight: m.weight_kg }))

  function handleLog() {
    if (!logWeight) return
    addMetric.mutate(
      { logged_at: new Date(logDate + 'T12:00:00').toISOString(), weight_kg: Number(logWeight) },
      { onSuccess: () => setLogWeight('') },
    )
  }

  function handleHeightSave() {
    const val = Number(heightInput)
    if (!val || val < 50 || val > 250) return
    upsertProfile.mutate({ height_cm: val }, { onSuccess: () => setEditingHeight(false) })
  }

  const bmi = latestWeight != null && heightCm != null ? calcBMI(latestWeight, heightCm) : null

  if (isLoading) {
    return <div className="p-8 text-center text-text-light text-sm">Loading...</div>
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-text-dark">Body Metrics</h2>
          <p className="text-sm text-text-mid mt-0.5">Track your progress. See the changes. Stay consistent.</p>
        </div>
        {weightChange != null && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              weightChange <= 0 ? 'bg-rose-light text-rose' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {weightChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {weightChange <= 0
              ? `Lost ${Math.abs(weightChange)} kg`
              : `Gained ${weightChange} kg`}{' '}
            in last 30 days
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Weight */}
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-rose" />
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Weight</p>
          </div>
          <p className="font-display text-2xl font-semibold text-text-dark">
            {latestWeight != null ? `${latestWeight} kg` : '—'}
          </p>
          {weightChange != null && (
            <p className={`text-xs mt-1 ${weightChange <= 0 ? 'text-rose' : 'text-amber-600'}`}>
              {weightChange > 0 ? '+' : ''}
              {weightChange} kg vs last month
            </p>
          )}
        </div>

        {/* BMI */}
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-rose text-xs font-bold tracking-wide">BMI</span>
          </div>
          <p className="font-display text-2xl font-semibold text-text-dark">
            {bmi != null ? bmi : '—'}
          </p>
          {bmi != null && (
            <p className="text-xs mt-1 text-text-light">{bmiLabel(bmi)}</p>
          )}
          {bmi == null && heightCm == null && (
            <p className="text-xs mt-1 text-text-light">Set height to calculate</p>
          )}
        </div>

        {/* Height — editable */}
        <div className="bg-card rounded-card border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-text-light uppercase tracking-wide font-medium">Height</p>
            {!editingHeight && (
              <button
                onClick={() => { setHeightInput(String(heightCm ?? '')); setEditingHeight(true) }}
                className="text-text-light hover:text-rose transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {editingHeight ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="number"
                value={heightInput}
                onChange={e => setHeightInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleHeightSave()}
                placeholder="175"
                className="w-20 text-sm border border-border rounded-lg px-2 py-1 focus:outline-none focus:border-rose bg-cream"
                autoFocus
              />
              <span className="text-text-mid text-sm">cm</span>
              <button onClick={handleHeightSave} className="text-rose hover:text-rose/80 transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingHeight(false)} className="text-text-light hover:text-text-mid transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="font-display text-2xl font-semibold text-text-dark">
              {heightCm != null ? (
                `${heightCm} cm`
              ) : (
                <button
                  onClick={() => { setHeightInput(''); setEditingHeight(true) }}
                  className="text-base text-text-light hover:text-rose transition-colors"
                >
                  Set height →
                </button>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-card rounded-card border border-border p-4">
          <p className="text-xs text-text-mid font-medium mb-3">Progress Over Time (Last 90 Days)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-light)' }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                }}
                labelStyle={{ color: 'var(--color-text-dark)', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                name="Weight (kg)"
                stroke="#D4848A"
                strokeWidth={2}
                dot={{ r: 3, fill: '#D4848A' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log new weight */}
      <div className="bg-card rounded-card border border-border p-4">
        <p className="text-xs text-text-mid font-medium mb-3">Log New Weight</p>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={logDate}
            onChange={e => setLogDate(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
          />
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-cream focus-within:border-rose">
            <input
              type="number"
              value={logWeight}
              onChange={e => setLogWeight(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLog()}
              placeholder="72.5"
              step="0.1"
              className="w-20 text-sm focus:outline-none bg-transparent"
            />
            <span className="text-text-light text-sm">kg</span>
          </div>
          <button
            onClick={handleLog}
            disabled={!logWeight || addMetric.isPending}
            className="flex items-center gap-1.5 bg-rose text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Weight
          </button>
        </div>
      </div>

      {/* History */}
      {sorted.length > 0 && (
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-text-mid font-medium">History ({sorted.length} {sorted.length === 1 ? 'entry' : 'entries'})</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-cream/50">
                {['Date', 'Weight (kg)', 'BMI', 'Change', ''].map(h => (
                  <th
                    key={h}
                    className={`px-4 py-2 text-[10px] text-text-light uppercase tracking-wide font-medium ${h === '' ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => {
                const prev = sorted[i + 1]?.weight_kg
                const delta =
                  m.weight_kg != null && prev != null
                    ? Math.round((m.weight_kg - prev) * 10) / 10
                    : null
                const entryBmi =
                  m.weight_kg != null && heightCm != null
                    ? calcBMI(m.weight_kg, heightCm)
                    : null
                return (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-0 hover:bg-cream/40 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-text-dark">{fmtFull(m.logged_at.split('T')[0])}</td>
                    <td className="px-4 py-2.5 font-medium text-text-dark">{m.weight_kg ?? '—'}</td>
                    <td className="px-4 py-2.5 text-text-mid">{entryBmi ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      {delta != null && (
                        <span
                          className={`text-xs font-medium ${delta <= 0 ? 'text-rose' : 'text-amber-600'}`}
                        >
                          {delta > 0 ? '+' : ''}
                          {delta} kg
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => deleteMetric.mutate(m.id)}
                        className="text-text-light hover:text-rose transition-colors text-base leading-none"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length === 0 && (
        <div className="text-center py-12 text-text-light text-sm">
          No entries yet. Log your first weight above.
        </div>
      )}
    </div>
  )
}
