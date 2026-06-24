import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '../../../shared/DataTable'
import {
  useResources, useAddResource, useUpdateResource, useDeleteResource,
  type Resource,
} from '../../../../hooks/useReading'

type Props = { workspaceId: string }

const STATUS_OPTS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'completed', label: 'Completed', color: 'bg-sage/20 text-sage' },
  { value: 'paused', label: 'Paused', color: 'bg-amber-100 text-amber-600' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-400' },
]

const columns: ColumnDef<Resource>[] = [
  { accessorKey: 'name', header: 'Name', meta: { type: 'text', editable: true } },
  { accessorKey: 'url', header: 'URL', meta: { type: 'text', editable: true } },
  { accessorKey: 'platform', header: 'Platform', meta: { type: 'text', editable: true } },
  { accessorKey: 'status', header: 'Status', meta: { type: 'select', editable: true, options: STATUS_OPTS } },
  { accessorKey: 'total_units', header: 'Total Videos', meta: { type: 'number', editable: true } },
  { accessorKey: 'units_done', header: 'Watched', meta: { type: 'number', editable: true } },
  { accessorKey: 'notes', header: 'Notes', meta: { type: 'text', editable: true } },
]

const NUM_COLS = new Set(['total_units', 'units_done'])

export default function PlaylistsTab({ workspaceId }: Props) {
  const { data: playlists = [], isLoading } = useResources(workspaceId, 'youtube_playlist')
  const addResource = useAddResource()
  const updateResource = useUpdateResource()
  const deleteResource = useDeleteResource()

  return (
    <div className="p-5">
      <div className="bg-card rounded-card border border-border overflow-hidden">
        <DataTable
          data={playlists}
          columns={columns}
          isLoading={isLoading}
          onRowAdd={() => addResource.mutate({ workspace_id: workspaceId, name: 'New Playlist', type: 'youtube_playlist' })}
          onRowUpdate={(rowIndex, columnId, value) => {
            const row = playlists[rowIndex]
            if (!row) return
            const v = NUM_COLS.has(columnId) ? (value === '' || value == null ? null : Number(value)) : value
            updateResource.mutate({ id: row.id, [columnId]: v })
          }}
          onRowDelete={rowIndex => deleteResource.mutate({ id: playlists[rowIndex].id, workspaceId })}
          emptyMessage="No playlists added yet. Click + to add one."
        />
      </div>
    </div>
  )
}
