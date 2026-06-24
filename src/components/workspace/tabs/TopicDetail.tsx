import { useState, useMemo } from 'react'
import { ArrowLeft, Clock, CheckCircle2, BookOpen, Zap, BarChart2, Plus, Trash2, ExternalLink } from 'lucide-react'
import { PieChart, Pie, Cell, Label, ResponsiveContainer } from 'recharts'
import {
  useCsQuestions, useUpdateCsQuestion,
  useCsTopicResources, useAddCsTopicResource, useDeleteCsTopicResource,
  useUpdateCsTopic,
  type CsTopic,
} from '../../../hooks/useCoreSubject'
import BlockEditor from '../../shared/BlockEditor'
import { safeUrl } from '../../../lib/utils'

type Props = {
  topic: CsTopic
  coreSubjectId: number
  workspaceId: string
  onBack: () => void
}

type SubTab = 'notes' | 'resources' | 'questions' | 'quick_revision'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  in_progress: { label: 'In Progress', cls: 'bg-rose-bg text-rose border-rose/30' },
  done:        { label: 'Completed',   cls: 'bg-green-50 text-sage border-sage/30' },
  not_started: { label: 'Not Started', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const DIFF_COLOR: Record<string, string> = {
  easy: '#5CA970', medium: '#F59E0B', hard: '#D4848A',
}

const SUBTABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
  { key: 'notes',          label: 'Notes',          icon: <BookOpen size={13} /> },
  { key: 'resources',      label: 'Resources',      icon: <BarChart2 size={13} /> },
  { key: 'questions',      label: 'Questions',      icon: <CheckCircle2 size={13} /> },
  { key: 'quick_revision', label: 'Quick Revision', icon: <Zap size={13} /> },
]

const RES_TYPES = ['video', 'article', 'docs', 'book', 'course']

