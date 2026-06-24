import { useState, useMemo } from 'react'
import { Plus, Trash2, MessageCircle, Search } from 'lucide-react'
import {
  useLeads, useAddLead, useUpdateLead, useDeleteLead,
  useNicheFinding, useUpsertNicheFinding,
  type Lead,
} from '../../../hooks/useBusiness'

type Props = { workspaceId: string }
type EC = { id: string; field: string; value: string }

const STATUS_OPTS = [
  { value: 'not_called', label: 'Not Called', cls: 'bg-gray-100 text-gray-500' },
  { value: 'called', label: 'Called', cls: 'bg-blue-100 text-blue-600' },
  { value: 'interested', label: 'Interested', cls: 'bg-green-100 text-green-600' },
  { value: 'not_interested', label: 'Not Interested', cls: 'bg-red-100 text-red-600' },
  { value: 'follow_up', label: 'Follow Up', cls: 'bg-amber-100 text-amber-600' },
  { value: 'converted', label: 'Converted', cls: 'bg-sage/20 text-sage' },
  { value: 'lost', label: 'Lost', cls: 'bg-red-50 text-red-300' },
]

const SOURCE_OPTS = [
  { value: 'google_maps', label: 'Google Maps', cls: '' },
  { value: 'referral', label: 'Referral', cls: '' },
  { value: 'linkedin', label: 'LinkedIn', cls: '' },
  { value: 'justdial', label: 'JustDial', cls: '' },
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

const FINDINGS_FIELDS: Array<{ key: keyof NicheFindingFields; label: string }> = [
  { key: 'what_works', label: 'What Works' },
  { key: 'common_objections', label: 'Common Objections' },
  { key: 'best_hooks', label: 'Best Hooks' },
  { key: 'pricing_notes', label: 'Pricing Notes' },
  { key: 'dos_and_donts', label: "Do's & Don'ts" },
  { key: 'best_platforms', label: 'Best Platforms' },
]

type NicheFindingFields = {
  what_works: string | null
  common_objections: string | null
  best_hooks: string | null
  pricing_notes: string | null
  dos_and_donts: string | null
  best_platforms: string | null
}

function NicheFindingsSheet({
  niche,
  workspaceId,
  onClose,
}: {
  niche: string
  workspaceId: string
  onClose: () => void
}) {
  const { data: finding } = useNicheFinding(workspaceId, niche)
  const upsert = useUpsertNicheFinding()

  function save(field: string, value: string) {
    upsert.mutate({ niche, workspace_id: workspaceId, [field]: value || null })
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-[480px] bg-card border-l border-border flex flex-col h-full overflow-y-auto shadow-xl">
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div>
            <h3 className="font-display text-lg text-text-dark">Niche Findings</h3>
            <p className="text-xs text-text-mid mt-0.5 font-medium">{niche}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-light hover:text-text-dark hover:bg-rose-bg transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5 space-y-5">
          {FINDINGS_FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-xs text-text-mid font-medium mb-1.5">{f.label}</label>
              <textarea
                key={`${finding?.id ?? 'new'}-${f.key}`}
                defaultValue={(finding as any)?.[f.key] ?? ''}
                onBlur={e => save(f.key, e.target.value)}
                rows={3}
                placeholder={`Add ${f.label.toLowerCase()}...`}
                className="w-full resize-none bg-cream border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LeadsTab({ workspaceId }: Props) {
  const [search, setSearch] = useState('')
  const [nicheFilter, setNicheFilter] = useState('All')
  const [ec, setEc] = useState<EC | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', niche: '', company: '' })
  const [nicheInput, setNicheInput] = useState(false)
  const [newNicheName, setNewNicheName] = useState('')
  const [extraNiches, setExtraNiches] = useState<string[]>([])
  const [findingsNiche, setFindingsNiche] = useState<string | null>(null)

  const { data: leads = [], isLoading } = useLeads(workspaceId)
  const addLead = useAddLead()
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()

  const niches = useMemo(() => {
    const fromLeads = leads.map(l => l.niche).filter(Boolean) as string[]
    return [...new Set([...fromLeads, ...extraNiches])].sort()
  }, [leads, extraNiches])

  const filtered = useMemo(
    () =>
      leads.filter(l => {
        const ms =
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          (l.company?.toLowerCase().includes(search.toLowerCase()) ?? false)
        const mn = nicheFilter === 'All' || l.niche === nicheFilter
        return ms && mn
      }),
    [leads, search, nicheFilter],
  )

  const scopedLeads = nicheFilter === 'All' ? leads : leads.filter(l => l.niche === nicheFilter)
  const stats = useMemo(() => {
    const total = scopedLeads.length
    const contacted = scopedLeads.filter(l => l.status && l.status !== 'not_called').length
    const interested = scopedLeads.filter(l => l.status === 'interested' || l.status === 'follow_up').length
    const converted = scopedLeads.filter(l => l.status === 'converted').length
    const rate = total > 0 ? Math.round((converted / total) * 100) : 0
    return { total, contacted, interested, converted, rate }
  }, [scopedLeads])

  function commit(id: string, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    updateLead.mutate({ id, workspace_id: workspaceId, [field]: v || null })
  }

  const isE = (id: string, f: string) => ec?.id === id && ec?.field === f

  function txt(lead: Lead, f: keyof Lead, wide = false) {
    const val = (lead[f] ?? '') as string
    return isE(lead.id, f as string) ? (
      <input
        autoFocus
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => (p ? { ...p, value: e.target.value } : null))}
        onBlur={() => commit(lead.id, f as string)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(lead.id, f as string)
          if (e.key === 'Escape') setEc(null)
        }}
      />
    ) : (
      <span
        className={`cursor-text ${wide ? 'text-text-dark font-medium' : 'text-text-dark text-xs'}`}
        onClick={() => setEc({ id: lead.id, field: f as string, value: val })}
      >
        {val || <span className="text-text-light">—</span>}
      </span>
    )
  }

  function dt(lead: Lead, f: keyof Lead) {
    const val = (lead[f] ?? '') as string
    return isE(lead.id, f as string) ? (
      <input
        autoFocus
        type="date"
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => (p ? { ...p, value: e.target.value } : null))}
        onBlur={() => commit(lead.id, f as string)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(lead.id, f as string)
          if (e.key === 'Escape') setEc(null)
        }}
      />
    ) : (
      <span
        className="cursor-text text-text-dark text-xs"
        onClick={() => setEc({ id: lead.id, field: f as string, value: val })}
      >
        {val
          ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : <span className="text-text-light">—</span>}
      </span>
    )
  }

  function sel(lead: Lead, f: keyof Lead, opts: Opt[]) {
    const val = (lead[f] ?? '') as string
    return isE(lead.id, f as string) ? (
      <select
        autoFocus
        className={SEL}
        value={ec!.value}
        onChange={e => commit(lead.id, f as string, e.target.value)}
        onBlur={() => setEc(null)}
      >
        <option value="">—</option>
        {opts.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    ) : (
      <span className="cursor-pointer" onClick={() => setEc({ id: lead.id, field: f as string, value: val })}>
        <Bdg val={val} opts={opts} />
      </span>
    )
  }

  function addNiche() {
    const n = newNicheName.trim()
    if (n && !niches.includes(n)) setExtraNiches(p => [...p, n])
    setNewNicheName('')
    setNicheInput(false)
  }

  function handleAdd() {
    if (!newLead.name.trim()) return
    const niche = newLead.niche || (nicheFilter !== 'All' ? nicheFilter : null)
    addLead.mutate(
      { name: newLead.name, company: newLead.company || null, niche, workspace_id: workspaceId, status: 'not_called' },
      { onSuccess: () => { setShowAdd(false); setNewLead({ name: '', niche: '', company: '' }) } },
    )
  }

  return (
    <div className="space-y-0">
      {/* Niche sub-nav */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
        {['All', ...niches].map(n => (
          <button
            key={n}
            onClick={() => setNicheFilter(n)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              nicheFilter === n
                ? 'bg-rose text-white border-rose'
                : 'bg-card border-border text-text-mid hover:border-rose hover:text-rose'
            }`}
          >
            {n}
          </button>
        ))}
        {nicheFilter !== 'All' && (
          <button
            onClick={() => setFindingsNiche(nicheFilter)}
            className="text-xs px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
          >
            Niche Findings →
          </button>
        )}
        {nicheInput ? (
          <input
            autoFocus
            value={newNicheName}
            onChange={e => setNewNicheName(e.target.value)}
            onBlur={addNiche}
            onKeyDown={e => {
              if (e.key === 'Enter') addNiche()
              if (e.key === 'Escape') { setNicheInput(false); setNewNicheName('') }
            }}
            placeholder="Niche name..."
            className="text-xs border border-rose rounded-full px-3 py-1.5 outline-none w-32 bg-card"
          />
        ) : (
          <button
            onClick={() => setNicheInput(true)}
            className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-text-light hover:border-rose hover:text-rose transition-colors flex items-center gap-1"
          >
            <Plus size={11} /> Add Niche
          </button>
        )}
      </div>

      {/* Stats + toolbar */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-6 bg-rose-bg/20 flex-wrap">
        {[
          { label: 'Total', val: stats.total },
          { label: 'Contacted', val: stats.contacted },
          { label: 'Interested', val: stats.interested },
          { label: 'Converted', val: stats.converted },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="font-display text-xl text-text-dark">{s.val}</span>
            <span className="text-xs text-text-light">{s.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="font-display text-xl text-sage">{stats.rate}%</span>
          <span className="text-xs text-text-light">Conv. Rate</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <Search size={13} className="text-text-light" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="text-sm bg-transparent outline-none text-text-dark placeholder:text-text-light w-40"
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
          >
            <Plus size={13} /> Add Lead
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3 flex-wrap">
          <input
            autoFocus
            value={newLead.name}
            onChange={e => setNewLead(n => ({ ...n, name: e.target.value }))}
            placeholder="Name *"
            className="flex-1 min-w-32 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          />
          <input
            value={newLead.company}
            onChange={e => setNewLead(n => ({ ...n, company: e.target.value }))}
            placeholder="Company"
            className="flex-1 min-w-32 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          />
          <input
            value={newLead.niche}
            onChange={e => setNewLead(n => ({ ...n, niche: e.target.value }))}
            placeholder={nicheFilter !== 'All' ? nicheFilter : 'Niche'}
            list="niche-datalist"
            className="w-36 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          />
          <datalist id="niche-datalist">
            {niches.map(n => <option key={n} value={n} />)}
          </datalist>
          <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">
            Add
          </button>
          <button
            onClick={() => setShowAdd(false)}
            className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border"
          >
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
              <th className={TH}>Company</th>
              <th className={`${TH} w-28`}>Mobile</th>
              <th className={`${TH} w-8`}>WA</th>
              <th className={`${TH} w-32`}>Status</th>
              <th className={`${TH} w-24`}>Last Contact</th>
              <th className={`${TH} w-24`}>Next Follow Up</th>
              <th className={`${TH} w-28`}>Source</th>
              <th className={`${TH} w-28`}>Best Time</th>
              <th className={`${TH} w-36`}>Response</th>
              <th className={`${TH} w-36`}>Notes</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-4 bg-rose-bg/40 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-text-light text-sm">
                    No leads found.
                  </td>
                </tr>
              )
              : filtered.map(lead => (
                <tr key={lead.id} className="border-b border-border hover:bg-rose-bg/20 group">
                  <td className="px-3 py-2 min-w-36">{txt(lead, 'name', true)}</td>
                  <td className="px-3 py-2 min-w-28">{txt(lead, 'company')}</td>
                  <td className="px-3 py-2 w-28">{txt(lead, 'mobile')}</td>
                  <td className="px-3 py-2 w-8">
                    {isE(lead.id, 'whatsapp') ? (
                      <input
                        autoFocus
                        className={INPUT}
                        style={{ width: 110 }}
                        value={ec!.value}
                        onChange={e => setEc(p => (p ? { ...p, value: e.target.value } : null))}
                        onBlur={() => commit(lead.id, 'whatsapp')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commit(lead.id, 'whatsapp')
                          if (e.key === 'Escape') setEc(null)
                        }}
                      />
                    ) : lead.whatsapp ? (
                      <a
                        href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={lead.whatsapp}
                        className="text-green-500 hover:text-green-600 transition-colors block"
                      >
                        <MessageCircle size={15} />
                      </a>
                    ) : (
                      <button
                        onClick={() => setEc({ id: lead.id, field: 'whatsapp', value: '' })}
                        className="text-text-light opacity-20 hover:opacity-60 hover:text-green-500 transition-all"
                      >
                        <MessageCircle size={15} />
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2">{sel(lead, 'status', STATUS_OPTS)}</td>
                  <td className="px-3 py-2">{dt(lead, 'last_contact')}</td>
                  <td className="px-3 py-2">{dt(lead, 'next_follow_up')}</td>
                  <td className="px-3 py-2">
                    {isE(lead.id, 'source') ? (
                      <select
                        autoFocus
                        className={SEL}
                        value={ec!.value}
                        onChange={e => commit(lead.id, 'source', e.target.value)}
                        onBlur={() => setEc(null)}
                      >
                        <option value="">—</option>
                        {SOURCE_OPTS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="cursor-pointer text-xs text-text-dark"
                        onClick={() => setEc({ id: lead.id, field: 'source', value: lead.source ?? '' })}
                      >
                        {SOURCE_OPTS.find(o => o.value === lead.source)?.label ?? lead.source ?? (
                          <span className="text-text-light">—</span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{txt(lead, 'best_time_to_call')}</td>
                  <td className="px-3 py-2 max-w-[144px]">
                    <div className="line-clamp-1">{txt(lead, 'response')}</div>
                  </td>
                  <td className="px-3 py-2 max-w-[144px]">
                    <div className="line-clamp-1">{txt(lead, 'notes')}</div>
                  </td>
                  <td className="relative w-10">
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      onClick={() => deleteLead.mutate({ id: lead.id, workspaceId })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            <tr>
              <td colSpan={12} className="p-0">
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

      {findingsNiche && (
        <NicheFindingsSheet
          niche={findingsNiche}
          workspaceId={workspaceId}
          onClose={() => setFindingsNiche(null)}
        />
      )}
    </div>
  )
}
