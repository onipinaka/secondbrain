import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import BlockEditor from '../../shared/BlockEditor'
import { supabase } from '../../../lib/supabase'
import {
  useWorkspaceNotes, useAddWorkspaceNote, useDeleteWorkspaceNote,
  type WorkspaceNote,
} from '../../../hooks/useWorkspace'

type Props = { workspaceId: string }

const TH = 'px-3 py-2.5 text-left text-text-mid font-medium text-[10px] uppercase tracking-wide'

export default function ProjectIdeasTab({ workspaceId }: Props) {
  const [panelIdea, setPanelIdea] = useState<WorkspaceNote | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const qc = useQueryClient()
  const { data: ideas = [], isLoading } = useWorkspaceNotes(workspaceId, 'project_idea')
  const addNote = useAddWorkspaceNote()
  const deleteNote = useDeleteWorkspaceNote()

  function handleAdd() {
    if (!newTitle.trim()) return
    addNote.mutate(
      { workspaceId, title: newTitle.trim(), entityType: 'project_idea' },
      { onSuccess: () => { setNewTitle(''); setShowAdd(false) } },
    )
  }

  async function saveTitle(idea: WorkspaceNote) {
    const trimmed = editingTitle.trim()
    setEditingId(null)
    if (!trimmed || trimmed === idea.title) return
    const { error } = await supabase.from('note_pages').update({ title: trimmed }).eq('id', idea.id)
    if (error) toast.error('Failed to update title')
    else qc.invalidateQueries({ queryKey: ['note_pages', workspaceId, 'project_idea'] })
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-end bg-rose-bg/10">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={13} /> Add Idea
        </button>
      </div>

      {showAdd && (
        <div className="p-4 border-b border-border bg-rose-bg/10 flex items-center gap-3">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Idea title *"
            className="flex-1 text-sm bg-card border border-border rounded-lg px-3 py-2 outline-none focus:border-rose"
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
          />
          <button onClick={handleAdd} className="bg-rose text-white text-xs px-4 py-2 rounded-lg hover:opacity-90">Add</button>
          <button onClick={() => setShowAdd(false)} className="text-xs text-text-mid px-3 py-2 rounded-lg border border-border">Cancel</button>
        </div>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-rose-bg/50 border-b border-border">
            <th className={TH}>Title</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-3 py-2"><div className="h-4 bg-rose-bg/40 rounded animate-pulse" /></td>
                  <td />
                </tr>
              ))
            : ideas.length === 0
            ? (
              <tr>
                <td colSpan={2} className="px-3 py-10 text-center text-text-light text-sm">
                  No ideas yet. Add something to build while learning.
                </td>
              </tr>
            )
            : ideas.map(idea => (
              <tr
                key={idea.id}
                className="border-b border-border hover:bg-rose-bg/20 group cursor-pointer"
                onClick={() => setPanelIdea(idea)}
              >
                <td className="px-3 py-2.5">
                  {editingId === idea.id ? (
                    <input
                      autoFocus
                      className="w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none"
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onBlur={() => saveTitle(idea)}
                      onKeyDown={e => { if (e.key === 'Enter') saveTitle(idea); if (e.key === 'Escape') setEditingId(null) }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="text-text-dark font-medium cursor-text"
                      onClick={e => { e.stopPropagation(); setEditingTitle(idea.title); setEditingId(idea.id) }}
                    >
                      {idea.title}
                    </span>
                  )}
                </td>
                <td className="relative w-10">
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                    onClick={e => {
                      e.stopPropagation()
                      if (panelIdea?.id === idea.id) setPanelIdea(null)
                      deleteNote.mutate({ id: idea.id, workspaceId, entityType: 'project_idea' })
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))
          }
          <tr>
            <td colSpan={2} className="p-0">
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

      {/* Right-side panel */}
      {panelIdea && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setPanelIdea(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-[520px] bg-card border-l border-border flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-display text-base text-text-dark">{panelIdea.title}</p>
              <button
                onClick={() => setPanelIdea(null)}
                className="text-text-light hover:text-text-dark transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <BlockEditor
                entityType="project_idea"
                entityId={panelIdea.id}
                workspaceId={workspaceId}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
