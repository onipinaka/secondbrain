import { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, Trash2, Mail, Paperclip, ChevronRight } from 'lucide-react'
import {
  useCmNiches,
  useAddCmNiche,
  useDeleteCmNiche,
  useCmCampaigns,
  useAddCmCampaign,
  useUpdateCmCampaign,
  useDeleteCmCampaign,
  useCmCampaignContacts,
  useAddCmCampaignContact,
  useDeleteCmCampaignContact,
} from '../../hooks/useChubsMedia'

const STATUS_META: Record<string, { label: string; badgeCls: string; btnCls: string }> = {
  not_started: { label: 'Not Started', badgeCls: 'bg-gray-100 text-gray-600',   btnCls: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
  active:      { label: 'Active',      badgeCls: 'bg-amber-100 text-amber-700', btnCls: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  completed:   { label: 'Completed',   badgeCls: 'bg-green-100 text-green-700', btnCls: 'bg-green-100 text-green-700 hover:bg-green-200' },
}
const STATUS_ORDER = ['not_started', 'active', 'completed'] as const

const NICHE_COLORS = [
  'bg-rose-100 text-rose-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
]

function nicheColor(idx: number) {
  return NICHE_COLORS[idx % NICHE_COLORS.length]
}

interface NewCampaignForm {
  name: string
  subject: string
  niche_id: number | null
  content: string
  attachment: string
}

interface EditCampaignForm {
  name: string
  subject: string
  niche_id: number | null
  content: string
  attachment: string
  status: string
  replied_count: number
}

interface NewContactForm {
  email: string
  company_name: string
  contact_name: string
  niche_id: number | null
}

const BLANK_CAMPAIGN: NewCampaignForm = {
  name: '', subject: '', niche_id: null, content: '', attachment: '',
}

const BLANK_CONTACT: NewContactForm = {
  email: '', company_name: '', contact_name: '', niche_id: null,
}

const FIELD = 'w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-rose-300'

export default function ChubsEmailOutreach() {
  const { data: niches = [] } = useCmNiches()
  const addNiche = useAddCmNiche()
  const deleteNiche = useDeleteCmNiche()
  const [nicheInput, setNicheInput] = useState('')
  const [addingNiche, setAddingNiche] = useState(false)

  function handleAddNiche() {
    const name = nicheInput.trim()
    if (!name) return
    const maxId = niches.reduce((m, n) => Math.max(m, n.niche_id), 0)
    addNiche.mutate({ name, niche_id: maxId + 1 }, {
      onSuccess: () => { setNicheInput(''); setAddingNiche(false) },
    })
  }

  const { data: campaigns = [], isLoading } = useCmCampaigns()
  const addCampaign = useAddCmCampaign()
  const updateCampaign = useUpdateCmCampaign()
  const deleteCampaign = useDeleteCmCampaign()

  const [selectedId, setSelectedId] = useState<number | 'new' | null>(null)
  const [newForm, setNewForm] = useState<NewCampaignForm>(BLANK_CAMPAIGN)
  const [editForm, setEditForm] = useState<EditCampaignForm>({
    name: '', subject: '', niche_id: null, content: '', attachment: '', status: 'not_started', replied_count: 0,
  })
  const editFormRef = useRef<EditCampaignForm>(editForm)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selected = useMemo(
    () => campaigns.find(c => c.id === selectedId) ?? null,
    [campaigns, selectedId],
  )

  // Sync editForm when switching campaigns; cancel any pending save
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (selected) {
      const form: EditCampaignForm = {
        name: selected.name,
        subject: selected.subject ?? '',
        niche_id: selected.niche_id,
        content: selected.content ?? '',
        attachment: selected.attachment ?? '',
        status: selected.status,
        replied_count: selected.replied_count,
      }
      setEditForm(form)
      editFormRef.current = form
    }
  // only fire when campaign ID changes, not on every re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id])

  function handleEditChange(updates: Partial<EditCampaignForm>) {
    const campaignId = selected?.id
    if (!campaignId) return
    setEditForm(prev => {
      const next = { ...prev, ...updates }
      editFormRef.current = next
      return next
    })
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!editFormRef.current.name.trim()) return
      updateCampaign.mutate({ id: campaignId, ...editFormRef.current })
    }, 600)
  }

  function cycleStatus() {
    if (!selected) return
    const idx = STATUS_ORDER.indexOf(editForm.status as typeof STATUS_ORDER[number])
    const newStatus = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
    setEditForm(p => ({ ...p, status: newStatus }))
    editFormRef.current = { ...editFormRef.current, status: newStatus }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    updateCampaign.mutate({ id: selected.id, status: newStatus })
  }

  // Contacts
  const { data: contacts = [] } = useCmCampaignContacts(
    typeof selectedId === 'number' ? selectedId : null,
  )
  const addContact = useAddCmCampaignContact()
  const deleteContact = useDeleteCmCampaignContact()
  const [contactForm, setContactForm] = useState<NewContactForm>(BLANK_CONTACT)
  const [addingContact, setAddingContact] = useState(false)

  const nicheMap = useMemo(
    () => Object.fromEntries(niches.map((n, i) => [n.niche_id, { ...n, colorIdx: i }])),
    [niches],
  )

  function handleCreateCampaign() {
    if (!newForm.name.trim()) return
    addCampaign.mutate(
      { ...newForm, status: 'not_started', replied_count: 0 },
      {
        onSuccess: (id) => {
          setSelectedId(id)
          setNewForm(BLANK_CAMPAIGN)
        },
      },
    )
  }

  function handleAddContact() {
    if (!contactForm.email.trim() && !contactForm.company_name.trim()) return
    if (typeof selectedId !== 'number') return
    addContact.mutate(
      { campaign_id: selectedId, ...contactForm },
      {
        onSuccess: () => {
          setContactForm(BLANK_CONTACT)
          setAddingContact(false)
        },
      },
    )
  }

  function handleDeleteCampaign() {
    if (!selected) return
    deleteCampaign.mutate(selected.id, {
      onSuccess: () => setSelectedId(null),
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Chubs Media <ChevronRight size={12} /> Client Acquisition
          </p>
          <h1 className="text-xl font-display font-semibold">Email Outreach</h1>
        </div>
        <button
          onClick={() => { setSelectedId('new'); setAddingContact(false) }}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
        >
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Campaign list ── */}
        <div className="w-72 border-r border-border flex flex-col shrink-0">
          <div className="px-4 py-2.5 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <p className="px-4 py-4 text-sm text-muted-foreground">Loading...</p>
            )}
            {!isLoading && campaigns.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No campaigns yet.
              </p>
            )}
            {campaigns.map(c => {
              const niche = c.niche_id != null ? nicheMap[c.niche_id] : null
              const isActive = selectedId === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedId(c.id); setAddingContact(false) }}
                  className={`w-full text-left px-4 py-3 transition-colors border-l-2 hover:bg-accent ${
                    isActive ? 'bg-rose-50 border-l-rose-500' : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium line-clamp-1 text-foreground">{c.name}</p>
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      (STATUS_META[c.status] ?? STATUS_META.not_started).badgeCls
                    }`}>
                      {(STATUS_META[c.status] ?? STATUS_META.not_started).label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {niche && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${nicheColor(niche.colorIdx)}`}>
                        {niche.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {c.replied_count} replied
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* ── Niches panel ── */}
          <div className="border-t border-border shrink-0">
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Niches</p>
              <button
                onClick={() => setAddingNiche(v => !v)}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium"
              >
                {addingNiche ? 'Cancel' : '+ Add'}
              </button>
            </div>
            {addingNiche && (
              <div className="px-4 pb-2 flex gap-2">
                <input
                  value={nicheInput}
                  onChange={e => setNicheInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNiche()}
                  placeholder="Niche name"
                  className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
                  autoFocus
                />
                <button
                  onClick={handleAddNiche}
                  disabled={!nicheInput.trim() || addNiche.isPending}
                  className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-medium hover:bg-rose-600 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
            <div className="px-4 pb-3 max-h-40 overflow-y-auto space-y-1">
              {niches.length === 0 && (
                <p className="text-xs text-muted-foreground py-1">No niches yet.</p>
              )}
              {niches.map((n, i) => (
                <div key={n.niche_id} className="flex items-center justify-between group">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${nicheColor(i)}`}>
                    {n.name}
                  </span>
                  <button
                    onClick={() => deleteNiche.mutate(n.niche_id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Detail panel ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Empty state */}
          {selectedId === null && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <Mail size={44} className="opacity-15" />
              <p className="text-sm">Select a campaign or create a new one</p>
            </div>
          )}

          {/* New campaign form */}
          {selectedId === 'new' && (
            <div className="p-6 max-w-2xl">
              <h2 className="text-base font-semibold mb-5">New Campaign</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Campaign Name *</label>
                  <input
                    value={newForm.name}
                    onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleCreateCampaign()}
                    className={FIELD}
                    placeholder="e.g. June Fitness Gyms"
                    autoFocus
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Subject Line</label>
                  <input
                    value={newForm.subject}
                    onChange={e => setNewForm(p => ({ ...p, subject: e.target.value }))}
                    className={FIELD}
                    placeholder="We help gyms get more members — quick intro"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Niche</label>
                  <select
                    value={newForm.niche_id ?? ''}
                    onChange={e => setNewForm(p => ({ ...p, niche_id: e.target.value ? Number(e.target.value) : null }))}
                    className={FIELD}
                  >
                    <option value="">— none —</option>
                    {niches.map(n => <option key={n.niche_id} value={n.niche_id}>{n.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                    <Paperclip size={11} /> Attachment (filename / link)
                  </label>
                  <input
                    value={newForm.attachment}
                    onChange={e => setNewForm(p => ({ ...p, attachment: e.target.value }))}
                    className={FIELD}
                    placeholder="portfolio.pdf or drive.google.com/..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Email Body</label>
                  <textarea
                    value={newForm.content}
                    onChange={e => setNewForm(p => ({ ...p, content: e.target.value }))}
                    rows={10}
                    className={`${FIELD} resize-none`}
                    placeholder={`Hi {name},\n\nI came across {company} and loved what you're doing...\n\nWould love to connect!`}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleCreateCampaign}
                  disabled={!newForm.name.trim() || addCampaign.isPending}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-40 transition-colors"
                >
                  {addCampaign.isPending ? 'Creating...' : 'Create Campaign'}
                </button>
                <button
                  onClick={() => { setSelectedId(null); setNewForm(BLANK_CAMPAIGN) }}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Campaign detail */}
          {selected && (
            <div className="p-6 max-w-3xl">

              {/* Title row */}
              <div className="flex items-center gap-3 mb-5">
                <input
                  value={editForm.name}
                  onChange={e => handleEditChange({ name: e.target.value })}
                  className="flex-1 text-xl font-semibold bg-transparent border-none outline-none focus:ring-0 p-0"
                />
                <div className="flex items-center gap-2 shrink-0">
                  {updateCampaign.isPending && (
                    <span className="text-xs text-muted-foreground">Saving...</span>
                  )}
                  <button
                    onClick={cycleStatus}
                    title="Click to cycle status"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      (STATUS_META[editForm.status] ?? STATUS_META.not_started).btnCls
                    }`}
                  >
                    {(STATUS_META[editForm.status] ?? STATUS_META.not_started).label}
                  </button>
                  <button
                    onClick={handleDeleteCampaign}
                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete campaign"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Campaign fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Subject Line</label>
                  <input
                    value={editForm.subject}
                    onChange={e => handleEditChange({ subject: e.target.value })}
                    className={FIELD}
                    placeholder="Email subject line"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Niche</label>
                  <select
                    value={editForm.niche_id ?? ''}
                    onChange={e => handleEditChange({ niche_id: e.target.value ? Number(e.target.value) : null })}
                    className={FIELD}
                  >
                    <option value="">— none —</option>
                    {niches.map(n => <option key={n.niche_id} value={n.niche_id}>{n.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                    <Paperclip size={11} /> Attachment
                  </label>
                  <input
                    value={editForm.attachment}
                    onChange={e => handleEditChange({ attachment: e.target.value })}
                    className={FIELD}
                    placeholder="portfolio.pdf or link"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Replied <span className="font-normal text-muted-foreground">(enter manually)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.replied_count}
                    onChange={e => handleEditChange({ replied_count: Math.max(0, Number(e.target.value)) })}
                    className={FIELD}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Email Body / Template</label>
                <textarea
                  value={editForm.content}
                  onChange={e => handleEditChange({ content: e.target.value })}
                  rows={10}
                  className={`${FIELD} resize-none`}
                  placeholder="Hi {name}, ..."
                />
              </div>

              {/* ── Contacts ── */}
              <div className="border-t border-border pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">
                    Contacts{' '}
                    <span className="text-muted-foreground font-normal">({contacts.length})</span>
                  </h3>
                  <button
                    onClick={() => {
                      setContactForm({ ...BLANK_CONTACT, niche_id: editForm.niche_id })
                      setAddingContact(true)
                    }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-medium transition-colors"
                  >
                    <Plus size={12} /> Add Contact
                  </button>
                </div>

                {/* Add contact form */}
                {addingContact && (
                  <div className="bg-accent rounded-lg p-3 mb-3 grid grid-cols-2 gap-2">
                    <input
                      value={contactForm.email}
                      onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email"
                      className={FIELD}
                      autoFocus
                    />
                    <input
                      value={contactForm.company_name}
                      onChange={e => setContactForm(p => ({ ...p, company_name: e.target.value }))}
                      placeholder="Company name"
                      className={FIELD}
                    />
                    <input
                      value={contactForm.contact_name}
                      onChange={e => setContactForm(p => ({ ...p, contact_name: e.target.value }))}
                      placeholder="Contact / person name"
                      className={FIELD}
                      onKeyDown={e => e.key === 'Enter' && handleAddContact()}
                    />
                    <div className="flex gap-2">
                      <select
                        value={contactForm.niche_id ?? ''}
                        onChange={e => setContactForm(p => ({ ...p, niche_id: e.target.value ? Number(e.target.value) : null }))}
                        className={`${FIELD} flex-1`}
                      >
                        <option value="">Niche</option>
                        {niches.map(n => <option key={n.niche_id} value={n.niche_id}>{n.name}</option>)}
                      </select>
                      <button
                        onClick={handleAddContact}
                        disabled={addContact.isPending}
                        className="px-3 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50 shrink-0 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setAddingContact(false); setContactForm(BLANK_CONTACT) }}
                        className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-background shrink-0 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Contacts table */}
                {contacts.length === 0 && !addingContact ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No contacts yet — click Add Contact above.
                  </p>
                ) : contacts.length > 0 ? (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-accent text-xs text-muted-foreground">
                          <th className="text-left px-3 py-2 font-medium">Email</th>
                          <th className="text-left px-3 py-2 font-medium">Company</th>
                          <th className="text-left px-3 py-2 font-medium">Contact</th>
                          <th className="text-left px-3 py-2 font-medium">Niche</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {contacts.map(c => {
                          const n = c.niche_id != null ? nicheMap[c.niche_id] : null
                          return (
                            <tr key={c.id} className="hover:bg-accent/40 transition-colors">
                              <td className="px-3 py-2.5 text-muted-foreground">
                                {c.email
                                  ? <a href={`mailto:${c.email}`} className="hover:text-rose-500 transition-colors">{c.email}</a>
                                  : '—'}
                              </td>
                              <td className="px-3 py-2.5 font-medium">{c.company_name || '—'}</td>
                              <td className="px-3 py-2.5">{c.contact_name || '—'}</td>
                              <td className="px-3 py-2.5">
                                {n
                                  ? <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${nicheColor(n.colorIdx)}`}>{n.name}</span>
                                  : '—'}
                              </td>
                              <td className="px-2 py-2.5">
                                <button
                                  onClick={() => deleteContact.mutate({ id: c.id, campaign_id: c.campaign_id })}
                                  className="p-1 text-muted-foreground hover:text-red-500 rounded transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
