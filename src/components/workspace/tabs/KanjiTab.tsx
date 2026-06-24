import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  useKanji, useAddKanji, useUpdateKanji, useDeleteKanji,
  type KanjiItem,
} from '../../../hooks/useLanguage'

type Props = { workspaceId: string }
type EC = { id: string; field: string; value: string }
type Opt = { value: string; label: string; cls: string }

const JLPT_OPTS: Opt[] = [
  { value: 'n5', label: 'N5', cls: 'bg-green-100 text-green-700' },
  { value: 'n4', label: 'N4', cls: 'bg-teal-100 text-teal-700' },
  { value: 'n3', label: 'N3', cls: 'bg-blue-100 text-blue-700' },
  { value: 'n2', label: 'N2', cls: 'bg-purple-100 text-purple-700' },
  { value: 'n1', label: 'N1', cls: 'bg-rose-light text-rose' },
]

function Bdg({ val, opts }: { val: string | null | undefined; opts: Opt[] }) {
  if (!val) return <span className="text-text-light text-xs">—</span>
  const o = opts.find(x => x.value === val)
  return o
    ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${o.cls}`}>{o.label}</span>
    : <span className="text-text-dark text-xs">{val}</span>
}

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'
const INPUT = 'w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none'
const SEL = 'bg-white border border-rose rounded px-1.5 py-1 text-xs outline-none'

export default function KanjiTab({ workspaceId: _workspaceId }: Props) {
  const [ec, setEc] = useState<EC | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newChar, setNewChar] = useState('')

  const { data: kanji = [], isLoading } = useKanji()
  const addKanji = useAddKanji()
  const updateKanji = useUpdateKanji()
  const deleteKanji = useDeleteKanji()

  function commit(id: string, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    updateKanji.mutate({ id, [field]: v || null } as any)
  }

  const isE = (id: string, f: string) => ec?.id === id && ec?.field === f

  function txt(item: KanjiItem, f: keyof KanjiItem) {
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

  function sel(item: KanjiItem, f: keyof KanjiItem, opts: Opt[]) {
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

  const total = kanji.length
  const masteredCount = kanji.filter(k => k.mastered).length

  function handleAdd() {
    if (!newChar.trim()) return
    addKanji.mutate({ character: newChar.trim() }, {
      onSuccess: () => { setNewChar(''); setShowAdd(false) },
    })
  }

  return (
    <div>
      {/* Stats */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-8 bg-rose-bg/10">
        {[['Total', total], ['Mastered', masteredCount]].map(([lbl, val]) => (
          <div key={lbl as string} className="text-center">
            <p className="text-lg font-display text-text-dark leading-tight">{val}</p>
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
          <Plus size={13} /> Add Kanji
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3 flex-wrap">
          <input
            autoFocus
            value={newChar}
            onChange={e => setNewChar(e.target.value)}
            placeholder="Character (e.g. 食) *"
            className="flex-1 min-w-32 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose font-display text-lg"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
          />
          <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">Add</button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">Cancel</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              <th className={`${TH} w-16`}>Char</th>
              <th className={`${TH} w-32`}>On Reading</th>
              <th className={`${TH} w-32`}>Kun Reading</th>
              <th className={`${TH} w-40`}>Meaning</th>
              <th className={`${TH} w-16 text-center`}>Strokes</th>
              <th className={`${TH} w-20`}>JLPT</th>
              <th className={`${TH} min-w-36`}>Examples</th>
              <th className={`${TH} w-20 text-center`}>Mastered</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : kanji.length === 0
              ? (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-text-light text-sm">No kanji yet.</td>
                </tr>
              )
              : kanji.map(item => (
                <tr key={item.id} className="border-b border-border hover:bg-rose-bg/20 group">
                  <td className="px-3 py-2 w-16">
                    {isE(item.id, 'character') ? (
                      <input
                        autoFocus
                        className="w-14 bg-white border border-rose rounded px-2 py-1 text-2xl font-display outline-none"
                        value={ec!.value}
                        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                        onBlur={() => commit(item.id, 'character')}
                        onKeyDown={e => { if (e.key === 'Enter') commit(item.id, 'character'); if (e.key === 'Escape') setEc(null) }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="cursor-text font-display text-2xl text-text-dark"
                        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: 'character', value: item.character }) }}
                      >
                        {item.character}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 w-32">{txt(item, 'on_reading')}</td>
                  <td className="px-3 py-2 w-32">{txt(item, 'kun_reading')}</td>
                  <td className="px-3 py-2 w-40">{txt(item, 'meaning')}</td>
                  <td className="px-3 py-2 w-16 text-center">
                    {isE(item.id, 'stroke_count') ? (
                      <input
                        autoFocus
                        type="number"
                        min={1}
                        className="w-14 bg-white border border-rose rounded px-2 py-1 text-xs outline-none"
                        value={ec!.value}
                        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                        onBlur={() => {
                          const v = ec?.value
                          setEc(null)
                          updateKanji.mutate({ id: item.id, stroke_count: v != null && v !== '' ? parseInt(v) : null })
                        }}
                        onKeyDown={e => { if (e.key === 'Escape') setEc(null) }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="cursor-text text-text-dark text-xs"
                        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: 'stroke_count', value: String(item.stroke_count ?? '') }) }}
                      >
                        {item.stroke_count ?? <span className="text-text-light">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 w-20">{sel(item, 'jlpt_level', JLPT_OPTS)}</td>
                  <td className="px-3 py-2 min-w-36">
                    <div className="truncate max-w-[144px]">{txt(item, 'example_words')}</div>
                  </td>
                  <td className="px-3 py-2 w-20 text-center">
                    <input
                      type="checkbox"
                      checked={item.mastered === true}
                      onChange={() => updateKanji.mutate({ id: item.id, mastered: !item.mastered })}
                      className="w-4 h-4 accent-rose cursor-pointer"
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td className="relative w-10">
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      onClick={() => deleteKanji.mutate(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            }
            <tr>
              <td colSpan={9} className="p-0">
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
