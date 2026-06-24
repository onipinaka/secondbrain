import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import {
  Search, Plus, Upload, Calendar, MessageCircle,
  MoreHorizontal, Trash2, ChevronLeft, ChevronRight, Edit2,
} from 'lucide-react'
import {
  useCmNiches, useCmLeads, useUpdateCmLead, useDeleteCmLead,
  type CmLead,
} from '../../hooks/useChubsMedia'
import AddEditLeadModal from './AddEditLeadModal'

const STATUS_OPTS = [
  { value: 'not_called',     label: 'Not Called',     cls: 'bg-gray-100 text-gray-500' },
  { value: 'called',         label: 'Called',         cls: 'bg-blue-100 text-blue-600' },
  { value: 'interested',     label: 'Interested',     cls: 'bg-green-100 text-green-700' },
  { value: 'not_interested', label: 'Not Interested', cls: 'bg-red-100 text-red-500' },
  { value: 'follow_up',      label: 'Follow Up',      cls: 'bg-amber-100 text-amber-700' },
  { value: 'converted',      label: 'Converted',      cls: 'bg-emerald-100 text-emerald-700' },
  { value: 'lost',           label: 'Lost',           cls: 'bg-red-50 text-red-300' },
]

const PAGE_SIZES = [10, 25, 50]

type EC = { id: number; field: string; value: string }

function StatusBadge({ val }: { val: string | null | undefined }) {
  if (!val) return <span className="text-text-light text-xs">—</span>
  const o = STATUS_OPTS.find(x => x.value === val)
  return o
    ? <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${o.cls}`}>{o.label}</span>
    : <span className="text-text-light text-xs">{val}</span>
}

function CompanyAvatar({ name }: { name: string | null }) {
  const n = name ?? '?'
  const initials = n.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
  const palettes = [
    'bg-rose-light text-rose',
    'bg-amber-100 text-amber-700',
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-700',
    'bg-purple-100 text-purple-600',
    'bg-pink-100 text-pink-600',
    'bg-sky-100 text-sky-600',
    'bg-orange-100 text-orange-600',
  ]
  const color = palettes[n.charCodeAt(0) % palettes.length]
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold flex-shrink-0 ${color}`}>
      {initials}
    </span>
  )
}

function paginationPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

const TH = 'px-3 py-3 text-left text-[11px] font-semibold text-text-mid uppercase tracking-wider whitespace-nowrap'
const INPUT = 'bg-white border border-rose/60 rounded-lg px-2 py-1 text-sm outline-none w-full focus:border-rose'

