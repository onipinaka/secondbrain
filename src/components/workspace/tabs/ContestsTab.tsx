import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  useContests, useAddContest, useUpdateContest, useDeleteContest,
  type ContestEntry,
} from '../../../hooks/useCP'

type Props = { workspaceId: string }
type EC = { id: string; field: string; value: string }
type Opt = { value: string; label: string; cls: string }

const PLATFORM_OPTS: Opt[] = [
  { value: 'codeforces', label: 'Codeforces', cls: 'bg-red-100 text-red-600' },
  { value: 'atcoder', label: 'AtCoder', cls: 'bg-blue-100 text-blue-600' },
  { value: 'hackerrank', label: 'HackerRank', cls: 'bg-green-100 text-green-700' },
  { value: 'leetcode', label: 'LeetCode', cls: 'bg-amber-100 text-amber-700' },
  { value: 'codechef', label: 'CodeChef', cls: 'bg-orange-100 text-orange-700' },
  { value: 'other', label: 'Other', cls: 'bg-gray-100 text-gray-500' },
]

function Bdg({ val, opts }: { val: string | null | undefined; opts: Opt[] }) {
  if (!val) return <span className="text-text-light text-xs">—</span>
  const o = opts.find(x => x.value === val)
  return o
    ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${o.cls}`}>{o.label}</span>
    : <span className="text-text-dark text-xs">{val}</span>
}

function fmtDate(d: string | null) {
  if (!d) return <span className="text-text-light text-xs">—</span>
  return <span className="text-xs text-text-dark">{new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
}

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'
const INPUT = 'w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none'
const SEL = 'bg-white border border-rose rounded px-1.5 py-1 text-xs outline-none'

export default function ContestsTab({ workspaceId: _workspaceId }: Props) {
  const [ec, setEc] = useState<EC | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPlatform, setNewPlatform] = useState('codeforces')

  const { data: contests = [], isLoading } = useContests()
  const addContest = useAddContest()
  const updateContest = useUpdateContest()
  const deleteContest = useDeleteContest()

  function commit(id: string, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    updateContest.mutate({ id, [field]: v || null } as any)
  }

  const isE = (id: string, f: string) => ec?.id === id && ec?.field === f

  function txt(item: ContestEntry, f: keyof ContestEntry) {
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

  function sel(item: ContestEntry, f: keyof ContestEntry, opts: Opt[]) {
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

  function numCell(item: ContestEntry, f: keyof ContestEntry) {
    const val = item[f] as number | null
    return isE(item.id, f as string) ? (
      <input
        autoFocus
        type="number"
        className="w-20 bg-white border border-rose rounded px-2 py-1 text-xs outline-none"
        value={ec!.value}
        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
        onBlur={() => {
          const v = ec?.value
          setEc(null)
          updateContest.mutate({ id: item.id, [f]: v != null && v !== '' ? parseInt(v) : null } as any)
        }}
        onKeyDown={e => { if (e.key === 'Escape') setEc(null) }}
        onClick={e => e.stopPropagation()}
      />
    ) : (
      <span
        className="cursor-text text-text-dark text-xs"
        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: f as string, value: String(val ?? '') }) }}
      >
        {val ?? <span className="text-text-light">—</span>}
      </span>
    )
  }

  const stats = useMemo(() => {
    const participated = contests.filter(c => c.participated).length
    const ranks = contests.filter(c => c.rank != null).map(c => c.rank!)
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null
    const changes = contests
      .filter(c => c.rating_before != null && c.rating_after != null)
      .map(c => c.rating_after! - c.rating_before!)
    const avgChange = changes.length > 0 ? Math.round(changes.reduce((a, b) => a + b, 0) / changes.length) : null
    return { total: contests.length, participated, bestRank, avgChange }
  }, [contests])

  function handleAdd() {
    if (!newName.trim()) return
    addContest.mutate(
      { name: newName.trim(), platform: newPlatform },
      { onSuccess: () => { setNewName(''); setShowAdd(false) } },
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-8 bg-rose-bg/10 flex-wrap">
        {[
          ['Total', stats.total],
          ['Participated', stats.participated],
          ['Best Rank', stats.bestRank ?? '—'],
          ['Avg Δ Rating', stats.avgChange != null ? (stats.avgChange >= 0 ? `+${stats.avgChange}` : String(stats.avgChange)) : '—'],
        ].map(([lbl, val]) => (
          <div key={lbl as string} className="text-center">
            <p className={`text-lg font-display leading-tight ${lbl === 'Avg Δ Rating' && stats.avgChange != null ? (stats.avgChange >= 0 ? 'text-green-600' : 'text-red-500') : 'text-text-dark'}`}>{val}</p>
            <p className="text-[10px] text-text-light uppercase tracking-wide">{lbl}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-end bg-card">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={13} /> Add Contest
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3 flex-wrap">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Contest name *"
            className="flex-1 min-w-48 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
          />
          <select
            value={newPlatform}
            onChange={e => setNewPlatform(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          >
            {PLATFORM_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">Add</button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">Cancel</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              <th className={`${TH} w-28`}>Platform</th>
              <th className={`${TH} min-w-48`}>Name</th>
              <th className={`${TH} w-28`}>Date</th>
              <th className={`${TH} w-24`}>Duration</th>
              <th className={`${TH} w-20 text-center`}>Reg.</th>
              <th className={`${TH} w-20 text-center`}>Part.</th>
              <th className={`${TH} w-20 text-center`}>Rank</th>
              <th className={`${TH} w-20`}>Solved</th>
              <th className={`${TH} w-20`}>Rating ↑</th>
              <th className={`${TH} w-20`}>Rating ↓</th>
              <th className={`${TH} w-20`}>Δ</th>
              <th className={`${TH} min-w-32`}>Notes</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 13 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : contests.length === 0
              ? (
                <tr>
                  <td colSpan={13} className="px-3 py-10 text-center text-text-light text-sm">No contests yet.</td>
                </tr>
              )
              : contests.map(item => {
                  const change = item.rating_after != null && item.rating_before != null
                    ? item.rating_after - item.rating_before
                    : null
                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-rose-bg/20 group">
                      <td className="px-3 py-2 w-28">{sel(item, 'platform', PLATFORM_OPTS)}</td>
                      <td className="px-3 py-2 min-w-48">
                        <span className="font-medium text-text-dark text-sm">
                          {isE(item.id, 'name') ? (
                            <input
                              autoFocus
                              className={INPUT}
                              value={ec!.value}
                              onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                              onBlur={() => commit(item.id, 'name')}
                              onKeyDown={e => { if (e.key === 'Enter') commit(item.id, 'name'); if (e.key === 'Escape') setEc(null) }}
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <span
                              className="cursor-text"
                              onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: 'name', value: item.name }) }}
                            >
                              {item.name}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2 w-28">
                        {isE(item.id, 'contest_date') ? (
                          <input
                            autoFocus
                            type="date"
                            className="bg-white border border-rose rounded px-2 py-1 text-xs outline-none"
                            value={ec!.value}
                            onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                            onBlur={() => commit(item.id, 'contest_date')}
                            onKeyDown={e => { if (e.key === 'Escape') setEc(null) }}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            className="cursor-text"
                            onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: 'contest_date', value: item.contest_date ?? '' }) }}
                          >
                            {fmtDate(item.contest_date)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 w-24">{txt(item, 'duration')}</td>
                      <td className="px-3 py-2 w-20 text-center">
                        <input
                          type="checkbox"
                          checked={item.registered === true}
                          onChange={() => updateContest.mutate({ id: item.id, registered: !item.registered })}
                          className="w-4 h-4 accent-rose cursor-pointer"
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-3 py-2 w-20 text-center">
                        <input
                          type="checkbox"
                          checked={item.participated === true}
                          onChange={() => updateContest.mutate({ id: item.id, participated: !item.participated })}
                          className="w-4 h-4 accent-rose cursor-pointer"
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-3 py-2 w-20 text-center">{numCell(item, 'rank')}</td>
                      <td className="px-3 py-2 w-20">{numCell(item, 'problems_solved')}</td>
                      <td className="px-3 py-2 w-20">{numCell(item, 'rating_before')}</td>
                      <td className="px-3 py-2 w-20">{numCell(item, 'rating_after')}</td>
                      <td className="px-3 py-2 w-20">
                        {change != null
                          ? <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>{change >= 0 ? `+${change}` : change}</span>
                          : <span className="text-text-light text-xs">—</span>}
                      </td>
                      <td className="px-3 py-2 min-w-32">
                        <div className="truncate max-w-[128px]">{txt(item, 'notes')}</div>
                      </td>
                      <td className="relative w-10">
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                          onClick={() => deleteContest.mutate(item.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
            }
            <tr>
              <td colSpan={13} className="p-0">
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
