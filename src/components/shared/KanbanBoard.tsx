import { useState, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Calendar } from 'lucide-react'
import type { Task, Workspace } from '../../hooks/useTasks'

export const KANBAN_COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'completed', label: 'Completed' },
]

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-600',
  low: 'bg-green-100 text-green-600',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function fmtDate(ds: string) {
  return new Date(ds + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Sortable Card ───────────────────────────────────────────────────────────

function SortableCard({
  task,
  workspaceName,
  onSchedule,
  onEdit,
}: {
  task: Task
  workspaceName: string | null
  onSchedule: (task: Task) => void
  onEdit: (task: Task) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-card rounded-card border border-border p-3 mb-2 cursor-default select-none ${isDragging ? 'opacity-30 shadow-lg' : ''}`}
      onClick={() => { if (!isDragging) onEdit(task) }}
    >
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-text-light hover:text-rose cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <GripVertical size={13} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-text-dark text-sm font-medium leading-snug">{task.title}</p>
          {workspaceName && (
            <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded bg-rose-bg text-rose">
              {workspaceName}
            </span>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.due_date && (
              <span className="text-text-light text-[11px]">{fmtDate(task.due_date)}</span>
            )}
            {task.priority && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[task.priority] ?? ''}`}
              >
                {PRIORITY_LABEL[task.priority]}
              </span>
            )}
          </div>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-text-light hover:text-rose"
          onClick={e => { e.stopPropagation(); onSchedule(task) }}
          title="Schedule"
          onMouseDown={e => e.stopPropagation()}
        >
          <Calendar size={13} />
        </button>
      </div>
    </div>
  )
}

// Ghost card used in DragOverlay
function GhostCard({ task, workspaceName }: { task: Task; workspaceName: string | null }) {
  return (
    <div className="bg-card rounded-card border border-rose shadow-lg p-3 w-[220px] opacity-95 rotate-1">
      <p className="text-text-dark text-sm font-medium leading-snug">{task.title}</p>
      {workspaceName && (
        <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-rose-bg text-rose">
          {workspaceName}
        </span>
      )}
    </div>
  )
}

// ─── Column ──────────────────────────────────────────────────────────────────

function Column({
  col,
  tasks,
  workspaceMap,
  onSchedule,
  onEdit,
  onOpenAddModal,
}: {
  col: (typeof KANBAN_COLUMNS)[number]
  tasks: Task[]
  workspaceMap: Map<string, string>
  onSchedule: (task: Task) => void
  onEdit: (task: Task) => void
  onOpenAddModal: (status: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div className="flex-1 min-w-[200px]">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-text-dark text-sm font-semibold">{col.label}</span>
        <span className="bg-rose-bg text-rose rounded-full px-2 py-0.5 text-xs font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Cards area */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`min-h-[400px] rounded-card transition-colors ${isOver ? 'bg-rose-bg/50' : ''}`}
        >
          {tasks.map(task => (
            <SortableCard
              key={task.id}
              task={task}
              workspaceName={task.workspace_id ? (workspaceMap.get(task.workspace_id) ?? null) : null}
              onSchedule={onSchedule}
              onEdit={onEdit}
            />
          ))}

          {/* Add task button — opens full modal pre-set to this column's status */}
          <button
            className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-light hover:text-rose hover:bg-rose-bg transition-colors mt-1"
            onClick={() => onOpenAddModal(col.id)}
          >
            <Plus size={13} />
            New Task
          </button>
        </div>
      </SortableContext>
    </div>
  )
}

// ─── KanbanBoard ─────────────────────────────────────────────────────────────

export interface KanbanBoardProps {
  tasks: Task[]
  workspaces: Workspace[]
  onStatusChange: (taskId: string, newStatus: string) => void
  onOpenAddModal: (status: string) => void
  onSchedule: (task: Task) => void
  onEdit: (task: Task) => void
}

export default function KanbanBoard({
  tasks,
  workspaces,
  onStatusChange,
  onOpenAddModal,
  onSchedule,
  onEdit,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const targetColRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const workspaceMap = new Map(workspaces.map(w => [w.id, w.name]))
  const colIds = KANBAN_COLUMNS.map(c => c.id)

  const tasksByStatus = Object.fromEntries(
    KANBAN_COLUMNS.map(col => [
      col.id,
      tasks.filter(t => {
        const s = t.status === 'skipped' ? 'backlog' : (t.status ?? 'backlog')
        return s === col.id
      }),
    ]),
  )
  const activeTask = activeId ? tasks.find(t => t.id === activeId) ?? null : null

  function resolveCol(overId: string): string | null {
    if (colIds.includes(overId)) return overId
    for (const col of KANBAN_COLUMNS) {
      if (tasksByStatus[col.id]?.some(t => t.id === overId)) return col.id
    }
    return null
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
    targetColRef.current = null
  }

  function handleDragOver(event: DragOverEvent) {
    targetColRef.current = event.over ? resolveCol(event.over.id as string) : null
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const col = targetColRef.current ?? (event.over ? resolveCol(event.over.id as string) : null)
    targetColRef.current = null
    if (!col) return
    const activeTaskItem = tasks.find(t => t.id === event.active.id)
    if (!activeTaskItem) return
    const currentStatus = activeTaskItem.status ?? 'backlog'
    if (currentStatus !== col) {
      onStatusChange(event.active.id as string, col)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4">
        {KANBAN_COLUMNS.map(col => (
          <Column
            key={col.id}
            col={col}
            tasks={tasksByStatus[col.id] ?? []}
            workspaceMap={workspaceMap}
            onSchedule={onSchedule}
            onEdit={onEdit}
            onOpenAddModal={onOpenAddModal}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <GhostCard
            task={activeTask}
            workspaceName={
              activeTask.workspace_id ? (workspaceMap.get(activeTask.workspace_id) ?? null) : null
            }
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