export default function ChubsLeadList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(() => {
    const fromParam = searchParams.get('status')
    if (fromParam) return fromParam
    if (location.pathname.includes('/interested')) return 'interested'
    if (location.pathname.includes('/converted')) return 'converted'
    return 'All'
  })
  const [nicheFilter, setNicheFilter] = useState<number | 'All'>(() => {
    const nid = searchParams.get('niche_id')
    return nid ? Number(nid) : 'All'
  })

  useEffect(() => {
    const fromParam = searchParams.get('status')
    if (fromParam) { setStatusFilter(fromParam); return }
    if (location.pathname.includes('/interested')) { setStatusFilter('interested'); return }
    if (location.pathname.includes('/converted')) { setStatusFilter('converted'); return }
    setStatusFilter('All')
  }, [location.pathname, searchParams])

  useEffect(() => {
    const nid = searchParams.get('niche_id')
    setNicheFilter(nid ? Number(nid) : 'All')
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setEditLead('new')
      setSearchParams(p => { p.delete('add'); return p }, { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [ec, setEc] = useState<EC | null>(null)
  const [editLead, setEditLead] = useState<CmLead | 'new' | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [actionsFor, setActionsFor] = useState<number | null>(null)

  const { data: niches = [] } = useCmNiches()
  const { data: leads = [], isLoading } = useCmLeads()
  const updateLead = useUpdateCmLead()
  const deleteLead = useDeleteCmLead()

  const stats = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const today = now.toISOString().slice(0, 10)
    const scoped = nicheFilter === 'All' ? leads : leads.filter(l => l.niche_id === nicheFilter)
    const total = scoped.length
    const newThisWeek = scoped.filter(l => new Date(l.created_at) > weekAgo).length
    const followUps = scoped.filter(l => l.follow_up_status === 'follow_up').length
    const dueToday = scoped.filter(l => l.follow_up_status === 'follow_up' && l.next_follow_up === today).length
    const interested = scoped.filter(l => l.follow_up_status === 'interested').length
    const converted = scoped.filter(l => l.follow_up_status === 'converted').length
    return { total, newThisWeek, followUps, dueToday, interested, converted }
  }, [leads, nicheFilter])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return leads.filter(l => {
      const matchNiche = nicheFilter === 'All' || l.niche_id === nicheFilter
      const matchStatus = statusFilter === 'All' || l.follow_up_status === statusFilter
      const matchSearch =
        !q ||
        (l.company_name ?? '').toLowerCase().includes(q) ||
        (l.contact_name ?? '').toLowerCase().includes(q) ||
        (l.email ?? '').toLowerCase().includes(q) ||
        (l.instagram ?? '').toLowerCase().includes(q)
      return matchNiche && matchStatus && matchSearch
    })
  }, [leads, nicheFilter, statusFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const selectedNiche = nicheFilter !== 'All' ? niches.find(n => n.niche_id === nicheFilter) : null

  function commit(id: number, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateLead.mutate({ id, [field]: v || null } as any)
  }

  const isE = (id: number, f: string) => ec?.id === id && ec?.field === f

  function txt(lead: CmLead, f: keyof CmLead, wide = false) {
    const val = (lead[f] ?? '') as string
    return isE(lead.id, f as string) ? (
      <input
        autoFocus
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
        onBlur={() => commit(lead.id, f as string)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(lead.id, f as string)
          if (e.key === 'Escape') setEc(null)
        }}
      />
    ) : (
      <span
        className={`cursor-text block truncate ${wide ? 'text-text-dark font-medium text-[13px]' : 'text-text-dark text-xs'}`}
        onClick={e => { e.stopPropagation(); setEc({ id: lead.id, field: f as string, value: val }) }}
      >
        {val || <span className="text-text-light">—</span>}
      </span>
    )
  }

  function toggleAll() {
    if (selected.size === paginated.length && paginated.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginated.map(l => l.id)))
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="bg-card border-b border-border px-8 pt-6 pb-6 relative overflow-hidden">
        <div className="flex items-center gap-1.5 text-xs text-text-light mb-3">
          <span className="hover:text-rose cursor-pointer transition-colors">Client Acquisition</span>
          <span>›</span>
          {selectedNiche && (
            <>
              <span className="hover:text-rose cursor-pointer transition-colors">{selectedNiche.name}</span>
              <span>›</span>
            </>
          )}
          <span className="text-text-dark font-medium">Lead List</span>
        </div>

        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-display text-[28px] font-bold text-text-dark flex items-center gap-2 leading-tight">
              Lead List <span className="text-xl">✨</span>
            </h1>
            <p className="text-text-mid text-sm mt-1.5">All your potential clients in one place.</p>
          </div>

          <div className="hidden lg:flex items-start gap-3 flex-shrink-0">
            <div className="w-28 h-[72px] bg-gradient-to-br from-rose-bg via-rose-light/30 to-cream rounded-xl border border-border/60 flex items-center justify-center shadow-sm">
              <div className="text-center">
                <p className="font-display text-[11px] font-bold text-text-dark leading-tight">CHUBS</p>
                <p className="font-display text-[11px] font-bold text-text-dark leading-tight">MEDIA</p>
              </div>
            </div>
            <div className="bg-rose-light/50 border border-rose/20 rounded-xl p-3 text-[11px] text-text-dark max-w-[110px] leading-relaxed italic shadow-sm">
              "One call can change everything ♥"
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Leads', val: stats.total,       sub: '',                                                 color: 'text-text-dark'   },
            { label: 'New Leads',   val: stats.newThisWeek, sub: '↑ this week',                                      color: 'text-rose'        },
            { label: 'Follow Ups',  val: stats.followUps,   sub: stats.dueToday > 0 ? `↑ ${stats.dueToday} due today` : '', color: 'text-amber-600' },
            { label: 'Interested',  val: stats.interested,  sub: '↑ this week',                                      color: 'text-emerald-600' },
            { label: 'Converted',   val: stats.converted,   sub: '↑ this week',                                      color: 'text-rose'        },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-card border border-border px-5 py-4">
              <p className="text-[11px] text-text-light mb-1">{s.label}</p>
              <p className={`font-display text-[32px] font-bold leading-none ${s.color}`}>{s.val}</p>
              {s.sub && <p className="text-[11px] text-text-light mt-1.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-card rounded-card border border-border px-4 py-3 flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="text-xs border border-border rounded-lg px-3 py-2 bg-white outline-none text-text-dark hover:border-rose/40 transition-colors"
          >
            <option value="All">All Follow Up Status</option>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={nicheFilter === 'All' ? 'All' : nicheFilter}
            onChange={e => { setNicheFilter(e.target.value === 'All' ? 'All' : Number(e.target.value)); setPage(1) }}
            className="text-xs border border-border rounded-lg px-3 py-2 bg-white outline-none text-text-dark hover:border-rose/40 transition-colors"
          >
            <option value="All">All Niches</option>
            {niches.map(n => <option key={n.niche_id} value={n.niche_id}>{n.name}</option>)}
          </select>

          <select className="text-xs border border-border rounded-lg px-3 py-2 bg-white outline-none text-text-dark">
            <option>All Owners</option>
            <option>Vivek</option>
          </select>

          <select className="text-xs border border-border rounded-lg px-3 py-2 bg-white outline-none text-text-dark">
            <option>All Time</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>

          <div className="flex-1 min-w-[160px] flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white focus-within:border-rose/40 transition-colors">
            <Search size={12} className="text-text-light flex-shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search leads..."
              className="text-xs bg-transparent outline-none text-text-dark placeholder:text-text-light flex-1 min-w-0"
            />
          </div>

          <button className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-2 text-text-mid hover:border-rose/40 hover:text-rose transition-colors">
            <Upload size={12} />
            Import Leads
          </button>

          <button
            onClick={() => setEditLead('new')}
            className="flex items-center gap-1.5 text-xs bg-rose text-white rounded-lg px-4 py-2 hover:opacity-90 transition-opacity font-medium"
          >
            <Plus size={13} />
            New Lead
          </button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-rose-bg/20">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && selected.size === paginated.length}
                      onChange={toggleAll}
                      className="accent-rose rounded w-3.5 h-3.5"
                    />
                  </th>
                  <th className={TH}>Company</th>
                  <th className={TH}>Contact Name</th>
                  <th className={TH}>Phone</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Instagram</th>
                  <th className={TH}>Follow Up Status</th>
                  <th className={TH}>Next Follow Up</th>
                  <th className={TH}>Owner</th>
                  <th className={TH}>Notes</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-4 bg-rose-bg/40 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-14 text-center">
                      <p className="text-text-light text-sm">No leads found.</p>
                      <button
                        onClick={() => setEditLead('new')}
                        className="mt-3 text-xs text-rose hover:underline"
                      >
                        Add your first lead →
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginated.map(lead => (
                    <tr
                      key={lead.id}
                      className={`border-b border-border hover:bg-rose-bg/10 group transition-colors cursor-pointer ${selected.has(lead.id) ? 'bg-rose-bg/20' : ''}`}
                      onClick={() => { setActionsFor(null); setEditLead(lead) }}
                    >
                      <td className="px-4 py-3 w-10" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(lead.id)}
                          onChange={() => setSelected(p => {
                            const n = new Set(p)
                            if (n.has(lead.id)) n.delete(lead.id); else n.add(lead.id)
                            return n
                          })}
                          className="accent-rose rounded w-3.5 h-3.5"
                        />
                      </td>

                      {/* Company */}
                      <td className="px-3 py-3 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <CompanyAvatar name={lead.company_name} />
                          {txt(lead, 'company_name', true)}
                        </div>
                      </td>

                      {/* Contact Name */}
                      <td className="px-3 py-3 min-w-[120px]">
                        {txt(lead, 'contact_name')}
                      </td>

                      {/* Phone */}
                      <td className="px-3 py-3 min-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          {lead.phone ? (
                            <a
                              href={`https://wa.me/${(lead.phone).replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-500 hover:text-green-600 flex-shrink-0 transition-colors"
                              onClick={e => e.stopPropagation()}
                            >
                              <MessageCircle size={13} />
                            </a>
                          ) : (
                            <span className="text-text-light/30">
                              <MessageCircle size={13} />
                            </span>
                          )}
                          {txt(lead, 'phone')}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-3 py-3 min-w-[160px] max-w-[180px]">
                        {isE(lead.id, 'email') ? (
                          <input
                            autoFocus
                            className={INPUT}
                            value={ec!.value}
                            onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                            onBlur={() => commit(lead.id, 'email')}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commit(lead.id, 'email')
                              if (e.key === 'Escape') setEc(null)
                            }}
                          />
                        ) : lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-xs text-blue-600 hover:underline truncate block"
                            onClick={e => e.stopPropagation()}
                            onDoubleClick={() => setEc({ id: lead.id, field: 'email', value: lead.email ?? '' })}
                          >
                            {lead.email}
                          </a>
                        ) : (
                          <span
                            className="text-text-light text-xs cursor-text"
                            onClick={e => { e.stopPropagation(); setEc({ id: lead.id, field: 'email', value: '' }) }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Instagram */}
                      <td className="px-3 py-3 min-w-[120px]">
                        {isE(lead.id, 'instagram') ? (
                          <input
                            autoFocus
                            className={INPUT}
                            value={ec!.value}
                            onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                            onBlur={() => commit(lead.id, 'instagram')}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commit(lead.id, 'instagram')
                              if (e.key === 'Escape') setEc(null)
                            }}
                          />
                        ) : lead.instagram ? (
                          <a
                            href={`https://instagram.com/${(lead.instagram).replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-rose hover:underline truncate block"
                            onClick={e => e.stopPropagation()}
                            onDoubleClick={() => setEc({ id: lead.id, field: 'instagram', value: lead.instagram ?? '' })}
                          >
                            {lead.instagram.startsWith('@') ? lead.instagram : `@${lead.instagram}`}
                          </a>
                        ) : (
                          <span
                            className="text-text-light text-xs cursor-text"
                            onClick={e => { e.stopPropagation(); setEc({ id: lead.id, field: 'instagram', value: '' }) }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Follow Up Status */}
                      <td className="px-3 py-3">
                        {isE(lead.id, 'follow_up_status') ? (
                          <select
                            autoFocus
                            className="bg-white border border-rose rounded-lg px-2 py-1 text-xs outline-none"
                            value={ec!.value}
                            onChange={e => commit(lead.id, 'follow_up_status', e.target.value)}
                            onBlur={() => setEc(null)}
                          >
                            <option value="">—</option>
                            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <span
                            className="cursor-pointer"
                            onClick={e => { e.stopPropagation(); setEc({ id: lead.id, field: 'follow_up_status', value: lead.follow_up_status ?? '' }) }}
                          >
                            <StatusBadge val={lead.follow_up_status} />
                          </span>
                        )}
                      </td>

                      {/* Next Follow Up */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isE(lead.id, 'next_follow_up') ? (
                          <input
                            autoFocus
                            type="date"
                            className="bg-white border border-rose rounded-lg px-2 py-1 text-xs outline-none w-[130px]"
                            value={ec!.value}
                            onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
                            onBlur={() => commit(lead.id, 'next_follow_up')}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commit(lead.id, 'next_follow_up')
                              if (e.key === 'Escape') setEc(null)
                            }}
                          />
                        ) : (
                          <span
                            className="flex items-center gap-1.5 text-xs text-text-dark cursor-text"
                            onClick={e => { e.stopPropagation(); setEc({ id: lead.id, field: 'next_follow_up', value: lead.next_follow_up ?? '' }) }}
                          >
                            {lead.next_follow_up ? (
                              <>
                                <Calendar size={12} className="text-text-light flex-shrink-0" />
                                {new Date(lead.next_follow_up + 'T00:00:00').toLocaleDateString('en-US', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })}
                              </>
                            ) : (
                              <span className="text-text-light">—</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="px-3 py-3 text-xs text-text-dark">Vivek</td>

                      {/* Notes */}
                      <td className="px-3 py-3">
                        {lead.notes ? (
                          <span
                            title={lead.notes}
                            className="cursor-pointer text-text-mid hover:text-rose transition-colors"
                            onClick={e => { e.stopPropagation(); setEc({ id: lead.id, field: 'notes', value: lead.notes ?? '' }) }}
                          >
                            <MessageCircle size={14} />
                          </span>
                        ) : (
                          <span
                            className="text-text-light/30 cursor-pointer hover:text-text-light transition-colors"
                            onClick={e => { e.stopPropagation(); setEc({ id: lead.id, field: 'notes', value: '' }) }}
                          >
                            <MessageCircle size={14} />
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setActionsFor(actionsFor === lead.id ? null : lead.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-text-dark p-1 rounded-lg hover:bg-rose-bg"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {actionsFor === lead.id && (
                          <div className="absolute right-2 top-10 z-30 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[110px]">
                            <button
                              onClick={() => {
                                setEditLead(lead)
                                setActionsFor(null)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-dark hover:bg-rose-bg transition-colors"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => {
                                deleteLead.mutate(lead.id)
                                setActionsFor(null)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-text-light">
              Showing{' '}
              {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, filtered.length)} of {filtered.length} leads
            </p>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-mid hover:border-rose/60 hover:text-rose disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={13} />
              </button>
              {paginationPages(page, totalPages).map((pg, i) =>
                pg === '...' ? (
                  <span key={`e${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-text-light">…</span>
                ) : (
                  <button
                    key={pg}
                    onClick={() => setPage(pg as number)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs border transition-colors ${
                      page === pg
                        ? 'bg-rose text-white border-rose'
                        : 'border-border text-text-mid hover:border-rose/60 hover:text-rose'
                    }`}
                  >
                    {pg}
                  </button>
                )
              )}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-mid hover:border-rose/60 hover:text-rose disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-light">
              Rows per page:
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border border-border rounded-lg px-2 py-1 bg-white outline-none text-text-dark text-xs"
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Inline notes edit overlay */}
      {ec?.field === 'notes' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={() => commit(leads.find(l => l.id === ec.id)?.id ?? 0, 'notes')}>
          <div className="bg-card rounded-card border border-border shadow-xl p-4 w-80" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-medium text-text-mid mb-2">Notes</p>
            <textarea
              autoFocus
              rows={4}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose resize-none bg-cream"
              value={ec.value}
              onChange={e => setEc(p => p ? { ...p, value: e.target.value } : null)}
              onKeyDown={e => {
                if (e.key === 'Escape') setEc(null)
              }}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => commit(ec.id, 'notes')}
                className="flex-1 bg-rose text-white text-xs py-2 rounded-lg hover:opacity-90"
              >
                Save
              </button>
              <button
                onClick={() => setEc(null)}
                className="px-4 text-xs border border-border rounded-lg text-text-mid hover:border-rose"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Lead Modal */}
      {editLead !== null && (
        <AddEditLeadModal
          lead={editLead === 'new' ? null : editLead}
          niches={niches}
          onClose={() => setEditLead(null)}
        />
      )}

      {actionsFor !== null && (
        <div className="fixed inset-0 z-20" onClick={() => setActionsFor(null)} />
      )}
    </div>
  )
}
