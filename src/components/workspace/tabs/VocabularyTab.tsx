import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  useVocabulary, useAddVocab, useUpdateVocab, useDeleteVocab,
  type VocabularyItem,
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

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'
const INPUT = 'w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none'
const SEL = 'bg-white border border-rose rounded px-1.5 py-1 text-xs outline-none'

export default function VocabularyTab({ workspaceId: _workspaceId }: Props) {
  const [ec, setEc] = useState<EC | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [jlptFilter, setJlptFilter] = useState('')
  const [masteredFilter, setMasteredFilter] = useState<'all' | 'mastered' | 'not'>('all')

  const { data: vocab = [], isLoading } = useVocabulary()
  const addVocab = useAddVocab()
  const updateVocab = useUpdateVocab()
  const deleteVocab = useDeleteVocab()

  function commit(id: string, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    updateVocab.mutate({ id, [field]: v || null } as any)
  }

  const isE = (id: string, f: string) => ec?.id === id && ec?.field === f

  function txt(item: VocabularyItem, f: keyof VocabularyItem, large = false) {
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
        className={`cursor-text ${large ? 'font-display text-base text-text-dark' : 'text-text-dark text-xs'}`}
        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: f as string, value: val }) }}
      >
        {val || <span className="text-text-light">—</span>}
      </span>
    )
  }

  function sel(item: VocabularyItem, f: keyof VocabularyItem, opts: Opt[]) {
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

  // Stats (full unfiltered data)
  const total = vocab.length
  const masteredCount = vocab.filter(v => v.mastered).length
  const n5 = vocab.filter(v => v.jlpt_level === 'n5').length
  const n4 = vocab.filter(v => v.jlpt_level === 'n4').length
  const n3 = vocab.filter(v => v.jlpt_level === 'n3').length

  const filtered = vocab.filter(v =>
    (!jlptFilter || v.jlpt_level === jlptFilter) &&
    (masteredFilter === 'all' ||
      (masteredFilter === 'mastered' ? v.mastered === true : v.mastered !== true))
  )

  function handleAdd() {
    if (!newWord.trim()) return
    addVocab.mutate({ word: newWord.trim() }, {
      onSuccess: () => { setNewWord(''); setShowAdd(false) },
    })
  }

  return (
    <div>
      {/* Stats strip */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-8 bg-rose-bg/10">
        {[['Total', total], ['Mastered', masteredCount], ['N5', n5], ['N4', n4], ['N3', n3]].map(([lbl, val]) => (
          <div key={lbl as string} className="text-center">
            <p className="text-lg font-display text-text-dark leading-tight">{val}</p>
            <p className="text-[10px] text-text-light uppercase tracking-wide">{lbl}</p>
          </div>
        ))}
      </div>

      {/* Filter + Add toolbar */}
      <div className="px-5 py-2.5 border-b border-border flex items-center gap-2 flex-wrap bg-card">
        <span className="text-[10px] text-text-light uppercase tracking-wide">JLPT:</span>
        {['', 'n5', 'n4', 'n3', 'n2', 'n1'].map(lvl => (
          <button
            key={lvl}
            onClick={() => setJlptFilter(lvl)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${jlptFilter === lvl ? 'bg-rose text-white border-rose' : 'bg-card border-border text-text-mid hover:border-rose hover:text-rose'}`}
          >
            {lvl === '' ? 'All' : lvl.toUpperCase()}
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-1" />
        {(['all', 'not', 'mastered'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMasteredFilter(m)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${masteredFilter === m ? 'bg-rose text-white border-rose' : 'bg-card border-border text-text-mid hover:border-rose hover:text-rose'}`}
          >
            {m === 'all' ? 'All' : m === 'mastered' ? 'Mastered' : 'Not Mastered'}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={13} /> Add Word
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3 flex-wrap">
          <input
            autoFocus
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            placeholder="Word (e.g. 食べる) *"
            className="flex-1 min-w-48 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
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
              <th className={`${TH} w-28`}>Word</th>
              <th className={`${TH} w-24`}>Reading</th>
              <th className={`${TH} w-24`}>Romaji</th>
              <th className={`${TH} w-40`}>Meaning</th>
              <th className={`${TH} min-w-40`}>Example</th>
              <th className={`${TH} w-20`}>JLPT</th>
              <th className={`${TH} w-20 text-center`}>Mastered</th>
              <th className={`${TH} w-16`}>SRS</th>
              <th className={`${TH} w-24`}>Reviewed</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-text-light text-sm">
                    {vocab.length === 0 ? 'No words yet.' : 'No words match current filters.'}
                  </td>
                </tr>
              )
              : filtered.map(item => (
                <tr key={item.id} className="border-b border-border hover:bg-rose-bg/20 group">
                  <td className="px-3 py-2 w-28">{txt(item, 'word', true)}</td>
                  <td className="px-3 py-2 w-24">{txt(item, 'reading')}</td>
                  <td className="px-3 py-2 w-24">{txt(item, 'romaji')}</td>
                  <td className="px-3 py-2 w-40">{txt(item, 'meaning')}</td>
                  <td className="px-3 py-2 min-w-40">
                    <div className="truncate max-w-[180px]">{txt(item, 'example_sentence')}</div>
                  </td>
                  <td className="px-3 py-2 w-20">{sel(item, 'jlpt_level', JLPT_OPTS)}</td>
                  <td className="px-3 py-2 w-20 text-center">
                    <input
                      type="checkbox"
                      checked={item.mastered === true}
                      onChange={() => updateVocab.mutate({ id: item.id, mastered: !item.mastered })}
                      className="w-4 h-4 accent-rose cursor-pointer"
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-3 py-2 w-16">
                    {isE(item.id, 'srs_level') ? (
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        max={5}
                        className="w-14 bg-white border border-rose rounded px-2 py-1 text-xs outline-none"
                        value={ec!.value}
                        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                        onBlur={() => {
                          const v = ec?.value
                          setEc(null)
                          updateVocab.mutate({ id: item.id, srs_level: v != null && v !== '' ? parseInt(v) : null })
                        }}
                        onKeyDown={e => { if (e.key === 'Escape') setEc(null) }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="cursor-text text-text-dark text-xs"
                        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: 'srs_level', value: String(item.srs_level ?? '') }) }}
                      >
                        {item.srs_level != null
                          ? <span className="inline-block px-2 py-0.5 rounded bg-rose-bg text-rose text-[10px]">SRS {item.srs_level}</span>
                          : <span className="text-text-light">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 w-24">
                    {isE(item.id, 'last_reviewed') ? (
                      <input
                        autoFocus
                        type="date"
                        className="bg-white border border-rose rounded px-2 py-1 text-xs outline-none"
                        value={ec!.value}
                        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                        onBlur={() => commit(item.id, 'last_reviewed')}
                        onKeyDown={e => { if (e.key === 'Escape') setEc(null) }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="cursor-text text-text-dark text-xs"
                        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: 'last_reviewed', value: item.last_reviewed ?? '' }) }}
                      >
                        {fmtDate(item.last_reviewed) ?? <span className="text-text-light">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="relative w-10">
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      onClick={() => deleteVocab.mutate(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            }
            <tr>
              <td colSpan={10} className="p-0">
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
