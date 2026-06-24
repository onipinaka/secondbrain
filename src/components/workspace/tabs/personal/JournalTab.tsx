import { useState } from 'react'
import { BookOpen, Plus, Trash2, Calendar } from 'lucide-react'
import BlockEditor from '../../../shared/BlockEditor'
import {
  useJournalEntries, useAddJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry,
  type JournalEntry,
} from '../../../../hooks/usePersonal'

type Props = { workspaceId: string }

function nowIso() { return new Date().toISOString() }

function fmtDay(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function fmtMonth(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function fmtFull(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function groupByMonth(entries: JournalEntry[]) {
  const groups: { month: string; entries: JournalEntry[] }[] = []
  for (const e of entries) {
    const m = fmtMonth(e.logged_at)
    const last = groups[groups.length - 1]
    if (last && last.month === m) last.entries.push(e)
    else groups.push({ month: m, entries: [e] })
  }
  return groups
}

export default function JournalTab({ workspaceId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: entries = [], isLoading } = useJournalEntries()
  const addEntry = useAddJournalEntry()
  const updateEntry = useUpdateJournalEntry()
  const deleteEntry = useDeleteJournalEntry()

  const selectedEntry = entries.find(e => e.id === selectedId) ?? null
  const groups = groupByMonth(entries)

  function handleNew() {
    addEntry.mutate(
      { logged_at: nowIso(), title: 'Untitled', content: null },
      { onSuccess: (data: JournalEntry) => setSelectedId(data.id) },
    )
  }

  function handleDelete(e: JournalEntry) {
    deleteEntry.mutate(e.id)
    setSelectedId(null)
  }

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 44px)' }}>
      {/* Sidebar */}
      <div className="w-72 border-r border-border flex flex-col shrink-0 sticky top-0" style={{ height: 'calc(100vh - 44px)' }}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-rose" />
            <span className="font-display text-sm font-semibold text-text-dark">Journal</span>
          </div>
          <button
            onClick={handleNew}
            disabled={addEntry.isPending}
            className="flex items-center gap-1 text-xs bg-rose text-white px-2.5 py-1 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={12} /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-border/30 rounded animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-text-light">
              <BookOpen size={28} className="opacity-30" />
              <p className="text-xs">No entries yet</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.month}>
                <div className="px-3 py-1.5 bg-rose-bg/20 border-b border-border/40">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-light">
                    {group.month}
                  </span>
                </div>
                {group.entries.map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={`w-full text-left px-3 py-2.5 border-b border-border/40 hover:bg-rose-bg/30 transition-colors ${
                      selectedId === e.id ? 'bg-rose-bg/50 border-l-2 border-l-rose' : ''
                    }`}
                  >
                    <p className="text-[10px] text-text-light flex items-center gap-1">
                      <Calendar size={10} />
                      {fmtDay(e.logged_at)}
                    </p>
                    <p className="text-sm text-text-dark font-medium mt-0.5 truncate">
                      {e.title || 'Untitled'}
                    </p>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main editor */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedEntry ? (
          <>
            {/* Entry header */}
            <div className="px-8 pt-6 pb-4 border-b border-border/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs text-text-light mb-1">{fmtFull(selectedEntry.logged_at)}</p>
                  <input
                    key={selectedEntry.id}
                    defaultValue={selectedEntry.title}
                    onBlur={e => {
                      const val = e.target.value.trim()
                      if (val !== selectedEntry.title) {
                        updateEntry.mutate({ id: selectedEntry.id, title: val || 'Untitled' })
                      }
                    }}
                    placeholder="Entry title..."
                    className="w-full font-display text-2xl font-bold text-text-dark bg-transparent outline-none placeholder:text-text-light/40"
                  />
                </div>
                <button
                  onClick={() => handleDelete(selectedEntry)}
                  className="text-text-light hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 mt-4"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* BlockEditor */}
            <div className="flex-1 overflow-y-auto px-8 py-5">
              <BlockEditor
                entityType="journal_entry"
                entityId={selectedEntry.id}
                workspaceId={workspaceId}
                placeholder="What's on your mind today?"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-light">
            <div className="w-16 h-16 rounded-2xl bg-rose-bg/40 flex items-center justify-center">
              <BookOpen size={28} className="text-rose/60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-dark/60">Select an entry or start writing</p>
              <p className="text-xs text-text-light mt-1">Your thoughts, captured.</p>
            </div>
            <button
              onClick={handleNew}
              disabled={addEntry.isPending}
              className="flex items-center gap-1.5 text-sm bg-rose text-white px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={14} /> New Entry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
