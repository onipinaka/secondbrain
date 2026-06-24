import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import {
  useWorkspaceNotes, useAddWorkspaceNote, useDeleteWorkspaceNote,
  type WorkspaceNote,
} from '../../../hooks/useWorkspace'
import BlockEditor from '../../shared/BlockEditor'

type Props = { workspaceId: string }

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide whitespace-nowrap'
const INPUT = 'w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none'

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export default function CaseStudiesTab({ workspaceId }: Props) {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [panel, setPanel] = useState<WorkspaceNote | null>(null)
  const [panelTitle, setPanelTitle] = useState('')
  const [panelTitleEditing, setPanelTitleEditing] = useState(false)

  const { data: cases = [], isLoading } = useWorkspaceNotes(workspaceId, 'case_study')
  const addNote = useAddWorkspaceNote()
  const deleteNote = useDeleteWorkspaceNote()

  async function commitTitle(id: string, title: string) {
    setEditingId(null)
    if (!title.trim()) return
    await supabase.from('note_pages').update({ title: title.trim() }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['note_pages', workspaceId, 'case_study'] })
  }

  async function commitPanelTitle() {
    if (!panel || !panelTitle.trim()) { setPanelTitleEditing(false); return }
    await supabase.from('note_pages').update({ title: panelTitle.trim() }).eq('id', panel.id)
    qc.invalidateQueries({ queryKey: ['note_pages', workspaceId, 'case_study'] })
    setPanel(p => p ? { ...p, title: panelTitle.trim() } : null)
    setPanelTitleEditing(false)
  }

  function handleAdd() {
    if (!newTitle.trim()) return
    addNote.mutate(
      { workspaceId, title: newTitle.trim(), entityType: 'case_study' },
      { onSuccess: () => { setNewTitle(''); setShowAdd(false) } },
    )
  }

  function openPanel(item: WorkspaceNote) {
    setPanel(item)
    setPanelTitle(item.title)
    setPanelTitleEditing(false)
  }

  return (
    <div className="flex h-full">
      <div className={`flex-1 min-w-0 overflow-x-auto ${panel ? 'border-r border-border' : ''}`}>
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-end bg-rose-bg/10">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
          >
            <Plus size={13} /> Add Case Study
          </button>
        </div>

        {showAdd && (
          <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3 flex-wrap">
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Case study title *"
              className="flex-1 min-w-48 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
            />
            <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">Add</button>
            <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">Cancel</button>
          </div>
        )}

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-rose-bg/50 border-b border-border">
              <th className={`${TH} min-w-64`}>Title</th>
              <th className={`${TH} min-w-36`}>Tags</th>
              <th className={`${TH} w-28`}>Last Updated</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-3 py-2"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : cases.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-text-light text-sm">No case studies yet.</td>
                </tr>
              )
              : cases.map(item => (
                <tr
                  key={item.id}
                  className={`border-b border-border hover:bg-rose-bg/20 group cursor-pointer ${panel?.id === item.id ? 'bg-rose-bg/30' : ''}`}
                  onClick={() => openPanel(item)}
                >
                  <td className="px-3 py-2.5 min-w-64">
                    {editingId === item.id ? (
                      <input
                        autoFocus
                        className={INPUT}
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onBlur={() => commitTitle(item.id, editingTitle)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitTitle(item.id, editingTitle)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="font-medium text-text-dark text-sm cursor-text"
                        onClick={e => { e.stopPropagation(); setEditingId(item.id); setEditingTitle(item.title) }}
                      >
                        {item.title}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 min-w-36">
                    <div className="flex flex-wrap gap-1">
                      {(item.tags ?? []).length > 0
                        ? item.tags!.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-block px-2 py-0.5 rounded-full bg-rose-bg text-rose text-[10px] font-medium">{tag}</span>
                          ))
                        : <span className="text-text-light text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 w-28 text-text-mid text-xs">{fmtDate(item.updated_at ?? item.created_at)}</td>
                  <td className="relative w-10">
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      onClick={e => { e.stopPropagation(); deleteNote.mutate({ id: item.id, workspaceId, entityType: 'case_study' }); if (panel?.id === item.id) setPanel(null) }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            }
            <tr>
              <td colSpan={4} className="p-0">
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

      {/* Right panel */}
      {panel && (
        <div className="w-[480px] flex-shrink-0 flex flex-col bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-rose-bg/10">
            {panelTitleEditing ? (
              <input
                autoFocus
                className="flex-1 bg-white border border-rose rounded px-2 py-1 text-sm font-display outline-none mr-2"
                value={panelTitle}
                onChange={e => setPanelTitle(e.target.value)}
                onBlur={commitPanelTitle}
                onKeyDown={e => { if (e.key === 'Enter') commitPanelTitle(); if (e.key === 'Escape') setPanelTitleEditing(false) }}
              />
            ) : (
              <h3
                className="font-display text-base text-text-dark truncate flex-1 cursor-text mr-2"
                onClick={() => { setPanelTitle(panel.title); setPanelTitleEditing(true) }}
              >
                {panel.title}
              </h3>
            )}
            <button onClick={() => setPanel(null)} className="text-text-light hover:text-text-dark flex-shrink-0">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <BlockEditor
              entityType="case_study"
              entityId={panel.id}
              workspaceId={workspaceId}
              placeholder="Describe the case study, key decisions, trade-offs, architecture..."
            />
          </div>
        </div>
      )}
    </div>
  )
}
