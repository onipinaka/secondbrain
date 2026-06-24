import { localDateStr } from '../../../../lib/utils'
import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import DataTable from '../../../shared/DataTable'
import {
  useDietLogs, useAddDietLog, useUpdateDietLog, useDeleteDietLog,
  type DietLog,
} from '../../../../hooks/useGym'

type Props = { workspaceId: string }

function today() { return localDateStr() }

const NUM_COLS = new Set(['calories', 'protein_g', 'carbs_g', 'fats_g'])

const columns: ColumnDef<DietLog>[] = [
  { accessorKey: 'meal', header: 'Meal', meta: { type: 'text', editable: true } },
  { accessorKey: 'calories', header: 'Calories', meta: { type: 'number', editable: true } },
  { accessorKey: 'protein_g', header: 'Protein g', meta: { type: 'number', editable: true } },
  { accessorKey: 'carbs_g', header: 'Carbs g', meta: { type: 'number', editable: true } },
  { accessorKey: 'fats_g', header: 'Fats g', meta: { type: 'number', editable: true } },
  { accessorKey: 'notes', header: 'Notes', meta: { type: 'text', editable: true } },
]

const MACRO_COLORS = ['#D4848A', '#8BC49A', '#F59E0B']

export default function DietTab({ workspaceId: _workspaceId }: Props) {
  const [selectedDate, setSelectedDate] = useState(today())
  const { data: allLogs = [], isLoading } = useDietLogs()
  const addDietLog = useAddDietLog()
  const updateDietLog = useUpdateDietLog()
  const deleteDietLog = useDeleteDietLog()

  const dayLogs = allLogs.filter(l => l.log_date === selectedDate)

  const totalCals = dayLogs.reduce((s, l) => s + (l.calories ?? 0), 0)
  const totalProtein = dayLogs.reduce((s, l) => s + (l.protein_g ?? 0), 0)
  const totalCarbs = dayLogs.reduce((s, l) => s + (l.carbs_g ?? 0), 0)
  const totalFats = dayLogs.reduce((s, l) => s + (l.fats_g ?? 0), 0)

  const macroData = [
    { name: 'Protein', value: totalProtein },
    { name: 'Carbs', value: totalCarbs },
    { name: 'Fats', value: totalFats },
  ].filter(d => d.value > 0)

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <label className="text-xs text-text-mid font-medium">Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card outline-none focus:border-rose"
        />
        <span className="text-sm text-text-mid ml-2">
          {dayLogs.length} meal{dayLogs.length !== 1 ? 's' : ''} · {totalCals} kcal
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card rounded-card border border-border overflow-hidden">
          <DataTable
            data={dayLogs}
            columns={columns}
            isLoading={isLoading}
            onRowAdd={() => addDietLog.mutate({ log_date: selectedDate, meal: 'Meal' })}
            onRowUpdate={(rowIndex, columnId, value) => {
              const row = dayLogs[rowIndex]
              if (!row) return
              const v = NUM_COLS.has(columnId) ? (value === '' || value == null ? null : Number(value)) : value
              updateDietLog.mutate({ id: row.id, [columnId]: v })
            }}
            onRowDelete={rowIndex => deleteDietLog.mutate(dayLogs[rowIndex].id)}
            emptyMessage="No meals logged for this date."
          />
          {dayLogs.length > 0 && (
            <div className="px-3 py-2 bg-rose-bg/30 border-t border-border grid grid-cols-6 text-xs font-semibold text-text-dark">
              <span>Totals</span>
              <span>{totalCals} kcal</span>
              <span>{totalProtein}g</span>
              <span>{totalCarbs}g</span>
              <span>{totalFats}g</span>
              <span />
            </div>
          )}
        </div>

        {macroData.length > 0 && (
          <div className="bg-card rounded-card border border-border p-4">
            <p className="text-xs text-text-mid font-medium mb-2">Macros</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                  {macroData.map((_, i) => (
                    <Cell key={i} fill={MACRO_COLORS[i % MACRO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => [`${v}g`]}
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
