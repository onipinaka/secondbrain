import { localDateStr } from '../../../../lib/utils'
import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import BlockEditor from '../../../shared/BlockEditor'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '../../../shared/DataTable'
import {
  useResources, useAddResource, useUpdateResource, useDeleteResource,
  useGeopoliticsNotes, useAddGeopoliticsNote, useUpdateGeopoliticsNote, useDeleteGeopoliticsNote,
  type GeopoliticsNote, type Resource,
} from '../../../../hooks/useReading'

type Props = { workspaceId: string }

function today() { return localDateStr() }

const PLAYLIST_NUM_COLS = new Set(['total_units', 'units_done'])

const playlistColumns: ColumnDef<Resource>[] = [
  { accessorKey: 'name', header: 'Name', meta: { type: 'text', editable: true } },
  { accessorKey: 'url', header: 'URL', meta: { type: 'text', editable: true } },
  { accessorKey: 'platform', header: 'Platform', meta: { type: 'text', editable: true } },
  { accessorKey: 'notes', header: 'Notes', meta: { type: 'text', editable: true } },
]

function EditCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  if (!editing) {
    return (
      <span
        className="cursor-text block px-1 py-0.5 rounded hover:bg-rose-bg/20 min-h-[1.5rem]"
        onClick={() => { setVal(value); setEditing(true) }}
      >
        {value || <span className="text-text-light text-xs">—</span>}
      </span>
    )
  }

  return (
    <input
      autoFocus
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { onSave(val); setEditing(false) }}
      onKeyDown={e => {
        if (e.key === 'Enter') { onSave(val); setEditing(false) }
        if (e.key === 'Escape') { setVal(value); setEditing(false) }
      }}
      className="border border-rose rounded px-2 py-0.5 text-sm outline-none w-full bg-card"
    />
  )
}

export default function GeopoliticsTab({ workspaceId }: Props) {
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

  const { data: playlists = [], isLoading: plLoading } = useResources(workspaceId, 'geopolitics')
  const addResource = useAddResource()
  const updateResource = useUpdateResource()
  const deleteResource = useDeleteResource()

  const { data: notes = [], isLoading: notesLoading } = useGeopoliticsNotes()
  const addNote = useAddGeopoliticsNote()
  const updateNote = useUpdateGeopoliticsNote()
  const deleteNote = useDeleteGeopoliticsNote()

  function update(id: string, patch: Partial<GeopoliticsNote>) {
    updateNote.mutate({ id, ...patch })
  }

  return (
    <div className="p-5 flex flex-col gap-8">
      {/* Playlists */}
      <section>
        <h3 className="font-display text-base font-semibold text-text-dark mb-4">Playlists</h3>
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <DataTable
            data={playlists}
            columns={playlistColumns}
            isLoading={plLoading}
            onRowAdd={() => addResource.mutate({ workspace_id: workspaceId, name: 'New Playlist', type: 'geopolitics' })}
            onRowUpdate={(rowIndex, columnId, value) => {
              const row = playlists[rowIndex]
              if (!row) return
              const v = PLAYLIST_NUM_COLS.has(columnId) ? (value === '' || value == null ? null : Number(value)) : value
              updateResource.mutate({ id: row.id, [columnId]: v })
            }}
            onRowDelete={rowIndex => deleteResource.mutate({ id: playlists[rowIndex].id, workspaceId })}
            emptyMessage="No geopolitics playlists yet. Click + to add."
          />
        </div>
      </section>

      {/* Notes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-text-dark">Notes</h3>
          <button
            onClick={() => addNote.mutate({ topic: 'New Note', log_date: today() })}
            className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90"
          >
            <Plus size={13} /> Add Note
          </button>
        </div>
        <div className="bg-card rounded-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-rose-bg/20">
                <th className="px-3 py-2 w-6" />
                <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Topic</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Region</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid">Key Learnings</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-text-mid w-28">Date</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {notesLoading ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-text-light text-xs">Loading...</td></tr>
              ) : notes.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-text-light text-xs">No notes yet.</td></tr>
              ) : (
                notes.map((n: GeopoliticsNote) => (
                  <>
                    <tr
                      key={n.id}
                      className="border-b border-border/50 hover:bg-rose-bg/10 cursor-pointer"
                      onClick={() => setExpandedNoteId(expandedNoteId === n.id ? null : n.id)}
                    >
                      <td className="px-3 py-2 text-text-light">
                        {expandedNoteId === n.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </td>
                      <td className="px-3 py-2 font-medium" onClick={e => e.stopPropagation()}>
                        <EditCell value={n.topic} onSave={v => update(n.id, { topic: v })} />
                      </td>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <EditCell value={n.region ?? ''} onSave={v => update(n.id, { region: v || null })} />
                      </td>
                      <td className="px-3 py-2 max-w-xs" onClick={e => e.stopPropagation()}>
                        <span className="line-clamp-1 text-text-mid">{n.key_learnings || '—'}</span>
                      </td>
                      <td className="px-3 py-2 text-text-light text-xs" onClick={e => e.stopPropagation()}>
                        <EditCell value={n.log_date} onSave={v => update(n.id, { log_date: v })} />
                      </td>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => deleteNote.mutate(n.id)}
                          className="text-text-light hover:text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                    {expandedNoteId === n.id && (
                      <tr key={`${n.id}-expand`} className="border-b border-border">
                        <td colSpan={6} className="px-5 py-4 bg-rose-bg/10">
                          <div className="mb-3">
                            <label className="text-xs text-text-light uppercase tracking-wide font-medium block mb-1">Key Learnings</label>
                            <textarea
                              defaultValue={n.key_learnings ?? ''}
                              onBlur={e => update(n.id, { key_learnings: e.target.value || null })}
                              rows={3}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-rose resize-none"
                              placeholder="Key learnings..."
                            />
                          </div>
                          <div>
                            <label className="text-xs text-text-light uppercase tracking-wide font-medium block mb-2">Notes</label>
                            <BlockEditor
                              entityType="geopolitics_note"
                              entityId={n.id}
                              workspaceId={workspaceId}
                              placeholder="Write detailed notes..."
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Opinion Journal */}
      <section>
        <h3 className="font-display text-base font-semibold text-text-dark mb-4">Opinion Journal</h3>
        <div className="bg-card rounded-card border border-border p-4">
          <BlockEditor
            entityType="geopolitics_journal"
            entityId={workspaceId}
            workspaceId={workspaceId}
            placeholder="Write your geopolitical opinions, analyses, and reflections..."
          />
        </div>
      </section>
    </div>
  )
}
