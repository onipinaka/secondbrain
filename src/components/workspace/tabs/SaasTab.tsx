import { useState } from 'react'
import { Plus, GitBranch, ExternalLink, Trash2 } from 'lucide-react'
import {
  useSaasProducts, useAddSaasProduct, useUpdateSaasProduct, useDeleteSaasProduct,
  type SaasProduct,
} from '../../../hooks/useBusiness'
import BlockEditor from '../../shared/BlockEditor'
import { safeUrl } from '../../../lib/utils'

type Props = { workspaceId: string }

const STAGE_OPTS = [
  { value: 'ideation', label: 'Ideation', cls: 'bg-gray-100 text-gray-500' },
  { value: 'building', label: 'Building', cls: 'bg-blue-100 text-blue-600' },
  { value: 'launched', label: 'Launched', cls: 'bg-amber-100 text-amber-600' },
  { value: 'profitable', label: 'Profitable', cls: 'bg-sage/20 text-sage' },
  { value: 'abandoned', label: 'Abandoned', cls: 'bg-red-50 text-red-400' },
]

function StageBadge({ stage }: { stage: string | null }) {
  const opt = STAGE_OPTS.find(o => o.value === stage)
  if (!opt) return <span className="text-text-light text-[10px]">{stage ?? '—'}</span>
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${opt.cls}`}>
      {opt.label}
    </span>
  )
}

function ProductSheet({
  product,
  workspaceId,
  onClose,
}: {
  product: SaasProduct
  workspaceId: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[560px] bg-card border-l border-border flex flex-col h-full shadow-xl">
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div>
            <h3 className="font-display text-lg text-text-dark">{product.name}</h3>
            <StageBadge stage={product.stage} />
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-light hover:text-text-dark hover:bg-rose-bg transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <BlockEditor entityType="saas_product" entityId={product.id} workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  )
}

function AddProductModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (name: string) => void
}) {
  const [name, setName] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-card shadow-xl p-6 w-96 z-10">
        <h3 className="font-display text-lg text-text-dark mb-4">New SaaS Product</h3>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && name.trim()) { onAdd(name.trim()); onClose() }
            if (e.key === 'Escape') onClose()
          }}
          placeholder="Product name *"
          className="w-full text-sm bg-cream border border-border rounded-lg px-3 py-2.5 outline-none focus:border-rose mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="text-xs text-text-mid px-4 py-2 rounded-lg border border-border">
            Cancel
          </button>
          <button
            onClick={() => { if (name.trim()) { onAdd(name.trim()); onClose() } }}
            className="text-xs bg-rose text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

type EditingField = { id: string; field: string; value: string } | null

export default function SaasTab({ workspaceId }: Props) {
  const [openProduct, setOpenProduct] = useState<SaasProduct | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<EditingField>(null)

  const { data: products = [], isLoading } = useSaasProducts(workspaceId)
  const addProduct = useAddSaasProduct()
  const updateProduct = useUpdateSaasProduct()
  const deleteProduct = useDeleteSaasProduct()

  function commit(id: string, field: string, value: string, numeric = false) {
    setEditing(null)
    const v: any = numeric ? (value !== '' ? Number(value) : null) : value || null
    updateProduct.mutate({ id, workspace_id: workspaceId, [field]: v })
  }

  const isE = (id: string, f: string) => editing?.id === id && editing?.field === f

  function editable(p: SaasProduct, f: keyof SaasProduct, placeholder = '', numeric = false) {
    const val = (p[f] ?? '') as string
    return isE(p.id, f as string) ? (
      <input
        autoFocus
        type={numeric ? 'number' : 'text'}
        className="w-full bg-cream border border-rose rounded px-2 py-1 text-sm outline-none"
        value={editing!.value}
        onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
        onBlur={() => commit(p.id, f as string, editing?.value ?? '', numeric)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(p.id, f as string, editing?.value ?? '', numeric)
          if (e.key === 'Escape') setEditing(null)
        }}
      />
    ) : (
      <span
        className="cursor-text text-sm text-text-dark"
        onClick={() => setEditing({ id: p.id, field: f as string, value: val })}
      >
        {val || <span className="text-text-light italic text-xs">{placeholder}</span>}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="p-5 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-card border border-border p-4 space-y-3 animate-pulse">
            <div className="h-5 bg-rose-bg/40 rounded w-2/3" />
            <div className="h-2 bg-rose-bg/40 rounded" />
            <div className="h-4 bg-rose-bg/40 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-card rounded-card border border-border p-4 flex flex-col gap-3 group relative">
            {/* Delete button */}
            <button
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
              onClick={() => deleteProduct.mutate({ id: p.id, workspaceId })}
            >
              <Trash2 size={13} />
            </button>

            {/* Name + Stage */}
            <div className="flex items-start justify-between gap-2 pr-6">
              <div className="font-display font-semibold text-text-dark text-base leading-tight">
                {editable(p, 'name', 'Product name')}
              </div>
              {isE(p.id, 'stage') ? (
                <select
                  autoFocus
                  className="bg-white border border-rose rounded px-1.5 py-0.5 text-xs outline-none shrink-0"
                  value={editing!.value}
                  onChange={e => commit(p.id, 'stage', e.target.value)}
                  onBlur={() => setEditing(null)}
                >
                  <option value="">—</option>
                  {STAGE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <span
                  className="cursor-pointer shrink-0"
                  onClick={() => setEditing({ id: p.id, field: 'stage', value: p.stage ?? '' })}
                >
                  <StageBadge stage={p.stage} />
                </span>
              )}
            </div>

            {/* Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-light uppercase tracking-wide">Progress</span>
                <span
                  className="text-[10px] text-text-mid tabular-nums cursor-text"
                  onClick={() => setEditing({ id: p.id, field: 'progress_percent', value: p.progress_percent != null ? String(p.progress_percent) : '' })}
                >
                  {isE(p.id, 'progress_percent') ? (
                    <input
                      autoFocus
                      type="number"
                      min={0}
                      max={100}
                      className="w-14 bg-white border border-rose rounded px-1.5 py-0.5 text-xs outline-none"
                      value={editing!.value}
                      onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                      onBlur={() => commit(p.id, 'progress_percent', editing?.value ?? '', true)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commit(p.id, 'progress_percent', editing?.value ?? '', true)
                        if (e.key === 'Escape') setEditing(null)
                      }}
                    />
                  ) : (
                    `${p.progress_percent ?? 0}%`
                  )}
                </span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose rounded-full transition-all"
                  style={{ width: `${p.progress_percent ?? 0}%` }}
                />
              </div>
            </div>

            {/* MRR */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-light uppercase tracking-wide">MRR</span>
              <span className="text-sm font-medium text-sage">
                {isE(p.id, 'mrr') ? (
                  <input
                    autoFocus
                    type="number"
                    className="w-24 bg-white border border-rose rounded px-1.5 py-0.5 text-sm outline-none"
                    value={editing!.value}
                    onChange={e => setEditing(prev => prev ? { ...prev, value: e.target.value } : null)}
                    onBlur={() => commit(p.id, 'mrr', editing?.value ?? '', true)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commit(p.id, 'mrr', editing?.value ?? '', true)
                      if (e.key === 'Escape') setEditing(null)
                    }}
                  />
                ) : (
                  <span
                    className="cursor-text"
                    onClick={() => setEditing({ id: p.id, field: 'mrr', value: p.mrr != null ? String(p.mrr) : '' })}
                  >
                    {p.mrr != null
                      ? `₹${p.mrr.toLocaleString('en-IN')}/mo`
                      : <span className="text-text-light italic text-xs font-normal">₹0/mo</span>}
                  </span>
                )}
              </span>
            </div>

            {/* Tech stack + links */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex-1 text-xs text-text-mid min-w-0">
                {editable(p, 'tech_stack', 'Tech stack...')}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.github_url && (
                  <a href={safeUrl(p.github_url)} target="_blank" rel="noopener noreferrer" className="text-text-light hover:text-text-dark transition-colors">
                    <GitBranch size={14} />
                  </a>
                )}
                {p.landing_page_url && (
                  <a href={safeUrl(p.landing_page_url)} target="_blank" rel="noopener noreferrer" className="text-text-light hover:text-text-dark transition-colors">
                    <ExternalLink size={14} />
                  </a>
                )}
                {!p.github_url && (
                  <button
                    className="text-text-light opacity-30 hover:opacity-60 transition-opacity"
                    onClick={() => setEditing({ id: p.id, field: 'github_url', value: '' })}
                    title="Add GitHub URL"
                  >
                    <GitBranch size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Target customer */}
            <div className="text-xs text-text-mid">
              {editable(p, 'target_customer', 'Target customer...')}
            </div>

            {/* Open notes */}
            <button
              onClick={() => setOpenProduct(p)}
              className="mt-auto w-full text-xs py-2 bg-rose-bg text-rose hover:bg-rose hover:text-white rounded-lg transition-colors font-medium"
            >
              Open Notes
            </button>
          </div>
        ))}

        {/* Add Product card */}
        <button
          onClick={() => setShowAdd(true)}
          className="bg-card rounded-card border-2 border-dashed border-border hover:border-rose hover:bg-rose-bg/20 transition-colors flex flex-col items-center justify-center gap-2 min-h-[200px] text-text-light hover:text-rose"
        >
          <Plus size={20} />
          <span className="text-sm font-medium">New Product</span>
        </button>
      </div>

      {openProduct && (
        <ProductSheet
          product={openProduct}
          workspaceId={workspaceId}
          onClose={() => setOpenProduct(null)}
        />
      )}

      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onAdd={name =>
            addProduct.mutate({ name, workspace_id: workspaceId, stage: 'ideation', progress_percent: 0 })
          }
        />
      )}
    </div>
  )
}
