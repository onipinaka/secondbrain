import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '../../../shared/DataTable'
import {
  useGymExercises, useAddGymExercise, useUpdateGymExercise, useDeleteGymExercise,
  type GymExercise,
} from '../../../../hooks/useGym'

type Props = { workspaceId: string }

const MUSCLE_OPTS = [
  { value: 'chest',     label: 'Chest',     color: 'bg-red-100 text-red-600' },
  { value: 'back',      label: 'Back',      color: 'bg-blue-100 text-blue-600' },
  { value: 'shoulders', label: 'Shoulders', color: 'bg-purple-100 text-purple-600' },
  { value: 'biceps',    label: 'Biceps',    color: 'bg-indigo-100 text-indigo-600' },
  { value: 'triceps',   label: 'Triceps',   color: 'bg-orange-100 text-orange-600' },
  { value: 'legs',      label: 'Legs',      color: 'bg-green-100 text-green-600' },
  { value: 'glutes',    label: 'Glutes',    color: 'bg-rose-bg text-rose' },
  { value: 'core',      label: 'Core',      color: 'bg-amber-100 text-amber-700' },
  { value: 'full_body', label: 'Full Body', color: 'bg-gray-100 text-gray-600' },
  { value: 'cardio',    label: 'Cardio',    color: 'bg-cyan-100 text-cyan-600' },
]

const columns: ColumnDef<GymExercise>[] = [
  { accessorKey: 'name',         header: 'Name',         meta: { type: 'text',   editable: true } },
  { accessorKey: 'muscle_group', header: 'Muscle Group', meta: { type: 'select', editable: true, options: MUSCLE_OPTS } },
  { accessorKey: 'equipment',    header: 'Equipment',    meta: { type: 'text',   editable: true } },
  { accessorKey: 'form_notes',   header: 'Form Notes',   meta: { type: 'text',   editable: true } },
  { accessorKey: 'video_url',    header: 'Video URL',    meta: { type: 'text',   editable: true } },
  { accessorKey: 'notes',        header: 'Notes',        meta: { type: 'text',   editable: true } },
]

export default function ExercisesTab({ workspaceId: _workspaceId }: Props) {
  const { data: exercises = [], isLoading } = useGymExercises()
  const addExercise = useAddGymExercise()
  const updateExercise = useUpdateGymExercise()
  const deleteExercise = useDeleteGymExercise()

  return (
    <div className="p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-text-dark">Exercise Library</h2>
        <p className="text-sm text-text-mid mt-0.5">Your saved exercises used in workouts.</p>
      </div>
      <div className="bg-card rounded-card border border-border overflow-hidden">
        <DataTable
          data={exercises}
          columns={columns}
          isLoading={isLoading}
          onRowAdd={() => addExercise.mutate({ name: 'New Exercise' })}
          onRowUpdate={(rowIndex, columnId, value) => {
            const row = exercises[rowIndex]
            if (!row) return
            updateExercise.mutate({ id: row.id, [columnId]: value || null })
          }}
          onRowDelete={rowIndex => deleteExercise.mutate(exercises[rowIndex].id)}
          emptyMessage="No exercises yet. Click + to add one."
        />
      </div>
    </div>
  )
}
