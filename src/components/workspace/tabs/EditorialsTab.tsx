import { localDateStr } from '../../../lib/utils'
import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import {
  useEditorials, useAddEditorial, useUpdateEditorial, useDeleteEditorial,
  type EditorialEntry,
} from '../../../hooks/useCP'

type Props = { workspaceId: string }
type EC = { id: string; field: string; value: string }

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function today() {
  return localDateStr()
}

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'
const INPUT = 'w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none'
const TEXTAREA = 'w-full bg-white border border-rose rounded px-3 py-2 text-sm outline-none resize-none'

export default function EditorialsTab({ workspaceId: _workspaceId }: Props) {
  const [ec, setEc] = useState<EC | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newProblem, setNewProblem] = useState('')
  const [panel, setPanel] = useState<EditorialEntry | null>(null)
  const [panelVals, setPanelVals] = useState<Partial<EditorialEntry>>({})

  const { data: editorials = [], isLoading } = useEditorials()
  const addEditorial = useAddEditorial()
  const updateEditorial = useUpdateEditorial()
  const deleteEditorial = useDeleteEditorial()

  function commit(id: string, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    updateEditorial.mutate({ id, [field]: v || null } as any)
  }

  const isE = (id: string, f: string) => ec?.id === id && ec?.field === f

  function txt(item: EditorialEntry, f: keyof EditorialEntry, bold = false) {
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
        className={`cursor-text ${bold ? 'font-medium text-text-dark text-sm' : 'text-text-dark text-xs'}`}
        onClick={e => { e.stopPropagation(); setEc({ id: item.id, field: f as string, value: val }) }}
      >
        {val || <span className="text-text-light text-xs">—</span>}
      </span>
    )
  }

  function handleAdd() {
    if (!newProblem.trim()) return
    addEditorial.mutate(
      { problem_name: newProblem.trim(), date_reviewed: today() },
      { onSuccess: () => { setNewProblem(''); setShowAdd(false) } },
    )
  }

  function openPanel(item: EditorialEntry) {
    setPanel(item)
    setPanelVals({
      problem_name: item.problem_name,
      contest_name: item.contest_name ?? '',
      what_went_wrong: item.what_went_wrong ?? '',
      correct_approach: item.correct_approach ?? '',
      date_reviewed: item.date_reviewed ?? today(),
    })
  }

  function savePanel() {
    if (!panel) return
    updateEditorial.mutate({
      id: panel.id,
      problem_name: panelVals.problem_name || panel.problem_name,
      contest_name: panelVals.contest_name || null,
      what_went_wrong: panelVals.what_went_wrong || null,
      correct_approach: panelVals.correct_approach || null,
      date_reviewed: panelVals.date_reviewed || null,
    })
    setPanel(p => p ? { ...p, ...panelVals } as EditorialEntry : null)
  }

  return (
    <div className="flex h-full">
      <div className={`flex-1 min-w-0 overflow-x-auto ${panel ? 'border-r border-border' : ''}`}>
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-end bg-rose-bg/10">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
          >
            <Plus size={13} /> Add Editorial
          </button>
        </div>

        {showAdd && (
          <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3 flex-wrap">
            <input
              autoFocus
              value={newProblem}
              onChange={e => setNewProblem(e.target.value)}
              placeholder="Problem name *"
              className="flex-1 min-w-48 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
            />
            <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">Add</button>
            <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">Cancel</button>
          </div>
        )}

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              <th className={`${TH} min-w-48`}>Problem</th>
              <th className={`${TH} min-w-32`}>Contest</th>
              <th className={`${TH} min-w-48`}>What Went Wrong</th>
              <th className={`${TH} min-w-48`}>Correct Approach</th>
              <th className={`${TH} w-28`}>Reviewed</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : editorials.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-text-light text-sm">No editorials yet.</td>
                </tr>
              )
              : editorials.map(item => (
                <tr
                  key={item.id}
                  className={`border-b border-border hover:bg-rose-bg/20 group cursor-pointer ${panel?.id === item.id ? 'bg-rose-bg/30' : ''}`}
                  onClick={() => openPanel(item)}
                >
                  <td className="px-3 py-2.5 min-w-48">{txt(item, 'problem_name', true)}</td>
                  <td className="px-3 py-2.5 min-w-32">{txt(item, 'contest_name')}</td>
                  <td className="px-3 py-2.5 min-w-48">
                    <div className="truncate max-w-[192px] text-xs text-text-dark">
                      {item.what_went_wrong || <span className="text-text-light">—</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 min-w-48">
                    <div className="truncate max-w-[192px] text-xs text-text-dark">
                      {item.correct_approach || <span className="text-text-light">—</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 w-28 text-xs text-text-mid">{fmtDate(item.date_reviewed)}</td>
                  <td className="relative w-10">
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      onClick={e => { e.stopPropagation(); deleteEditorial.mutate(item.id); if (panel?.id === item.id) setPanel(null) }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            }
            <tr>
              <td colSpan={6} className="p-0">
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

      {/* Detail panel */}
      {panel && (
        <div className="w-[480px] flex-shrink-0 flex flex-col bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-rose-bg/10">
            <h3 className="font-display text-base text-text-dark truncate flex-1 mr-2">{panel.problem_name}</h3>
            <button onClick={() => setPanel(null)} className="text-text-light hover:text-text-dark flex-shrink-0">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            <div>
              <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">Problem Name</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card font-medium text-text-dark"
                value={panelVals.problem_name ?? ''}
                onChange={e => setPanelVals(p => ({ ...p, problem_name: e.target.value }))}
                onBlur={savePanel}
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">Contest</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card"
                value={panelVals.contest_name ?? ''}
                onChange={e => setPanelVals(p => ({ ...p, contest_name: e.target.value }))}
                onBlur={savePanel}
                placeholder="Contest name"
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">Date Reviewed</label>
              <input
                type="date"
                className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card"
                value={panelVals.date_reviewed ?? ''}
                onChange={e => setPanelVals(p => ({ ...p, date_reviewed: e.target.value }))}
                onBlur={savePanel}
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">What Went Wrong</label>
              <textarea
                rows={5}
                className={TEXTAREA}
                value={panelVals.what_went_wrong ?? ''}
                onChange={e => setPanelVals(p => ({ ...p, what_went_wrong: e.target.value }))}
                onBlur={savePanel}
                placeholder="Describe what you missed or did wrong..."
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">Correct Approach</label>
              <textarea
                rows={6}
                className={TEXTAREA}
                value={panelVals.correct_approach ?? ''}
                onChange={e => setPanelVals(p => ({ ...p, correct_approach: e.target.value }))}
                onBlur={savePanel}
                placeholder="Explain the correct approach or algorithm..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
