import { useState, useMemo } from 'react'
import { Plus, X, ExternalLink, Trash2, Search, ChevronLeft } from 'lucide-react'
import { PieChart, Pie, Cell } from 'recharts'
import {
  useCsQuestions, useCsTopics, useAddCsQuestion, useUpdateCsQuestion, useDeleteCsQuestion,
  type CsQuestion,
} from '../../../hooks/useCoreSubject'
import BlockEditor from '../../shared/BlockEditor'
import { safeUrl } from '../../../lib/utils'

type Props = { coreSubjectId: number; workspaceId: string }
type DiffFilter = 'all' | 'easy' | 'medium' | 'hard'
type StatusFilter = 'all' | 'solved' | 'attempted' | 'todo' | 'revisit'

const DIFF_OPTS = [
  { value: 'easy',   label: 'Easy',   cls: 'bg-green-100 text-green-600' },
  { value: 'medium', label: 'Medium', cls: 'bg-amber-100 text-amber-600' },
  { value: 'hard',   label: 'Hard',   cls: 'bg-red-100 text-red-600' },
]
const STATUS_OPTS = [
  { value: 'todo',      label: 'To Do',    cls: 'bg-gray-100 text-gray-500' },
  { value: 'attempted', label: 'Attempted', cls: 'bg-amber-100 text-amber-600' },
  { value: 'solved',    label: 'Solved',   cls: 'bg-sage/20 text-sage' },
  { value: 'revisit',   label: 'Revisit',  cls: 'bg-rose-light/50 text-rose' },
]