export default function TopicDetail({ topic, coreSubjectId, workspaceId, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<SubTab>('notes')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState(topic.title)
  const [editingHours, setEditingHours] = useState(false)
  const [spentVal, setSpentVal] = useState('')
  const [allocVal, setAllocVal] = useState('')
  const [addingRes, setAddingRes] = useState(false)
  const [newRes, setNewRes] = useState({ title: '', url: '', type: 'article' })

  const updateTopic = useUpdateCsTopic()
  const updateQ = useUpdateCsQuestion()
  const { data: allQuestions = [] } = useCsQuestions(coreSubjectId)
  const { data: resources = [] } = useCsTopicResources(topic.topic_id)
  const addResource = useAddCsTopicResource()
  const deleteResource = useDeleteCsTopicResource()

  const topicQs  = useMemo(() => allQuestions.filter(q => q.topic_id === topic.topic_id), [allQuestions, topic.topic_id])
  const solvedQs = useMemo(() => topicQs.filter(q => q.status === 'solved'), [topicQs])

  const spent = topic.completed_hours ?? 0
  const alloc = topic.total_hours ?? 0
  const progress = alloc > 0 ? Math.min(Math.round((spent / alloc) * 100), 100) : 0
  const diffColor = DIFF_COLOR[topic.difficulty ?? ''] ?? '#D4848A'
  const statusCfg = STATUS_CFG[topic.status ?? 'not_started'] ?? STATUS_CFG.not_started

  const donutData = useMemo(() => [
    { name: 'Solved', value: solvedQs.length, fill: '#8BC49A' },
    { name: 'Remaining', value: topicQs.length - solvedQs.length, fill: '#E0E0E0' },
  ].filter(d => d.value > 0), [solvedQs, topicQs])

  function saveHours() {
    setEditingHours(false)
    updateTopic.mutate({
      id: topic.id,
      core_subject_id: coreSubjectId,
      completed_hours: spentVal !== '' ? Number(spentVal) : null,
      total_hours: allocVal !== '' ? Number(allocVal) : null,
    })
  }

  function addRes() {
    if (!newRes.url.trim()) return
    addResource.mutate({ topic_id: topic.topic_id, title: newRes.title || newRes.url, url: newRes.url, type: newRes.type })
    setNewRes({ title: '', url: '', type: 'article' })
    setAddingRes(false)
  }

  return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-text-mid hover:text-text-dark mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to Topics
      </button>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: topic details */}
        <div className="col-span-2 space-y-4">
          {/* Header card */}
          <div className="bg-card rounded-card border border-border p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 mr-3">
                {editingTitle ? (
                  <input
                    autoFocus
                    className="font-display text-2xl text-text-dark bg-white border border-rose rounded-lg px-2 py-0.5 outline-none w-full"
                    value={titleVal}
                    onChange={e => setTitleVal(e.target.value)}
                    onBlur={() => { setEditingTitle(false); updateTopic.mutate({ id: topic.id, core_subject_id: coreSubjectId, title: titleVal }) }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { setEditingTitle(false); updateTopic.mutate({ id: topic.id, core_subject_id: coreSubjectId, title: titleVal }) }
                      if (e.key === 'Escape') { setEditingTitle(false); setTitleVal(topic.title) }
                    }}
                  />
                ) : (
                  <h2
                    className="font-display text-2xl text-text-dark cursor-text hover:text-rose transition-colors"
                    onClick={() => { setTitleVal(topic.title); setEditingTitle(true) }}
                    title="Click to edit"
                  >
                    {topic.title}
                  </h2>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {topic.difficulty && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: diffColor + '20', color: diffColor }}>
                      {topic.difficulty}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => updateTopic.mutate({ id: topic.id, core_subject_id: coreSubjectId, status: isDone(topic) ? 'in_progress' : 'done' })}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-90 shrink-0 ${isDone(topic) ? 'bg-rose-bg text-rose border border-rose/30' : 'bg-sage text-white'}`}
              >
                <CheckCircle2 size={12} /> {isDone(topic) ? 'Reopen' : 'Mark Done'}
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-text-light mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-border rounded-full">
                <div className="h-full bg-rose rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Hours */}
            {editingHours ? (
              <div className="flex items-center gap-2 text-sm">
                <input autoFocus type="number" value={spentVal} onChange={e => setSpentVal(e.target.value)}
                  placeholder="Done hrs" className="w-20 border border-rose rounded px-2 py-1 outline-none text-xs" />
                <span className="text-text-light">/</span>
                <input type="number" value={allocVal} onChange={e => setAllocVal(e.target.value)}
                  placeholder="Total hrs" className="w-20 border border-rose rounded px-2 py-1 outline-none text-xs" />
                <button onClick={saveHours} className="text-xs bg-rose text-white px-2 py-1 rounded">Save</button>
                <button onClick={() => setEditingHours(false)} className="text-xs text-text-light hover:text-rose">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setSpentVal(String(spent)); setAllocVal(String(alloc)); setEditingHours(true) }}
                className="flex items-center gap-1.5 text-xs text-text-light hover:text-rose transition-colors">
                <Clock size={11} /> {spent}h done / {alloc > 0 ? `${alloc}h total` : 'no estimate'}
              </button>
            )}
          </div>

          {/* Sub tabs */}
          <div className="flex border-b border-border">
            {SUBTABS.map(st => (
              <button key={st.key} onClick={() => setActiveTab(st.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === st.key ? 'border-rose text-rose' : 'border-transparent text-text-mid hover:text-text-dark'
                }`}>
                {st.icon} {st.label}
              </button>
            ))}
          </div>

          {/* Sub tab content */}
          {activeTab === 'notes' && (
            <BlockEditor
              entityType="cs_topic_notes"
              entityId={topic.topic_id.toString()}
              workspaceId={workspaceId}
              placeholder="Add notes, key insights, things to remember..."
            />
          )}

          {activeTab === 'resources' && (
            <div className="bg-card rounded-card border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <p className="text-sm font-medium text-text-dark">Resources ({resources.length})</p>
                <button onClick={() => setAddingRes(true)}
                  className="flex items-center gap-1 text-xs text-rose hover:opacity-80">
                  <Plus size={12} /> Add
                </button>
              </div>
              {addingRes && (
                <div className="p-4 border-b border-border space-y-2">
                  <input autoFocus value={newRes.title} onChange={e => setNewRes(r => ({ ...r, title: e.target.value }))}
                    placeholder="Title (optional)" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 outline-none focus:border-rose" />
                  <input value={newRes.url} onChange={e => setNewRes(r => ({ ...r, url: e.target.value }))}
                    placeholder="URL *" className="w-full text-sm border border-border rounded-lg px-3 py-1.5 outline-none focus:border-rose" />
                  <div className="flex gap-2">
                    <select value={newRes.type} onChange={e => setNewRes(r => ({ ...r, type: e.target.value }))}
                      className="text-xs bg-card border border-border rounded-lg px-2 py-1.5 outline-none">
                      {RES_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={addRes} className="text-xs bg-rose text-white px-3 py-1.5 rounded-lg">Add</button>
                    <button onClick={() => setAddingRes(false)} className="text-xs text-text-light hover:text-rose">Cancel</button>
                  </div>
                </div>
              )}
              {resources.length === 0 && !addingRes ? (
                <p className="p-6 text-center text-text-light text-sm">No resources yet. Add videos, articles, docs.</p>
              ) : (
                <div className="divide-y divide-border">
                  {resources.map(r => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-rose-bg/20">
                      <span className="text-xs px-1.5 py-0.5 bg-rose-bg rounded text-rose font-medium shrink-0">{r.type ?? 'link'}</span>
                      <a href={safeUrl(r.url)} target="_blank" rel="noreferrer"
                        className="flex-1 text-sm text-text-dark hover:text-rose flex items-center gap-1 min-w-0">
                        <span className="truncate">{r.title}</span>
                        <ExternalLink size={10} className="shrink-0 opacity-50" />
                      </a>
                      <button onClick={() => deleteResource.mutate({ id: r.id, topicId: topic.topic_id })}
                        className="opacity-0 group-hover:opacity-100 text-text-light hover:text-rose transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="bg-card rounded-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-medium text-text-dark">Problems for this topic ({topicQs.length})</p>
              </div>
              {topicQs.length === 0 ? (
                <p className="p-6 text-center text-text-light text-sm">No problems linked to this topic.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {topicQs.map(q => (
                      <tr key={q.id} className="border-b border-border/50 hover:bg-rose-bg/20">
                        <td className="px-4 py-2.5 text-text-dark font-medium text-xs">{q.title}</td>
                        <td className="px-4 py-2.5 text-center">
                          {q.link && (
                            <a href={safeUrl(q.link)} target="_blank" rel="noreferrer" className="text-rose hover:opacity-70">
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <select value={q.status ?? 'todo'}
                            onChange={e => updateQ.mutate({ id: q.id, core_subject_id: coreSubjectId, status: e.target.value })}
                            className="text-xs bg-transparent outline-none text-text-mid">
                            <option value="todo">To Do</option>
                            <option value="attempted">Attempted</option>
                            <option value="solved">Solved</option>
                            <option value="revisit">Revisit</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'quick_revision' && (
            <BlockEditor
              entityType="cs_topic_revision"
              entityId={topic.topic_id.toString()}
              workspaceId={workspaceId}
              placeholder="Key points, formulas, tricks to remember..."
            />
          )}
        </div>

        {/* Right: stats sidebar */}
        <div className="space-y-3">
          <div className="bg-card rounded-card border border-border p-4">
            <p className="font-display text-sm text-text-dark mb-3">Problem Stats</p>
            <div className="flex justify-center">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={donutData.length ? donutData : [{ name: 'empty', value: 1, fill: '#E0E0E0' }]}
                    cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                    {(donutData.length ? donutData : [{ fill: '#E0E0E0' }]).map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                    <Label value={`${topicQs.length}`} position="center" style={{ fontSize: 16, fontWeight: 700, fill: '#2C2C2C' }} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-center">
                <p className="font-display text-xl text-sage">{solvedQs.length}</p>
                <p className="text-[10px] text-text-light">Solved</p>
              </div>
              <div className="text-center">
                <p className="font-display text-xl text-text-light">{topicQs.length - solvedQs.length}</p>
                <p className="text-[10px] text-text-light">Remaining</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-card border border-border p-4 space-y-3">
            <p className="font-display text-sm text-text-dark">Status</p>
            <select value={topic.status ?? 'not_started'}
              onChange={e => updateTopic.mutate({ id: topic.id, core_subject_id: coreSubjectId, status: e.target.value })}
              className="w-full text-xs bg-rose-bg/20 border border-border rounded-lg px-3 py-2 outline-none">
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select value={topic.difficulty ?? ''}
              onChange={e => updateTopic.mutate({ id: topic.id, core_subject_id: coreSubjectId, difficulty: e.target.value || null })}
              className="w-full text-xs bg-rose-bg/20 border border-border rounded-lg px-3 py-2 outline-none">
              <option value="">No Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function isDone(t: CsTopic) { return t.status === 'done' }
