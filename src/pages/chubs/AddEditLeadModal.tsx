import { useState } from 'react'
import {
  X, User, MessageCircle, Phone, Mail, Tag, Clock, Calendar,
  MessageSquare, FileText, Link2, BookOpen,
} from 'lucide-react'
import { type CmLead, type CmNiche, useAddCmLead, useUpdateCmLead } from '../../hooks/useChubsMedia'

const STATUS_OPTS = [
  { value: 'not_called',     label: 'Not Called',     dot: 'bg-gray-400',    active: 'border-gray-300 text-gray-600 bg-gray-50' },
  { value: 'called',         label: 'Called',         dot: 'bg-blue-400',    active: 'border-blue-300 text-blue-600 bg-blue-50' },
  { value: 'interested',     label: 'Interested',     dot: 'bg-green-400',   active: 'border-green-300 text-green-600 bg-green-50' },
  { value: 'not_interested', label: 'Not Interested', dot: 'bg-red-400',     active: 'border-red-300 text-red-500 bg-red-50' },
  { value: 'follow_up',      label: 'Follow Up',      dot: 'bg-amber-400',   active: 'border-amber-300 text-amber-600 bg-amber-50' },
  { value: 'converted',      label: 'Converted',      dot: 'bg-emerald-400', active: 'border-emerald-300 text-emerald-600 bg-emerald-50' },
  { value: 'lost',           label: 'Lost',           dot: 'bg-rose/50',     active: 'border-rose/30 text-rose/70 bg-rose-light/30' },
]

const SOURCE_OPTS = [
  'Instagram DM', 'WhatsApp', 'Referral', 'Cold Call',
  'Website', 'Facebook', 'LinkedIn', 'Google', 'Event', 'Other',
]

const TEMPLATE_OPTS = [
  'Introduction Message',
  'Follow Up – No Response',
  'Follow Up – Interested',
  'Proposal Sent',
  'Nurture Message',
  'Closing Message',
]

type Form = {
  contact_name: string
  company_name: string
  phone: string
  whatsapp: string
  email: string
  niche_id: string
  follow_up_status: string
  source: string
  last_contact: string
  next_follow_up: string
  best_time_to_call: string
  whatsapp_template_used: string
  response: string
  notes: string
}

const BLANK: Form = {
  contact_name: '', company_name: '', phone: '', whatsapp: '',
  email: '', niche_id: '', follow_up_status: 'not_called', source: '',
  last_contact: '', next_follow_up: '', best_time_to_call: '',
  whatsapp_template_used: '', response: '', notes: '',
}

function toForm(lead: CmLead): Form {
  return {
    contact_name: lead.contact_name ?? '',
    company_name: lead.company_name ?? '',
    phone: lead.phone ?? '',
    whatsapp: lead.whatsapp ?? '',
    email: lead.email ?? '',
    niche_id: lead.niche_id ? String(lead.niche_id) : '',
    follow_up_status: lead.follow_up_status ?? 'not_called',
    source: lead.source ?? '',
    last_contact: lead.last_contact ?? '',
    next_follow_up: lead.next_follow_up ?? '',
    best_time_to_call: lead.best_time_to_call ?? '',
    whatsapp_template_used: lead.whatsapp_template_used ?? '',
    response: lead.response ?? '',
    notes: lead.notes ?? '',
  }
}

type Props = {
  lead?: CmLead | null
  niches: CmNiche[]
  onClose: () => void
}

const FIELD = 'w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-white placeholder:text-text-light'
const LABEL = 'block text-xs text-text-mid font-medium mb-1.5'
const ICON_INPUT = (cls = '') => `${FIELD} pl-8 ${cls}`

