import { useState } from 'react'
import { Plus, Trash2, Search, ArrowLeft } from 'lucide-react'
import {
  useCsCheatSheets, useAddCsCheatSheet, useUpdateCsCheatSheet, useDeleteCsCheatSheet,
  useCsTopics, type CsCheatSheet,
} from '../../../hooks/useCoreSubject'
import BlockEditor from '../../shared/BlockEditor'

type Props = { coreSubjectId: number; workspaceId: string }

const SHEET_COLORS = [
  'bg-rose-light/40', 'bg-sage/20', 'bg-blue-100', 'bg-amber-100', 'bg-purple-100', 'bg-pink-100',
]
const SHEET_ICONS = ['📝', '🔧', '⚡', '🧠', '📊', '💡', '🔑', '📐']

export default function CheatSheetsTab({ coreSubjectId, workspaceId }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CsCheatSheet | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleVal, setTitleVal] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newTopicId, setNewTopicId] = useState('')
  const [creating, setCreating] = useState(false)

  const { data: sheets = [] } = useCsCheatSheets(coreSubjectId)
  const { data: topics = [] } = useCsTopics(coreSubjectId)
  const addSheet = useAddCsCheatSheet()
  const updateSheet = useUpdateCsCheatSheet()
  const deleteSheet = useDeleteCsCheatSheet()

  const topicMap = Object.fromEntries(topics.map(t => [t.topic_id, t.title]))
  const filtered = sheets.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))

  function handleCreate() {
    if (!newTitle.trim()) return
    addSheet.mutate({
      core_subject_id: coreSubjectId,
      title: newTitle.trim(),
      topic_id: newTopicId ? Number(newTopicId) : null,
    }, {
      onSuccess: (data) => {
        setSelected(data as CsCheatSheet)
        setNewTitle('')
        setNewTopicId('')
        setCreating(false)
      },
    })
  }

  if (selected) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-text-light hover:text-text-dark transition-colors">
            <ArrowLeft size={15} />
          </button>
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                autoFocus
                className="font-display text-lg text-text-dark bg-white border border-rose rounded-lg px-2 py-0.5 outline-none w-full"
                value={titleVal}
                onChange={e => setTitleVal(e.target.value)}
                onBlur={() => { setEditingTitle(false); updateSheet.mutate({ id: selected.id, core_subject_id: coreSubjectId, title: titleVal }); setSelected(s => s ? { ...s, title: titleVal } : null) }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { setEditingTitle(false); updateSheet.mutate({ id: selected.id, core_subject_id: coreSubjectId, title: titleVal }); setSelected(s => s ? { ...s, title: titleVal } : null) }
                  if (e.key === 'Escape') { setEditingTitle(false); setTitleVal(selected.title) }
                }}
              />
            ) : (
              <p
                className="font-display text-lg text-text-dark cursor-text hover:text-rose transition-colors truncate"
                onClick={() => { setTitleVal(selected.title); setEditingTitle(true) }}
                title="Click to edit"
              >
                {selected.title}
              </p>
            )}
            {selected.topic_id && topicMap[selected.topic_id] && (
              <p className="text-[10px] text-text-light">{topicMap[selected.topic_id]}</p>
            )}
          </div>
          <button
            onClick={() => { deleteSheet.mutate({ id: selected.id, coreSubjectId }); setSelected(null) }}
            className="text-text-light hover:text-rose transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <BlockEditor
            key={selected.id}
            entityType="cs_cheat_sheet"
            entityId={selected.id.toString()}
            workspaceId={workspaceId}
            placeholder="Write your cheat sheet content here..."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={13} className="text-text-light" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cheat sheets..."
            className="flex-1 text-sm bg-transparent outline-none text-text-dark placeholder:text-text-light" />
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90">
          <Plus size={13} /> New Cheat Sheet
        </button>
      </div>

      {creating && (
        <div className="flex gap-2 flex-wrap">
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="Cheat sheet title..."
            className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose min-w-48" />
          <select value={newTopicId} onChange={e => setNewTopicId(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none">
            <option value="">No Topic</option>
            {topics.map(t => <option key={t.topic_id} value={String(t.topic_id)}>{t.title}</option>)}
          </select>
          <button onClick={handleCreate} className="bg-rose text-white text-xs px-3 py-2 rounded-lg">Create</button>
          <button onClick={() => setCreating(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">Cancel</button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-light">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm">No cheat sheets yet. Create your first one.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {filtered.map((sheet, i) => (
          <div key={sheet.id} onClick={() => setSelected(sheet)}
            className={`${SHEET_COLORS[i % SHEET_COLORS.length]} rounded-card border border-border p-5 cursor-pointer hover:shadow-sm transition-shadow group relative`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{SHEET_ICONS[i % SHEET_ICONS.length]}</span>
              <button
                onClick={e => { e.stopPropagation(); deleteSheet.mutate({ id: sheet.id, coreSubjectId }) }}
                className="opacity-0 group-hover:opacity-100 text-text-light hover:text-rose transition-all">
                <Trash2 size={11} />
              </button>
            </div>
            <p className="font-display text-sm text-text-dark font-semibold leading-snug mb-1">{sheet.title}</p>
            {sheet.topic_id && topicMap[sheet.topic_id] && (
              <p className="text-[10px] text-rose mb-1">{topicMap[sheet.topic_id]}</p>
            )}
            <p className="text-[10px] text-text-light">
              {sheet.updated_at
                ? new Date(sheet.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'New'}
            </p>
            {sheet.content && (
              <p className="text-[10px] text-text-light mt-2 line-clamp-2 font-mono">{sheet.content}</p>
            )}
            <div className="mt-3">
              <span className="text-xs text-rose opacity-70 group-hover:opacity-100 transition-opacity">View →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
