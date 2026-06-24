import { localDateStr } from '../lib/utils'
import { useState } from 'react'
import {
  CheckSquare, Bell, Lightbulb, Link2, StickyNote, Plus, Shield,
  ExternalLink, Heart, X,
} from 'lucide-react'
import { useWorkspaces } from '../hooks/useTasks'
import {
  useQcTasks, useAddQcTask, useUpdateQcTask, useDeleteQcTask,
  useQcReminders, useAddQcReminder, useUpdateQcReminder, useDeleteQcReminder,
  useQcTimeBlocks, useAddQcTimeBlock, useUpdateQcTimeBlock, useDeleteQcTimeBlock,
  useQcIdeas, useAddQcIdea, useUpdateQcIdea, useDeleteQcIdea,
  useQcLinks, useAddQcLink, useDeleteQcLink,
  useQcNotes, useAddQcNote, useDeleteQcNote,
} from '../hooks/useQuickCapture'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ds: string | null) {
  if (!ds) return '—'
  const d = new Date(ds + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'short' })
}

function fmtTime(t: string | null) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function WsBadge({ name }: { name: string | undefined | null }) {
  if (!name) return <span className="text-text-light text-xs">—</span>
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-bg text-rose border border-rose-light">
      {name}
    </span>
  )
}

// ─── section shell ─────────────────────────────────────────────────────────────

function Section({
  icon, title, onAdd, addLabel, children,
}: {
  icon: React.ReactNode
  title: string
  onAdd: () => void
  addLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-card rounded-card border border-border flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-rose-bg flex items-center justify-center text-rose">
            {icon}
          </span>
          <h2 className="font-display text-base font-semibold text-text-dark">{title}</h2>
        </div>
        <button
          onClick={onAdd}
          className="w-5 h-5 rounded-full bg-rose-bg hover:bg-rose-light flex items-center justify-center text-rose transition-colors"
        >
          <Plus size={11} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
      <div className="px-4 py-2 border-t border-border/50">
        <button
          onClick={onAdd}
          className="text-xs text-rose hover:text-rose-mid flex items-center gap-1 transition-colors"
        >
          <Plus size={12} />
          {addLabel}
        </button>
      </div>
    </div>
  )
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-rose-bg/40 border-b border-border">
        {cols.map(c => (
          <th key={c} className="px-3 py-2 text-left text-[10px] uppercase tracking-wide text-text-mid font-medium whitespace-nowrap">
            {c}
          </th>
        ))}
        <th className="w-8" />
      </tr>
    </thead>
  )
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400 p-1"
    >
      <X size={11} />
    </button>
  )
}

function EditCell({
  value, onSave, type = 'text', className,
}: {
  value: string | null
  onSave: (v: string) => void
  type?: 'text' | 'date' | 'time'
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        className="w-full bg-white border border-rose rounded px-1.5 py-0.5 text-xs outline-none"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setEditing(false) }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(draft); setEditing(false) }
          if (e.key === 'Escape') setEditing(false)
        }}
      />
    )
  }

  const display = type === 'date' ? fmtDate(value) : type === 'time' ? fmtTime(value) : (value ?? '—')
  return (
    <span
      onClick={() => { setDraft(value ?? ''); setEditing(true) }}
      className={`cursor-text text-xs text-text-dark hover:text-rose transition-colors ${className ?? ''}`}
    >
      {display || '—'}
    </span>
  )
}

// ─── SUDDEN TASKS ─────────────────────────────────────────────────────────────