export default function AddEditLeadModal({ lead, niches, onClose }: Props) {
  const isEdit = !!lead
  const [form, setForm] = useState<Form>(lead ? toForm(lead) : BLANK)
  const [waAutoFilled, setWaAutoFilled] = useState(!lead)

  const addLead = useAddCmLead()
  const updateLead = useUpdateCmLead()
  const isPending = addLead.isPending || updateLead.isPending

  function set(k: keyof Form, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function handlePhoneChange(val: string) {
    setForm(f => {
      const next = { ...f, phone: val }
      if (waAutoFilled || f.whatsapp === '' || f.whatsapp === f.phone) {
        next.whatsapp = val
        setWaAutoFilled(true)
      }
      return next
    })
  }

  function handleWaChange(val: string) {
    setWaAutoFilled(false)
    set('whatsapp', val)
  }

  function handleSave() {
    const payload = {
      contact_name: form.contact_name || null,
      company_name: form.company_name || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      niche_id: form.niche_id ? Number(form.niche_id) : null,
      follow_up_status: form.follow_up_status || null,
      source: form.source || null,
      last_contact: form.last_contact || null,
      next_follow_up: form.next_follow_up || null,
      best_time_to_call: form.best_time_to_call || null,
      whatsapp_template_used: form.whatsapp_template_used || null,
      response: form.response || null,
      notes: form.notes || null,
    }
    if (isEdit) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateLead.mutate({ id: lead!.id, ...payload } as any, { onSuccess: onClose })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addLead.mutate(payload as any, { onSuccess: onClose })
    }
  }

  const waPhone = form.phone.replace(/\D/g, '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[92vh] flex overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Left: form ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Header */}
          <div className="flex items-start justify-between px-7 pt-5 pb-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-rose" />
              </div>
              <div>
                <h2 className="font-display text-[17px] font-bold text-text-dark leading-tight">
                  {isEdit ? 'Edit Lead' : 'Add / Edit Lead'}
                </h2>
                <p className="text-xs text-text-light mt-0.5">
                  {isEdit ? 'Update lead details' : 'Add a new lead or update lead details'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={onClose} className="text-sm text-text-mid hover:text-text-dark transition-colors">
                Cancel
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-light hover:text-text-dark hover:bg-rose-bg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">

            {/* Quick WhatsApp banner */}
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={17} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-dark">Quick WhatsApp</p>
                  <p className="text-xs text-text-light">Send a message to this lead right now</p>
                </div>
              </div>
              <a
                href={waPhone ? `https://wa.me/${waPhone}` : undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={!waPhone ? e => e.preventDefault() : undefined}
                className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium transition-opacity flex-shrink-0 ${
                  waPhone ? 'bg-rose text-white hover:opacity-90' : 'bg-rose/30 text-white cursor-not-allowed'
                }`}
              >
                <MessageCircle size={13} />
                Send WhatsApp Message
              </a>
            </div>

            {/* Row 1: Name, Company, Mobile */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Name <span className="text-rose">*</span></label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                  <input
                    autoFocus
                    value={form.contact_name}
                    onChange={e => set('contact_name', e.target.value)}
                    placeholder="Enter full name"
                    className={ICON_INPUT()}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Company</label>
                <div className="relative">
                  <FileText size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                  <input
                    value={form.company_name}
                    onChange={e => set('company_name', e.target.value)}
                    placeholder="Enter company name"
                    className={ICON_INPUT()}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Mobile <span className="text-rose">*</span></label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    placeholder="Enter mobile number"
                    className={ICON_INPUT()}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: WhatsApp, Email, Niche */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>WhatsApp</label>
                <div className="relative">
                  <MessageCircle size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={e => handleWaChange(e.target.value)}
                    placeholder="Enter WhatsApp number"
                    className={ICON_INPUT()}
                  />
                </div>
                {waAutoFilled && form.phone && (
                  <p className="text-[10px] text-text-light mt-1">Pre-filled from mobile number</p>
                )}
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="Enter email address"
                    className={ICON_INPUT()}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Niche <span className="text-rose">*</span></label>
                <div className="relative">
                  <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                  <select
                    value={form.niche_id}
                    onChange={e => set('niche_id', e.target.value)}
                    className={ICON_INPUT('appearance-none')}
                  >
                    <option value="">Select niche</option>
                    {niches.map(n => <option key={n.niche_id} value={n.niche_id}>{n.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Status + Source */}
            <div className="grid grid-cols-[1fr_200px] gap-6 items-start">
              <div>
                <label className={`${LABEL} flex items-center gap-1.5`}>
                  Status <span className="text-rose">*</span>
                  <span className="w-3.5 h-3.5 rounded-full border border-text-light/50 text-text-light text-[9px] flex items-center justify-center font-bold leading-none select-none">i</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => set('follow_up_status', o.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                        form.follow_up_status === o.value
                          ? `${o.active} font-medium shadow-sm`
                          : 'border-border text-text-light hover:border-gray-300 hover:text-text-mid'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${o.dot}`} />
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={LABEL}>Source <span className="text-rose">*</span></label>
                <div className="relative">
                  <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                  <select
                    value={form.source}
                    onChange={e => set('source', e.target.value)}
                    className={ICON_INPUT('appearance-none')}
                  >
                    <option value="">Select source</option>
                    {SOURCE_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Last Contact, Next Follow Up, Best Time to Call */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Last Contact</label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                  <input
                    type="date"
                    value={form.last_contact}
                    onChange={e => set('last_contact', e.target.value)}
                    className={ICON_INPUT()}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Next Follow Up</label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                  <input
                    type="date"
                    value={form.next_follow_up}
                    onChange={e => set('next_follow_up', e.target.value)}
                    className={ICON_INPUT()}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Best Time to Call</label>
                <div className="relative">
                  <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                  <input
                    value={form.best_time_to_call}
                    onChange={e => set('best_time_to_call', e.target.value)}
                    placeholder="e.g. 10 AM - 1 PM or 5 PM - 8 PM"
                    className={ICON_INPUT()}
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Template Used */}
            <div>
              <label className={LABEL}>WhatsApp Template Used</label>
              <div className="relative">
                <MessageSquare size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                <input
                  list="wa-templates"
                  value={form.whatsapp_template_used}
                  onChange={e => set('whatsapp_template_used', e.target.value)}
                  placeholder="Select template or type custom message"
                  className={ICON_INPUT()}
                />
                <datalist id="wa-templates">
                  {TEMPLATE_OPTS.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
            </div>

            {/* Response */}
            <div>
              <label className={LABEL}>
                Response <span className="text-text-light font-normal">(What they said)</span>
              </label>
              <div className="relative">
                <MessageSquare size={13} className="absolute left-3 top-3 text-text-light pointer-events-none" />
                <textarea
                  value={form.response}
                  onChange={e => set('response', e.target.value.slice(0, 1000))}
                  rows={3}
                  placeholder="Write down their exact response, questions, objections, requirements..."
                  className={`${FIELD} pl-8 resize-none`}
                />
              </div>
              <p className="text-[10px] text-text-light text-right mt-1">{form.response.length}/1000</p>
            </div>

            {/* Notes */}
            <div className="pb-1">
              <label className={LABEL}>
                Notes <span className="text-text-light font-normal">(General notes about this lead)</span>
              </label>
              <div className="relative">
                <BookOpen size={13} className="absolute left-3 top-3 text-text-light pointer-events-none" />
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value.slice(0, 2000))}
                  rows={3}
                  placeholder="Add any additional notes, preferences, key points, or follow up strategy..."
                  className={`${FIELD} pl-8 resize-none`}
                />
              </div>
              <p className="text-[10px] text-text-light text-right mt-1">{form.notes.length}/2000</p>
            </div>
          </div>

          {/* Save button */}
          <div className="px-7 py-4 border-t border-border flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-rose text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              <FileText size={15} />
              {isPending ? 'Saving…' : 'Save Lead'}
            </button>
          </div>
        </div>

        {/* ── Right: decorative panel ── */}
        <div className="hidden lg:flex w-52 flex-shrink-0 bg-gradient-to-b from-rose-bg via-rose-light/20 to-cream flex-col items-center justify-center p-6 border-l border-border/40 gap-5">
          <div className="text-5xl select-none">🌷</div>
          <div className="text-4xl select-none">☕</div>
          <div className="bg-white/80 rounded-xl px-5 py-4 border border-rose/20 text-center shadow-sm w-full">
            <p className="font-display text-base font-bold text-text-dark tracking-wide">Chubs</p>
            <p className="font-display text-base font-bold text-text-dark tracking-wide">Media</p>
            <div className="mt-1.5 w-8 h-px bg-rose/30 mx-auto" />
            <p className="text-[11px] text-rose mt-1.5 font-medium">Build. Sell. Scale.</p>
          </div>
          <p className="text-[11px] text-text-light italic text-center leading-relaxed">
            Every conversation is a chance to change the game.
          </p>
        </div>
      </div>
    </div>
  )
}
