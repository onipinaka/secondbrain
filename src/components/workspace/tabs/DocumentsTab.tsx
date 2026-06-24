import { useState } from 'react'
import {
  Plus, X, ExternalLink, Trash2, FileText, Link2,
  FileImage, BookOpen, FlaskConical, Layers, File,
} from 'lucide-react'
import {
  useProjectDocuments, useAddProjectDocument, useDeleteProjectDocument,
  type ProjectDocument,
} from '../../../hooks/useProjects'
import { safeUrl } from '../../../lib/utils'

type Props = { projectId: string }

const DOC_TYPES = [
  { value: 'prd',      label: 'PRD',       icon: FileText,    color: 'text-blue-500',   bg: 'bg-blue-50' },
  { value: 'figma',    label: 'Figma',     icon: Layers,      color: 'text-purple-500', bg: 'bg-purple-50' },
  { value: 'spec',     label: 'Spec',      icon: BookOpen,    color: 'text-amber-500',  bg: 'bg-amber-50' },
  { value: 'research', label: 'Research',  icon: FlaskConical,color: 'text-green-500',  bg: 'bg-green-50' },
  { value: 'pdf',      label: 'PDF',       icon: FileImage,   color: 'text-red-500',    bg: 'bg-red-50' },
  { value: 'link',     label: 'Link',      icon: Link2,       color: 'text-rose',       bg: 'bg-rose-bg' },
  { value: 'note',     label: 'Note',      icon: FileText,    color: 'text-text-mid',   bg: 'bg-gray-100' },
  { value: 'other',    label: 'Other',     icon: File,        color: 'text-gray-400',   bg: 'bg-gray-50' },
]

function getDocType(v: string) {
  return DOC_TYPES.find(d => d.value === v) ?? DOC_TYPES[DOC_TYPES.length - 1]
}

function DocCard({ doc, onDelete }: { doc: ProjectDocument; onDelete: () => void }) {
  const dt = getDocType(doc.doc_type)
  const Icon = dt.icon

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 group hover:border-rose/20 hover:shadow-sm transition-all">
      <div className={`w-9 h-9 rounded-lg ${dt.bg} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={dt.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-dark leading-tight truncate">{doc.title}</p>
            <span className={`inline-block text-[10px] font-medium mt-0.5 ${dt.color}`}>{dt.label}</span>
          </div>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400 shrink-0 p-0.5"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {doc.content && (
          <p className="text-xs text-text-light mt-1.5 line-clamp-2">{doc.content}</p>
        )}

        {doc.link && (
          <a
            href={safeUrl(doc.link)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-rose hover:underline mt-2"
          >
            <ExternalLink size={11} />
            Open {dt.label}
          </a>
        )}
      </div>
    </div>
  )
}

export default function DocumentsTab({ projectId }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('link')
  const [link, setLink] = useState('')
  const [content, setContent] = useState('')

  const { data: docs = [], isLoading } = useProjectDocuments(projectId)
  const addDoc = useAddProjectDocument()
  const deleteDoc = useDeleteProjectDocument()

  function handleAdd() {
    if (!title.trim()) return
    addDoc.mutate(
      {
        project_id: projectId,
        title: title.trim(),
        doc_type: docType,
        link: link.trim() || null,
        content: content.trim() || null,
        sort_order: docs.length,
      },
      {
        onSuccess: () => {
          setTitle('')
          setLink('')
          setContent('')
          setDocType('link')
          setShowAdd(false)
        },
      },
    )
  }

  // Group by type
  const grouped = DOC_TYPES.map(dt => ({
    ...dt,
    items: docs.filter(d => d.doc_type === dt.value),
  })).filter(g => g.items.length > 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-base font-semibold text-text-dark">Documents & Links</h2>
          <p className="text-text-light text-xs mt-0.5">{docs.length} item{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90 font-medium"
        >
          <Plus size={13} /> Add Document
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-rose-bg/10 border border-rose/20 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-dark">New Document</h3>
            <button onClick={() => setShowAdd(false)} className="text-text-light hover:text-text-dark">
              <X size={15} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-text-light uppercase tracking-wide font-semibold">Title *</label>
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Document title"
                  className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card text-text-dark"
                  onKeyDown={e => { if (e.key === 'Escape') setShowAdd(false) }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-text-light uppercase tracking-wide font-semibold">Type</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card text-text-dark"
                >
                  {DOC_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-text-light uppercase tracking-wide font-semibold">Link / URL</label>
              <input
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://..."
                className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card text-text-dark"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-text-light uppercase tracking-wide font-semibold">Description</label>
              <textarea
                rows={2}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Brief description (optional)"
                className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-card text-text-dark resize-none"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-1.5 rounded-lg border border-border hover:bg-rose-bg/20">
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!title.trim() || addDoc.isPending}
                className="text-xs bg-rose text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-40 font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-rose-bg/20 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <p className="text-text-light text-sm mb-3">No documents yet.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs text-rose border border-rose/30 px-3 py-2 rounded-lg hover:bg-rose-bg mx-auto"
          >
            <Plus size={13} /> Add first document
          </button>
        </div>
      ) : grouped.length > 0 ? (
        <div className="flex flex-col gap-8">
          {grouped.map(g => {
            const Icon = g.icon
            return (
              <div key={g.value}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={13} className={g.color} />
                  <span className="text-xs font-semibold text-text-mid uppercase tracking-wide">{g.label}</span>
                  <span className="text-[10px] text-text-light bg-border/60 rounded-full px-1.5 py-0.5">{g.items.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {g.items.map(doc => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      onDelete={() => deleteDoc.mutate({ id: String(doc.id), project_id: projectId })}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              onDelete={() => deleteDoc.mutate({ id: String(doc.id), project_id: projectId })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
