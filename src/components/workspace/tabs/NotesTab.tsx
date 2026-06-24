import { useState, useRef } from 'react'
import { Plus, Trash2, Search, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useCsNotes, useAddCsNote, useUpdateCsNote, useDeleteCsNote,
  useCsTopics, type CsNote,
} from '../../../hooks/useCoreSubject'
import BlockEditor from '../../shared/BlockEditor'

type Props = { coreSubjectId: number; workspaceId: string }

const MIN_W = 40
const MAX_W = 480
const DEFAULT_W = 288

export default function NotesTab({ coreSubjectId, workspaceId }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CsNote | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [leftW, setLeftW] = useState(DEFAULT_W)
  const prevW = useRef(DEFAULT_W)

  const { data: notes = [] } = useCsNotes(coreSubjectId)
  const { data: topics = [] } = useCsTopics(coreSubjectId)
  const addNote = useAddCsNote()
  const updateNote = useUpdateCsNote()
  const deleteNote = useDeleteCsNote()

  const collapsed = leftW <= MIN_W
  const topicMap = Object.fromEntries(topics.map(t => [t.topic_id, t.title]))
  const filtered = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()))

  function handleCreate() {
    if (!newTitle.trim()) return
    addNote.mutate({
      core_subject_id: coreSubjectId,
      title: newTitle.trim(),
    }, {
      onSuccess: (data) => {
        setSelected(data as CsNote)
        setNewTitle('')
        setCreating(false)
      },
    })
  }

  function handleToggle() {
    if (collapsed) {
      setLeftW(prevW.current > MIN_W ? prevW.current : DEFAULT_W)
    } else {
      prevW.current = leftW
      setLeftW(MIN_W)
    }
  }

  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = leftW

    function onMove(ev: MouseEvent) {
      setLeftW(Math.min(MAX_W, Math.max(MIN_W, startW + ev.clientX - startX)))
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px]">
      {/* Left panel */}
      <div
        className="shrink-0 border-r border-border flex flex-col bg-cream/40 overflow-hidden"
        style={{ width: leftW }}
      >
        {collapsed ? (
          <div className="flex flex-col items-center py-3 gap-3 h-full">
            <button
              onClick={handleToggle}
              title="Expand notes list"
              className="text-text-light hover:text-rose transition-colors"
            >
              <ChevronRight size={15} />
            </button>
            <div className="flex-1 flex flex-col items-center gap-2 overflow-hidden">
              {filtered.slice(0, 8).map(note => (
                <button
                  key={note.id}
                  onClick={() => setSelected(note)}
                  title={note.title}
                  className={`w-6 h-6 rounded text-[9px] flex items-center justify-center transition-colors ${selected?.id === note.id ? 'bg-rose text-white' : 'bg-border/40 text-text-light hover:bg-rose-bg hover:text-rose'}`}
                >
                  {note.title.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 bg-card border border-border rounded-lg px-3 py-1.5">
                  <Search size={12} className="text-text-light" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
                    className="flex-1 text-sm bg-transparent outline-none text-text-dark placeholder:text-text-light" />
                </div>
                <button onClick={() => setCreating(true)}
                  className="p-1.5 bg-rose text-white rounded-lg hover:opacity-90 shrink-0">
                  <Plus size={13} />
                </button>
                <button onClick={handleToggle} title="Collapse" className="text-text-light hover:text-rose transition-colors shrink-0">
                  <ChevronLeft size={14} />
                </button>
              </div>
              {creating && (
                <div className="flex gap-2">
                  <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
                    placeholder="Note title..."
                    className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-1.5 outline-none focus:border-rose" />
                  <button onClick={handleCreate} className="text-xs bg-rose text-white px-2 rounded-lg">Add</button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="p-4 text-xs text-text-light italic text-center">No notes yet</p>
              )}
              {filtered.map(note => (
                <div key={note.id} onClick={() => setSelected(note)}
                  className={`group px-4 py-3 cursor-pointer border-b border-border/50 hover:bg-rose-bg/30 transition-colors ${selected?.id === note.id ? 'bg-rose-bg/50 border-l-2 border-l-rose' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-text-dark font-medium truncate">{note.title}</p>
                      {note.topic_id && topicMap[note.topic_id] && (
                        <p className="text-[10px] text-rose mt-0.5 truncate">{topicMap[note.topic_id]}</p>
                      )}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <Tag size={9} className="text-text-light" />
                          {note.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[9px] bg-sage/10 text-sage px-1 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-text-light mt-0.5">
                        {note.updated_at ? new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); if (selected?.id === note.id) setSelected(null); deleteNote.mutate({ id: note.id, coreSubjectId }) }}
                      className="opacity-0 group-hover:opacity-100 text-text-light hover:text-rose transition-all shrink-0 mt-0.5">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Drag handle */}
      <div
        className="w-1 shrink-0 cursor-col-resize hover:bg-rose/40 active:bg-rose/60 transition-colors"
        onMouseDown={handleDragStart}
      />

      {/* Right — editor */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-border space-y-1">
              {editingTitle ? (
                <input
                  autoFocus
                  className="font-display text-lg text-text-dark bg-white border border-rose rounded-lg px-2 py-0.5 outline-none w-full"
                  value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  onBlur={() => { setEditingTitle(false); updateNote.mutate({ id: selected.id, core_subject_id: coreSubjectId, title: titleVal }); setSelected(s => s ? { ...s, title: titleVal } : null) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { setEditingTitle(false); updateNote.mutate({ id: selected.id, core_subject_id: coreSubjectId, title: titleVal }); setSelected(s => s ? { ...s, title: titleVal } : null) }
                    if (e.key === 'Escape') { setEditingTitle(false); setTitleVal(selected.title) }
                  }}
                />
              ) : (
                <p
                  className="font-display text-lg text-text-dark cursor-text hover:text-rose transition-colors"
                  onClick={() => { setTitleVal(selected.title); setEditingTitle(true) }}
                  title="Click to edit"
                >
                  {selected.title}
                </p>
              )}
              {selected.topic_id && topicMap[selected.topic_id] && (
                <p className="text-[10px] text-text-light">{topicMap[selected.topic_id]}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <BlockEditor
                key={selected.id}
                entityType="cs_note"
                entityId={selected.id.toString()}
                workspaceId={workspaceId}
                placeholder="Start writing..."
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-light gap-3">
            <span className="text-5xl">✏️</span>
            <p className="font-display text-lg text-text-mid">Select a note to edit</p>
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 text-sm text-rose hover:opacity-70">
              <Plus size={13} /> New Note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
