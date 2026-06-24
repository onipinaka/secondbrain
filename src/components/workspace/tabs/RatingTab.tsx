import { localDateStr } from '../../../lib/utils'
import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  useCPRating, useAddCPRating, useDeleteCPRating,
  type CPRatingEntry,
} from '../../../hooks/useCP'

type Props = { workspaceId: string }

const PLATFORM_OPTS = [
  { value: 'codeforces', label: 'Codeforces', color: '#EF4444' },
  { value: 'atcoder', label: 'AtCoder', color: '#3B82F6' },
  { value: 'hackerrank', label: 'HackerRank', color: '#22C55E' },
  { value: 'leetcode', label: 'LeetCode', color: '#F59E0B' },
  { value: 'codechef', label: 'CodeChef', color: '#F97316' },
  { value: 'other', label: 'Other', color: '#A0A0A0' },
]

const PLATFORM_COLOR: Record<string, string> = Object.fromEntries(PLATFORM_OPTS.map(p => [p.value, p.color]))
const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(PLATFORM_OPTS.map(p => [p.value, p.label]))

function today() {
  return localDateStr()
}

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'

export default function RatingTab({ workspaceId: _workspaceId }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [newDate, setNewDate] = useState(today())
  const [newPlatform, setNewPlatform] = useState('codeforces')
  const [newRating, setNewRating] = useState('')

  const { data: entries = [], isLoading } = useCPRating()
  const addRating = useAddCPRating()
  const deleteRating = useDeleteCPRating()

  // Build pivot chart data: one row per date, columns per platform
  const { chartData, platforms } = useMemo(() => {
    const platformSet = [...new Set(entries.map(e => e.platform))].sort()
    const dateSet = [...new Set(entries.map(e => e.log_date))].sort()

    const data = dateSet.map(date => {
      const row: Record<string, string | number | null> = { date }
      for (const p of platformSet) {
        const hit = entries.find(e => e.log_date === date && e.platform === p)
        row[p] = hit?.rating ?? null
      }
      return row
    })

    return { chartData: data, platforms: platformSet }
  }, [entries])

  function handleAdd() {
    if (!newDate || !newRating || !newPlatform) return
    const rating = parseInt(newRating)
    if (isNaN(rating)) return
    addRating.mutate(
      { platform: newPlatform, rating, log_date: newDate },
      { onSuccess: () => { setNewRating(''); setShowAdd(false) } },
    )
  }

  // Group entries by platform for the table display (most recent first per platform)
  const sortedEntries = [...entries].sort((a, b) => b.log_date.localeCompare(a.log_date))

  return (
    <div>
      {/* Chart */}
      <div className="px-5 py-4 border-b border-border bg-rose-bg/10">
        <p className="text-sm font-medium text-text-dark mb-3">Rating History</p>
        {entries.length === 0 ? (
          <p className="text-xs text-text-light py-4 text-center">No data yet. Log your first rating below.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E4DC" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#E8D5CC' }}
                  tickFormatter={d => {
                    const dt = new Date(d + 'T00:00:00')
                    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: '1px solid #F0E4DC', borderRadius: 6 }}
                  formatter={(v, name) => [v, PLATFORM_LABEL[name as string] ?? name]}
                />
                <Legend
                  formatter={v => PLATFORM_LABEL[v] ?? v}
                  wrapperStyle={{ fontSize: 11 }}
                />
                {platforms.map(p => (
                  <Line
                    key={p}
                    type="monotone"
                    dataKey={p}
                    stroke={PLATFORM_COLOR[p] ?? '#A0A0A0'}
                    strokeWidth={2}
                    dot={{ r: 3, fill: PLATFORM_COLOR[p] ?? '#A0A0A0' }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-end bg-card">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={13} /> Log Rating
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3 flex-wrap">
          <input
            autoFocus
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          />
          <select
            value={newPlatform}
            onChange={e => setNewPlatform(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          >
            {PLATFORM_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="number"
            value={newRating}
            onChange={e => setNewRating(e.target.value)}
            placeholder="Rating *"
            min={0}
            className="w-28 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
          />
          <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">Log</button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">Cancel</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              <th className={`${TH} w-32`}>Date</th>
              <th className={`${TH} w-36`}>Platform</th>
              <th className={`${TH} w-24`}>Rating</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : sortedEntries.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-text-light text-sm">No entries yet.</td>
                </tr>
              )
              : sortedEntries.map((item: CPRatingEntry) => {
                  const platformOpt = PLATFORM_OPTS.find(p => p.value === item.platform)
                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-rose-bg/20 group">
                      <td className="px-3 py-2 w-32 text-xs text-text-dark">
                        {new Date(item.log_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                      <td className="px-3 py-2 w-36">
                        <span className="inline-flex items-center gap-1.5 text-xs text-text-dark">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: platformOpt?.color ?? '#A0A0A0' }}
                          />
                          {platformOpt?.label ?? item.platform}
                        </span>
                      </td>
                      <td className="px-3 py-2 w-24 font-display text-base text-text-dark">{item.rating}</td>
                      <td className="relative w-10">
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                          onClick={() => deleteRating.mutate(item.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
            }
            <tr>
              <td colSpan={4} className="p-0">
                <button
                  className="w-full py-2 bg-rose-bg/30 hover:bg-rose-bg text-text-light hover:text-rose transition-colors flex items-center justify-center"
                  onClick={() => setShowAdd(true)}
                >
                  <Plus size={14} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
