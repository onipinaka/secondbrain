import { useState } from 'react'
import { Quote as QuoteIcon, Plus, Star, Trash2, X, Shuffle } from 'lucide-react'
import {
  useQuotes, useAddQuote, useUpdateQuote, useDeleteQuote,
  type Quote,
} from '../../../../hooks/usePersonal'

type Props = { workspaceId: string }

const PRESET_CATEGORIES = ['Philosophy', 'Motivation', 'Stoicism', 'Life', 'Success', 'Wisdom', 'Mindfulness']

export default function QuotesTab({ workspaceId: _workspaceId }: Props) {
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [favsOnly, setFavsOnly] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [spotlight, setSpotlight] = useState<Quote | null>(null)

  const [form, setForm] = useState({ quote: '', author: '', category: '', source: '' })

  const { data: quotes = [], isLoading } = useQuotes()
  const addQuote = useAddQuote()
  const updateQuote = useUpdateQuote()
  const deleteQuote = useDeleteQuote()

  const categories = [...new Set(quotes.map(q => q.category).filter(Boolean))] as string[]
  const favCount = quotes.filter(q => q.is_favourite).length

  const filtered = quotes.filter(q => {
    if (favsOnly && !q.is_favourite) return false
    if (catFilter && q.category !== catFilter) return false
    return true
  })

  function handleAdd() {
    if (!form.quote.trim()) return
    addQuote.mutate(
      {
        quote: form.quote.trim(),
        author: form.author.trim() || null,
        category: form.category.trim() || null,
        source: form.source.trim() || null,
      },
      {
        onSuccess: () => {
          setForm({ quote: '', author: '', category: '', source: '' })
          setShowAdd(false)
        },
      },
    )
  }

  function handleRandom() {
    if (quotes.length === 0) return
    const r = quotes[Math.floor(Math.random() * quotes.length)]
    setSpotlight(r)
  }

  if (isLoading) {
    return (
      <div className="p-6 grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-card rounded-card border border-border h-44 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-bg flex items-center justify-center">
            <QuoteIcon size={20} className="text-rose" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-dark">Quotes</h1>
            <p className="text-sm text-text-light">
              {quotes.length} quotes · {favCount} favourites
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {quotes.length > 0 && (
            <button
              onClick={handleRandom}
              className="flex items-center gap-1.5 text-sm border border-border px-3 py-2 rounded-xl text-text-mid hover:border-rose/50 hover:text-rose transition-colors"
            >
              <Shuffle size={14} /> Random
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-rose text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-colors"
          >
            <Plus size={15} /> Add Quote
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFavsOnly(!favsOnly)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            favsOnly
              ? 'bg-rose-bg text-rose border-rose/30'
              : 'bg-card text-text-mid border-border hover:border-rose/50'
          }`}
        >
          <Star size={11} className={favsOnly ? 'fill-amber-500 text-rose' : ''} />
          Favourites
          {favCount > 0 && <span className="ml-0.5 text-[10px]">({favCount})</span>}
        </button>

        <div className="w-px h-4 bg-border" />

        <button
          onClick={() => setCatFilter(null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            catFilter === null
              ? 'bg-rose text-white border-rose'
              : 'bg-card text-text-mid border-border hover:border-rose/40'
          }`}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(catFilter === c ? null : c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              catFilter === c
                ? 'bg-rose text-white border-rose'
                : 'bg-card text-text-mid border-border hover:border-rose/40'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-light">
          <QuoteIcon size={36} className="opacity-20" />
          <p className="text-sm">
            {quotes.length === 0 ? 'No quotes yet. Add your first one.' : 'No quotes match this filter.'}
          </p>
          {quotes.length === 0 && (
            <button
              onClick={() => setShowAdd(true)}
              className="text-xs text-rose hover:underline"
            >
              Add first quote →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(q => (
            <QuoteCard
              key={q.id}
              quote={q}
              onToggleFav={() => updateQuote.mutate({ id: q.id, is_favourite: !q.is_favourite })}
              onDelete={() => deleteQuote.mutate(q.id)}
              onClick={() => setSpotlight(q)}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-text-dark">Add Quote</h3>
              <button onClick={() => setShowAdd(false)} className="text-text-light hover:text-text-dark">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-light">Quote *</label>
              <textarea
                value={form.quote}
                onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
                placeholder="Enter the quote..."
                rows={4}
                autoFocus
                className="border border-border rounded-xl px-3 py-2.5 text-sm text-text-dark bg-transparent outline-none focus:border-rose resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-light">Author</label>
                <input
                  value={form.author}
                  onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                  placeholder="Marcus Aurelius..."
                  className="border border-border rounded-xl px-3 py-2 text-sm text-text-dark bg-transparent outline-none focus:border-rose"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-light">Source</label>
                <input
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="Meditations, Book IV..."
                  className="border border-border rounded-xl px-3 py-2 text-sm text-text-dark bg-transparent outline-none focus:border-rose"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-light">Category</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm(f => ({ ...f, category: f.category === c ? '' : c }))}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      form.category === c
                        ? 'bg-rose-bg text-rose border-rose/30'
                        : 'border-border text-text-light hover:border-rose/50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="Or type custom category..."
                className="border border-border rounded-xl px-3 py-2 text-sm text-text-dark bg-transparent outline-none focus:border-rose"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setShowAdd(false); setForm({ quote: '', author: '', category: '', source: '' }) }}
                className="px-4 py-2 text-sm text-text-mid hover:text-text-dark border border-border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.quote.trim() || addQuote.isPending}
                className="px-4 py-2 text-sm bg-rose text-white rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                Save Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spotlight / Random modal */}
      {spotlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSpotlight(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-xl p-8 flex flex-col gap-4">
            <button
              onClick={() => setSpotlight(null)}
              className="absolute top-4 right-4 text-text-light hover:text-text-dark"
            >
              <X size={18} />
            </button>
            <span className="font-display text-8xl leading-none text-rose/20 select-none -mb-4">"</span>
            <p className="font-display text-xl italic text-text-dark leading-relaxed">{spotlight.quote}</p>
            {spotlight.author && (
              <p className="text-text-mid text-sm font-medium">— {spotlight.author}{spotlight.source ? `, ${spotlight.source}` : ''}</p>
            )}
            {spotlight.category && (
              <span className="self-start text-xs bg-rose-bg text-rose px-2.5 py-1 rounded-full">{spotlight.category}</span>
            )}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <button
                onClick={() => { updateQuote.mutate({ id: spotlight.id, is_favourite: !spotlight.is_favourite }); setSpotlight({ ...spotlight, is_favourite: !spotlight.is_favourite }) }}
                className="flex items-center gap-1.5 text-sm text-text-mid hover:text-rose transition-colors"
              >
                <Star size={15} className={spotlight.is_favourite ? 'fill-amber-400 text-amber-400' : ''} />
                {spotlight.is_favourite ? 'Favourited' : 'Favourite'}
              </button>
              <button onClick={handleRandom} className="flex items-center gap-1.5 text-sm text-text-mid hover:text-text-dark transition-colors ml-auto">
                <Shuffle size={14} /> Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuoteCard({ quote: q, onToggleFav, onDelete, onClick }: {
  quote: Quote
  onToggleFav: () => void
  onDelete: () => void
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-card border border-border p-5 flex flex-col gap-3 group relative cursor-pointer hover:border-rose/30 hover:shadow-sm transition-all"
    >
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400 p-0.5"
      >
        <Trash2 size={13} />
      </button>

      <span className="font-display text-5xl leading-none text-rose/25 select-none -mb-2">"</span>
      <p className="font-display italic text-text-dark text-sm leading-relaxed line-clamp-4 flex-1">{q.quote}</p>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <div className="flex flex-col gap-0.5 min-w-0">
          {q.author && <p className="text-xs font-medium text-text-mid truncate">— {q.author}</p>}
          {q.category && (
            <span className="text-[10px] bg-rose-bg text-rose px-2 py-0.5 rounded-full self-start">{q.category}</span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleFav() }}
          className="p-1 shrink-0"
        >
          <Star
            size={15}
            className={q.is_favourite ? 'fill-amber-400 text-amber-400' : 'text-text-light hover:text-amber-300 transition-colors'}
          />
        </button>
      </div>
    </div>
  )
}
