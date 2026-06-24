import { useState, useMemo } from 'react'
import { Plus, X, Trash2, ExternalLink, Search } from 'lucide-react'
import {
  useCsAllTopicResources, useCsTopics, useAddCsTopicResource, useDeleteCsTopicResource,
  type CsTopicResource,
} from '../../../hooks/useCoreSubject'
import { safeUrl } from '../../../lib/utils'

type Props = { coreSubjectId: number }

const TYPE_OPTS = [
  { value: 'video',   label: 'Video',   cls: 'bg-red-100 text-red-600' },
  { value: 'article', label: 'Article', cls: 'bg-blue-100 text-blue-600' },
  { value: 'docs',    label: 'Docs',    cls: 'bg-gray-100 text-gray-500' },
  { value: 'book',    label: 'Book',    cls: 'bg-amber-100 text-amber-600' },
  { value: 'course',  label: 'Course',  cls: 'bg-purple-100 text-purple-600' },
  { value: 'blog',    label: 'Blog',    cls: 'bg-green-100 text-green-600' },
]

function TypeBadge({ type }: { type: string | null | undefined }) {
  if (!type) return <span className="text-text-light text-[10px]">—</span>
  const o = TYPE_OPTS.find(x => x.value === type)
  return o
    ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${o.cls}`}>{o.label}</span>
    : <span className="text-[10px] text-text-mid">{type}</span>
}

export default function ResourcesTab({ coreSubjectId }: Props) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newRes, setNewRes] = useState({ title: '', url: '', type: 'video', topic_id: '' })

  const { data: resources = [], isLoading } = useCsAllTopicResources(coreSubjectId)
  const { data: topics = [] } = useCsTopics(coreSubjectId)
  const addResource = useAddCsTopicResource()
  const deleteResource = useDeleteCsTopicResource()

  const topicMap = useMemo(() => Object.fromEntries(topics.map(t => [t.topic_id, t.title])), [topics])

  const filtered = useMemo(() => resources.filter(r => {
    const ms = r.title.toLowerCase().includes(search.toLowerCase()) ||
               r.url.toLowerCase().includes(search.toLowerCase())
    const mt = typeFilter === 'all' || r.type === typeFilter
    const mtp = topicFilter === 'all' || String(r.topic_id) === topicFilter
    return ms && mt && mtp
  }), [resources, search, typeFilter, topicFilter])

  function handleAdd() {
    if (!newRes.title.trim() || !newRes.url.trim() || !newRes.topic_id) return
    addResource.mutate({
      title: newRes.title,
      url: newRes.url,
      type: newRes.type || null,
      topic_id: Number(newRes.topic_id),
    }, {
      onSuccess: () => {
        setShowAdd(false)
        setNewRes({ title: '', url: '', type: 'video', topic_id: '' })
      },
    })
  }

  if (isLoading) return <div className="p-8 text-center text-text-light text-sm">Loading resources...</div>

  return (
    <div className="p-5 space-y-4">
      {/* Stats */}
      <div className="bg-card rounded-card border border-border px-4 py-3 flex items-center gap-6">
        <div className="text-center"><p className="font-display text-2xl text-text-dark">{resources.length}</p><p className="text-[10px] text-text-light">Resources</p></div>
        {TYPE_OPTS.map(t => {
          const count = resources.filter(r => r.type === t.value).length
          if (!count) return null
          return (
            <div key={t.value} className="text-center">
              <p className="font-display text-2xl text-text-mid">{count}</p>
              <p className="text-[10px] text-text-light">{t.label}</p>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={13} className="text-text-light" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..."
            className="flex-1 text-sm bg-transparent outline-none text-text-dark placeholder:text-text-light" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none text-text-mid">
          <option value="all">All Types</option>
          {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)}
          className="text-xs bg-card border border-border rounded-lg px-3 py-2 outline-none text-text-mid">
          <option value="all">All Topics</option>
          {topics.map(t => <option key={t.topic_id} value={String(t.topic_id)}>{t.title}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90">
          <Plus size={13} /> Add Resource
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={e => { e.preventDefault(); handleAdd() }}
          className="bg-card border border-border rounded-card p-4 flex items-center gap-3 flex-wrap">
          <input autoFocus value={newRes.title} onChange={e => setNewRes(n => ({ ...n, title: e.target.value }))}
            placeholder="Resource name..."
            className="flex-1 min-w-48 text-sm bg-rose-bg/20 border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
          <input value={newRes.url} onChange={e => setNewRes(n => ({ ...n, url: e.target.value }))}
            placeholder="URL"
            className="flex-1 min-w-48 text-sm bg-rose-bg/20 border border-border rounded-lg px-3 py-2 outline-none focus:border-rose" />
          <select value={newRes.type} onChange={e => setNewRes(n => ({ ...n, type: e.target.value }))}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none">
            {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={newRes.topic_id} onChange={e => setNewRes(n => ({ ...n, topic_id: e.target.value }))}
            required className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none">
            <option value="">Select Topic *</option>
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
              <th className="text-left px-4 py-2.5 font-medium">Resource</th>
              <th className="text-left px-4 py-2.5 font-medium w-24">Type</th>
              <th className="text-left px-4 py-2.5 font-medium w-36">Topic</th>
              <th className="text-center px-4 py-2.5 font-medium w-16">Link</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-text-light text-sm">No resources yet. Add one!</td></tr>
            ) : filtered.map((r: CsTopicResource) => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-rose-bg/20 group">
                <td className="px-4 py-2.5 text-text-dark text-xs font-medium">{r.title}</td>
                <td className="px-4 py-2.5"><TypeBadge type={r.type} /></td>
                <td className="px-4 py-2.5 text-[10px] text-text-light">{topicMap[r.topic_id] ?? '—'}</td>
                <td className="px-4 py-2.5 text-center">
                  <a href={safeUrl(r.url)} target="_blank" rel="noreferrer"
                    className="text-rose hover:opacity-70 inline-flex justify-center">
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td className="px-4 py-2.5">
                  <button onClick={() => deleteResource.mutate({ id: r.id, topicId: r.topic_id })}
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
