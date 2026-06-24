import { useState, useMemo } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import {
  useClients, useAddClient, useUpdateClient, useDeleteClient,
  type Client,
} from '../../../hooks/useBusiness'
import BlockEditor from '../../shared/BlockEditor'

type Props = { workspaceId: string }
type EC = { id: string; field: string; value: string }

const INVOICE_OPTS = [
  { value: 'pending', label: 'Pending', cls: 'bg-amber-100 text-amber-600' },
  { value: 'partial', label: 'Partial', cls: 'bg-blue-100 text-blue-600' },
  { value: 'paid', label: 'Paid', cls: 'bg-sage/20 text-sage' },
]

type Opt = { value: string; label: string; cls: string }

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'
const INPUT = 'w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none'
const SEL = 'bg-white border border-rose rounded px-1.5 py-1 text-xs outline-none'

function Bdg({ val, opts }: { val: string | null | undefined; opts: Opt[] }) {
  if (!val) return <span className="text-text-light text-xs">—</span>
  const o = opts.find(x => x.value === val)
  return o
    ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${o.cls}`}>{o.label}</span>
    : <span className="text-text-light text-[10px]">{val}</span>
}

const SHEET_SECTIONS = [
  { key: 'meeting_notes', label: 'Meeting Notes', entityType: 'client' },
  { key: 'deliverables', label: 'Deliverables', entityType: 'client_deliverables' },
  { key: 'credentials', label: 'Credentials', entityType: 'client_credentials' },
]

function ClientSheet({
  client,
  workspaceId,
  onClose,
  onUpdate,
}: {
  client: Client
  workspaceId: string
  onClose: () => void
  onUpdate: (field: string, value: string) => void
}) {
  const [activeSection, setActiveSection] = useState('meeting_notes')

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[560px] bg-card border-l border-border flex flex-col h-full shadow-xl">
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div>
            <h3 className="font-display text-lg text-text-dark">{client.name}</h3>
            {client.niche && <p className="text-xs text-text-mid mt-0.5">{client.niche}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-light hover:text-text-dark hover:bg-rose-bg transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-border px-5 gap-1 pt-2 overflow-x-auto">
          {SHEET_SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`text-xs px-3 py-2 rounded-t-lg whitespace-nowrap transition-colors ${
                activeSection === s.key
                  ? 'bg-rose-bg text-rose font-medium border-b-2 border-rose -mb-px'
                  : 'text-text-mid hover:text-text-dark'
              }`}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={() => setActiveSection('upsell')}
            className={`text-xs px-3 py-2 rounded-t-lg whitespace-nowrap transition-colors ${
              activeSection === 'upsell'
                ? 'bg-rose-bg text-rose font-medium border-b-2 border-rose -mb-px'
                : 'text-text-mid hover:text-text-dark'
            }`}
          >
            Upsell
          </button>
          <button
            onClick={() => setActiveSection('satisfaction')}
            className={`text-xs px-3 py-2 rounded-t-lg whitespace-nowrap transition-colors ${
              activeSection === 'satisfaction'
                ? 'bg-rose-bg text-rose font-medium border-b-2 border-rose -mb-px'
                : 'text-text-mid hover:text-text-dark'
            }`}
          >
            Satisfaction
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {SHEET_SECTIONS.map(s =>
            activeSection === s.key ? (
              <div key={s.key}>
                <BlockEditor entityType={s.entityType} entityId={client.id} workspaceId={workspaceId} />
              </div>
            ) : null,
          )}
          {activeSection === 'upsell' && (
            <div className="p-5">
              <label className="block text-xs text-text-mid font-medium mb-2">Upsell Opportunities</label>
              <textarea
                key={`upsell-${client.id}`}
                defaultValue={client.upsell_opportunities ?? ''}
                onBlur={e => onUpdate('upsell_opportunities', e.target.value)}
                rows={8}
                placeholder="Note upsell opportunities..."
                className="w-full resize-none bg-cream border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
              />
            </div>
          )}
          {activeSection === 'satisfaction' && (
            <div className="p-5">
              <label className="block text-xs text-text-mid font-medium mb-2">Satisfaction Notes</label>
              <textarea
                key={`satisfaction-${client.id}`}
                defaultValue={client.satisfaction_notes ?? ''}
                onBlur={e => onUpdate('satisfaction_notes', e.target.value)}
                rows={8}
                placeholder="Client satisfaction feedback..."
                className="w-full resize-none bg-cream border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClientsTab({ workspaceId }: Props) {
  const [search, setSearch] = useState('')
  const [ec, setEc] = useState<EC | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')

  const { data: clients = [], isLoading } = useClients(workspaceId)
  const addClient = useAddClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const filtered = useMemo(
    () =>
      clients.filter(
        c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.niche?.toLowerCase().includes(search.toLowerCase()) ?? false),
      ),
    [clients, search],
  )

  function commit(id: string, field: string, val?: string, numeric = false) {
    const raw = val ?? ec?.value ?? ''
    setEc(null)
    const v = numeric ? (raw !== '' ? Number(raw) : null) : raw || null
    updateClient.mutate({ id, workspace_id: workspaceId, [field]: v })
  }

  const isE = (id: string, f: string) => ec?.id === id && ec?.field === f

  function txt(c: Client, f: keyof Client, wide = false) {
    const val = (c[f] ?? '') as string
    return isE(c.id, f as string) ? (
      <input
        autoFocus
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => (p ? { ...p, value: e.target.value } : null))}
        onBlur={() => commit(c.id, f as string)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(c.id, f as string)
          if (e.key === 'Escape') setEc(null)
        }}
      />
    ) : (
      <span
        className={`cursor-text ${wide ? 'text-text-dark font-medium' : 'text-text-dark text-xs'}`}
        onClick={() => setEc({ id: c.id, field: f as string, value: val })}
      >
        {val || <span className="text-text-light">—</span>}
      </span>
    )
  }

  function num(c: Client, f: keyof Client, prefix = '') {
    const raw = c[f] as number | null
    return isE(c.id, f as string) ? (
      <input
        autoFocus
        type="number"
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => (p ? { ...p, value: e.target.value } : null))}
        onBlur={() => commit(c.id, f as string, undefined, true)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(c.id, f as string, undefined, true)
          if (e.key === 'Escape') setEc(null)
        }}
      />
    ) : (
      <span
        className="cursor-text text-text-dark text-xs tabular-nums"
        onClick={() => setEc({ id: c.id, field: f as string, value: raw != null ? String(raw) : '' })}
      >
        {raw != null
          ? `${prefix}${raw.toLocaleString('en-IN')}`
          : <span className="text-text-light">—</span>}
      </span>
    )
  }

  function dt(c: Client, f: keyof Client) {
    const val = (c[f] ?? '') as string
    return isE(c.id, f as string) ? (
      <input
        autoFocus
        type="date"
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => (p ? { ...p, value: e.target.value } : null))}
        onBlur={() => commit(c.id, f as string)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(c.id, f as string)
          if (e.key === 'Escape') setEc(null)
        }}
      />
    ) : (
      <span
        className="cursor-text text-text-dark text-xs"
        onClick={() => setEc({ id: c.id, field: f as string, value: val })}
      >
        {val
          ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
          : <span className="text-text-light">—</span>}
      </span>
    )
  }

  function sel(c: Client, f: keyof Client, opts: Opt[]) {
    const val = (c[f] ?? '') as string
    return isE(c.id, f as string) ? (
      <select
        autoFocus
        className={SEL}
        value={ec!.value}
        onChange={e => commit(c.id, f as string, e.target.value)}
        onBlur={() => setEc(null)}
      >
        <option value="">—</option>
        {opts.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    ) : (
      <span className="cursor-pointer" onClick={() => setEc({ id: c.id, field: f as string, value: val })}>
        <Bdg val={val} opts={opts} />
      </span>
    )
  }

  function handleSheetUpdate(field: string, value: string) {
    if (!selectedClient) return
    updateClient.mutate({
      id: selectedClient.id,
      workspace_id: workspaceId,
      [field]: value || null,
    })
  }

  function handleAdd() {
    if (!newName.trim()) return
    addClient.mutate(
      { name: newName, workspace_id: workspaceId },
      { onSuccess: () => { setShowAdd(false); setNewName('') } },
    )
  }

  return (
    <div className="space-y-0">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="flex items-center gap-2 bg-rose-bg/50 border border-border rounded-lg px-3 py-2 flex-1 max-w-80">
          <Search size={13} className="text-text-light" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="flex-1 text-sm bg-transparent outline-none text-text-dark placeholder:text-text-light"
          />
        </div>
        <span className="text-xs text-text-light">{clients.length} clients</span>
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={13} /> Add Client
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
            placeholder="Client name *"
            className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          />
          <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">
            Add
          </button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              <th className={TH}>Name</th>
              <th className={TH}>Niche</th>
              <th className={TH}>Project Type</th>
              <th className={TH}>Deliverables</th>
              <th className={`${TH} w-24`}>Deadline</th>
              <th className={`${TH} w-28`}>Amount (₹)</th>
              <th className={`${TH} w-28`}>Invoice</th>
              <th className={`${TH} w-32`}>Progress</th>
              <th className={`${TH} w-24`}>Start Date</th>
              <th className={`${TH} w-36`}>Notes</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-4 bg-rose-bg/40 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-text-light text-sm">
                    No clients yet. Click + to add one.
                  </td>
                </tr>
              )
              : filtered.map(c => (
                <tr
                  key={c.id}
                  className="border-b border-border hover:bg-rose-bg/20 group cursor-pointer"
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('input,select,button,a')) return
                    setSelectedClient(c)
                  }}
                >
                  <td className="px-3 py-2 min-w-36">{txt(c, 'name', true)}</td>
                  <td className="px-3 py-2 min-w-24">{txt(c, 'niche')}</td>
                  <td className="px-3 py-2 min-w-28">{txt(c, 'project_type')}</td>
                  <td className="px-3 py-2 max-w-[160px]">
                    <div className="line-clamp-1">{txt(c, 'deliverables')}</div>
                  </td>
                  <td className="px-3 py-2">{dt(c, 'deadline')}</td>
                  <td className="px-3 py-2">{num(c, 'amount_inr', '₹')}</td>
                  <td className="px-3 py-2">{sel(c, 'invoice_status', INVOICE_OPTS)}</td>
                  <td className="px-3 py-2 w-32">
                    {isE(c.id, 'progress_percent') ? (
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        max={100}
                        className={INPUT}
                        value={ec!.value}
                        onChange={e => setEc(p => (p ? { ...p, value: e.target.value } : null))}
                        onBlur={() => commit(c.id, 'progress_percent', undefined, true)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commit(c.id, 'progress_percent', undefined, true)
                          if (e.key === 'Escape') setEc(null)
                        }}
                      />
                    ) : (
                      <div
                        className="flex items-center gap-2 cursor-text"
                        onClick={() => setEc({ id: c.id, field: 'progress_percent', value: c.progress_percent != null ? String(c.progress_percent) : '' })}
                      >
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose rounded-full transition-all"
                            style={{ width: `${c.progress_percent ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-mid tabular-nums w-7 shrink-0">
                          {c.progress_percent ?? 0}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{dt(c, 'start_date')}</td>
                  <td className="px-3 py-2 max-w-[144px]">
                    <div className="line-clamp-1">{txt(c, 'notes')}</div>
                  </td>
                  <td className="relative w-10">
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      onClick={e => { e.stopPropagation(); deleteClient.mutate({ id: c.id, workspaceId }) }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            <tr>
              <td colSpan={11} className="p-0">
                <button
                  className="w-full py-2 bg-rose-bg/30 hover:bg-rose-bg text-text-light hover:text-rose transition-colors flex items-center justify-center"
                  onClick={() => setShowAdd(true)}
                >
                  <Plus size={14} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {selectedClient && (
        <ClientSheet
          client={selectedClient}
          workspaceId={workspaceId}
          onClose={() => setSelectedClient(null)}
          onUpdate={handleSheetUpdate}
        />
      )}
    </div>
  )
}
