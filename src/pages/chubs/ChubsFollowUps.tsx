import { localDateStr } from '../../lib/utils'
import { useState, useMemo } from 'react'
import { Search, Calendar, MessageCircle, ChevronRight } from 'lucide-react'
import { useCmLeads, useCmNiches, useUpdateCmLead, type CmLead } from '../../hooks/useChubsMedia'
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

function duePill(dateStr: string) {
  const today = localDateStr()
  if (dateStr < today) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Overdue</span>
  if (dateStr === today) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Today</span>
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff <= 3) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">In {diff}d</span>
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
}

function StatusBadge({ val }: { val: string | null }) {
  if (!val) return <span className="text-text-light text-xs">—</span>
  const o = STATUS_OPTS.find(x => x.value === val)
  return o ? <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${o.cls}`}>{o.label}</span>
    : <span className="text-xs text-text-light">{val}</span>
}

function CompanyAvatar({ name }: { name: string | null }) {
  const n = name ?? '?'
  const initials = n.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()
  const palettes = ['bg-rose-light text-rose','bg-amber-100 text-amber-700','bg-blue-100 text-blue-600','bg-emerald-100 text-emerald-700','bg-purple-100 text-purple-600']
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold flex-shrink-0 ${palettes[n.charCodeAt(0) % palettes.length]}`}>
      {initials}
    </span>
  )
}

const TH = 'px-3 py-3 text-left text-[11px] font-semibold text-text-mid uppercase tracking-wider whitespace-nowrap'

export default function ChubsFollowUps() {
  const { data: leads = [], isLoading } = useCmLeads()
  const { data: niches = [] } = useCmNiches()
  const updateLead = useUpdateCmLead()
  const [search, setSearch] = useState('')
  const [editLead, setEditLead] = useState<CmLead | null>(null)
  const [editingStatus, setEditingStatus] = useState<number | null>(null)

  const followUps = useMemo(() => {
    const q = search.toLowerCase()
    return leads
      .filter(l =>
        l.next_follow_up != null &&
        l.follow_up_status !== 'converted' &&
        (!q || (l.company_name ?? '').toLowerCase().includes(q) || (l.contact_name ?? '').toLowerCase().includes(q))
      )
      .sort((a, b) => (a.next_follow_up ?? '').localeCompare(b.next_follow_up ?? ''))
  }, [leads, search])

  const today = localDateStr()
  const overdue = followUps.filter(l => (l.next_follow_up ?? '') < today).length
  const dueToday = followUps.filter(l => l.next_follow_up === today).length

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-card border-b border-border px-8 pt-6 pb-6">
        <div className="flex items-center gap-1.5 text-xs text-text-light mb-3">
          <span>Client Acquisition</span>
          <ChevronRight size={12} />
          <span className="text-text-dark font-medium">Follow Ups</span>
        </div>
        <h1 className="font-display text-[26px] font-bold text-text-dark">Follow Ups</h1>
        <p className="text-text-mid text-sm mt-1">Leads sorted by follow-up date — oldest first.</p>
      </div>

      <div className="px-8 py-6 space-y-4">
        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Follow Ups', val: followUps.length, color: 'text-text-dark' },
            { label: 'Due Today',        val: dueToday,         color: 'text-amber-600' },
            { label: 'Overdue',          val: overdue,          color: 'text-red-500'   },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-card border border-border px-5 py-4">
              <p className="text-[11px] text-text-light mb-1">{s.label}</p>
              <p className={`font-display text-[30px] font-bold leading-none ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-card rounded-card border border-border px-4 py-3 flex items-center gap-2">
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-white focus-within:border-rose/40 transition-colors flex-1 max-w-xs">
            <Search size={12} className="text-text-light shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by company or contact..."
              className="text-xs bg-transparent outline-none text-text-dark placeholder:text-text-light flex-1"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-rose-bg/20">
                  <th className={TH}>Company</th>
                  <th className={TH}>Contact</th>
                  <th className={TH}>Phone</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Next Follow Up</th>
                  <th className={TH}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-3 py-3"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : followUps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <Calendar size={32} className="mx-auto mb-3 text-text-light opacity-30" />
                      <p className="text-text-light text-sm">No follow-ups scheduled.</p>
                    </td>
                  </tr>
                ) : (
                  followUps.map(lead => (
                    <tr
                      key={lead.id}
                      className="border-b border-border hover:bg-rose-bg/10 transition-colors cursor-pointer group"
                      onClick={() => setEditLead(lead)}
                    >
                      <td className="px-3 py-3 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <CompanyAvatar name={lead.company_name} />
                          <span className="text-[13px] font-medium text-text-dark truncate">{lead.company_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-text-dark">{lead.contact_name || '—'}</td>
                      <td className="px-3 py-3 text-xs text-text-dark">{lead.phone || '—'}</td>
                      <td className="px-3 py-3">
                        {editingStatus === lead.id ? (
                          <select
                            autoFocus
                            className="bg-white border border-rose rounded-lg px-2 py-1 text-xs outline-none"
                            value={lead.follow_up_status ?? ''}
                            onChange={e => {
                              updateLead.mutate({ id: lead.id, follow_up_status: e.target.value || null })
                              setEditingStatus(null)
                            }}
                            onBlur={() => setEditingStatus(null)}
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="">—</option>
                            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <span onClick={e => { e.stopPropagation(); setEditingStatus(lead.id) }} className="cursor-pointer">
                            <StatusBadge val={lead.follow_up_status} />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {duePill(lead.next_follow_up!)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {lead.notes
                          ? <span title={lead.notes ?? ''}><MessageCircle size={14} className="text-text-mid" /></span>
                          : <MessageCircle size={14} className="text-text-light opacity-20" />}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editLead !== null && (
        <AddEditLeadModal
          lead={editLead}
          niches={niches}
          onClose={() => setEditLead(null)}
        />
      )}
    </div>
  )
}
