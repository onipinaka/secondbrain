import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft, GitBranch, ExternalLink, Plus, Trash2,
  List, LayoutGrid, GripVertical, CheckCircle2, X,
  Bug, Layers, BarChart3, FileText,
} from 'lucide-react'

import {
  useProject, useUpdateProject,
  useProjectFeatures, useAddProjectFeature, useUpdateProjectFeature, useDeleteProjectFeature,
  useProjectBugs, useAddProjectBug, useUpdateProjectBug, useDeleteProjectBug,
  type Project, type ProjectFeature, type ProjectBug,
} from '../hooks/useProjects'
import BlockEditor from '../components/shared/BlockEditor'
import RoadmapTab from '../components/workspace/tabs/RoadmapTab'
import DocumentsTab from '../components/workspace/tabs/DocumentsTab'
import { safeUrl } from '../lib/utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTS = [
  { value: 'ideation',   label: 'Ideation',   cls: 'bg-blue-100 text-blue-600' },
  { value: 'building',   label: 'Building',   cls: 'bg-amber-100 text-amber-700' },
  { value: 'testing',    label: 'Testing',    cls: 'bg-orange-100 text-orange-600' },
  { value: 'completed',  label: 'Completed',  cls: 'bg-green-100 text-green-700' },
  { value: 'dropped',    label: 'Dropped',    cls: 'bg-gray-100 text-gray-500' },
  { value: 'paused',     label: 'Paused',     cls: 'bg-gray-100 text-gray-500' },
]

const FEATURE_COLS = [
  { id: 'backlog',     label: 'Backlog' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'testing',     label: 'Testing' },
  { id: 'completed',   label: 'Done' },
]

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-600',
  high:     'bg-rose-bg text-rose',
  medium:   'bg-amber-100 text-amber-700',
  low:      'bg-green-100 text-green-600',
}

const PRIORITY_OPTS = ['critical', 'high', 'medium', 'low']

const BUG_PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-600',
  high:     'bg-rose-bg text-rose',
  medium:   'bg-amber-100 text-amber-700',
  low:      'bg-gray-100 text-gray-500',
}

const BUG_STATUS_BADGE: Record<string, string> = {
  open:       'bg-red-100 text-red-600',
  in_progress:'bg-blue-100 text-blue-600',
  fixed:      'bg-green-100 text-green-700',
  wont_fix:   'bg-gray-100 text-gray-500',
}

const DETAIL_TABS = ['Overview', 'Features', 'Bugs', 'Documents', 'User Feedback', 'Competitor Analysis', 'Pricing', 'Marketing', 'Roadmap']