function SuddenTasksSection({ workspaces }: { workspaces: { id: number; name: string }[] }) {
  const { data = [], isLoading } = useQcTasks()
  const addTask = useAddQcTask()
  const updateTask = useUpdateQcTask()
  const deleteTask = useDeleteQcTask()
  const wsMap = new Map(workspaces.map(w => [w.id, w.name]))

  const pending = data.filter(r => !r.is_done)

  function addNew() {
    addTask.mutate({ task: 'New task', due_date: null, due_time: null, workspace_id: null, is_done: false })
  }

  return (
    <Section icon={<CheckSquare size={13} />} title="Sudden Tasks" onAdd={addNew} addLabel="Add Task">
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-4 bg-rose-bg/40 rounded animate-pulse" />)}
        </div>
      ) : (
        <table className="w-full border-collapse text-xs">
          <THead cols={['Task', 'Due Date', 'Due Time', 'Workspace', 'Done']} />
          <tbody>
            {pending.map(row => (
              <tr key={row.id} className="border-b border-border group hover:bg-rose-bg/20 transition-colors">
                <td className="px-3 py-2">
                  <EditCell
                    value={row.task}
                    onSave={v => updateTask.mutate({ id: row.id, task: v })}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <EditCell
                    value={row.due_date}
                    type="date"
                    onSave={v => updateTask.mutate({ id: row.id, due_date: v || null })}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <EditCell
                    value={row.due_time}
                    type="time"
                    onSave={v => updateTask.mutate({ id: row.id, due_time: v || null })}
                  />
                </td>
                <td className="px-3 py-2">
                  <WsBadge name={row.workspace_id ? wsMap.get(row.workspace_id) : null} />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={row.is_done}
                    onChange={e => updateTask.mutate({ id: row.id, is_done: e.target.checked })}
                    className="w-3.5 h-3.5 accent-rose cursor-pointer"
                  />
                </td>
                <td className="px-1">
                  <DeleteBtn onClick={() => deleteTask.mutate(row.id)} />
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-text-light text-xs">No pending tasks</td></tr>
            )}
          </tbody>
        </table>
      )}
    </Section>
  )
}

// ─── REMINDERS ────────────────────────────────────────────────────────────────

function RemindersSection() {
  const { data = [], isLoading } = useQcReminders()
  const addReminder = useAddQcReminder()
  const updateReminder = useUpdateQcReminder()
  const deleteReminder = useDeleteQcReminder()

  function addNew() {
    addReminder.mutate({ title: 'New reminder', date: localDateStr(), time: null, is_all_day: false, person: null, notes: null })
  }

  return (
    <Section icon={<Bell size={13} />} title="Reminders" onAdd={addNew} addLabel="Add Reminder">
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-4 bg-rose-bg/40 rounded animate-pulse" />)}
        </div>
      ) : (
        <table className="w-full border-collapse text-xs">
          <THead cols={['Reminder', 'Date', 'Time', 'Person', 'Notes']} />
          <tbody>
            {data.map(row => (
              <tr key={row.id} className="border-b border-border group hover:bg-rose-bg/20 transition-colors">
                <td className="px-3 py-2">
                  <EditCell value={row.title} onSave={v => updateReminder.mutate({ id: row.id, title: v })} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <EditCell value={row.date} type="date" onSave={v => updateReminder.mutate({ id: row.id, date: v || null })} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <EditCell value={row.time} type="time" onSave={v => updateReminder.mutate({ id: row.id, time: v || null })} />
                </td>
                <td className="px-3 py-2">
                  <EditCell value={row.person} onSave={v => updateReminder.mutate({ id: row.id, person: v || null })} />
                </td>
                <td className="px-3 py-2">
                  <EditCell value={row.notes} onSave={v => updateReminder.mutate({ id: row.id, notes: v || null })} />
                </td>
                <td className="px-1">
                  <DeleteBtn onClick={() => deleteReminder.mutate(row.id)} />
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-text-light text-xs">No reminders yet</td></tr>
            )}
          </tbody>
        </table>
      )}
    </Section>
  )
}

// ─── TIME BLOCKS ──────────────────────────────────────────────────────────────

const RECURRENCE_OPTS = ['daily', 'weekly', 'once']

