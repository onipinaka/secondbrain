import { useState, useMemo } from 'react'
import { Plus, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import {
  useCsInterviewQA, useAddCsInterviewQA, useUpdateCsInterviewQA, useDeleteCsInterviewQA,
  useCsTopics, type CsInterviewQuestion,
} from '../../../hooks/useCoreSubject'
import BlockEditor from '../../shared/BlockEditor'

type Props = { coreSubjectId: number; workspaceId: string }
type Expanded = Record<number, boolean>

const DIFF_OPTS = [
  { value: 'easy',   label: 'Easy',   cls: 'bg-green-100 text-green-600' },
  { value: 'medium', label: 'Medium', cls: 'bg-amber-100 text-amber-600' },
  { value: 'hard',   label: 'Hard',   cls: 'bg-red-100 text-red-600' },
]

export default function InterviewQATab({ coreSubjectId, workspaceId }: Props) {
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const [diffFilter, setDiffFilter] = useState('all')
  const [viewedFilter, setViewedFilter] = useState<'all' | 'viewed' | 'unviewed'>('all')
  const [expanded, setExpanded] = useState<Expanded>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ question: '', tag: '', difficulty: 'medium', topic_id: '' })

  const { data: items = [] } = useCsInterviewQA(coreSubjectId)
  const { data: topics = [] } = useCsTopics(coreSubjectId)
  const addItem = useAddCsInterviewQA()
  const updateItem = useUpdateCsInterviewQA()
  const deleteItem = useDeleteCsInterviewQA()

  const tags = useMemo(() => Array.from(new Set(items.map(i => i.tag).filter(Boolean))) as string[], [items])
  const topicMap = useMemo(() => Object.fromEntries(topics.map(t => [t.topic_id, t.title])), [topics])

  const filtered = useMemo(() => items.filter(i => {
    const ms = i.question.toLowerCase().includes(search.toLowerCase())
    const mt = tagFilter === 'all' || i.tag === tagFilter
    const mtp = topicFilter === 'all' || String(i.topic_id) === topicFilter
    const md = diffFilter === 'all' || i.difficulty === diffFilter
    const mv = viewedFilter === 'all' || (viewedFilter === 'viewed' ? i.viewed : !i.viewed)
    return ms && mt && mtp && md && mv
  }), [items, search, tagFilter, topicFilter, diffFilter, viewedFilter])

  function toggle(id: number) {
    setExpanded(e => ({ ...e, [id]: !e[id] }))
    const item = items.find(i => i.id === id)
    if (item && !item.viewed) {
      updateItem.mutate({ id, core_subject_id: coreSubjectId, viewed: true })
    }
  }

  function handleAdd() {
    if (!newItem.question.trim()) return
    addItem.mutate({
      question: newItem.question,
      tag: newItem.tag || null,
      difficulty: newItem.difficulty || null,
      topic_id: newItem.topic_id ? Number(newItem.topic_id) : null,
      core_subject_id: coreSubjectId,
    }, {
      onSuccess: () => {
        setShowAdd(false)
        setNewItem({ question: '', tag: '', difficulty: 'medium', topic_id: '' })
      },
    })
  }

  const unviewedCount = items.filter(i => !i.viewed).length

  return (
    <div className="p-5 space-y-4">
      <div className="bg-card rounded-card border border-border px-4 py-3 flex items-center gap-6">
        <div className="text-center"><p className="font-display text-2xl text-text-dark">{items.length}</p><p className="text-[10px] text-text-light">Total Q&A</p></div>
        <div className="text-center"><p className="font-display text-2xl text-sage">{items.length - unviewedCount}</p><p className="text-[10px] text-text-light">Reviewed</p></div>
        <div className="text-center"><p className="font-display text-2xl text-rose">{unviewedCount}</p><p className="text-[10px] text-text-light">Not Seen</p></div>
        <div className="text-center"><p className="font-display text-2xl text-text-mid">{tags.length}</p><p className="text-[10px] text-text-light">Categories</p></div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..."
          className="flex-1 min-w-48 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose text-text-dark placeholder:text-text-light" />
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
          className="text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none text-text-mid">
          <option value="all">All Tags</option>
          {tags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)}
          className="text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none text-text-mid">
          <option value="all">All Topics</option>
          {topics.map(t => <option key={t.topic_id} value={String(t.topic_id)}>{t.title}</option>)}
        </select>
        <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)}
          className="text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none text-text-mid">
          <option value="all">All Difficulty</option>
          {DIFF_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={viewedFilter} onChange={e => setViewedFilter(e.target.value as typeof viewedFilter)}
          className="text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none text-text-mid">
          <option value="all">All</option>
          <option value="viewed">Reviewed</option>
          <option value="unviewed">Not Seen</option>
        </select>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90">
          <Plus size={13} /> Add Q&A
        </button>
      </div>

      {showAdd && (
        <div className="bg-card border border-border rounded-card p-4 space-y-3">
          <textarea value={newItem.question} onChange={e => setNewItem(n => ({ ...n, question: e.target.value }))}
            placeholder="Interview question..."
            className="w-full text-sm bg-rose-bg/20 border border-border rounded-lg px-3 py-2 outline-none focus:border-rose resize-none min-h-[80px]" />
          <div className="flex items-center gap-3">
            <input value={newItem.tag} onChange={e => setNewItem(n => ({ ...n, tag: e.target.value }))}
              placeholder="Tag (e.g. OS, Networking)"
              className="flex-1 text-sm bg-rose-bg/20 border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
            <select value={newItem.difficulty} onChange={e => setNewItem(n => ({ ...n, difficulty: e.target.value }))}
              className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none">
              {DIFF_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={newItem.topic_id} onChange={e => setNewItem(n => ({ ...n, topic_id: e.target.value }))}
              className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none">
              <option value="">No Topic</option>
              {topics.map(t => <option key={t.topic_id} value={String(t.topic_id)}>{t.title}</option>)}
            </select>
            <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg">Add</button>
            <button onClick={() => setShowAdd(false)} className="text-text-light hover:text-rose"><X size={14} /></button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-text-light text-sm">No questions found</div>
        ) : filtered.map((item: CsInterviewQuestion) => {
          const diffO = DIFF_OPTS.find(o => o.value === item.difficulty)
          const isOpen = !!expanded[item.id]
          return (
            <div key={item.id} className={`bg-card rounded-card border transition-colors ${item.viewed ? 'border-border' : 'border-rose/30 bg-rose-bg/10'}`}>
              <button onClick={() => toggle(item.id)}
                className="w-full px-4 py-3 flex items-start gap-3 text-left">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {!item.viewed && <span className="text-[9px] bg-rose text-white px-1.5 py-0.5 rounded-full font-medium">NEW</span>}
                    {item.tag && <span className="text-[10px] bg-rose-bg text-rose px-2 py-0.5 rounded-full">{item.tag}</span>}
                    {item.topic_id && topicMap[item.topic_id] && (
                      <span className="text-[10px] bg-sage/10 text-sage px-2 py-0.5 rounded-full">{topicMap[item.topic_id]}</span>
                    )}
                    {diffO && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${diffO.cls}`}>{diffO.label}</span>}
                  </div>
                  <p className="text-sm text-text-dark font-medium leading-snug">{item.question}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2 mt-0.5">
                  <button onClick={e => { e.stopPropagation(); deleteItem.mutate({ id: item.id, coreSubjectId }) }}
                    className="text-text-light hover:text-rose">
                    <Trash2 size={12} />
                  </button>
                  {isOpen ? <ChevronUp size={14} className="text-text-light" /> : <ChevronDown size={14} className="text-text-light" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-border/50 space-y-3">
                  {/* Editable question fields */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <input
                      defaultValue={item.tag ?? ''}
                      onBlur={e => { if (e.target.value !== (item.tag ?? '')) updateItem.mutate({ id: item.id, core_subject_id: coreSubjectId, tag: e.target.value || null }) }}
                      placeholder="Tag..."
                      className="text-xs bg-rose-bg/20 border border-border rounded-lg px-2 py-1 outline-none focus:border-rose w-32"
                    />
                    <select
                      defaultValue={item.difficulty ?? ''}
                      onChange={e => updateItem.mutate({ id: item.id, core_subject_id: coreSubjectId, difficulty: e.target.value || null })}
                      className="text-xs bg-rose-bg/20 border border-border rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="">No Difficulty</option>
                      {DIFF_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select
                      defaultValue={item.topic_id ? String(item.topic_id) : ''}
                      onChange={e => updateItem.mutate({ id: item.id, core_subject_id: coreSubjectId, topic_id: e.target.value ? Number(e.target.value) : null })}
                      className="text-xs bg-rose-bg/20 border border-border rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="">No Topic</option>
                      {topics.map(t => <option key={t.topic_id} value={String(t.topic_id)}>{t.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-light uppercase tracking-wide mb-1">Question</p>
                    <textarea
                      key={`q-${item.id}`}
                      defaultValue={item.question}
                      onBlur={e => { if (e.target.value !== item.question) updateItem.mutate({ id: item.id, core_subject_id: coreSubjectId, question: e.target.value }) }}
                      className="w-full min-h-[60px] resize-none bg-rose-bg/20 rounded-lg p-3 text-sm text-text-dark border-none outline-none focus:ring-1 focus:ring-rose"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-light uppercase tracking-wide mb-1.5">Answer</p>
                    <BlockEditor
                      key={`answer-${item.id}`}
                      entityType="cs_interview_qa"
                      entityId={item.id.toString()}
                      workspaceId={workspaceId}
                      placeholder="Write your answer here..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateItem.mutate({ id: item.id, core_subject_id: coreSubjectId, viewed: !item.viewed })}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${item.viewed ? 'border-border text-text-light' : 'border-sage bg-sage/10 text-sage'}`}
                    >
                      {item.viewed ? '✓ Reviewed' : 'Mark Reviewed'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
