import { useState, useEffect, useRef } from 'react'
import {
  X, Trash2, Clock, Palette, Calendar, Star,
  FileText, Lightbulb, StickyNote, ChevronRight,
} from 'lucide-react'
import { useUpdateOpportunity, useDeleteOpportunity, type Opportunity } from '../../../hooks/useOpportunities'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  hackathon:   'bg-rose/15 text-rose border border-rose/20',
  competition: 'bg-purple-100 text-purple-600 border border-purple-200',
  internship:  'bg-blue-100 text-blue-600 border border-blue-200',
  fellowship:  'bg-green-100 text-green-700 border border-green-200',
}
const TYPE_LABEL: Record<string, string> = {
  hackathon: 'Hackathon', competition: 'Competition',
  internship: 'Internship', fellowship: 'Fellowship',
}

const STATUS_PIPELINE = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted',   label: 'Submitted' },
  { value: 'accepted',    label: 'Accepted' },
  { value: 'rejected',    label: 'Rejected' },
  { value: 'dropped',     label: 'Dropped' },
]

const STATUS_BADGE: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-amber-100 text-amber-700',
  submitted:   'bg-purple-100 text-purple-600',
  accepted:    'bg-emerald-100 text-emerald-700',
  rejected:    'bg-red-50 text-red-400',
  dropped:     'bg-gray-100 text-gray-400',
}
const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started', in_progress: 'In Progress',
  submitted: 'Submitted', accepted: 'Accepted',
  rejected: 'Rejected', dropped: 'Dropped',
}

const PRIORITY_OPTS = [
  { value: 'high',   label: 'High',   dot: 'bg-rose',        text: 'text-rose' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-400',   text: 'text-amber-600' },
  { value: 'low',    label: 'Low',    dot: 'bg-gray-300',    text: 'text-gray-500' },
]

const INPUT = 'w-full bg-transparent outline-none text-sm text-text-dark placeholder:text-text-light'
const LABEL = 'text-[11px] text-text-light w-32 shrink-0'
const ROW = 'flex items-start gap-4 py-3 border-b border-border/60'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dl: string | null): number | null {
  if (!dl) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dl + 'T00:00:00')
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