const INPUT = 'w-full bg-card border border-rose rounded px-2 py-1 text-sm outline-none'
const SEL   = 'bg-card border border-rose rounded px-1.5 py-1 text-xs outline-none'
const TH    = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Bdg({ val, map }: { val: string | null | undefined; map: Record<string, string> }) {
  if (!val) return <span className="text-text-light text-xs">—</span>
  const cls = map[val] ?? 'bg-gray-100 text-gray-500'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${cls}`}>{val.replace(/_/g, ' ')}</span>
}

function ProjectIcon({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase()
  return (
    <div className="w-14 h-14 rounded-2xl bg-rose-bg flex items-center justify-center shrink-0 border border-rose/20">
      <span className="font-display text-2xl font-bold text-rose">{letter}</span>
    </div>
  )
}

// ─── Feature Edit Modal ───────────────────────────────────────────────────────

type FeatureModalState =
  | { open: false }
  | { open: true; id?: string; title: string; description: string; notes: string; priority: string; deadline: string }

function FeatureModal({
  state,
  onClose,
  onSave,
}: {
  state: FeatureModalState
  onClose: () => void
  onSave: (patch: { title: string; description: string | null; notes: string | null; priority: string | null; deadline: string | null }) => void
}) {
  if (!state.open) return null
  const [title, setTitle] = useState(state.title)
  const [desc, setDesc] = useState(state.description)
  const [notes, setNotes] = useState(state.notes)
  const [priority, setPriority] = useState(state.priority)
  const [deadline, setDeadline] = useState(state.deadline)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-text-dark">{state.id ? 'Edit Feature' : 'Add Feature'}</h3>
          <button onClick={onClose} className="text-text-light hover:text-text-dark"><X size={16} /></button>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-text-light uppercase tracking-wide">Title *</label>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Feature title"
            className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-transparent text-text-dark" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-text-light uppercase tracking-wide">Description</label>
          <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description..."
            className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-transparent text-text-dark resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-text-light uppercase tracking-wide">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-transparent text-text-dark">
              <option value="">None</option>
              {PRIORITY_OPTS.map(o => <option key={o} value={o} className="capitalize">{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-text-light uppercase tracking-wide">Deadline</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-transparent text-text-dark" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-text-light uppercase tracking-wide">Notes</label>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Implementation notes..."
            className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-transparent text-text-dark resize-none" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text-mid border border-border rounded-xl hover:bg-rose-bg/20">Cancel</button>
          <button
            onClick={() => onSave({ title: title.trim(), description: desc.trim() || null, notes: notes.trim() || null, priority: priority || null, deadline: deadline || null })}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm bg-rose text-white rounded-xl hover:opacity-90 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Features Kanban ─────────────────────────────────────────────────────────

function DraggableFeatureCard({
  feature,
  onDelete,
  onClick,
}: {
  feature: ProjectFeature
  onDelete: () => void
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(feature.id) })
  const style = transform ? { transform: CSS.Transform.toString(transform) } : undefined
  const isDone = feature.status === 'completed'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-xl p-3 group select-none flex flex-col gap-2 transition-all ${isDragging ? 'opacity-40 shadow-xl border-rose/40' : 'border-border hover:border-rose/30 hover:shadow-sm'}`}
    >
      <div className="flex items-start gap-2">
        {isDone && <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <p className="text-sm font-medium text-text-dark leading-snug">{feature.title}</p>
          {feature.description && (
            <p className="text-xs text-text-light mt-0.5 line-clamp-2">{feature.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400 p-0.5"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete() }}
          >
            <Trash2 size={11} />
          </button>
          <button
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing text-text-light hover:text-text-mid p-0.5"
            onPointerDown={e => e.stopPropagation()}
          >
            <GripVertical size={13} />
          </button>
        </div>
      </div>
      {feature.priority && (
        <div>
          <Bdg val={feature.priority} map={PRIORITY_BADGE} />
        </div>
      )}
    </div>
  )
}

function DroppableColumn({
  col,
  features,
  onAdd,
  onDelete,
  onEdit,
}: {
  col: { id: string; label: string }
  features: ProjectFeature[]
  onAdd: (status: string) => void
  onDelete: (f: ProjectFeature) => void
  onEdit: (f: ProjectFeature) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div className="flex flex-col min-w-[200px] flex-1">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-dark">{col.label}</span>
          <span className="text-[10px] text-text-light bg-border/60 rounded-full px-2 py-0.5 font-medium">{features.length}</span>
        </div>
        <button
          onClick={() => onAdd(col.id)}
          className="text-text-light hover:text-rose transition-colors p-0.5"
        >
          <Plus size={14} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] flex flex-col gap-2 p-2 rounded-xl border-2 transition-colors ${isOver ? 'border-rose/40 bg-rose-bg/20' : 'border-transparent bg-rose-bg/5'}`}
      >
        {features.map(f => (
          <DraggableFeatureCard
            key={f.id}
            feature={f}
            onDelete={() => onDelete(f)}
            onClick={() => onEdit(f)}
          />
        ))}
        <button
          onClick={() => onAdd(col.id)}
          className="flex items-center gap-1 text-text-light hover:text-rose text-xs py-1.5 px-2 rounded-lg hover:bg-rose-bg/30 transition-colors mt-1"
        >
          <Plus size={12} /> Add Feature
        </button>
      </div>
    </div>
  )
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function OverviewTab({ project, onSave }: { project: Project; onSave: (patch: Partial<Project>) => void }) {
  const [desc, setDesc] = useState(project.description ?? '')
  const [tagline, setTagline] = useState(project.tagline ?? '')
  const [tech, setTech] = useState((project.tech_stack ?? []).join(', '))
  const [startDate, setStartDate] = useState(project.start_date ?? '')
  const [targetDate, setTargetDate] = useState(project.target_date ?? '')
  const [notes, setNotes] = useState(project.notes ?? '')

  useEffect(() => {
    setDesc(project.description ?? '')
    setTagline(project.tagline ?? '')
    setTech((project.tech_stack ?? []).join(', '))
    setStartDate(project.start_date ?? '')
    setTargetDate(project.target_date ?? '')
    setNotes(project.notes ?? '')
  }, [project.id])

  return (
    <div className="p-6 max-w-2xl flex flex-col gap-5">
      <div>
        <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">Tagline</label>
        <input
          value={tagline}
          onChange={e => setTagline(e.target.value)}
          onBlur={() => onSave({ tagline: tagline.trim() || null })}
          placeholder="One-line summary of the project"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card"
        />
      </div>
      <div>
        <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">Description</label>
        <textarea
          rows={4}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onBlur={() => onSave({ description: desc.trim() || null })}
          placeholder="What is this project about?"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card resize-none"
        />
      </div>
      <div>
        <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">Tech Stack</label>
        <input
          value={tech}
          onChange={e => setTech(e.target.value)}
          onBlur={() => onSave({ tech_stack: tech ? tech.split(',').map(s => s.trim()).filter(Boolean) : null })}
          placeholder="React, TypeScript, Supabase, ..."
          className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card"
        />
        {tech && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tech.split(',').map(s => s.trim()).filter(Boolean).map(t => (
              <span key={t} className="inline-block px-2 py-0.5 rounded-full bg-rose-bg/60 text-text-mid text-[10px]">{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            onBlur={() => onSave({ start_date: startDate || null })}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card" />
        </div>
        <div>
          <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">Target Date</label>
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
            onBlur={() => onSave({ target_date: targetDate || null })}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card" />
        </div>
      </div>
      <div>
        <label className="block text-[10px] text-text-mid uppercase tracking-wide font-medium mb-1">Notes</label>
        <textarea
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => onSave({ notes: notes.trim() || null })}
          placeholder="General notes about the project..."
          className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card resize-none"
        />
      </div>
    </div>
  )
}

function FeaturesTab({ projectId }: { projectId: string }) {
  const [listView, setListView] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [featureModal, setFeatureModal] = useState<FeatureModalState>({ open: false })
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [ec, setEc] = useState<{ id: string; field: string; value: string } | null>(null)

  const { data: features = [] } = useProjectFeatures(projectId)
  const addFeature = useAddProjectFeature()
  const updateFeature = useUpdateProjectFeature()
  const deleteFeature = useDeleteProjectFeature()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string) }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const newStatus = over.id as string
    const feature = features.find(f => String(f.id) === String(active.id))
    if (!feature || feature.status === newStatus) return
    updateFeature.mutate({ id: String(feature.id), project_id: projectId, status: newStatus })
  }

  function openAdd(status: string) {
    setPendingStatus(status)
    setFeatureModal({ open: true, title: '', description: '', notes: '', priority: '', deadline: '' })
  }

  function openEdit(f: ProjectFeature) {
    setPendingStatus(null)
    setFeatureModal({
      open: true,
      id: String(f.id),
      title: f.title,
      description: f.description ?? '',
      notes: f.notes ?? '',
      priority: f.priority ?? '',
      deadline: f.deadline ?? '',
    })
  }

  function handleModalSave(patch: { title: string; description: string | null; notes: string | null; priority: string | null; deadline: string | null }) {
    if (!featureModal.open || !patch.title) return
    if (featureModal.id) {
      updateFeature.mutate({ id: featureModal.id, project_id: projectId, ...patch }, { onSuccess: () => setFeatureModal({ open: false }) })
    } else {
      const colFeatures = features.filter(f => (f.status ?? 'backlog') === (pendingStatus ?? 'backlog'))
      addFeature.mutate(
        { project_id: projectId, title: patch.title, description: patch.description, notes: patch.notes, priority: patch.priority, status: pendingStatus ?? 'backlog', sort_order: colFeatures.length },
        { onSuccess: () => { setFeatureModal({ open: false }); setPendingStatus(null) } },
      )
    }
  }

  const activeFeature = activeId ? features.find(f => String(f.id) === activeId) : null

  // List view helpers
  const isE = (id: string, f: string) => ec?.id === id && ec?.field === f

  function txt(feat: ProjectFeature, field: keyof ProjectFeature, bold = false) {
    const val = (feat[field] ?? '') as string
    return isE(String(feat.id), field as string) ? (
      <input autoFocus className={INPUT} value={ec!.value}
        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
        onBlur={() => { const v = ec?.value; setEc(null); updateFeature.mutate({ id: String(feat.id), project_id: projectId, [field]: v || null } as any) }}
        onKeyDown={e => { if (e.key === 'Enter') { const v = ec?.value; setEc(null); updateFeature.mutate({ id: String(feat.id), project_id: projectId, [field]: v || null } as any) } if (e.key === 'Escape') setEc(null) }}
      />
    ) : (
      <span className={`cursor-text ${bold ? 'font-medium text-text-dark text-sm' : 'text-text-dark text-xs'}`}
        onClick={() => setEc({ id: String(feat.id), field: field as string, value: val })}>
        {val || <span className="text-text-light text-xs">—</span>}
      </span>
    )
  }

  function selCell(feat: ProjectFeature, field: keyof ProjectFeature, opts: string[], map: Record<string, string>) {
    const val = (feat[field] ?? '') as string
    return isE(String(feat.id), field as string) ? (
      <select autoFocus className={SEL} value={ec!.value}
        onChange={e => { const v = e.target.value; setEc(null); updateFeature.mutate({ id: String(feat.id), project_id: projectId, [field]: v || null } as any) }}
        onBlur={() => setEc(null)}>
        <option value="">—</option>
        {opts.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    ) : (
      <span className="cursor-pointer" onClick={() => setEc({ id: String(feat.id), field: field as string, value: val })}>
        <Bdg val={val || null} map={map} />
      </span>
    )
  }

  const STATUS_MAP = { backlog: 'bg-gray-100 text-gray-500', in_progress: 'bg-blue-100 text-blue-600', testing: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700' }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-card flex-shrink-0">
        <span className="text-sm text-text-mid">{features.length} feature{features.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setListView(false)}
            className={`p-1.5 rounded ${!listView ? 'bg-rose text-white' : 'text-text-light hover:text-text-dark'}`} title="Kanban">
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setListView(true)}
            className={`p-1.5 rounded ${listView ? 'bg-rose text-white' : 'text-text-light hover:text-text-dark'}`} title="List">
            <List size={14} />
          </button>
        </div>
      </div>

      {listView ? (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-rose-bg/30 border-b border-border sticky top-0">
                <th className={`${TH} min-w-48`}>Title</th>
                <th className={`${TH} min-w-32`}>Description</th>
                <th className={`${TH} w-24`}>Priority</th>
                <th className={`${TH} w-28`}>Status</th>
                <th className={`${TH} min-w-32`}>Notes</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {features.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-text-light text-sm">No features yet.</td></tr>
              ) : features.map(f => (
                <tr key={f.id} className="border-b border-border hover:bg-rose-bg/20 group">
                  <td className="px-3 py-2.5">{txt(f, 'title', true)}</td>
                  <td className="px-3 py-2.5"><div className="truncate max-w-[160px]">{txt(f, 'description')}</div></td>
                  <td className="px-3 py-2.5">{selCell(f, 'priority', PRIORITY_OPTS, PRIORITY_BADGE)}</td>
                  <td className="px-3 py-2.5">{selCell(f, 'status', FEATURE_COLS.map(c => c.id), STATUS_MAP)}</td>
                  <td className="px-3 py-2.5"><div className="truncate max-w-[160px]">{txt(f, 'notes')}</div></td>
                  <td className="relative w-10">
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      onClick={() => deleteFeature.mutate({ id: String(f.id), project_id: projectId })}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} className="p-0">
                  <button className="w-full py-2 bg-rose-bg/30 hover:bg-rose-bg text-text-light hover:text-rose transition-colors flex items-center justify-center"
                    onClick={() => openAdd('backlog')}>
                    <Plus size={14} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-5">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-h-[360px]">
              {FEATURE_COLS.map(col => (
                <DroppableColumn
                  key={col.id}
                  col={col}
                  features={features.filter(f => (f.status ?? 'backlog') === col.id)}
                  onAdd={openAdd}
                  onDelete={f => deleteFeature.mutate({ id: String(f.id), project_id: projectId })}
                  onEdit={openEdit}
                />
              ))}
            </div>
            <DragOverlay>
              {activeFeature ? (
                <div className="bg-card border border-rose/60 rounded-xl p-3 shadow-xl cursor-grabbing w-52">
                  <p className="text-sm text-text-dark font-medium">{activeFeature.title}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      <FeatureModal state={featureModal} onClose={() => setFeatureModal({ open: false })} onSave={handleModalSave} />
    </div>
  )
}

function BugsTab({ projectId }: { projectId: string }) {
  const [ec, setEc] = useState<{ id: string; field: string; value: string } | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')

  const { data: bugs = [], isLoading } = useProjectBugs(projectId)
  const addBug = useAddProjectBug()
  const updateBug = useUpdateProjectBug()
  const deleteBug = useDeleteProjectBug()

  const isE = (id: string, f: string) => ec?.id === id && ec?.field === f

  function txt(bug: ProjectBug, field: keyof ProjectBug, bold = false) {
    const val = (bug[field] ?? '') as string
    return isE(String(bug.id), field as string) ? (
      <input autoFocus className={INPUT} value={ec!.value}
        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
        onBlur={() => { const v = ec?.value; setEc(null); updateBug.mutate({ id: String(bug.id), project_id: projectId, [field]: v || null } as any) }}
        onKeyDown={e => { if (e.key === 'Enter') { const v = ec?.value; setEc(null); updateBug.mutate({ id: String(bug.id), project_id: projectId, [field]: v || null } as any) } if (e.key === 'Escape') setEc(null) }}
        onClick={e => e.stopPropagation()}
      />
    ) : (
      <span className={`cursor-text ${bold ? 'font-medium text-text-dark text-sm' : 'text-text-dark text-xs'}`}
        onClick={e => { e.stopPropagation(); setEc({ id: String(bug.id), field: field as string, value: val }) }}>
        {val || <span className="text-text-light text-xs">—</span>}
      </span>
    )
  }

  function selCell(bug: ProjectBug, field: keyof ProjectBug, opts: string[], map: Record<string, string>) {
    const val = (bug[field] ?? '') as string
    return isE(String(bug.id), field as string) ? (
      <select autoFocus className={SEL} value={ec!.value}
        onChange={e => { const v = e.target.value; setEc(null); updateBug.mutate({ id: String(bug.id), project_id: projectId, [field]: v || null } as any) }}
        onBlur={() => setEc(null)} onClick={e => e.stopPropagation()}>
        <option value="">—</option>
        {opts.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    ) : (
      <span className="cursor-pointer" onClick={e => { e.stopPropagation(); setEc({ id: String(bug.id), field: field as string, value: val }) }}>
        <Bdg val={val || null} map={map} />
      </span>
    )
  }

  function handleAdd() {
    if (!newTitle.trim()) return
    addBug.mutate({ project_id: projectId, title: newTitle.trim(), priority: newPriority || null }, {
      onSuccess: () => { setNewTitle(''); setShowAdd(false) },
    })
  }

  return (
    <div>
      <div className="px-5 py-3 border-b border-border flex items-center justify-end bg-card">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90">
          <Plus size={13} /> Report Bug
        </button>
      </div>
      {showAdd && (
        <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3 flex-wrap">
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Bug title *"
            className="flex-1 min-w-48 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }} />
          <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose">
            {['critical', 'high', 'medium', 'low'].map(o => <option key={o} value={o} className="capitalize">{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
          <button onClick={handleAdd} disabled={!newTitle.trim()} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40">Add</button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">Cancel</button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/30 border-b border-border">
              <th className={`${TH} min-w-48`}>Title</th>
              <th className={`${TH} w-24`}>Priority</th>
              <th className={`${TH} w-28`}>Status</th>
              <th className={`${TH} min-w-40`}>Notes</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : bugs.length === 0
              ? <tr><td colSpan={5} className="px-3 py-12 text-center text-text-light text-sm">No bugs reported.</td></tr>
              : bugs.map(bug => (
                  <tr key={bug.id} className="border-b border-border hover:bg-rose-bg/20 group">
                    <td className="px-3 py-2.5 min-w-48">{txt(bug, 'title', true)}</td>
                    <td className="px-3 py-2.5 w-24">{selCell(bug, 'priority', ['critical', 'high', 'medium', 'low'], BUG_PRIORITY_BADGE)}</td>
                    <td className="px-3 py-2.5 w-28">{selCell(bug, 'status', ['open', 'in_progress', 'fixed', 'wont_fix'], BUG_STATUS_BADGE)}</td>
                    <td className="px-3 py-2.5 min-w-40"><div className="truncate max-w-[200px]">{txt(bug, 'notes')}</div></td>
                    <td className="relative w-10">
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                        onClick={() => deleteBug.mutate({ id: String(bug.id), project_id: projectId })}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
            }
            <tr>
              <td colSpan={5} className="p-0">
                <button className="w-full py-2 bg-rose-bg/30 hover:bg-rose-bg text-text-light hover:text-rose transition-colors flex items-center justify-center"
                  onClick={() => setShowAdd(true)}>
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

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ features }: { features: ProjectFeature[] }) {
  const total = features.length
  const completed = features.filter(f => f.status === 'completed').length
  const inProgress = features.filter(f => f.status === 'in_progress').length
  const planned = features.filter(f => f.status === 'backlog' || f.status === 'testing').length

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0

  const stats = [
    { icon: Layers,      label: 'Total Features', value: String(total),         sub: '',                    color: 'text-rose',     bg: 'bg-rose-bg' },
    { icon: CheckCircle2,label: 'Completed',       value: String(completed),     sub: `(${pct(completed)}%)`, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: BarChart3,   label: 'In Progress',     value: String(inProgress),    sub: `(${pct(inProgress)}%)`,color: 'text-blue-600',  bg: 'bg-blue-50' },
    { icon: FileText,    label: 'Planned',         value: String(planned),       sub: `(${pct(planned)}%)`,   color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="flex-shrink-0 border-t border-border bg-card px-6 py-3">
      <div className="flex items-center gap-8 flex-wrap">
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={15} className={s.color} />
            </div>
            <div>
              <p className="text-[10px] text-text-light font-medium">{s.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-base font-bold text-text-dark">{s.value}</span>
                {s.sub && <span className="text-[10px] text-text-light">{s.sub}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(
    (location.state as { tab?: string } | null)?.tab ?? 'Overview'
  )
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState('')

  const { data: project, isLoading } = useProject(projectId ?? '')
  const { data: features = [] } = useProjectFeatures(projectId ?? '')
  const updateProject = useUpdateProject()

  useEffect(() => {
    if (project) setNameVal(project.name)
  }, [project?.id])

  const save = useCallback((patch: Partial<Project>) => {
    if (!project) return
    updateProject.mutate({ id: String(project.id), ...patch })
  }, [project, updateProject])

  const completedCount = features.filter(f => f.status === 'completed').length
  const progressPct = features.length > 0 ? Math.round((completedCount / features.length) * 100) : 0

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col gap-4 animate-pulse">
        <div className="h-8 bg-rose-bg/40 rounded w-64" />
        <div className="h-4 bg-rose-bg/40 rounded w-96" />
        <div className="h-2 bg-rose-bg/40 rounded w-full mt-4" />
      </div>
    )
  }

  if (!project) {
    return <div className="p-8 text-text-light text-sm">Project not found.</div>
  }

  const statusOpt = STATUS_OPTS.find(o => o.value === project.status)

  function renderTab() {
    if (!project) return null
    switch (activeTab) {
      case 'Overview':
        return <OverviewTab project={project} onSave={save} />
      case 'Features':
        return <FeaturesTab projectId={String(project.id)} />
      case 'Bugs':
        return <BugsTab projectId={String(project.id)} />
      case 'Documents':
        return <DocumentsTab projectId={String(project.id)} />
      case 'Roadmap':
        return <RoadmapTab projectId={String(project.id)} />
      default: {
        const slug = activeTab.toLowerCase().replace(/\s+/g, '_')
        return (
          <div className="p-6">
            <BlockEditor
              entityType={`project_${slug}`}
              entityId={String(project.id)}
              workspaceId={String(project.id)}
              placeholder={`Start writing ${activeTab.toLowerCase()}...`}
            />
          </div>
        )
      }
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border bg-card flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-text-light hover:text-text-dark text-xs mb-4 transition-colors"
        >
          <ArrowLeft size={13} /> Back to Projects
        </button>

        <div className="flex items-start gap-4">
          <ProjectIcon name={project.name} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              {editingName ? (
                <input
                  autoFocus
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onBlur={() => { setEditingName(false); if (nameVal.trim()) save({ name: nameVal.trim() }) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { setEditingName(false); if (nameVal.trim()) save({ name: nameVal.trim() }) }
                    if (e.key === 'Escape') { setEditingName(false); setNameVal(project.name) }
                  }}
                  className="font-display text-2xl font-bold text-text-dark bg-transparent border-b-2 border-rose outline-none"
                />
              ) : (
                <h1
                  className="font-display text-2xl font-bold text-text-dark cursor-text hover:text-rose/80 transition-colors"
                  onClick={() => { setNameVal(project.name); setEditingName(true) }}
                >
                  {project.name}
                </h1>
              )}

              <select
                value={project.status ?? ''}
                onChange={e => save({ status: e.target.value || null })}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border border-current/20 outline-none cursor-pointer ${statusOpt?.cls ?? 'bg-gray-100 text-gray-500'}`}
              >
                <option value="">No status</option>
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {project.tagline && (
              <p className="text-text-mid text-sm mt-0.5">{project.tagline}</p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-text-light flex-wrap">
              <button
                onClick={() => {
                  const url = prompt('GitHub URL:', project.github_link ?? '')
                  if (url !== null) save({ github_link: url || null })
                }}
                className={`flex items-center gap-1 hover:text-text-dark transition-colors ${!project.github_link ? 'opacity-40' : ''}`}
              >
                <GitBranch size={12} />
                {project.github_link ? (
                  <a href={safeUrl(project.github_link)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:underline">
                    GitHub
                  </a>
                ) : 'Add GitHub'}
              </button>

              <button
                onClick={() => {
                  const url = prompt('Live URL:', project.deployed_link ?? '')
                  if (url !== null) save({ deployed_link: url || null })
                }}
                className={`flex items-center gap-1 hover:text-text-dark transition-colors ${!project.deployed_link ? 'opacity-40' : ''}`}
              >
                <ExternalLink size={12} />
                {project.deployed_link ? (
                  <a href={safeUrl(project.deployed_link)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:underline">
                    Live App
                  </a>
                ) : 'Add Live URL'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[10px] text-text-light uppercase tracking-wide font-medium shrink-0">Overall Progress</span>
          <div className="flex-1 h-2 bg-rose/15 rounded-full overflow-hidden">
            <div className="h-full bg-rose rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-sm font-semibold text-text-dark shrink-0">{progressPct}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card flex-shrink-0 overflow-x-auto">
        <div className="flex px-6 gap-0">
          {DETAIL_TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === t ? 'border-rose text-rose font-medium' : 'border-transparent text-text-mid hover:text-text-dark'}`}
            >
              {t === 'Bugs' ? (
                <span className="flex items-center gap-1.5"><Bug size={13} />{t}</span>
              ) : t === 'Documents' ? (
                <span className="flex items-center gap-1.5"><FileText size={13} />{t}</span>
              ) : t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto min-h-0">
        {renderTab()}
      </div>

      {/* Bottom stats */}
      <StatsBar features={features} />
    </div>
  )
}
