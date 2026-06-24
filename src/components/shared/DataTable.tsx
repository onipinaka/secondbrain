import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, Trash2, Plus, ExternalLink } from 'lucide-react'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    type?: 'text' | 'select' | 'date' | 'badge' | 'number' | 'url' | 'progress'
    options?: { label: string; value: string; color?: string }[]
    editable?: boolean
  }
}

export interface DataTableProps<T extends Record<string, any>> {
  data: T[]
  columns: ColumnDef<T>[]
  onRowUpdate: (rowIndex: number, columnId: string, value: any) => void
  onRowAdd: () => void
  onRowDelete: (rowIndex: number) => void
  isLoading?: boolean
  emptyMessage?: string
}

interface EditingCell {
  rowIndex: number
  columnId: string
  value: any
}

const BADGE_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-600',
  critical: 'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-600',
  low: 'bg-green-100 text-green-600',
  done: 'bg-sage/20 text-sage',
  solved: 'bg-sage/20 text-sage',
  merged: 'bg-sage/20 text-sage',
  in_progress: 'bg-blue-100 text-blue-600',
  not_started: 'bg-gray-100 text-gray-500',
  to_do: 'bg-gray-100 text-gray-500',
  blocked: 'bg-red-50 text-red-400',
}

function getBadgeClass(
  value: string,
  options?: { label: string; value: string; color?: string }[],
): string {
  const opt = options?.find(o => o.value === value)
  if (opt?.color) return opt.color
  return BADGE_COLORS[value?.toLowerCase()] ?? 'bg-gray-100 text-gray-500'
}

function getBadgeLabel(
  value: string,
  options?: { label: string; value: string; color?: string }[],
): string {
  return options?.find(o => o.value === value)?.label ?? value ?? '—'
}

const INPUT_CLS =
  'w-full bg-white border border-rose rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-rose'

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowUpdate,
  onRowAdd,
  onRowDelete,
  isLoading = false,
  emptyMessage = 'No entries yet. Click + to add one.',
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  function startEdit(rowIndex: number, columnId: string, value: any) {
    setEditingCell({ rowIndex, columnId, value })
  }

  function commitEdit() {
    if (!editingCell) return
    onRowUpdate(editingCell.rowIndex, editingCell.columnId, editingCell.value)
    setEditingCell(null)
  }

  function cancelEdit() {
    setEditingCell(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') cancelEdit()
  }

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {columns.map((_, j) => (
                  <td key={j} className="px-3 py-2">
                    <div className="h-4 bg-rose-bg/40 rounded animate-pulse" />
                  </td>
                ))}
                <td className="w-10" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const rows = table.getRowModel().rows

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="bg-rose-bg/50 border-b border-border">
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-3 py-2.5 text-left text-text-mid font-medium text-xs uppercase tracking-wide cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && <ChevronUp size={12} />}
                    {header.column.getIsSorted() === 'desc' && <ChevronDown size={12} />}
                    {!header.column.getIsSorted() && (
                      <ChevronsUpDown size={12} className="text-text-light" />
                    )}
                  </span>
                </th>
              ))}
              <th className="w-10" />
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="py-16">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-light flex items-center justify-center select-none">
                    <span className="text-xl">🌸</span>
                  </div>
                  <p className="text-text-light text-sm">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map(row => (
              <tr
                key={row.id}
                className="border-b border-border hover:bg-rose-bg/20 transition-colors group"
              >
                {row.getVisibleCells().map(cell => {
                  const meta = cell.column.columnDef.meta
                  const isEditing =
                    editingCell?.rowIndex === row.index &&
                    editingCell?.columnId === cell.column.id
                  const isEditable = meta?.type !== 'badge' && meta?.type !== 'progress' && meta?.editable !== false
                  const cellValue = cell.getValue()
                  const strValue = cellValue != null ? String(cellValue) : ''

                  return (
                    <td
                      key={cell.id}
                      className="px-3 py-2 text-text-dark"
                      onClick={() => {
                        if (isEditable && !isEditing) startEdit(row.index, cell.column.id, cellValue)
                      }}
                    >
                      {isEditing ? (
                        meta?.type === 'select' ? (
                          <select
                            autoFocus
                            className={INPUT_CLS}
                            value={editingCell.value ?? ''}
                            onChange={e => {
                              onRowUpdate(row.index, cell.column.id, e.target.value)
                              setEditingCell(null)
                            }}
                            onBlur={cancelEdit}
                            onKeyDown={e => { if (e.key === 'Escape') cancelEdit() }}
                          >
                            {meta?.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : meta?.type === 'date' ? (
                          <input
                            type="date"
                            autoFocus
                            className={INPUT_CLS}
                            value={editingCell.value ?? ''}
                            onChange={e =>
                              setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)
                            }
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                          />
                        ) : meta?.type === 'number' ? (
                          <input
                            type="number"
                            autoFocus
                            className={INPUT_CLS}
                            value={editingCell.value ?? ''}
                            onChange={e =>
                              setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)
                            }
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          <input
                            type="text"
                            autoFocus
                            className={INPUT_CLS}
                            value={editingCell.value ?? ''}
                            onChange={e =>
                              setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)
                            }
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                          />
                        )
                      ) : (meta?.type === 'badge' || meta?.type === 'select') && strValue ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(strValue, meta?.options)}`}
                        >
                          {getBadgeLabel(strValue, meta?.options)}
                        </span>
                      ) : meta?.type === 'url' && strValue ? (
                        <a
                          href={strValue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-rose hover:underline inline-flex items-center gap-1 text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink size={12} />
                          <span className="max-w-28 truncate">{strValue}</span>
                        </a>
                      ) : meta?.type === 'progress' ? (
                        <div className="flex items-center gap-2 min-w-24">
                          <div className="flex-1 bg-sage/20 rounded-full h-1.5">
                            <div
                              className="bg-sage h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, Number(strValue) || 0))}%` }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums text-text-light w-7 text-right shrink-0">
                            {strValue}%
                          </span>
                        </div>
                      ) : (
                        <span className={isEditable ? 'cursor-text' : ''}>
                          {strValue || '—'}
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="relative w-10">
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                    onClick={() => onRowDelete(row.index)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))
          )}
          <tr>
            <td colSpan={columns.length + 1} className="p-0">
              <button
                className="w-full py-2 bg-rose-bg/30 hover:bg-rose-bg text-text-light hover:text-rose transition-colors flex items-center justify-center"
                onClick={onRowAdd}
              >
                <Plus size={14} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
