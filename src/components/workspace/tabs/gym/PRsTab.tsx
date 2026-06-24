import { localDateStr } from '../../../../lib/utils'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  usePRTrackers, useAddPRTracker, useUpdatePRTracker, useDeletePRTracker,
  type PRTracker,
} from '../../../../hooks/useGym'

type Props = { workspaceId: string }

function today() { return localDateStr() }

function EditCell({
  value,
  onSave,
  type = 'text',
}: {
  value: string
  onSave: (v: string) => void
  type?: 'text' | 'date'
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => { onSave(val); setEditing(false) }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(val); setEditing(false) }
          if (e.key === 'Escape') { setVal(value); setEditing(false) }
        }}
        className="w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none"
      />
    )
  }

  return (
    <span
      className="cursor-text hover:bg-rose-bg/30 rounded px-1 -mx-1 transition-colors"
      onClick={() => { setVal(value); setEditing(true) }}
    >
      {value || '—'}
    </span>
  )
}

export default function PRsTab({ workspaceId: _workspaceId }: Props) {
  const { data: prs = [], isLoading } = usePRTrackers()
  const addPR = useAddPRTracker()
  const updatePR = useUpdatePRTracker()
  const deletePR = useDeletePRTracker()

  function handleNewPR(pr: PRTracker) {
    const newMax = prompt(`New PR for ${pr.exercise_name}?\nEnter new max (e.g. "100kg", "5x5@80kg"):`, pr.current_max ?? '')
    if (newMax === null) return
    updatePR.mutate({ id: pr.id, current_max: newMax.trim(), date_achieved: today() })
    toast.success('🏆 New PR!')
  }

  if (isLoading) {
    return (
      <div className="p-5">
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <div className="animate-pulse p-4 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-rose-bg/40 rounded" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5">
      <div className="bg-card rounded-card border border-border overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              {['Exercise', 'Current Max', 'Date Achieved', 'Goal', 'Notes', ''].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-text-mid font-medium text-xs uppercase tracking-wide">
                  {h}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {prs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-text-light text-sm">
                  No PRs tracked yet. Click + to add one.
                </td>
              </tr>
            )}
            {prs.map((pr, i) => (
              <tr key={pr.id} className="border-b border-border hover:bg-rose-bg/20 transition-colors group">
                <td className="px-3 py-2 text-text-dark font-medium">
                  <EditCell
                    value={pr.exercise_name}
                    onSave={v => updatePR.mutate({ id: pr.id, exercise_name: v })}
                  />
                </td>
                <td className="px-3 py-2 text-text-dark">
                  <EditCell
                    value={pr.current_max ?? ''}
                    onSave={v => updatePR.mutate({ id: pr.id, current_max: v })}
                  />
                </td>
                <td className="px-3 py-2 text-text-dark">
                  <EditCell
                    type="date"
                    value={pr.date_achieved ?? ''}
                    onSave={v => updatePR.mutate({ id: pr.id, date_achieved: v })}
                  />
                </td>
                <td className="px-3 py-2 text-text-dark">
                  <EditCell
                    value={pr.goal ?? ''}
                    onSave={v => updatePR.mutate({ id: pr.id, goal: v })}
                  />
                </td>
                <td className="px-3 py-2 text-text-dark">
                  <EditCell
                    value={pr.notes ?? ''}
                    onSave={v => updatePR.mutate({ id: pr.id, notes: v })}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleNewPR(pr)}
                    className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors whitespace-nowrap"
                  >
                    🏆 New PR!
                  </button>
                </td>
                <td className="relative w-10">
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                    onClick={() => deletePR.mutate(prs[i].id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={7} className="p-0">
                <button
                  className="w-full py-2 bg-rose-bg/30 hover:bg-rose-bg text-text-light hover:text-rose transition-colors flex items-center justify-center"
                  onClick={() => addPR.mutate({ exercise_name: 'New Exercise' })}
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
