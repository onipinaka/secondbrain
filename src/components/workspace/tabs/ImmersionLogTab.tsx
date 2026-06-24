import { localDateStr } from '../../../lib/utils'
import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  useImmersionLog, useAddImmersion, useUpdateImmersion, useDeleteImmersion,
  type ImmersionEntry,
} from '../../../hooks/useLanguage'

type Props = { workspaceId: string }
type EC = { id: string; field: string; value: string }
type Opt = { value: string; label: string; cls: string }

const TYPE_OPTS: Opt[] = [
  { value: 'listening', label: 'Listening', cls: 'bg-blue-100 text-blue-600' },
  { value: 'speaking', label: 'Speaking', cls: 'bg-green-100 text-green-700' },
  { value: 'reading', label: 'Reading', cls: 'bg-amber-100 text-amber-700' },
  { value: 'general', label: 'General', cls: 'bg-gray-100 text-gray-500' },
]

const COMP_CLS = [
  '', // 0 unused
  'bg-red-100 text-red-600',
  'bg-orange-100 text-orange-600',
  'bg-amber-100 text-amber-700',
  'bg-lime-100 text-lime-700',
  'bg-green-100 text-green-700',
]

const CHART_COLORS: Record<string, string> = {
  Listening: '#6EA8D0',
  Speaking: '#6EBD8A',
  Reading: '#D4A96A',
  General: '#A0A0A0',
}