function fmtDate(dl: string | null) {
  if (!dl) return null
  return new Date(dl + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Draft = {
  name: string; type: string; status: string; deadline: string
  priority: string; theme: string; notes: string; ps: string; solution: string
}

function toDraft(op: Opportunity): Draft {
  return {
    name:     op.name ?? '',
    type:     op.type ?? 'hackathon',
    status:   op.status ?? 'not_started',
    deadline: op.deadline ?? '',
    priority: op.priority ?? 'medium',
    theme:    op.theme ?? '',
    notes:    op.notes ?? '',
    ps:       op.ps ?? '',
    solution: op.solution ?? '',
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = { opportunity: Opportunity; onClose: () => void; onDeleted: () => void }

export default function OpportunityDetailPanel({ opportunity, onClose, onDeleted }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(opportunity))
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateOp = useUpdateOpportunity()
  const deleteOp = useDeleteOpportunity()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setDraft(toDraft(opportunity))
    setSaveState('idle')
    setConfirmDelete(false)
  }, [opportunity.id])

  function save(next: Draft) {
    setSaveState('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateOp.mutate(
        {
          id: opportunity.id,
          name:     next.name || opportunity.name,
          type:     next.type || null,
          status:   next.status || null,
          deadline: next.deadline || null,
          priority: next.priority || null,
          theme:    next.theme || null,
          notes:    next.notes || null,
          ps:       next.ps || null,
          solution: next.solution || null,
        },
        {
          onSuccess: () => { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 2000) },
          onError:   () => setSaveState('idle'),
        },
      )
    }, 500)
  }

  function change(field: keyof Draft, value: string) {
    const next = { ...draft, [field]: value }
    setDraft(next)
    save(next)
  }

  function setStatus(value: string) {
    const next = { ...draft, status: value }
    setDraft(next)
    save(next)
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteOp.mutate(opportunity.id, { onSuccess: onDeleted })
  }

  const days = daysUntil(draft.deadline)
  const urgent = days !== null && days <= 7 && days >= 0
  const isToday = days === 0
  const past = days !== null && days < 0
  const prio = PRIORITY_OPTS.find(o => o.value === draft.priority) ?? PRIORITY_OPTS[1]
  const typeCls = TYPE_BADGE[draft.type] ?? 'bg-gray-100 text-gray-500 border border-gray-200'
  const statusCls = STATUS_BADGE[draft.status] ?? 'bg-gray-100 text-gray-500'

  // Pipeline active index
  const MAIN_PIPELINE = STATUS_PIPELINE.slice(0, 4) // not_started→accepted (linear)
  const TERMINAL = ['rejected', 'dropped']
  const pipelineIdx = MAIN_PIPELINE.findIndex(s => s.value === draft.status)
  const isTerminal = TERMINAL.includes(draft.status)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative bg-card w-full max-w-[480px] max-h-[90vh] rounded-2xl shadow-2xl border border-border flex flex-col pointer-events-auto overflow-hidden">

          {/* ── Header ── */}
          <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <input
                  value={draft.name}
                  onChange={e => change('name', e.target.value)}
                  className="w-full font-display text-[20px] font-bold text-text-dark bg-transparent outline-none placeholder:text-text-light leading-tight"
                  placeholder="Opportunity name"
                />
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* Type select */}
                  <div className="relative">
                    <select
                      value={draft.type}
                      onChange={e => change('type', e.target.value)}
                      className={`appearance-none pl-2.5 pr-5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer outline-none ${typeCls}`}
                    >
                      {Object.entries(TYPE_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <ChevronRight size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 rotate-90 opacity-50 pointer-events-none" />
                  </div>
                  {/* Status select */}
                  <div className="relative">
                    <select
                      value={draft.status}
                      onChange={e => change('status', e.target.value)}
                      className={`appearance-none pl-2.5 pr-5 py-0.5 rounded-full text-[11px] font-medium cursor-pointer outline-none ${statusCls}`}
                    >
                      {STATUS_PIPELINE.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <ChevronRight size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 rotate-90 opacity-50 pointer-events-none" />
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg text-text-light hover:bg-rose-bg hover:text-rose transition-colors mt-0.5">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto">

            {/* Urgency banner */}
            {draft.deadline && (urgent || isToday || past) && (
              <div className={`mx-5 mt-4 rounded-xl px-4 py-3 flex items-center justify-between ${
                past ? 'bg-gray-50 border border-gray-200' : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className={past ? 'text-gray-400' : 'text-amber-500'} />
                  <div>
                    <p className={`text-[13px] font-bold ${past ? 'text-gray-500' : 'text-amber-700'}`}>
                      {isToday ? 'Deadline Today — Act Now!' : past ? `Deadline passed ${Math.abs(days!)} days ago` : `${days} day${days === 1 ? '' : 's'} left — Act Now!`}
                    </p>
                    <p className="text-[11px] text-text-light">
                      {past ? 'Closed on' : 'Closes on'} {fmtDate(draft.deadline)}
                    </p>
                  </div>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${past ? 'bg-gray-300' : 'bg-rose animate-pulse'}`} />
              </div>
            )}

            {/* ── Fields ── */}
            <div className="px-6 pt-4 pb-2 space-y-0">

              {/* Theme */}
              <div className={ROW}>
                <Palette size={15} className="text-text-light mt-0.5 shrink-0" />
                <span className={LABEL}>Theme / Domain</span>
                <input
                  value={draft.theme}
                  onChange={e => change('theme', e.target.value)}
                  className={INPUT}
                  placeholder="e.g. AI/ML, FinTech, Social Impact…"
                />
              </div>

              {/* Deadline */}
              <div className={ROW}>
                <Calendar size={15} className={`mt-0.5 shrink-0 ${urgent ? 'text-rose' : 'text-text-light'}`} />
                <span className={LABEL}>Deadline</span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="date"
                    value={draft.deadline}
                    onChange={e => change('deadline', e.target.value)}
                    className={`${INPUT} flex-none w-auto`}
                  />
                  {draft.deadline && days !== null && (
                    <span className={`text-[11px] font-medium ${urgent ? 'text-rose' : past ? 'text-gray-400' : 'text-text-light'}`}>
                      {isToday ? '(Today)' : days > 0 ? `(${days} days left)` : `(${Math.abs(days)} days ago)`}
                    </span>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className={ROW}>
                <Star size={15} className="text-text-light mt-0.5 shrink-0" />
                <span className={LABEL}>Priority</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${prio.dot}`} />
                  <select
                    value={draft.priority}
                    onChange={e => change('priority', e.target.value)}
                    className={`bg-transparent outline-none text-sm font-medium ${prio.text} cursor-pointer`}
                  >
                    {PRIORITY_OPTS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes (organizer / general) */}
              <div className={ROW}>
                <StickyNote size={15} className="text-text-light mt-0.5 shrink-0" />
                <span className={LABEL}>Notes</span>
                <textarea
                  value={draft.notes}
                  onChange={e => change('notes', e.target.value)}
                  rows={2}
                  className={`${INPUT} resize-none`}
                  placeholder="General notes about this opportunity…"
                />
              </div>
            </div>

            {/* ── Progress Pipeline ── */}
            <div className="mx-5 my-4 bg-cream rounded-xl border border-border px-4 py-4">
              <p className="text-[12px] font-semibold text-text-dark mb-3">Your Progress</p>
              <div className="flex items-center gap-0">
                {MAIN_PIPELINE.map((stage, idx) => {
                  const active = draft.status === stage.value
                  const done = !isTerminal && pipelineIdx > idx
                  return (
                    <div key={stage.value} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => setStatus(stage.value)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                            active
                              ? 'border-rose bg-rose scale-110'
                              : done
                              ? 'border-rose bg-rose/20'
                              : 'border-border bg-white hover:border-rose/50'
                          }`}
                          title={stage.label}
                        >
                          {(active || done) && <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-white' : 'bg-rose'}`} />}
                        </button>
                        <span className={`text-[9px] text-center leading-tight w-14 ${active ? 'text-rose font-semibold' : done ? 'text-rose/60' : 'text-text-light'}`}>
                          {stage.label}
                        </span>
                      </div>
                      {idx < MAIN_PIPELINE.length - 1 && (
                        <div className={`h-0.5 flex-1 mb-4 ${done ? 'bg-rose/40' : 'bg-border'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Terminal states */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                <span className="text-[10px] text-text-light mr-1">Mark as:</span>
                {TERMINAL.map(t => (
                  <button
                    key={t}
                    onClick={() => setStatus(t)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors ${
                      draft.status === t
                        ? STATUS_BADGE[t] + ' border-transparent font-medium'
                        : 'border-border text-text-light hover:border-rose/30 hover:text-rose'
                    }`}
                  >
                    {STATUS_LABEL[t]}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-text-light mt-2">Click a stage to update your status.</p>
            </div>

            {/* ── Personal Notes / PS / Solution ── */}
            <div className="px-6 space-y-4 pb-6">

              {/* Problem Statement */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={13} className="text-rose shrink-0" />
                  <p className="text-[12px] font-semibold text-text-dark">Problem Statement</p>
                </div>
                <textarea
                  value={draft.ps}
                  onChange={e => change('ps', e.target.value)}
                  rows={4}
                  className="w-full bg-cream border border-border rounded-xl px-4 py-3 text-sm text-text-dark outline-none focus:border-rose transition-colors resize-none placeholder:text-text-light"
                  placeholder="Describe the problem you're solving…"
                />
              </div>

              {/* Solution */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={13} className="text-amber-500 shrink-0" />
                  <p className="text-[12px] font-semibold text-text-dark">Solution / Approach</p>
                </div>
                <textarea
                  value={draft.solution}
                  onChange={e => change('solution', e.target.value)}
                  rows={4}
                  className="w-full bg-cream border border-border rounded-xl px-4 py-3 text-sm text-text-dark outline-none focus:border-rose transition-colors resize-none placeholder:text-text-light"
                  placeholder="Your proposed solution or approach…"
                />
              </div>

              {/* Save indicator */}
              <p className="text-[11px] text-text-light flex items-center gap-1.5">
                {saveState === 'saving' && <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Saving…</>}
                {saveState === 'saved'  && <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Saved automatically</>}
                {saveState === 'idle'   && <><span className="w-1.5 h-1.5 rounded-full bg-text-light/30" /> Saves automatically</>}
              </p>
            </div>

            {/* ── Footer ── */}
            <div className="px-6 pb-5 border-t border-border pt-4 flex items-center justify-between">
              <p className="text-[11px] text-text-light">
                Created {new Date(opportunity.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-red-500 font-medium">Delete?</span>
                  <button onClick={handleDelete} className="text-[11px] font-semibold text-white bg-red-500 px-3 py-1 rounded-lg hover:bg-red-600 transition-colors">Yes</button>
                  <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-text-mid hover:text-text-dark px-2 py-1">No</button>
                </div>
              ) : (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-[12px] text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={13} /> Delete Opportunity
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