function TimeBlocksSection() {
  const { data = [], isLoading } = useQcTimeBlocks()
  const addBlock = useAddQcTimeBlock()
  const updateBlock = useUpdateQcTimeBlock()
  const deleteBlock = useDeleteQcTimeBlock()

  function addNew() {
    addBlock.mutate({
      name: 'New block', recurrence: 'once', weekdays: null,
      specific_date: null, start_time: '09:00', end_time: '10:00',
      type: 'hard', notes: null, is_active: true,
    })
  }

  return (
    <Section icon={<Shield size={13} />} title="Time Blocks to Protect" onAdd={addNew} addLabel="Add Time Block">
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-4 bg-rose-bg/40 rounded animate-pulse" />)}
        </div>
      ) : (
        <table className="w-full border-collapse text-xs">
          <THead cols={['Name', 'Recurrence', 'Start', 'End', 'Type']} />
          <tbody>
            {data.map(row => (
              <tr key={row.id} className="border-b border-border group hover:bg-rose-bg/10 transition-colors bg-rose-bg/20">
                <td className="px-3 py-2">
                  <EditCell value={row.name} onSave={v => updateBlock.mutate({ id: row.id, name: v })} />
                </td>
                <td className="px-3 py-2">
                  <select
                    className="border-none bg-transparent text-xs outline-none cursor-pointer"
                    value={row.recurrence}
                    onChange={e => updateBlock.mutate({ id: row.id, recurrence: e.target.value })}
                  >
                    {RECURRENCE_OPTS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <EditCell value={row.start_time} type="time" onSave={v => updateBlock.mutate({ id: row.id, start_time: v || null })} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <EditCell value={row.end_time} type="time" onSave={v => updateBlock.mutate({ id: row.id, end_time: v || null })} />
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${row.type === 'hard' ? 'bg-rose text-white' : 'bg-rose-bg text-rose'}`}>
                    {row.type ?? 'hard'}
                  </span>
                </td>
                <td className="px-1">
                  <DeleteBtn onClick={() => deleteBlock.mutate(row.id)} />
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-text-light text-xs">No time blocks yet — protect your deep work!</td></tr>
            )}
          </tbody>
        </table>
      )}
    </Section>
  )
}

// ─── IDEAS ────────────────────────────────────────────────────────────────────

const IDEA_CATS = ['business', 'tech', 'personal', 'education', 'other']

function IdeasSection() {
  const { data = [], isLoading } = useQcIdeas()
  const addIdea = useAddQcIdea()
  const updateIdea = useUpdateQcIdea()
  const deleteIdea = useDeleteQcIdea()

  const unsorted = data.filter(r => !r.is_sorted)

  function addNew() {
    addIdea.mutate({ idea: 'New idea', category: null, is_sorted: false, sorted_to_workspace_id: null })
  }

  return (
    <div className="relative">
      <Section icon={<Lightbulb size={13} />} title="Random Ideas" onAdd={addNew} addLabel="Add Idea">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-4 bg-rose-bg/40 rounded animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <THead cols={['Idea', 'Category', 'Sorted']} />
            <tbody>
              {unsorted.map(row => (
                <tr key={row.id} className="border-b border-border group hover:bg-rose-bg/20 transition-colors">
                  <td className="px-3 py-2 max-w-[180px]">
                    <EditCell value={row.idea} onSave={v => updateIdea.mutate({ id: row.id, idea: v })} />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="border-none bg-transparent text-xs outline-none cursor-pointer"
                      value={row.category ?? ''}
                      onChange={e => updateIdea.mutate({ id: row.id, category: e.target.value || null })}
                    >
                      <option value="">—</option>
                      {IDEA_CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.is_sorted}
                      onChange={e => updateIdea.mutate({ id: row.id, is_sorted: e.target.checked })}
                      className="w-3.5 h-3.5 accent-rose cursor-pointer"
                    />
                  </td>
                  <td className="px-1">
                    <DeleteBtn onClick={() => deleteIdea.mutate(row.id)} />
                  </td>
                </tr>
              ))}
              {unsorted.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-text-light text-xs">No ideas yet — let them flow!</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  )
}

// ─── LINKS ────────────────────────────────────────────────────────────────────

function LinksSection() {
  const { data = [], isLoading } = useQcLinks()
  const addLink = useAddQcLink()
  const deleteLink = useDeleteQcLink()
  const [form, setForm] = useState({ title: '', url: '', tags: '' })
  const [adding, setAdding] = useState(false)

  function handleAdd() {
    if (!form.url.trim()) return
    addLink.mutate({
      title: form.title || null,
      url: form.url,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
    })
    setForm({ title: '', url: '', tags: '' })
    setAdding(false)
  }

  function getFavicon(url: string) {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=16` } catch { return null }
  }

  function getDomain(url: string) {
    try { return new URL(url).hostname } catch { return url.slice(0, 20) }
  }

  return (
    <Section icon={<Link2 size={13} />} title="Links to Check Later" onAdd={() => setAdding(true)} addLabel="Add Link">
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-4 bg-rose-bg/40 rounded animate-pulse" />)}
        </div>
      ) : (
        <>
          {adding && (
            <div className="p-3 border-b border-border space-y-2">
              <input className="w-full border border-border rounded px-2 py-1 text-xs outline-none focus:border-rose bg-white" placeholder="Title (optional)" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              <input className="w-full border border-border rounded px-2 py-1 text-xs outline-none focus:border-rose bg-white" placeholder="URL *" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
              <input className="w-full border border-border rounded px-2 py-1 text-xs outline-none focus:border-rose bg-white" placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-3 py-1 bg-rose text-white rounded text-xs hover:bg-rose-mid">Save</button>
                <button onClick={() => setAdding(false)} className="px-3 py-1 border border-border rounded text-xs text-text-mid">Cancel</button>
              </div>
            </div>
          )}
          <table className="w-full border-collapse text-xs">
            <THead cols={['Title', 'URL', 'Tags']} />
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-b border-border group hover:bg-rose-bg/20 transition-colors">
                  <td className="px-3 py-2 text-xs text-text-dark">{row.title || '—'}</td>
                  <td className="px-3 py-2">
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-rose hover:underline">
                      {getFavicon(row.url) && <img src={getFavicon(row.url)!} alt="" width={12} height={12} className="rounded-sm" />}
                      {getDomain(row.url)}
                      <ExternalLink size={9} />
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(row.tags ?? []).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-rose-bg text-text-mid text-[10px]">{tag}</span>
                      ))}
                      {!row.tags?.length && <span className="text-text-light">—</span>}
                    </div>
                  </td>
                  <td className="px-1">
                    <DeleteBtn onClick={() => deleteLink.mutate(row.id)} />
                  </td>
                </tr>
              ))}
              {data.length === 0 && !adding && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-text-light text-xs">No links saved yet</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </Section>
  )
}

