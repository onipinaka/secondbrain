import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronUp, ChevronDown, Check, Pencil, X, FileText } from 'lucide-react'
import {
  useRoadmapPhases, useAddRoadmapPhase, useUpdateRoadmapPhase, useDeleteRoadmapPhase,
  type RoadmapPhase,
} from '../../../hooks/useProjects'

type Props = { projectId: string }

const STATUS_OPTS = [
  { value: 'planned',     label: 'Planned',     dot: 'bg-gray-300',    text: 'text-gray-500',   ring: 'border-gray-300' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-blue-500',    text: 'text-blue-600',   ring: 'border-blue-400' },
  { value: 'completed',   label: 'Completed',   dot: 'bg-green-500',   text: 'text-green-600',  ring: 'border-green-400' },
  { value: 'skipped',     label: 'Skipped',     dot: 'bg-gray-200',    text: 'text-gray-400',   ring: 'border-gray-200' },
]

function getStatus(v: string) {
  return STATUS_OPTS.find(o => o.value === v) ?? STATUS_OPTS[0]
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

type EditState = {
  title: string
  description: string
  status: string
  target_date: string
}

function PhaseCard({
  phase,
  index,
  total,
  projectId,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdate,
}: {
  phase: RoadmapPhase
  index: number
  total: number
  projectId: string
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onUpdate: (patch: Partial<RoadmapPhase>) => void
}) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditState>({
    title: phase.title,
    description: phase.description ?? '',
    status: phase.status,
    target_date: phase.target_date ?? '',
  })

  const st = getStatus(phase.status)
  const isCompleted = phase.status === 'completed'
  const isSkipped = phase.status === 'skipped'

  function save() {
    onUpdate({
      title: form.title.trim() || phase.title,
      description: form.description.trim() || null,
      status: form.status,
      target_date: form.target_date || null,
    })
    setEditing(false)
  }

  function startEdit() {
    setForm({
      title: phase.title,
      description: phase.description ?? '',
      status: phase.status,
      target_date: phase.target_date ?? '',
    })
    setEditing(true)
  }

  return (
    <div className="flex gap-4 group">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-card transition-colors ${st.ring} ${isCompleted ? 'bg-green-50' : isSkipped ? 'opacity-40' : ''}`}>
          {isCompleted ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <span className={`text-xs font-bold ${st.text} ${isSkipped ? 'line-through' : ''}`}>{index + 1}</span>
          )}
        </div>
        {index < total - 1 && (
          <div className={`w-0.5 flex-1 min-h-[24px] mt-1 ${isCompleted ? 'bg-green-300' : 'bg-border'}`} />
        )}
      </div>

      {/* Card body */}
      <div className={`flex-1 mb-6 bg-card border rounded-xl p-4 transition-all ${isSkipped ? 'opacity-50' : 'border-border hover:border-rose/20 hover:shadow-sm'}`}>
        {editing ? (
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Phase title"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-rose bg-transparent text-text-dark"
            />
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe what this phase involves..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-transparent text-text-dark resize-none"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-text-light uppercase tracking-wide font-semibold">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-rose bg-card text-text-dark"
                >
                  {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-text-light uppercase tracking-wide font-semibold">Target Date</label>
                <input
                  type="date"
                  value={form.target_date}
                  onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))}
                  className="border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-rose bg-card text-text-dark"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setEditing(false)} className="text-xs text-text-mid px-3 py-1.5 rounded-lg border border-border hover:bg-rose-bg/20">
                Cancel
              </button>
              <button onClick={save} disabled={!form.title.trim()} className="text-xs bg-rose text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-40">
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className={`font-display text-base font-semibold text-text-dark leading-tight ${isSkipped ? 'line-through text-text-light' : ''}`}>
                    {phase.title}
                  </h3>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 border ${st.ring} ${st.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {getStatus(phase.status).label}
                  </span>
                  {phase.target_date && (
                    <span className="text-[10px] text-text-light">
                      Target: {fmtDate(phase.target_date)}
                    </span>
                  )}
                </div>
                {phase.description && (
                  <p className="text-text-mid text-sm leading-relaxed whitespace-pre-wrap">{phase.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => navigate(`/projects/${projectId}/phase/${phase.id}/notes`)}
                  className="flex items-center gap-1 p-1 px-2 text-text-light hover:text-rose text-[10px] font-medium transition-colors border border-transparent hover:border-rose/30 rounded-lg"
                  title="Phase notes"
                >
                  <FileText size={12} /> Notes
                </button>
                <button
                  onClick={onMoveUp}
                  disabled={index === 0}
                  className="p-1 text-text-light hover:text-text-dark disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={onMoveDown}
                  disabled={index === total - 1}
                  className="p-1 text-text-light hover:text-text-dark disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <ChevronDown size={14} />
                </button>
                <button onClick={startEdit} className="p-1 text-text-light hover:text-rose transition-colors" title="Edit">
                  <Pencil size={13} />
                </button>
                <button onClick={onDelete} className="p-1 text-text-light hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function RoadmapTab({ projectId }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newStatus, setNewStatus] = useState('planned')
  const [newDate, setNewDate] = useState('')

  const { data: phases = [], isLoading } = useRoadmapPhases(projectId)
  const addPhase = useAddRoadmapPhase()
  const updatePhase = useUpdateRoadmapPhase()
  const deletePhase = useDeleteRoadmapPhase()

  function handleAdd() {
    if (!newTitle.trim()) return
    addPhase.mutate(
      {
        project_id: projectId,
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        status: newStatus,
        target_date: newDate || null,
        sort_order: phases.length,
      },
      {
        onSuccess: () => {
          setNewTitle('')
          setNewDesc('')
          setNewStatus('planned')
          setNewDate('')
          setShowAdd(false)
        },
      },
    )
  }

  function movePhase(index: number, dir: -1 | 1) {
    const a = phases[index]
    const b = phases[index + dir]
    if (!a || !b) return
    updatePhase.mutate({ id: String(a.id), project_id: projectId, sort_order: b.sort_order })
    updatePhase.mutate({ id: String(b.id), project_id: projectId, sort_order: a.sort_order })
  }

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-rose-bg/40 shrink-0" />
            <div className="flex-1 h-24 bg-rose-bg/20 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-base font-semibold text-text-dark">Project Roadmap</h2>
          <p className="text-text-light text-xs mt-0.5">{phases.length} phase{phases.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90 font-medium"
        >
          <Plus size={13} /> Add Phase
        </button>
      </div>

      {/* Timeline */}
      {phases.length === 0 && !showAdd ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <p className="text-text-light text-sm mb-3">No phases yet. Start building your roadmap.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90 mx-auto"
          >
            <Plus size={13} /> Add First Phase
          </button>
        </div>
      ) : (
        <div>
          {phases.map((phase, i) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              index={i}
              total={phases.length}
              projectId={projectId}
              onMoveUp={() => movePhase(i, -1)}
              onMoveDown={() => movePhase(i, 1)}
              onDelete={() => deletePhase.mutate({ id: String(phase.id), project_id: projectId })}
              onUpdate={patch => updatePhase.mutate({ id: String(phase.id), project_id: projectId, ...patch })}
            />
          ))}
        </div>
      )}

      {/* Add phase form */}
      {showAdd && (
        <div className="border-2 border-dashed border-rose/30 rounded-xl p-5 bg-rose-bg/10 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-rose/40 flex items-center justify-center bg-card">
                <span className="text-xs font-bold text-rose">{phases.length + 1}</span>
              </div>
              <span className="text-sm font-medium text-text-dark">New Phase</span>
            </div>
            <button onClick={() => setShowAdd(false)} className="text-text-light hover:text-text-dark">
              <X size={15} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Phase title *"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-rose bg-card text-text-dark"
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
            />
            <textarea
              rows={3}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Describe what this phase involves..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card text-text-dark resize-none"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-text-light uppercase tracking-wide font-semibold">Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-rose bg-card text-text-dark"
                >
                  {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-text-light uppercase tracking-wide font-semibold">Target Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-rose bg-card text-text-dark"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-1.5 rounded-lg border border-border hover:bg-rose-bg/20">
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim() || addPhase.isPending}
                className="text-xs bg-rose text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-40"
              >
                Add Phase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
