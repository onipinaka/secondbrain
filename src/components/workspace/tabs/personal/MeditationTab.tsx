import { localDateStr } from '../../../../lib/utils'
import { useState } from 'react'
import { Brain, Plus, Flame, Clock, TrendingUp, Calendar, X, Trash2 } from 'lucide-react'
import {
  useMeditationLogs, useAddMeditationLog, useUpdateMeditationLog, useDeleteMeditationLog,
  type MeditationLog,
} from '../../../../hooks/usePersonal'

type Props = { workspaceId: string }

function today() { return localDateStr() }

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function computeStreak(logs: MeditationLog[]): number {
  const days = new Set(logs.map(l => l.log_date).filter(Boolean))
  let streak = 0
  const d = new Date()
  while (true) {
    const key = d.toISOString().split('T')[0]
    if (days.has(key)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

const TYPE_OPTS = [
  { value: 'guided',     label: 'Guided',     color: 'bg-rose-bg text-rose' },
  { value: 'breathwork', label: 'Breathwork', color: 'bg-rose-light text-rose' },
  { value: 'silent',     label: 'Silent',     color: 'bg-border text-text-mid' },
  { value: 'body_scan',  label: 'Body Scan',  color: 'bg-rose-bg text-text-mid' },
]

const MOOD_EMOJI = ['', '😫', '😕', '😐', '🙂', '😄']

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return null
  const opt = TYPE_OPTS.find(o => o.value === type)
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${opt?.color ?? 'bg-gray-100 text-gray-600'}`}>
      {opt?.label ?? type}
    </span>
  )
}

type ModalState = { open: false } | { open: true; id?: string; log_date: string; duration_mins: string; type: string; resource: string; mood_before: string; mood_after: string; notes: string }

const EMPTY_FORM = { log_date: today(), duration_mins: '', type: 'silent', resource: '', mood_before: '', mood_after: '', notes: '' }

export default function MeditationTab({ workspaceId: _workspaceId }: Props) {
  const { data: logs = [], isLoading } = useMeditationLogs()
  const addLog = useAddMeditationLog()
  const updateLog = useUpdateMeditationLog()
  const deleteLog = useDeleteMeditationLog()

  const [modal, setModal] = useState<ModalState>({ open: false })

  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthLogs = logs.filter(l => l.log_date?.startsWith(monthPrefix))
  const totalSessions = monthLogs.length
  const totalMins = monthLogs.reduce((s, l) => s + (l.duration_mins ?? 0), 0)
  const totalHours = (totalMins / 60).toFixed(1)
  const moodPairs = monthLogs.filter(l => l.mood_before != null && l.mood_after != null)
  const avgMoodImpr = moodPairs.length > 0
    ? +(moodPairs.reduce((s, l) => s + ((l.mood_after ?? 0) - (l.mood_before ?? 0)), 0) / moodPairs.length).toFixed(1)
    : null
  const streak = computeStreak(logs)

  function openAdd() {
    setModal({ open: true, ...EMPTY_FORM })
  }

  function openEdit(l: MeditationLog) {
    setModal({
      open: true,
      id: l.id,
      log_date: l.log_date,
      duration_mins: l.duration_mins?.toString() ?? '',
      type: l.type ?? 'silent',
      resource: l.resource ?? '',
      mood_before: l.mood_before?.toString() ?? '',
      mood_after: l.mood_after?.toString() ?? '',
      notes: l.notes ?? '',
    })
  }

  function handleSave() {
    if (!modal.open) return
    const patch = {
      log_date: modal.log_date,
      duration_mins: modal.duration_mins ? Number(modal.duration_mins) : null,
      type: modal.type || null,
      resource: modal.resource || null,
      mood_before: modal.mood_before ? Number(modal.mood_before) : null,
      mood_after: modal.mood_after ? Number(modal.mood_after) : null,
      notes: modal.notes || null,
    }
    if (modal.id) {
      updateLog.mutate({ id: modal.id, ...patch }, { onSuccess: () => setModal({ open: false }) })
    } else {
      addLog.mutate(patch, { onSuccess: () => setModal({ open: false }) })
    }
  }

  function setField(key: string, val: string) {
    if (!modal.open) return
    setModal(m => m.open ? { ...m, [key]: val } : m)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-bg flex items-center justify-center">
            <Brain size={20} className="text-rose" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-dark">Meditation</h1>
            <p className="text-sm text-text-light">Quiet the mind. Build the practice.</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-rose text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-colors"
        >
          <Plus size={15} /> Log Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Calendar, label: 'Sessions this month', value: String(totalSessions), color: 'text-rose', bg: 'bg-rose-bg' },
          { icon: Clock, label: 'Hours this month', value: `${totalHours}h`, color: 'text-rose', bg: 'bg-rose-bg' },
          { icon: Flame, label: 'Day streak', value: streak > 0 ? `${streak}🔥` : '0', color: 'text-rose', bg: 'bg-rose-bg' },
          { icon: TrendingUp, label: 'Avg mood lift', value: avgMoodImpr != null ? `+${avgMoodImpr}` : '—', color: 'text-sage', bg: 'bg-rose-bg' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-card border border-border p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={16} className={s.color} />
            </div>
            <div>
              <p className="text-[10px] text-text-light uppercase tracking-wide font-medium leading-tight">{s.label}</p>
              <p className="font-display text-lg font-bold text-text-dark mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Session list */}
      <div className="bg-card rounded-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-dark">All Sessions</h2>
          <span className="text-xs text-text-light">{logs.length} total</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-border/30 rounded animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-text-light">
            <Brain size={32} className="opacity-20" />
            <p className="text-sm">No sessions logged yet. Start your practice.</p>
            <button onClick={openAdd} className="text-xs text-rose hover:underline">Log first session →</button>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {logs.map(l => (
              <div
                key={l.id}
                onClick={() => openEdit(l)}
                className="px-4 py-3 flex items-center gap-4 hover:bg-rose-bg/20 cursor-pointer transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-bg flex items-center justify-center shrink-0">
                  <Brain size={14} className="text-rose" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-text-dark">{fmtDate(l.log_date)}</span>
                    <TypeBadge type={l.type} />
                    {l.resource && (
                      <span className="text-xs text-text-light truncate max-w-[160px]">{l.resource}</span>
                    )}
                  </div>
                  {l.notes && (
                    <p className="text-xs text-text-light mt-0.5 truncate">{l.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0 text-sm text-text-light">
                  {l.duration_mins && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {l.duration_mins}m
                    </span>
                  )}
                  {l.mood_before != null && l.mood_after != null && (
                    <span className="text-xs">
                      {MOOD_EMOJI[l.mood_before]} → {MOOD_EMOJI[l.mood_after]}
                    </span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); deleteLog.mutate(l.id) }}
                    className="opacity-0 group-hover:opacity-100 text-text-light hover:text-red-400 transition-all p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Session modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal({ open: false })} />
          <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-text-dark">
                {modal.id ? 'Edit Session' : 'Log Session'}
              </h2>
              <button onClick={() => setModal({ open: false })} className="text-text-light hover:text-text-dark">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-light">Date</label>
                <input
                  type="date"
                  value={modal.log_date}
                  onChange={e => setField('log_date', e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm text-text-dark bg-transparent outline-none focus:border-rose"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-light">Duration (mins)</label>
                <input
                  type="number"
                  value={modal.duration_mins}
                  onChange={e => setField('duration_mins', e.target.value)}
                  placeholder="20"
                  className="border border-border rounded-lg px-3 py-2 text-sm text-text-dark bg-transparent outline-none focus:border-rose"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-light">Type</label>
              <div className="flex gap-2 flex-wrap">
                {TYPE_OPTS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setField('type', o.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      modal.type === o.value
                        ? `${o.color} border-transparent`
                        : 'border-border text-text-light hover:border-rose/50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-light">Resource / App</label>
              <input
                type="text"
                value={modal.resource}
                onChange={e => setField('resource', e.target.value)}
                placeholder="Headspace, Wim Hof, etc."
                className="border border-border rounded-lg px-3 py-2 text-sm text-text-dark bg-transparent outline-none focus:border-rose"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-light">Mood Before</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setField('mood_before', modal.mood_before === String(n) ? '' : String(n))}
                      className={`text-base flex-1 py-1 rounded-lg transition-colors ${
                        modal.mood_before === String(n) ? 'bg-rose-bg' : 'hover:bg-border/40'
                      }`}
                    >
                      {MOOD_EMOJI[n]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-light">Mood After</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setField('mood_after', modal.mood_after === String(n) ? '' : String(n))}
                      className={`text-base flex-1 py-1 rounded-lg transition-colors ${
                        modal.mood_after === String(n) ? 'bg-rose-bg' : 'hover:bg-border/40'
                      }`}
                    >
                      {MOOD_EMOJI[n]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-light">Notes</label>
              <textarea
                value={modal.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="How did it feel? Any insights?"
                rows={2}
                className="border border-border rounded-lg px-3 py-2 text-sm text-text-dark bg-transparent outline-none focus:border-rose resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setModal({ open: false })}
                className="px-4 py-2 text-sm text-text-light hover:text-text-dark border border-border rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={addLog.isPending || updateLog.isPending}
                className="px-4 py-2 text-sm bg-rose text-white rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {modal.id ? 'Save' : 'Log Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
