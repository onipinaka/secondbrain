import { useState, useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import DataTable from '../../shared/DataTable'
import {
  useContentItems, useAddContentItem, useUpdateContentItem, useDeleteContentItem,
  type ContentItem,
} from '../../../hooks/useBusiness'

type Props = { workspaceId: string }

const PLATFORM_OPTS = [
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-100 text-blue-600' },
  { value: 'twitter', label: 'Twitter', color: 'bg-sky-100 text-sky-600' },
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-100 text-pink-600' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-100 text-red-600' },
]

const STATUS_OPTS = [
  { value: 'idea', label: 'Idea', color: 'bg-gray-100 text-gray-500' },
  { value: 'draft', label: 'Draft', color: 'bg-amber-100 text-amber-600' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-600' },
  { value: 'published', label: 'Published', color: 'bg-sage/20 text-sage' },
]

const PLATFORM_PILL: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-600',
  twitter: 'bg-sky-100 text-sky-600',
  instagram: 'bg-pink-100 text-pink-600',
  youtube: 'bg-red-100 text-red-600',
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CalendarView({ items }: { items: ContentItem[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()

  const byDate = useMemo(() => {
    const map: Record<string, ContentItem[]> = {}
    items.forEach(item => {
      if (!item.scheduled_date) return
      const key = item.scheduled_date.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(item)
    })
    return map
  }, [items])

  const cells: Array<number | null> = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="p-5">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-rose-bg transition-colors text-text-mid">
          <ChevronLeft size={16} />
        </button>
        <span className="font-display text-lg text-text-dark">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-rose-bg transition-colors text-text-mid">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-[10px] text-text-light text-center font-medium uppercase tracking-wide py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayItems = byDate[dateKey] ?? []
          const isToday =
            today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

          return (
            <div
              key={dateKey}
              className={`min-h-[72px] rounded-lg border p-1.5 ${
                isToday ? 'border-rose bg-rose-bg/30' : 'border-border bg-card'
              }`}
            >
              <span className={`text-xs font-medium block mb-1 ${isToday ? 'text-rose' : 'text-text-mid'}`}>
                {day}
              </span>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map(item => (
                  <div
                    key={item.id}
                    title={item.content_idea}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                      PLATFORM_PILL[item.platform ?? ''] ?? 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.content_idea}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-[10px] text-text-light pl-1">+{dayItems.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ContentTab({ workspaceId }: Props) {
  const [view, setView] = useState<'table' | 'calendar'>('table')

  const { data: items = [], isLoading } = useContentItems(workspaceId)
  const addItem = useAddContentItem()
  const updateItem = useUpdateContentItem()
  const deleteItem = useDeleteContentItem()

  const columns = useMemo<ColumnDef<ContentItem>[]>(
    () => [
      {
        id: 'content_idea',
        header: 'Content Idea',
        accessorKey: 'content_idea',
        meta: { type: 'text', editable: true },
      },
      {
        id: 'platform',
        header: 'Platform',
        accessorKey: 'platform',
        meta: { type: 'select', options: PLATFORM_OPTS },
      },
      {
        id: 'type',
        header: 'Type',
        accessorKey: 'type',
        meta: { type: 'text', editable: true },
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        meta: { type: 'select', options: STATUS_OPTS },
      },
      {
        id: 'scheduled_date',
        header: 'Scheduled Date',
        accessorKey: 'scheduled_date',
        meta: { type: 'date', editable: true },
      },
      {
        id: 'performance_notes',
        header: 'Performance Notes',
        accessorKey: 'performance_notes',
        meta: { type: 'text', editable: true },
      },
    ],
    [],
  )

  function handleUpdate(rowIndex: number, columnId: string, value: any) {
    const row = items[rowIndex]
    updateItem.mutate({
      id: row.id,
      workspace_id: workspaceId,
      [columnId]: value || null,
    })
  }

  return (
    <div>
      {/* View toggle */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {(['table', 'calendar'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs px-3 py-1 rounded-md capitalize transition-colors ${
                view === v ? 'bg-rose text-white' : 'text-text-mid hover:text-text-dark'
              }`}
            >
              {v === 'table' ? '≡ Table' : '📅 Calendar'}
            </button>
          ))}
        </div>
        {view === 'table' && (
          <button
            onClick={() => addItem.mutate({ content_idea: 'New Content', workspace_id: workspaceId, status: 'idea' })}
            className="flex items-center gap-1.5 bg-rose text-white text-xs px-3 py-2 rounded-lg hover:opacity-90"
          >
            <Plus size={13} /> Add
          </button>
        )}
      </div>

      {view === 'table' ? (
        <div className="bg-card rounded-card border border-border overflow-hidden m-5">
          <DataTable
            data={items}
            columns={columns}
            onRowUpdate={handleUpdate}
            onRowAdd={() => addItem.mutate({ content_idea: 'New Content', workspace_id: workspaceId, status: 'idea' })}
            onRowDelete={i => deleteItem.mutate({ id: items[i].id, workspaceId })}
            isLoading={isLoading}
            emptyMessage="No content yet. Click + to add."
          />
        </div>
      ) : (
        <CalendarView items={items} />
      )}
    </div>
  )
}
