import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, Trash2, Pencil, Check, X, Tag } from 'lucide-react'
import {
  useCmNiches, useCmLeads,
  useAddCmNiche, useUpdateCmNiche, useDeleteCmNiche,
} from '../../hooks/useChubsMedia'

const COLORS = [
  'bg-rose-100 text-rose-600 border-rose-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-blue-100 text-blue-600 border-blue-200',
  'bg-indigo-100 text-indigo-600 border-indigo-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-purple-100 text-purple-600 border-purple-200',
  'bg-pink-100 text-pink-600 border-pink-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
]

export default function ChubsNiches() {
  const { data: niches = [], isLoading } = useCmNiches()
  const { data: leads = [] } = useCmLeads()
  const addNiche = useAddCmNiche()
  const updateNiche = useUpdateCmNiche()
  const deleteNiche = useDeleteCmNiche()

  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    const nextId = Math.max(0, ...niches.map(n => n.niche_id)) + 1
    addNiche.mutate({ name, niche_id: nextId }, {
      onSuccess: () => { setNewName(''); setAdding(false) },
    })
  }

  function startEdit(niche_id: number, name: string) {
    setEditingId(niche_id)
    setEditName(name)
    setConfirmDelete(null)
  }

  function commitEdit() {
    const name = editName.trim()
    if (!name || editingId === null) { setEditingId(null); return }
    updateNiche.mutate({ niche_id: editingId, name }, { onSuccess: () => setEditingId(null) })
  }

  function handleDelete(niche_id: number) {
    if (confirmDelete === niche_id) {
      deleteNiche.mutate(niche_id, { onSuccess: () => setConfirmDelete(null) })
    } else {
      setConfirmDelete(niche_id)
      setEditingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-card border-b border-border px-8 pt-6 pb-6">
        <div className="flex items-center gap-1.5 text-xs text-text-light mb-3">
          <Link to="/chubs/client-acquisition" className="hover:text-rose transition-colors">Acquisition</Link>
          <ChevronRight size={12} />
          <span className="text-text-dark font-medium">Manage Niches</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[26px] font-bold text-text-dark">Niches</h1>
            <p className="text-text-mid text-sm mt-1">Organise leads by industry or niche.</p>
          </div>
          <button
            onClick={() => { setAdding(true); setConfirmDelete(null); setEditingId(null) }}
            className="flex items-center gap-2 bg-rose text-white text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-rose/90 transition-colors"
          >
            <Plus size={14} />
            Add Niche
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-2xl space-y-3">

        {/* Add row */}
        {adding && (
          <div className="bg-card rounded-card border border-rose/40 px-5 py-4 flex items-center gap-3">
            <Tag size={15} className="text-rose flex-shrink-0" />
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Niche name…"
              className="flex-1 bg-transparent outline-none text-sm text-text-dark placeholder:text-text-light"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || addNiche.isPending}
              className="flex items-center gap-1 text-[12px] font-semibold text-white bg-rose px-3 py-1.5 rounded-lg hover:bg-rose/90 transition-colors disabled:opacity-40"
            >
              <Check size={13} /> Save
            </button>
            <button onClick={() => setAdding(false)} className="text-text-light hover:text-text-dark transition-colors">
              <X size={15} />
            </button>
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-card border border-border h-[68px] animate-pulse" />
          ))
        ) : niches.length === 0 && !adding ? (
          <div className="bg-card rounded-card border border-border px-6 py-12 text-center">
            <Tag size={32} className="mx-auto mb-3 text-text-light opacity-30" />
            <p className="text-text-light text-sm">No niches yet. Add one above.</p>
          </div>
        ) : (
          niches.map((n, i) => {
            const leadCount = leads.filter(l => l.niche_id === n.niche_id).length
            const colorCls = COLORS[i % COLORS.length]
            const isEditing = editingId === n.niche_id
            const isConfirm = confirmDelete === n.niche_id

            return (
              <div
                key={n.niche_id}
                className="bg-card rounded-card border border-border px-5 py-4 flex items-center gap-4"
              >
                {/* Color badge */}
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[13px] font-bold border flex-shrink-0 ${colorCls}`}>
                  {n.name.charAt(0).toUpperCase()}
                </span>

                {/* Name / edit input */}
                {isEditing ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                    onBlur={commitEdit}
                    className="flex-1 bg-transparent border-b border-rose outline-none text-sm text-text-dark"
                  />
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text-dark">{n.name}</p>
                    <p className="text-[11px] text-text-light">{leadCount} lead{leadCount !== 1 ? 's' : ''}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isConfirm ? (
                    <>
                      <span className="text-[11px] text-red-500 font-medium">Delete?</span>
                      <button
                        onClick={() => handleDelete(n.niche_id)}
                        className="text-[11px] font-semibold text-white bg-red-500 px-2.5 py-1 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[11px] text-text-mid hover:text-text-dark transition-colors px-2 py-1"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/chubs/client-acquisition/leads?niche_id=${n.niche_id}`}
                        className="text-[11px] text-rose hover:underline font-medium"
                      >
                        View leads
                      </Link>
                      <button
                        onClick={() => startEdit(n.niche_id, n.name)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-light hover:bg-rose-bg hover:text-rose transition-colors"
                        title="Rename"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(n.niche_id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-light hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
