import { useState, useMemo } from 'react'
import { Plus, X, Trash2, RefreshCw, CheckCircle } from 'lucide-react'
import {
  useCsRevisionSessions, useAddCsRevisionSession, useUpdateCsRevisionSession, useDeleteCsRevisionSession,
  useCsTopics, type CsRevisionSession,
} from '../../../hooks/useCoreSubject'

type Props = { coreSubjectId: number }
type FilterKey = 'upcoming' | 'completed' | 'all'

const STATUS_OPTS = [
  { value: 'planned',    label: 'Planned',   cls: 'bg-blue-100 text-blue-600' },
  { value: 'completed',  label: 'Done',      cls: 'bg-sage/20 text-sage' },
  { value: 'skipped',   label: 'Skipped',   cls: 'bg-gray-100 text-gray-500' },
]

function diffDays(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function fmtDate(ds: string | null | undefined): string {
  if (!ds) return '—'
  return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function RevisionTab({ coreSubjectId }: Props) {
  const [filter, setFilter] = useState<FilterKey>('upcoming')
  const [showAdd, setShowAdd] = useState(false)
  const [newSession, setNewSession] = useState({ title: '', scheduled_at: '', topic_id: '', description: '' })

  const { data: sessions = [] } = useCsRevisionSessions(coreSubjectId)
  const { data: topics = [] } = useCsTopics(coreSubjectId)
  const addSession = useAddCsRevisionSession()
  const updateSession = useUpdateCsRevisionSession()
  const deleteSession = useDeleteCsRevisionSession()

  const topicMap = useMemo(() => Object.fromEntries(topics.map(t => [t.topic_id, t.title])), [topics])

  const filtered = useMemo(() => sessions.filter(s => {
    if (filter === 'completed') return s.status === 'completed'
    if (filter === 'upcoming') return s.status !== 'completed'
    return true
  }), [sessions, filter])

  const completedCount = sessions.filter(s => s.status === 'completed').length
  const plannedCount   = sessions.filter(s => s.status !== 'completed').length
  const overdueCount   = sessions.filter(s => s.scheduled_at && s.status !== 'completed' && diffDays(s.scheduled_at) < 0).length

  function handleAdd() {
    if (!newSession.title.trim()) return
    addSession.mutate({
      title: newSession.title,
      core_subject_id: coreSubjectId,
      topic_id: newSession.topic_id ? Number(newSession.topic_id) : null,
      scheduled_at: newSession.scheduled_at || null,
      description: newSession.description || null,
      status: 'planned',
    }, {
      onSuccess: () => {
        setShowAdd(false)
        setNewSession({ title: '', scheduled_at: '', topic_id: '', description: '' })
      },
    })
  }

  function markDone(s: CsRevisionSession) {
    updateSession.mutate({
      id: s.id,
      core_subject_id: coreSubjectId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
  }

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="p-5 space-y-4">
      {/* Stats */}
      <div className="bg-card rounded-card border border-border px-4 py-3 flex items-center gap-6">
        <div className="text-center"><p className="font-display text-2xl text-text-dark">{sessions.length}</p><p className="text-[10px] text-text-light">Total Sessions</p></div>
        <div className="text-center"><p className="font-display text-2xl text-sage">{completedCount}</p><p className="text-[10px] text-text-light">Completed</p></div>
        <div className="text-center"><p className="font-display text-2xl text-blue-500">{plannedCount}</p><p className="text-[10px] text-text-light">Planned</p></div>
        {overdueCount > 0 && (
          <div className="text-center"><p className="font-display text-2xl text-rose">{overdueCount}</p><p className="text-[10px] text-text-light">Overdue</p></div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${filter === f.key ? 'bg-rose text-white' : 'text-text-mid hover:text-text-dark'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90">
          <Plus size={13} /> Schedule Session
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card border border-border rounded-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <input autoFocus value={newSession.title} onChange={e => setNewSession(n => ({ ...n, title: e.target.value }))}
              placeholder="Session title..."
              className="flex-1 text-sm bg-rose-bg/20 border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
            <input type="date" value={newSession.scheduled_at} onChange={e => setNewSession(n => ({ ...n, scheduled_at: e.target.value }))}
              className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none" />
            <select value={newSession.topic_id} onChange={e => setNewSession(n => ({ ...n, topic_id: e.target.value }))}
              className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none">
              <option value="">All Topics</option>
              {topics.map(t => <option key={t.topic_id} value={String(t.topic_id)}>{t.title}</option>)}
            </select>
          </div>
          <textarea value={newSession.description} onChange={e => setNewSession(n => ({ ...n, description: e.target.value }))}
            placeholder="What to revise... (optional)"
            className="w-full resize-none min-h-[60px] text-sm bg-rose-bg/20 border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg">Schedule</button>
            <button onClick={() => setShowAdd(false)} className="text-text-light hover:text-rose"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border text-text-mid text-[10px] uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-medium">Session</th>
              <th className="text-left px-4 py-2.5 font-medium w-28">Topic</th>
              <th className="text-left px-4 py-2.5 font-medium w-28">Scheduled</th>
              <th className="text-left px-4 py-2.5 font-medium w-24">Status</th>
              <th className="text-left px-4 py-2.5 font-medium w-28">Completed</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-text-light text-sm">
                {filter === 'upcoming' ? 'No upcoming sessions. Schedule one!' : 'No sessions found.'}
              </td></tr>
            ) : filtered.map((s: CsRevisionSession) => {
              const days = s.scheduled_at ? diffDays(s.scheduled_at) : null
              const isOverdue = days !== null && days < 0 && s.status !== 'completed'
              const statusO = STATUS_OPTS.find(o => o.value === (s.status ?? 'planned'))
              return (
                <tr key={s.id} className="border-b border-border/50 hover:bg-rose-bg/20 group">
                  <td className="px-4 py-3">
                    <p className="text-text-dark text-xs font-medium">{s.title}</p>
                    {s.description && <p className="text-[10px] text-text-light mt-0.5 line-clamp-1">{s.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-text-light">
                    {s.topic_id ? topicMap[s.topic_id] ?? '—' : 'All Topics'}
                  </td>
                  <td className={`px-4 py-3 text-xs tabular-nums ${isOverdue ? 'text-rose font-medium' : 'text-text-light'}`}>
                    {fmtDate(s.scheduled_at)}
                    {isOverdue && <span className="ml-1 text-[10px]">({Math.abs(days!)}d ago)</span>}
                  </td>
                  <td className="px-4 py-3">
                    {statusO && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusO.cls}`}>{statusO.label}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-light tabular-nums">{fmtDate(s.completed_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {s.status !== 'completed' && (
                        <button onClick={() => markDone(s)}
                          className="flex items-center gap-1 text-[10px] text-sage border border-sage/30 px-2 py-1 rounded-lg hover:bg-sage/10">
                          <CheckCircle size={9} /> Done
                        </button>
                      )}
                      <button onClick={() => updateSession.mutate({ id: s.id, core_subject_id: coreSubjectId, status: 'planned', completed_at: null })}
                        className="text-[10px] text-blue-500 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50">
                        <RefreshCw size={9} />
                      </button>
                      <button onClick={() => deleteSession.mutate({ id: s.id, coreSubjectId })}
                        className="text-text-light hover:text-rose">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
