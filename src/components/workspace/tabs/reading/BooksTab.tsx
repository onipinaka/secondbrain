import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  useBooks, useAddBook, useUpdateBook, useDeleteBook,
  type Book,
} from '../../../../hooks/useReading'

type Props = { workspaceId: string }

type BookFilter = 'all' | 'reading' | 'to_read' | 'done'

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  to_read: { label: 'To Read', color: 'bg-gray-100 text-gray-500' },
  reading: { label: 'Reading', color: 'bg-blue-100 text-blue-600' },
  done: { label: 'Done', color: 'bg-sage/20 text-sage' },
}

const FILTERS: { key: BookFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'reading', label: 'Reading' },
  { key: 'to_read', label: 'To Read' },
  { key: 'done', label: 'Done' },
]

const STATUS_OPTS = ['to_read', 'reading', 'done']

type ModalBook = Partial<Book> & { _editing?: boolean }

export default function BooksTab({ workspaceId: _workspaceId }: Props) {
  const [filter, setFilter] = useState<BookFilter>('all')
  const [modal, setModal] = useState<ModalBook | null>(null)

  const { data: books = [], isLoading } = useBooks()
  const addBook = useAddBook()
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()

  const filtered = books.filter(b => filter === 'all' || b.status === filter)

  function handleSave() {
    if (!modal) return
    if (modal._editing && modal.id) {
      const { _editing, ...patch } = modal
      updateBook.mutate({ id: modal.id, ...patch })
    } else {
      const { _editing, id, ...patch } = modal
      addBook.mutate(patch)
    }
    setModal(null)
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 mr-2"
        >
          <Plus size={13} /> Add Book
        </button>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-rose text-white border-rose'
                : 'bg-card text-text-mid border-border hover:border-rose/50'
            }`}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 opacity-70">{books.filter(b => b.status === f.key).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-card rounded-card border border-border h-48 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-text-light text-sm">
          {books.length === 0 ? 'No books added yet.' : 'No books match this filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b => (
            <BookCard
              key={b.id}
              book={b}
              onEdit={() => setModal({ ...b, _editing: true })}
              onDelete={() => deleteBook.mutate(b.id)}
              onRating={(r) => updateBook.mutate({ id: b.id, rating: r })}
            />
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card rounded-card border border-border p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="font-display text-base font-semibold text-text-dark">
              {modal._editing ? 'Edit Book' : 'Add Book'}
            </h3>

            <input
              value={modal.title ?? ''}
              onChange={e => setModal(m => ({ ...m!, title: e.target.value }))}
              placeholder="Title *"
              autoFocus
              className="border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-rose"
            />
            <input
              value={modal.author ?? ''}
              onChange={e => setModal(m => ({ ...m!, author: e.target.value }))}
              placeholder="Author"
              className="border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-rose"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-light mb-1 block">Status</label>
                <select
                  value={modal.status ?? 'to_read'}
                  onChange={e => setModal(m => ({ ...m!, status: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-rose"
                >
                  {STATUS_OPTS.map(s => (
                    <option key={s} value={s}>{STATUS_CFG[s]?.label ?? s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-light mb-1 block">Rating (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={modal.rating ?? ''}
                  onChange={e => setModal(m => ({ ...m!, rating: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-rose"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-light mb-1 block">Current Page</label>
                <input
                  type="number"
                  value={modal.current_page ?? ''}
                  onChange={e => setModal(m => ({ ...m!, current_page: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-rose"
                />
              </div>
              <div>
                <label className="text-xs text-text-light mb-1 block">Total Pages</label>
                <input
                  type="number"
                  value={modal.total_pages ?? ''}
                  onChange={e => setModal(m => ({ ...m!, total_pages: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-rose"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-light mb-1 block">Started</label>
                <input
                  type="date"
                  value={modal.started_date ?? ''}
                  onChange={e => setModal(m => ({ ...m!, started_date: e.target.value || null }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-rose"
                />
              </div>
              <div>
                <label className="text-xs text-text-light mb-1 block">Finished</label>
                <input
                  type="date"
                  value={modal.finished_date ?? ''}
                  onChange={e => setModal(m => ({ ...m!, finished_date: e.target.value || null }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-rose"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="text-sm text-text-mid px-3 py-1.5 hover:text-text-dark">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!modal.title?.trim()}
                className="text-sm bg-rose text-white px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {modal._editing ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookCard({
  book: b,
  onEdit,
  onDelete,
  onRating,
}: {
  book: Book
  onEdit: () => void
  onDelete: () => void
  onRating: (r: number) => void
}) {
  const pct = b.current_page && b.total_pages ? Math.round((b.current_page / b.total_pages) * 100) : 0
  const cfg = STATUS_CFG[b.status ?? ''] ?? { label: b.status ?? '', color: 'bg-gray-100 text-gray-500' }

  return (
    <div className="bg-card rounded-card border border-border p-4 flex flex-col gap-2 group relative">
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="text-[10px] text-text-light hover:text-rose px-1.5 py-0.5 border border-border rounded">Edit</button>
        <button onClick={onDelete} className="text-text-light hover:text-red-400">
          <Trash2 size={12} />
        </button>
      </div>

      <span className={`self-start text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>

      <div>
        <h3 className="font-display text-base font-semibold text-text-dark leading-tight pr-8">{b.title}</h3>
        {b.author && <p className="text-text-mid text-xs mt-0.5">{b.author}</p>}
      </div>

      {b.status === 'reading' && b.total_pages != null && b.current_page != null && (
        <div className="mt-1">
          <div className="flex justify-between text-[11px] text-text-light mb-1">
            <span>Page {b.current_page} of {b.total_pages}</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-border/40 rounded-full h-1.5">
            <div className="bg-rose rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {b.status === 'done' && (
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => onRating(i)} className="text-base leading-none">
              <span className={i <= (b.rating ?? 0) ? 'text-rose' : 'text-border'}>★</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 text-[11px] text-text-light mt-auto">
        {b.started_date && <span>Started {b.started_date}</span>}
        {b.finished_date && <span>Finished {b.finished_date}</span>}
      </div>
    </div>
  )
}
