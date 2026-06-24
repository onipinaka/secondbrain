import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  useCourses, useAddCourse, useUpdateCourse, useDeleteCourse,
  type Course,
} from '../../../../hooks/useReading'

type Props = { workspaceId: string }

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-500' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-600' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-600' },
}

function EditCell({ value, onSave, type = 'text' }: { value: string; onSave: (v: string) => void; type?: 'text' | 'number' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  if (!editing) {
    return (
      <span
        className="cursor-text block px-1 py-0.5 rounded hover:bg-rose-bg/20 min-h-[1.5rem]"
        onClick={() => { setVal(value); setEditing(true) }}
      >
        {value || <span className="text-text-light text-xs">—</span>}
      </span>
    )
  }

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
      className="border border-rose rounded px-2 py-0.5 text-sm outline-none w-full bg-card"
    />
  )
}

export default function CoursesTab({ workspaceId: _workspaceId }: Props) {
  const { data: courses = [], isLoading } = useCourses()
  const addCourse = useAddCourse()
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()

  function update(id: string, patch: Partial<Course>) {
    updateCourse.mutate({ id, ...patch })
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      <div>
        <button
          onClick={() => addCourse.mutate({ name: 'New Course', status: 'not_started' })}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90"
        >
          <Plus size={13} /> Add Course
        </button>
      </div>

      <div className="bg-card rounded-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-rose-bg/20">
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Platform</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid w-16">Done</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid w-16">Total</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid w-40">Progress</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid w-12">Cert</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Notes</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-text-light text-xs">Loading...</td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-text-light text-xs">No courses yet. Click + to add.</td></tr>
            ) : (
              courses.map(c => {
                const pct = c.current_unit && c.total_units
                  ? Math.min(100, Math.round((c.current_unit / c.total_units) * 100))
                  : 0
                const statusCfg = STATUS_CFG[c.status ?? ''] ?? { label: c.status ?? '', color: 'bg-gray-100 text-gray-500' }

                return (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-rose-bg/10">
                    <td className="px-3 py-2 max-w-[180px]">
                      <EditCell value={c.name} onSave={v => update(c.id, { name: v })} />
                    </td>
                    <td className="px-3 py-2">
                      <EditCell value={c.platform ?? ''} onSave={v => update(c.id, { platform: v || null })} />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={c.status ?? 'not_started'}
                        onChange={e => update(c.id, { status: e.target.value })}
                        className={`text-xs px-2 py-0.5 rounded-full border-0 outline-none cursor-pointer ${statusCfg.color}`}
                      >
                        {Object.entries(STATUS_CFG).map(([v, cfg]) => (
                          <option key={v} value={v}>{cfg.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <EditCell
                        value={c.current_unit?.toString() ?? ''}
                        onSave={v => update(c.id, { current_unit: v ? Number(v) : null })}
                        type="number"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <EditCell
                        value={c.total_units?.toString() ?? ''}
                        onSave={v => update(c.id, { total_units: v ? Number(v) : null })}
                        type="number"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {c.total_units ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-border/40 rounded-full h-1.5">
                            <div className="bg-sage rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-text-light w-8 text-right">{pct}%</span>
                        </div>
                      ) : (
                        <span className="text-text-light text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!c.has_certificate}
                        onChange={e => update(c.id, { has_certificate: e.target.checked })}
                        className="accent-rose cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <EditCell value={c.notes ?? ''} onSave={v => update(c.id, { notes: v || null })} />
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => deleteCourse.mutate(c.id)} className="text-text-light hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