function Bdg({ val, opts }: { val: string | null | undefined; opts: Opt[] }) {
  if (!val) return <span className="text-text-light text-xs">—</span>
  const o = opts.find(x => x.value === val)
  return o
    ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${o.cls}`}>{o.label}</span>
    : <span className="text-text-dark text-xs">{val}</span>
}

function CompBdg({ val }: { val: number | null }) {
  if (val == null) return <span className="text-text-light text-xs">—</span>
  const cls = COMP_CLS[val] ?? 'bg-gray-100 text-gray-500'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>{val}/5</span>
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function today() {
  return localDateStr()
}

function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'
const INPUT = 'w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none'
const SEL = 'bg-white border border-rose rounded px-1.5 py-1 text-xs outline-none'

export default function ImmersionLogTab({ workspaceId: _workspaceId }: Props) {
  const [ec, setEc] = useState<EC | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newDate, setNewDate] = useState(today())
  const [newType, setNewType] = useState('')

  const { data: logs = [], isLoading } = useImmersionLog()
  const addImmersion = useAddImmersion()
  const updateImmersion = useUpdateImmersion()
  const deleteImmersion = useDeleteImmersion()

  function commit(id: string, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    updateImmersion.mutate({ id, [field]: v || null } as any)
  }

  const isE = (id: string, f: string) => ec?.id === id && ec?.field === f

  function txt(item: ImmersionEntry, f: keyof ImmersionEntry) {
    const val = (item[f] ?? '') as string
    return isE(item.id, f as string) ? (
      <input
        autoFocus
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
        onBlur={() => commit(item.id, f as string)}
        onKeyDown={e => { if (e.key === 'Enter') commit(item.id, f as string); if (e.key === 'Escape') setEc(null) }}
        onClick={e => e.stopPropagation()}
      />
    ) : (
      <span
        className="cursor-text text-text-dark text-xs"
        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: f as string, value: val }) }}
      >
        {val || <span className="text-text-light">—</span>}
      </span>
    )
  }

  function sel(item: ImmersionEntry, f: keyof ImmersionEntry, opts: Opt[]) {
    const val = (item[f] ?? '') as string
    return isE(item.id, f as string) ? (
      <select
        autoFocus
        className={SEL}
        value={ec!.value}
        onChange={e => commit(item.id, f as string, e.target.value)}
        onBlur={() => setEc(null)}
        onClick={e => e.stopPropagation()}
      >
        <option value="">—</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <span
        className="cursor-pointer"
        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: f as string, value: val }) }}
      >
        <Bdg val={val} opts={opts} />
      </span>
    )
  }

  // Stats
  const stats = useMemo(() => {
    const ms = monthStart()
    const thisMonth = logs.filter(l => l.log_date >= ms)
    const totalMins = thisMonth.reduce((s, l) => s + (l.duration_mins ?? 0), 0)
    const byType = { listening: 0, speaking: 0, reading: 0, general: 0 } as Record<string, number>
    for (const l of thisMonth) {
      const t = l.type ?? 'general'
      byType[t] = (byType[t] ?? 0) + (l.duration_mins ?? 0)
    }
    const chartData = [
      { name: 'Listening', mins: byType['listening'] ?? 0 },
      { name: 'Speaking', mins: byType['speaking'] ?? 0 },
      { name: 'Reading', mins: byType['reading'] ?? 0 },
      { name: 'General', mins: byType['general'] ?? 0 },
    ]
    return { totalMins, chartData }
  }, [logs])

  function handleAdd() {
    if (!newDate) return
    addImmersion.mutate(
      { log_date: newDate, type: newType || null },
      { onSuccess: () => { setNewDate(today()); setNewType(''); setShowAdd(false) } },
    )
  }

  return (
    <div>
      {/* Stats + mini chart */}
      <div className="px-5 py-4 border-b border-border bg-rose-bg/10 flex items-center gap-8 flex-wrap">
        <div>
          <p className="text-lg font-display text-text-dark leading-tight">
            {(stats.totalMins / 60).toFixed(1)} hrs
          </p>
          <p className="text-[10px] text-text-light uppercase tracking-wide">This Month</p>
        </div>
        <div className="w-48 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} barCategoryGap="20%">
              <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v) => [`${v ?? 0} mins`, '']}
                contentStyle={{ fontSize: 11, border: '1px solid #F0E4DC', borderRadius: 6 }}
              />
              <Bar dataKey="mins" radius={[2, 2, 0, 0]}>
                {stats.chartData.map(entry => (
                  <Cell key={entry.name} fill={CHART_COLORS[entry.name] ?? '#A0A0A0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-end bg-card">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={13} /> Log Session
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
            value={newType}
            onChange={e => setNewType(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          >
            <option value="">Type (optional)</option>
            {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">Log</button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">Cancel</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              <th className={`${TH} w-28`}>Date</th>
              <th className={`${TH} w-28`}>Type</th>
              <th className={`${TH} min-w-40`}>Content</th>
              <th className={`${TH} w-24`}>Duration</th>
              <th className={`${TH} w-24`}>Comprehension</th>
              <th className={`${TH} min-w-36`}>Notes</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : logs.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-text-light text-sm">No sessions yet.</td>
                </tr>
              )
              : logs.map(item => (
                <tr key={item.id} className="border-b border-border hover:bg-rose-bg/20 group">
                  <td className="px-3 py-2 w-28">
                    {isE(item.id, 'log_date') ? (
                      <input
                        autoFocus
                        type="date"
                        className="bg-white border border-rose rounded px-2 py-1 text-xs outline-none"
                        value={ec!.value}
                        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                        onBlur={() => commit(item.id, 'log_date')}
                        onKeyDown={e => { if (e.key === 'Escape') setEc(null) }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="cursor-text text-text-dark text-xs"
                        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: 'log_date', value: item.log_date }) }}
                      >
                        {fmtDate(item.log_date)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 w-28">{sel(item, 'type', TYPE_OPTS)}</td>
                  <td className="px-3 py-2 min-w-40">
                    <div className="truncate max-w-[200px]">{txt(item, 'content')}</div>
                  </td>
                  <td className="px-3 py-2 w-24">
                    {isE(item.id, 'duration_mins') ? (
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        className="w-20 bg-white border border-rose rounded px-2 py-1 text-xs outline-none"
                        value={ec!.value}
                        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                        onBlur={() => {
                          const v = ec?.value
                          setEc(null)
                          updateImmersion.mutate({ id: item.id, duration_mins: v != null && v !== '' ? parseInt(v) : null })
                        }}
                        onKeyDown={e => { if (e.key === 'Escape') setEc(null) }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="cursor-text text-text-dark text-xs"
                        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: 'duration_mins', value: String(item.duration_mins ?? '') }) }}
                      >
                        {item.duration_mins != null
                          ? `${item.duration_mins} mins`
                          : <span className="text-text-light">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 w-24">
                    {isE(item.id, 'comprehension') ? (
                      <select
                        autoFocus
                        className={SEL}
                        value={ec!.value}
                        onChange={e => {
                          const v = e.target.value
                          setEc(null)
                          updateImmersion.mutate({ id: item.id, comprehension: v ? parseInt(v) : null })
                        }}
                        onBlur={() => setEc(null)}
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <span
                        className="cursor-pointer"
                        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: 'comprehension', value: String(item.comprehension ?? '') }) }}
                      >
                        <CompBdg val={item.comprehension} />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 min-w-36">
                    <div className="truncate max-w-[144px]">{txt(item, 'notes')}</div>
                  </td>
                  <td className="relative w-10">
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      onClick={() => deleteImmersion.mutate(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            }
            <tr>
              <td colSpan={7} className="p-0">
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
