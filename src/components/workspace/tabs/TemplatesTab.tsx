import { useState, useMemo } from 'react'
import { Plus, Trash2, Copy, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  useTemplates, useAddTemplate, useUpdateTemplate, useDeleteTemplate,
  type OutreachTemplate,
} from '../../../hooks/useBusiness'

type Props = { workspaceId: string }
type EC = { id: string; field: string; value: string }

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'
const INPUT = 'w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none'

export default function TemplatesTab({ workspaceId }: Props) {
  const [search, setSearch] = useState('')
  const [ec, setEc] = useState<EC | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')

  const { data: templates = [], isLoading } = useTemplates(workspaceId)
  const addTemplate = useAddTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()

  const filtered = useMemo(
    () =>
      templates.filter(
        t =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.use_case?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
          (t.platform?.toLowerCase().includes(search.toLowerCase()) ?? false),
      ),
    [templates, search],
  )

  function commit(id: string, field: string, val?: string) {
    const v = val ?? ec?.value ?? ''
    setEc(null)
    updateTemplate.mutate({ id, workspace_id: workspaceId, [field]: v || null })
  }

  const isE = (id: string, f: string) => ec?.id === id && ec?.field === f

  function txt(t: OutreachTemplate, f: keyof OutreachTemplate, wide = false) {
    const val = (t[f] ?? '') as string
    return isE(t.id, f as string) ? (
      <input
        autoFocus
        className={INPUT}
        value={ec!.value}
        onChange={e => setEc(p => (p ? { ...p, value: e.target.value } : null))}
        onBlur={() => commit(t.id, f as string)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(t.id, f as string)
          if (e.key === 'Escape') setEc(null)
        }}
      />
    ) : (
      <span
        className={`cursor-text ${wide ? 'text-text-dark font-medium' : 'text-text-dark text-xs'}`}
        onClick={() => setEc({ id: t.id, field: f as string, value: val })}
      >
        {val || <span className="text-text-light">—</span>}
      </span>
    )
  }

  function copyTemplate(text: string | null) {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => toast.success('Copied!'))
  }

  function handleAdd() {
    if (!newName.trim()) return
    addTemplate.mutate(
      { name: newName, workspace_id: workspaceId },
      { onSuccess: () => { setShowAdd(false); setNewName('') } },
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="flex items-center gap-2 bg-rose-bg/50 border border-border rounded-lg px-3 py-2 flex-1 max-w-80">
          <Search size={13} className="text-text-light" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="flex-1 text-sm bg-transparent outline-none text-text-dark placeholder:text-text-light"
          />
        </div>
        <span className="text-xs text-text-light">{templates.length} templates</span>
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={13} /> Add Template
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
            placeholder="Template name *"
            className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
          />
          <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">
            Add
          </button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              <th className="w-8 px-2 py-2.5" />
              <th className={TH}>Name</th>
              <th className={`${TH} w-28`}>Platform</th>
              <th className={`${TH} w-36`}>Use Case</th>
              <th className={`${TH} w-24`}>Success Rate</th>
              <th className={`${TH} w-48`}>Template (preview)</th>
              <th className={`${TH} w-36`}>Notes</th>
              <th className="w-20 px-2 py-2.5 text-center text-text-mid font-medium text-[10px] uppercase tracking-wide">
                Copy
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3 py-2">
                        <div className="h-4 bg-rose-bg/40 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-text-light text-sm">
                    No templates yet. Click + to add one.
                  </td>
                </tr>
              )
              : filtered.map(t => (
                <>
                  <tr key={t.id} className="border-b border-border hover:bg-rose-bg/20 group">
                    <td className="px-2 py-2.5 w-8">
                      <button
                        onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                        className="text-text-light hover:text-text-dark transition-colors"
                      >
                        {expandedId === t.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                    </td>
                    <td className="px-3 py-2 min-w-36">{txt(t, 'name', true)}</td>
                    <td className="px-3 py-2">{txt(t, 'platform')}</td>
                    <td className="px-3 py-2">{txt(t, 'use_case')}</td>
                    <td className="px-3 py-2">{txt(t, 'success_rate')}</td>
                    <td className="px-3 py-2 max-w-[192px]">
                      <span
                        className="text-xs text-text-mid line-clamp-1 cursor-pointer hover:text-text-dark"
                        onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      >
                        {t.template_text || <span className="italic text-text-light">No text yet</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2">{txt(t, 'notes')}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => copyTemplate(t.template_text)}
                        disabled={!t.template_text}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-rose-bg text-rose hover:bg-rose hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Copy size={11} /> Copy
                      </button>
                    </td>
                    <td className="relative w-10">
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                        onClick={() => deleteTemplate.mutate({ id: t.id, workspaceId })}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                  {expandedId === t.id && (
                    <tr className="border-b border-border bg-rose-bg/10">
                      <td colSpan={9} className="px-4 py-3">
                        <label className="block text-[10px] text-text-light uppercase tracking-wide mb-1.5">
                          Template Text
                        </label>
                        <textarea
                          key={t.id}
                          defaultValue={t.template_text ?? ''}
                          onBlur={e =>
                            updateTemplate.mutate({ id: t.id, workspace_id: workspaceId, template_text: e.target.value || null })
                          }
                          rows={6}
                          placeholder="Write the template text..."
                          className="w-full resize-none bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose font-mono"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => copyTemplate(t.template_text)}
                            disabled={!t.template_text}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Copy size={12} /> Copy to Clipboard
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            <tr>
              <td colSpan={9} className="p-0">
                <button
                  className="w-full py-2 bg-rose-bg/30 hover:bg-rose-bg text-text-light hover:text-rose transition-colors flex items-center justify-center"
                  onClick={() => setShowAdd(true)}
                >
                  <Plus size={14} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