type Opt = { value: string; label: string; cls: string }
function Bdg({ val, opts }: { val: string | null | undefined; opts: Opt[] }) {
  if (!val) return <span className="text-text-light text-xs">—</span>
  const o = opts.find(x => x.value === val)
  return o
    ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${o.cls}`}>{o.label}</span>
    : <span className="text-text-light text-[10px]">{val}</span>
}

export default function QuestionsTab({ coreSubjectId, workspaceId }: Props) {
  const [search, setSearch] = useState('')
  const [diff, setDiff] = useState<DiffFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const [selected, setSelected] = useState<CsQuestion | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newQ, setNewQ] = useState({ title: '', difficulty: 'medium', topic_id: '', link: '' })

  const { data: questions = [] } = useCsQuestions(coreSubjectId)
  const { data: topics = [] } = useCsTopics(coreSubjectId)
  const addQ = useAddCsQuestion()
  const updateQ = useUpdateCsQuestion()
  const deleteQ = useDeleteCsQuestion()

  const solvedCount   = useMemo(() => questions.filter(q => q.status === 'solved').length, [questions])
  const attemptedCount = useMemo(() => questions.filter(q => q.status === 'attempted').length, [questions])
  const toDoCount     = useMemo(() => questions.filter(q => !q.status || q.status === 'todo').length, [questions])

  const donutData = useMemo(() => [
    { name: 'Solved',    value: solvedCount,    fill: '#8BC49A' },
    { name: 'Attempted', value: attemptedCount, fill: '#6B9FD9' },
    { name: 'To Do',     value: toDoCount,      fill: '#D9D9D9' },
  ].filter(d => d.value > 0), [solvedCount, attemptedCount, toDoCount])

  const filtered = useMemo(() => questions.filter(q => {
    const ms = q.title.toLowerCase().includes(search.toLowerCase())
    const md = diff === 'all' || q.difficulty === diff
    const mst = status === 'all' || q.status === status || (status === 'todo' && (!q.status || q.status === 'todo'))
    const mt = topicFilter === 'all' || String(q.topic_id) === topicFilter
    return ms && md && mst && mt
  }), [questions, search, diff, status, topicFilter])

  const topicMap = useMemo(() => Object.fromEntries(topics.map(t => [t.topic_id, t.title])), [topics])

  function handleAdd() {
    if (!newQ.title.trim()) return
    addQ.mutate({
      title: newQ.title,
      difficulty: newQ.difficulty,
      topic_id: newQ.topic_id ? Number(newQ.topic_id) : null,
      core_subject_id: coreSubjectId,
      link: newQ.link || null,
      status: 'todo',
    }, { onSuccess: () => { setShowAdd(false); setNewQ({ title: '', difficulty: 'medium', topic_id: '', link: '' }) } })
  }

  if (selected) {
    const diffO = DIFF_OPTS.find(o => o.value === selected.difficulty)
    return (
      <div className="p-6">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm text-text-mid hover:text-text-dark mb-5 transition-colors">
          <ChevronLeft size={15} /> Back to Problems
        </button>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-card rounded-card border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-3">
                {editingTitle ? (
                  <input
                    autoFocus
                    className="font-display text-xl text-text-dark bg-white border border-rose rounded-lg px-2 py-0.5 outline-none w-full mb-1.5"
                    value={titleVal}
                    onChange={e => setTitleVal(e.target.value)}
                    onBlur={() => { setEditingTitle(false); updateQ.mutate({ id: selected.id, core_subject_id: coreSubjectId, title: titleVal }); setSelected(s => s ? { ...s, title: titleVal } : null) }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { setEditingTitle(false); updateQ.mutate({ id: selected.id, core_subject_id: coreSubjectId, title: titleVal }); setSelected(s => s ? { ...s, title: titleVal } : null) }
                      if (e.key === 'Escape') { setEditingTitle(false); setTitleVal(selected.title) }
                    }}
                  />
                ) : (
                  <h2
                    className="font-display text-xl text-text-dark cursor-text hover:text-rose transition-colors mb-1.5"
                    onClick={() => { setTitleVal(selected.title); setEditingTitle(true) }}
                    title="Click to edit"
                  >
                    {selected.title}
                  </h2>
                )}
                <div className="flex items-center gap-2">
                  {diffO && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${diffO.cls}`}>{diffO.label}</span>}
                  {selected.topic_id && topicMap[selected.topic_id] && (
                    <span className="text-[10px] bg-rose-bg text-rose px-2 py-0.5 rounded-full">{topicMap[selected.topic_id]}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selected.link && (
                  <a href={safeUrl(selected.link)} target="_blank" rel="noreferrer"
                    className="text-xs text-rose flex items-center gap-1 hover:opacity-70">
                    <ExternalLink size={11} /> Open
                  </a>
                )}
                <button onClick={() => { deleteQ.mutate({ id: selected.id, coreSubjectId }); setSelected(null) }}
                  className="text-text-light hover:text-rose">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[10px] text-text-light uppercase tracking-wide mb-3">Solution Notes</p>
              <BlockEditor
                key={selected.id}
                entityType="cs_question"
                entityId={selected.id.toString()}
                workspaceId={workspaceId}
                placeholder="Add your approach, intuition, solution notes..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-card rounded-card border border-border p-4 space-y-3">
              <p className="font-display text-sm text-text-dark">Progress</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-text-light text-xs">Status</span>
                  <select
                    defaultValue={selected.status ?? 'todo'}
                    onChange={e => updateQ.mutate({ id: selected.id, core_subject_id: coreSubjectId, status: e.target.value })}
                    className="text-xs bg-transparent outline-none text-right text-text-dark"
                  >
                    {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-light text-xs">Difficulty</span>
                  <select
                    defaultValue={selected.difficulty ?? ''}
                    onChange={e => updateQ.mutate({ id: selected.id, core_subject_id: coreSubjectId, difficulty: e.target.value || null })}
                    className="text-xs bg-transparent outline-none text-right text-text-dark"
                  >
                    <option value="">—</option>
                    {DIFF_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-light text-xs">Time (min)</span>
                  <input type="number"
                    defaultValue={selected.timer ?? ''}
                    onBlur={e => updateQ.mutate({ id: selected.id, core_subject_id: coreSubjectId, timer: Number(e.target.value) || null })}
                    placeholder="—"
                    className="text-xs bg-transparent outline-none text-right w-16 text-text-dark"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-light text-xs">Attempts</span>
                  <input type="number"
                    defaultValue={selected.attempt ?? 0}
                    onBlur={e => updateQ.mutate({ id: selected.id, core_subject_id: coreSubjectId, attempt: Number(e.target.value) || 0 })}
                    className="text-xs bg-transparent outline-none text-right w-12 text-text-dark"
                  />
                </div>
              </div>
              {selected.status !== 'solved' && (
                <button
                  onClick={() => { updateQ.mutate({ id: selected.id, core_subject_id: coreSubjectId, status: 'solved' }); setSelected({ ...selected, status: 'solved' }) }}
                  className="w-full bg-sage text-white text-xs py-2 rounded-lg hover:opacity-90 transition-opacity mt-1"
                >
                  ✓ Mark as Solved
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-4">
      {/* Stats bar */}
      <div className="bg-card rounded-card border border-border p-4 flex items-center gap-5">
        <div className="shrink-0">
          <PieChart width={60} height={60}>
            <Pie data={donutData.length ? donutData : [{ name: 'empty', value: 1, fill: '#E0E0E0' }]}
              cx="50%" cy="50%" innerRadius={18} outerRadius={28} dataKey="value" paddingAngle={2}>
              {(donutData.length ? donutData : [{ fill: '#E0E0E0' }]).map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center"><p className="font-display text-2xl text-sage">{solvedCount}</p><p className="text-[10px] text-text-light mt-0.5">Solved</p></div>
          <div className="text-center"><p className="font-display text-2xl text-blue-500">{attemptedCount}</p><p className="text-[10px] text-text-light mt-0.5">Attempted</p></div>
          <div className="text-center"><p className="font-display text-2xl text-text-light">{toDoCount}</p><p className="text-[10px] text-text-light mt-0.5">To Do</p></div>
          <div className="text-center"><p className="font-display text-2xl text-text-dark">{questions.length}</p><p className="text-[10px] text-text-light mt-0.5">Total</p></div>
        </div>
        <div className="ml-auto text-xs text-text-light">
          {questions.length > 0 && `${Math.round((solvedCount / questions.length) * 100)}% solved`}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={13} className="text-text-light" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search problems..."
            className="flex-1 text-sm bg-transparent outline-none text-text-dark placeholder:text-text-light" />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {(['all', 'easy', 'medium', 'hard'] as DiffFilter[]).map(d => (
            <button key={d} onClick={() => setDiff(d)}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${diff === d ? 'bg-rose text-white' : 'text-text-mid hover:text-text-dark'}`}>
              {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <select value={status} onChange={e => setStatus(e.target.value as StatusFilter)}
          className="text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none text-text-mid">
          <option value="all">All Status</option>
          <option value="solved">Solved</option>
          <option value="attempted">Attempted</option>
          <option value="todo">To Do</option>
          <option value="revisit">Revisit</option>
        </select>
        <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)}
          className="text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none text-text-mid">
          <option value="all">All Topics</option>
          {topics.map(t => <option key={t.topic_id} value={String(t.topic_id)}>{t.title}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90">
          <Plus size={13} /> Add Problem
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={e => { e.preventDefault(); handleAdd() }}
          className="bg-card border border-border rounded-card p-4 flex items-center gap-3 flex-wrap">
          <input autoFocus value={newQ.title} onChange={e => setNewQ(n => ({ ...n, title: e.target.value }))}
            placeholder="Problem name..."
            className="flex-1 min-w-48 text-sm bg-rose-bg/20 border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
          <input value={newQ.link} onChange={e => setNewQ(n => ({ ...n, link: e.target.value }))}
            placeholder="Link (optional)"
            className="flex-1 min-w-36 text-sm bg-rose-bg/20 border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
          <select value={newQ.difficulty} onChange={e => setNewQ(n => ({ ...n, difficulty: e.target.value }))}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none">
            {DIFF_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={newQ.topic_id} onChange={e => setNewQ(n => ({ ...n, topic_id: e.target.value }))}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none">
            <option value="">No Topic</option>
            {topics.map(t => <option key={t.topic_id} value={String(t.topic_id)}>{t.title}</option>)}
          </select>
          <button type="submit" className="bg-rose text-white text-xs px-4 py-2 rounded-lg">Add</button>
          <button type="button" onClick={() => setShowAdd(false)} className="text-text-light hover:text-rose"><X size={14} /></button>
        </form>
      )}

      {/* Table */}
      <div className="bg-card rounded-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border text-text-mid text-[10px] uppercase tracking-wide">
              <th className="text-left px-3 py-2.5 font-medium">Problem</th>
              <th className="text-left px-3 py-2.5 font-medium w-20">Difficulty</th>
              <th className="text-left px-3 py-2.5 font-medium w-24">Status</th>
              <th className="text-left px-3 py-2.5 font-medium w-32">Topic</th>
              <th className="text-left px-3 py-2.5 font-medium w-16">Time</th>
              <th className="text-center px-3 py-2.5 font-medium w-12">Link</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-text-light text-sm">No problems found</td></tr>
            ) : filtered.map(q => (
              <tr key={q.id} onClick={() => setSelected(q)}
                className="border-b border-border/50 hover:bg-rose-bg/20 cursor-pointer group transition-colors">
                <td className="px-3 py-2.5 text-text-dark font-medium text-xs">{q.title}</td>
                <td className="px-3 py-2.5"><Bdg val={q.difficulty} opts={DIFF_OPTS} /></td>
                <td className="px-3 py-2.5"><Bdg val={q.status ?? 'todo'} opts={STATUS_OPTS} /></td>
                <td className="px-3 py-2.5 text-[10px] text-text-light">
                  {q.topic_id ? topicMap[q.topic_id] ?? '—' : '—'}
                </td>
                <td className="px-3 py-2.5 text-[10px] text-text-light tabular-nums">
                  {q.timer ? `${q.timer}m` : '—'}
                </td>
                <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                  {q.link
                    ? <a href={safeUrl(q.link)} target="_blank" rel="noreferrer" className="text-rose hover:opacity-70 inline-flex justify-center"><ExternalLink size={12} /></a>
                    : <span className="text-text-light text-[10px]">—</span>}
                </td>
                <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                  <button onClick={() => deleteQ.mutate({ id: q.id, coreSubjectId })}
                    className="opacity-0 group-hover:opacity-100 text-text-light hover:text-rose transition-all">
                    <Trash2 size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
