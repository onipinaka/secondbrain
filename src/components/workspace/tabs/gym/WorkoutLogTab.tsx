import { useState } from 'react'
import { Plus, Trash2, Star, Clock, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react'
import { useGymWorkouts, useDeleteGymWorkout, useGymWorkoutSets } from '../../../../hooks/useGym'

type Props = { workspaceId: string; onTabChange: (key: string) => void }

const TYPE_COLOR: Record<string, string> = {
  push: '#D4848A', pull: '#8BC49A', legs: '#8BACC4',
  cardio: '#F59E0B', calisthenics: '#A78BFA', rest: '#D1D5DB',
  upper: '#F9A8D4', lower: '#6EE7B7', full_body: '#93C5FD',
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function Stars({ n }: { n: number | null }) {
  if (!n) return null
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < n ? 'text-amber-400 fill-amber-400' : 'text-border'}`} />
      ))}
    </div>
  )
}

function WorkoutSetsList({ workoutId }: { workoutId: string }) {
  const { data: sets = [], isLoading } = useGymWorkoutSets(workoutId)

  if (isLoading) return <p className="text-xs text-text-light py-2">Loading sets…</p>
  if (!sets.length) return <p className="text-xs text-text-light py-2">No exercise sets recorded.</p>

  // Group by exercise
  const grouped = new Map<string, typeof sets>()
  sets.forEach(s => {
    const key = s.exercise_id
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(s)
  })

  return (
    <div className="flex flex-col gap-2 mt-3">
      {[...grouped.entries()].map(([, exSets]) => {
        const name = exSets[0].gym_exercises?.name ?? 'Unknown'
        const muscle = exSets[0].gym_exercises?.muscle_group
        const reps = exSets.map(s => s.reps ?? '—').join(', ')
        const weights = exSets.map(s => s.weight_kg != null ? `${s.weight_kg}` : 'BW').join(', ')
        return (
          <div key={name} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-text-dark">{name}</span>
              {muscle && <span className="ml-2 text-[10px] text-text-light capitalize">{muscle}</span>}
            </div>
            <div className="text-xs text-text-mid shrink-0">{exSets.length} sets</div>
            <div className="text-xs text-text-mid shrink-0">Reps: {reps}</div>
            <div className="text-xs text-text-mid shrink-0">kg: {weights}</div>
          </div>
        )
      })}
    </div>
  )
}

function WorkoutCard({ workout, onDelete }: {
  workout: ReturnType<typeof useGymWorkouts>['data'] extends (infer T)[] | undefined ? T : never
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const typeColor = TYPE_COLOR[workout.workout_type ?? ''] ?? '#D4848A'

  return (
    <div className="bg-card rounded-card border border-border overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: typeColor + '22' }}
            >
              <Dumbbell className="w-4 h-4" style={{ color: typeColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-base font-semibold text-text-dark">
                  {workout.workout_type ?? 'Workout'}
                </span>
                {workout.workout_type && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                    style={{ background: typeColor + '22', color: typeColor }}>
                    {workout.workout_type}
                  </span>
                )}
                <Stars n={workout.rating} />
              </div>
              <p className="text-xs text-text-mid mt-0.5">{fmtDate(workout.date)}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {workout.duration_minutes && (
                  <span className="flex items-center gap-1 text-xs text-text-mid">
                    <Clock className="w-3 h-3" /> {workout.duration_minutes} min
                  </span>
                )}
                {workout.location && (
                  <span className="text-xs text-text-light">📍 {workout.location}</span>
                )}
                {workout.feel && (
                  <span className="text-xs text-text-light capitalize">Felt: {workout.feel}</span>
                )}
                {workout.calories_burned && (
                  <span className="text-xs text-text-light">🔥 {workout.calories_burned} kcal</span>
                )}
              </div>
              {workout.notes && (
                <p className="text-xs text-text-mid mt-1 italic">{workout.notes}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-text-light hover:text-rose transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={onDelete} className="text-text-light hover:text-rose transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded exercise sets */}
        {expanded && <WorkoutSetsList workoutId={String(workout.id)} />}
      </div>
    </div>
  )
}

export default function WorkoutLogTab({ workspaceId: _workspaceId, onTabChange }: Props) {
  const { data: workouts = [], isLoading } = useGymWorkouts()
  const deleteWorkout = useDeleteGymWorkout()

  if (isLoading) {
    return <div className="p-8 text-center text-text-light text-sm">Loading…</div>
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-text-dark">Workout History</h2>
          <p className="text-sm text-text-mid mt-0.5">{workouts.length} workouts logged</p>
        </div>
        <button
          onClick={() => onTabChange('log_workout')}
          className="flex items-center gap-1.5 bg-rose text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Workout
        </button>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="w-10 h-10 text-border mx-auto mb-3" />
          <p className="text-text-mid text-sm">No workouts yet.</p>
          <button
            onClick={() => onTabChange('log_workout')}
            className="mt-3 text-rose text-sm hover:underline"
          >
            Log your first workout →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map(w => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onDelete={() => deleteWorkout.mutate(String(w.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
