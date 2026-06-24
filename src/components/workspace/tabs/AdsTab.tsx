import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '../../shared/DataTable'
import {
  useAds, useAddAd, useUpdateAd, useDeleteAd,
  type AdTracker,
} from '../../../hooks/useBusiness'

type Props = { workspaceId: string }

const STATUS_OPTS = [
  { value: 'active', label: 'Active', color: 'bg-sage/20 text-sage' },
  { value: 'paused', label: 'Paused', color: 'bg-amber-100 text-amber-600' },
  { value: 'ended', label: 'Ended', color: 'bg-gray-100 text-gray-500' },
]

export default function AdsTab({ workspaceId }: Props) {
  const { data: ads = [], isLoading } = useAds(workspaceId)
  const addAd = useAddAd()
  const updateAd = useUpdateAd()
  const deleteAd = useDeleteAd()

  const columns = useMemo<ColumnDef<AdTracker>[]>(
    () => [
      {
        id: 'campaign',
        header: 'Campaign',
        accessorKey: 'campaign',
        meta: { type: 'text', editable: true },
      },
      {
        id: 'platform',
        header: 'Platform',
        accessorKey: 'platform',
        meta: { type: 'text', editable: true },
      },
      {
        id: 'budget',
        header: 'Budget (₹)',
        accessorKey: 'budget',
        meta: { type: 'number', editable: true },
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        meta: { type: 'select', options: STATUS_OPTS },
      },
      {
        id: 'results',
        header: 'Results',
        accessorKey: 'results',
        meta: { type: 'text', editable: true },
      },
      {
        id: 'roi',
        header: 'ROI',
        accessorKey: 'roi',
        meta: { type: 'text', editable: true },
      },
      {
        id: 'notes',
        header: 'Notes',
        accessorKey: 'notes',
        meta: { type: 'text', editable: true },
      },
    ],
    [],
  )

  function handleUpdate(rowIndex: number, columnId: string, value: any) {
    const row = ads[rowIndex]
    const numFields = ['budget']
    const v = numFields.includes(columnId)
      ? value !== '' && value != null ? Number(value) : null
      : value || null
    updateAd.mutate({ id: row.id, workspace_id: workspaceId, [columnId]: v })
  }

  return (
    <div className="bg-card rounded-card border border-border overflow-hidden m-5">
      <DataTable
        data={ads}
        columns={columns}
        onRowUpdate={handleUpdate}
        onRowAdd={() => addAd.mutate({ campaign: 'New Campaign', workspace_id: workspaceId, status: 'active' })}
        onRowDelete={i => deleteAd.mutate({ id: ads[i].id, workspaceId })}
        isLoading={isLoading}
        emptyMessage="No ad campaigns yet. Click + to add one."
      />
    </div>
  )
}
