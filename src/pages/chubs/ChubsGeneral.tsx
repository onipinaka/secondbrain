import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, ArrowLeft, Trash2, StickyNote } from 'lucide-react'
import {
  useCmGeneralNotes,
  useAddCmGeneralNote,
  useUpdateCmGeneralNote,
  useDeleteCmGeneralNote,
  type CmGeneralNote,
} from '../../hooks/useChubsMedia'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface EditForm {
  headline: string
  content: string
}

export default function ChubsGeneral() {
  const { data: notes = [], isLoading } = useCmGeneralNotes()
  const addNote = useAddCmGeneralNote()
  const updateNote = useUpdateCmGeneralNote()
  const deleteNote = useDeleteCmGeneralNote()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<EditForm>({ headline: '', content: '' })
  const formRef = useRef<EditForm>(form)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selected = useMemo(
    () => notes.find(n => n.id === selectedId) ?? null,
    [notes, selectedId],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (selected) {
      const f: EditForm = { headline: selected.headline, content: selected.content ?? '' }
      setForm(f)
      formRef.current = f
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id])

  function handleChange(updates: Partial<EditForm>) {
    const id = selected?.id
    if (!id) return
    setForm(prev => {
      const next = { ...prev, ...updates }
      formRef.current = next
      return next
    })
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!formRef.current.headline.trim()) return
      updateNote.mutate({ id, ...formRef.current })
    }, 600)
  }

  function handleNew() {
    addNote.mutate(undefined, {
      onSuccess: (id) => setSelectedId(id),
    })
  }

  function handleDelete() {
    if (!selected) return
    deleteNote.mutate(selected.id, {
      onSuccess: () => setSelectedId(null),
    })
  }

  // ── Detail view ──
  if (selectedId !== null && selected) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} /> All Notes
          </button>
          <div className="flex items-center gap-3">
            {updateNote.isPending && (
              <span className="text-xs text-muted-foreground">Saving...</span>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        <div className="px-8 pt-8 pb-4 shrink-0">
          <input
            value={form.headline}
            onChange={e => handleChange({ headline: e.target.value })}
            placeholder="Note headline..."
            className="w-full text-2xl font-display font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
            autoFocus={form.headline === 'Untitled'}
            onFocus={e => { if (e.target.value === 'Untitled') e.target.select() }}
          />
        </div>

        <div className="flex-1 px-8 pb-8">
          <textarea
            value={form.content}
            onChange={e => handleChange({ content: e.target.value })}
            placeholder="Write your notes here..."
            className="w-full h-full resize-none bg-transparent border-none outline-none text-sm text-foreground leading-relaxed placeholder:text-muted-foreground/40"
          />
        </div>
      </div>
    )
  }

  if (selectedId !== null && !selected && addNote.isPending) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Creating...
      </div>
    )
  }

  // ── Grid view ──
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <p className="text-xs text-muted-foreground">Chubs Media</p>
          <h1 className="text-xl font-display font-semibold">General</h1>
        </div>
        <button
          onClick={handleNew}
          disabled={addNote.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition-colors"
        >
          <Plus size={15} /> New Note
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

        {!isLoading && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <StickyNote size={48} className="opacity-15" />
            <div className="text-center">
              <p className="text-sm font-medium">No notes yet</p>
              <p className="text-xs mt-1">Click "New Note" to get started</p>
            </div>
          </div>
        )}

        {notes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map(n => (
              <NoteCard key={n.id} note={n} onClick={() => setSelectedId(n.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteCard({ note, onClick }: { note: CmGeneralNote; onClick: () => void }) {
  const preview = note.content?.trim()
  return (
    <button
      onClick={onClick}
      className="text-left bg-card border border-border rounded-card p-4 shadow-none hover:border-rose-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-2 mb-3">
        <StickyNote size={15} className="text-rose-400 mt-0.5 shrink-0" />
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
          {note.headline || 'Untitled'}
        </p>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4 min-h-[48px]">
        {preview || 'No notes yet...'}
      </p>
      <p className="text-[10px] text-muted-foreground/60">
        {formatDate(note.created_at)}
      </p>
    </button>
  )
}