// ─── QUICK NOTES ──────────────────────────────────────────────────────────────

function QuickNotesSection() {
  const { data = [], isLoading } = useQcNotes()
  const addNote = useAddQcNote()
  const deleteNote = useDeleteQcNote()
  const [draft, setDraft] = useState('')

  function handleAdd() {
    if (!draft.trim()) return
    addNote.mutate(draft.trim())
    setDraft('')
  }

  return (
    <Section icon={<StickyNote size={13} />} title="Quick Notes" onAdd={handleAdd} addLabel="Add Note">
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2].map(i => <div key={i} className="h-4 bg-rose-bg/40 rounded animate-pulse" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-8 px-4">
          <div className="bg-rose-bg/50 border border-rose-light/40 rounded-xl px-6 py-5 text-center max-w-[220px]">
            <p className="font-display italic text-sm text-text-mid leading-relaxed">
              "Capture your thoughts, organize your mind, create your future."
            </p>
            <Heart size={14} className="text-rose mx-auto mt-2" />
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {data.map(note => (
            <div key={note.id} className="group flex items-start gap-2 bg-rose-bg/30 rounded-lg px-3 py-2 border border-border/50">
              <p className="flex-1 text-xs text-text-dark leading-relaxed">{note.content}</p>
              <button
                onClick={() => deleteNote.mutate(note.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400 shrink-0"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="px-3 pb-2">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-rose bg-white"
            placeholder="Jot a quick note..."
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          />
          <button
            onClick={handleAdd}
            disabled={!draft.trim()}
            className="px-2.5 py-1.5 bg-rose text-white rounded-lg text-xs disabled:opacity-40 hover:bg-rose-mid transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </Section>
  )
}

// ─── ADD MODAL ────────────────────────────────────────────────────────────────

type ModalType = 'task' | 'reminder' | 'idea' | 'link' | 'time_block'

function AddModal({
  defaultType, workspaces, onClose,
}: {
  defaultType: ModalType
  workspaces: { id: number; name: string }[]
  onClose: () => void
}) {
  const [type, setType] = useState<ModalType>(defaultType)
  const [form, setForm] = useState({
    task: '', title: '', idea: '', url: '', tags: '', content: '',
    due_date: '', due_time: '', date: '', time: '', start_time: '', end_time: '',
    person: '', notes: '', category: '', workspace_id: '', recurrence: 'once',
  })

  const addTask = useAddQcTask()
  const addReminder = useAddQcReminder()
  const addIdea = useAddQcIdea()
  const addLink = useAddQcLink()
  const addBlock = useAddQcTimeBlock()

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-white'
  const labelCls = 'text-xs text-text-mid block mb-1'

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (type === 'task') {
      if (!form.task.trim()) return
      addTask.mutate({
        task: form.task, due_date: form.due_date || null, due_time: form.due_time || null,
        workspace_id: form.workspace_id ? Number(form.workspace_id) : null, is_done: false,
      })
    } else if (type === 'reminder') {
      if (!form.title.trim()) return
      addReminder.mutate({
        title: form.title, date: form.date || null, time: form.time || null,
        is_all_day: false, person: form.person || null, notes: form.notes || null,
      })
    } else if (type === 'idea') {
      if (!form.idea.trim()) return
      addIdea.mutate({ idea: form.idea, category: form.category || null, is_sorted: false, sorted_to_workspace_id: null })
    } else if (type === 'link') {
      if (!form.url.trim()) return
      addLink.mutate({
        title: form.title || null, url: form.url,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      })
    } else if (type === 'time_block') {
      if (!form.title.trim()) return
      addBlock.mutate({
        name: form.title, recurrence: form.recurrence, weekdays: null,
        specific_date: form.date || null, start_time: form.start_time || '09:00',
        end_time: form.end_time || '10:00', type: 'hard', notes: form.notes || null, is_active: true,
      })
    }
    onClose()
  }

  const MODAL_TYPES: { id: ModalType; label: string }[] = [
    { id: 'task', label: 'Task' },
    { id: 'reminder', label: 'Reminder' },
    { id: 'idea', label: 'Idea' },
    { id: 'link', label: 'Link' },
    { id: 'time_block', label: 'Time Block' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card rounded-card border border-border shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold text-text-dark">Quick Capture</h2>
          <button onClick={onClose} className="text-text-light hover:text-text-mid"><X size={18} /></button>
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {MODAL_TYPES.map(mt => (
            <button key={mt.id} type="button" onClick={() => setType(mt.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${type === mt.id ? 'bg-rose text-white' : 'bg-rose-bg text-text-mid hover:bg-rose-light'}`}>
              {mt.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {type === 'task' && <>
            <div><label className={labelCls}>Task *</label><input autoFocus className={inputCls} placeholder="What needs to be done?" value={form.task} onChange={e => set('task', e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Due Date</label><input type="date" className={inputCls} value={form.due_date} onChange={e => set('due_date', e.target.value)} /></div>
              <div><label className={labelCls}>Due Time</label><input type="time" className={inputCls} value={form.due_time} onChange={e => set('due_time', e.target.value)} /></div>
            </div>
            <div><label className={labelCls}>Workspace</label>
              <select className={inputCls} value={form.workspace_id} onChange={e => set('workspace_id', e.target.value)}>
                <option value="">None</option>
                {workspaces.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
              </select>
            </div>
          </>}
          {type === 'reminder' && <>
            <div><label className={labelCls}>Reminder *</label><input autoFocus className={inputCls} placeholder="What to remember?" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Date</label><input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} /></div>
              <div><label className={labelCls}>Time</label><input type="time" className={inputCls} value={form.time} onChange={e => set('time', e.target.value)} /></div>
            </div>
            <div><label className={labelCls}>Person Involved</label><input className={inputCls} placeholder="Who?" value={form.person} onChange={e => set('person', e.target.value)} /></div>
            <div><label className={labelCls}>Notes</label><input className={inputCls} placeholder="Extra context..." value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </>}
          {type === 'time_block' && <>
            <div><label className={labelCls}>Name *</label><input autoFocus className={inputCls} placeholder="e.g. Sleep, Gym..." value={form.title} onChange={e => set('title', e.target.value)} required /></div>
            <div><label className={labelCls}>Recurrence</label>
              <select className={inputCls} value={form.recurrence} onChange={e => set('recurrence', e.target.value)}>
                {RECURRENCE_OPTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Start Time</label><input type="time" className={inputCls} value={form.start_time} onChange={e => set('start_time', e.target.value)} /></div>
              <div><label className={labelCls}>End Time</label><input type="time" className={inputCls} value={form.end_time} onChange={e => set('end_time', e.target.value)} /></div>
            </div>
            <div><label className={labelCls}>Notes</label><input className={inputCls} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </>}
          {type === 'idea' && <>
            <div><label className={labelCls}>Idea *</label><input autoFocus className={inputCls} placeholder="Describe the idea..." value={form.idea} onChange={e => set('idea', e.target.value)} required /></div>
            <div><label className={labelCls}>Category</label>
              <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">Select...</option>
                {IDEA_CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </>}
          {type === 'link' && <>
            <div><label className={labelCls}>Title</label><input autoFocus className={inputCls} placeholder="Link title..." value={form.title} onChange={e => set('title', e.target.value)} /></div>
            <div><label className={labelCls}>URL *</label><input type="url" className={inputCls} placeholder="https://..." value={form.url} onChange={e => set('url', e.target.value)} required /></div>
            <div><label className={labelCls}>Tags (comma-separated)</label><input className={inputCls} placeholder="react, typescript" value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
          </>}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-rose text-white rounded-lg py-2 text-sm font-medium hover:bg-rose-mid transition-colors">Add</button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-text-mid border border-border rounded-lg hover:bg-rose-bg transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

type LayoutMode = '2x3' | '3x2' | '6x1'

const LAYOUTS: { id: LayoutMode; label: string; desc: string }[] = [
  { id: '2x3', label: '2×3', desc: '2 rows · 3 cols' },
  { id: '3x2', label: '3×2', desc: '3 rows · 2 cols' },
  { id: '6x1', label: '6×1', desc: '6 rows · 1 col' },
]

export default function Inbox() {
  const [modal, setModal] = useState<ModalType | null>(null)
  const [layout, setLayout] = useState<LayoutMode>(
    () => (localStorage.getItem('inbox-layout') as LayoutMode) || '2x3'
  )
  const { data: rawWorkspaces = [] } = useWorkspaces()
  const workspaces = rawWorkspaces.map(w => ({ id: Number(w.id), name: w.name }))

  function changeLayout(l: LayoutMode) {
    setLayout(l)
    localStorage.setItem('inbox-layout', l)
  }

  const gridCls =
    layout === '2x3' ? 'grid grid-cols-1 lg:grid-cols-3 gap-4' :
    layout === '3x2' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' :
    'grid grid-cols-1 gap-4'

  const quickBtns: { type: ModalType; icon: React.ReactNode; label: string }[] = [
    { type: 'task', icon: <CheckSquare size={13} />, label: 'New Task' },
    { type: 'reminder', icon: <Bell size={13} />, label: 'New Reminder' },
    { type: 'idea', icon: <Lightbulb size={13} />, label: 'New Idea' },
    { type: 'link', icon: <Link2 size={13} />, label: 'New Link' },
    { type: 'time_block', icon: <Shield size={13} />, label: 'New Time Block' },
  ]

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-semibold text-text-dark flex items-center gap-2">
            Quick Capture / Inbox
            <Heart size={20} className="text-rose" />
          </h1>
          <p className="text-text-mid text-sm mt-1">Capture now. Organize later.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {quickBtns.map(btn => (
              <button
                key={btn.type}
                onClick={() => setModal(btn.type)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm text-text-dark hover:border-rose hover:text-rose transition-colors shadow-none"
              >
                <span className="text-rose">{btn.icon}</span>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 pt-1">
          <span className="text-[10px] text-text-light uppercase tracking-wide">Layout</span>
          <div className="flex items-center gap-1">
            {LAYOUTS.map(l => (
              <button
                key={l.id}
                title={l.desc}
                onClick={() => changeLayout(l.id)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                  layout === l.id
                    ? 'bg-rose text-white'
                    : 'bg-card border border-border text-text-mid hover:border-rose hover:text-rose'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={gridCls}>
        <SuddenTasksSection workspaces={workspaces} />
        <RemindersSection />
        <TimeBlocksSection />
        <IdeasSection />
        <LinksSection />
        <QuickNotesSection />
      </div>

      <div className="flex items-center justify-start px-1">
        <p className="text-xs text-text-light flex items-center gap-2">
          <Lightbulb size={13} className="text-rose opacity-60" />
          Tip: Check this inbox daily. Clear mind = High focus.
        </p>
      </div>

      {modal && (
        <AddModal
          defaultType={modal}
          workspaces={workspaces}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
