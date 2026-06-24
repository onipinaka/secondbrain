import { localDateStr } from '../../../../lib/utils'
import { useState, useMemo } from 'react'
import { Star, Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import { useGymExercises, useSaveGymWorkout } from '../../../../hooks/useGym'

type Props = { workspaceId: string; onTabChange: (key: string) => void }

const WORKOUT_TYPES = ['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Lower Body', 'Full Body', 'Cardio', 'Calisthenics', 'Mobility', 'Rest']
const LOCATIONS = ['Gym', 'Home', 'Outdoor', 'Hotel', 'CrossFit Box']
const ENERGY_OPTS = ['Low', 'Medium', 'High', 'Very High']
const FOCUS_OPTS = ['Low', 'Medium', 'High', 'Very High']
const FEEL_OPTS = ['Strong', 'Good', 'Okay', 'Tired']
const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Full Body']

type ExerciseRow = {
  id: string
  exerciseId: string
  exerciseName: string
  muscleGroup: string
  repsStr: string
  weightStr: string
  notes: string
}

function todayISO() { return localDateStr() }

function nowTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function parseDuration(start: string, end: string): number | null {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? diff : null
}

function fmtDuration(mins: number | null) {
  if (!mins) return '—'
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function calcVolume(rows: ExerciseRow[]): number {
  let total = 0
  rows.forEach(r => {
    const weights = r.weightStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
    const reps = r.repsStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    const sets = Math.max(weights.length, reps.length)
    for (let i = 0; i < sets; i++) {
      total += (weights[i] ?? 0) * (reps[i] ?? 0)
    }
  })
  return Math.round(total)
}

function buildSets(rows: ExerciseRow[]) {
  const result: { exercise_id: string; set_number: number; reps: number | null; weight_kg: number | null; notes: string | null }[] = []
  rows.forEach(r => {
    const repsArr = r.repsStr.split(',').map(s => parseInt(s.trim()))
    const wArr = r.weightStr.split(',').map(s => parseFloat(s.trim()))
    const count = Math.max(repsArr.length, wArr.length)
    for (let i = 0; i < count; i++) {
      result.push({
        exercise_id: r.exerciseId,
        set_number: i + 1,
        reps: isNaN(repsArr[i]) ? null : repsArr[i],
        weight_kg: isNaN(wArr[i]) ? null : wArr[i],
        notes: r.notes || null,
      })
    }
  })
  return result
}

export default function LogWorkoutTab({ workspaceId: _workspaceId, onTabChange }: Props) {
  const { data: gymExercises = [] } = useGymExercises()
  const saveWorkout = useSaveGymWorkout()

  // Workout details
  const [date, setDate] = useState(todayISO())
  const [workoutType, setWorkoutType] = useState('Push Day')
  const [location, setLocation] = useState('Gym')
  const [startTime, setStartTime] = useState(nowTime())
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [caloriesBurned, setCaloriesBurned] = useState('')
  const [avgHeartRate, setAvgHeartRate] = useState('')

  // Exercises
  const [exerciseRows, setExerciseRows] = useState<ExerciseRow[]>([])
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [pickId, setPickId] = useState('')
  const [pickReps, setPickReps] = useState('')
  const [pickWeight, setPickWeight] = useState('')
  const [pickNotes, setPickNotes] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  // Feeling
  const [rating, setRating] = useState(0)
  const [energyLevel, setEnergyLevel] = useState('High')
  const [focusLevel, setFocusLevel] = useState('High')
  const [feel, setFeel] = useState('')
  const [hasSoreness, setHasSoreness] = useState(false)
  const [soreAreas, setSoreAreas] = useState<string[]>([])
  const [postNote, setPostNote] = useState('')

  const duration = parseDuration(startTime, endTime)
  const volume = useMemo(() => calcVolume(exerciseRows), [exerciseRows])

  const selectedExercise = gymExercises.find(e => String(e.id) === pickId)

  function addExerciseRow() {
    if (!pickId || !selectedExercise) return
    const row: ExerciseRow = {
      id: crypto.randomUUID(),
      exerciseId: pickId,
      exerciseName: selectedExercise.name,
      muscleGroup: selectedExercise.muscle_group ?? '',
      repsStr: pickReps,
      weightStr: pickWeight,
      notes: pickNotes,
    }
    if (editingIdx !== null) {
      setExerciseRows(r => r.map((er, i) => i === editingIdx ? row : er))
      setEditingIdx(null)
    } else {
      setExerciseRows(r => [...r, row])
    }
    setPickId(''); setPickReps(''); setPickWeight(''); setPickNotes('')
    setShowAddExercise(false)
  }

  function startEdit(idx: number) {
    const row = exerciseRows[idx]
    setPickId(row.exerciseId)
    setPickReps(row.repsStr)
    setPickWeight(row.weightStr)
    setPickNotes(row.notes)
    setEditingIdx(idx)
    setShowAddExercise(true)
  }

  function toggleSoreArea(area: string) {
    setSoreAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  async function handleSave() {
    const startDt = startTime ? new Date(`${date}T${startTime}:00`).toISOString() : null
    const endDt = endTime ? new Date(`${date}T${endTime}:00`).toISOString() : null

    await saveWorkout.mutateAsync({
      workout: {
        date,
        workout_type: workoutType || null,
        location: location || null,
        start_time: startDt,
        end_time: endDt,
        duration_minutes: duration,
        notes: notes || null,
        calories_burned: caloriesBurned ? Number(caloriesBurned) : null,
        avg_heart_rate: avgHeartRate ? Number(avgHeartRate) : null,
        rating: rating || null,
        energy_level: energyLevel || null,
        focus_level: focusLevel || null,
        feel: feel || null,
        has_soreness: hasSoreness,
        sore_areas: soreAreas.length ? soreAreas : null,
        post_workout_note: postNote || null,
        muscle_groups: null,
      },
      sets: buildSets(exerciseRows),
    })
    onTabChange('workout_log')
  }

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-1.5 text-rose text-sm font-medium hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="font-display text-3xl font-semibold text-text-dark">Log Workout</h1>
          <p className="text-sm text-text-mid mt-0.5">Track your workout and progress.</p>
        </div>
        <p className="text-sm text-text-mid">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* ── Left main column ── */}
        <div className="col-span-2 flex flex-col gap-5">

          {/* 1. Workout Details */}
          <div className="bg-card rounded-card border border-border p-5">
            <p className="text-sm font-semibold text-text-dark mb-4">1. Workout Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">
                  Workout Type <span className="text-rose">*</span>
                </label>
                <select
                  value={workoutType}
                  onChange={e => setWorkoutType(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
                >
                  {WORKOUT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">Location</label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
                >
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">Date</label>
                <input
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream" />
                </div>
                <div>
                  <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">
                    End Time {duration && <span className="text-rose font-normal normal-case">({fmtDuration(duration)})</span>}
                  </label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">Notes (Optional)</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="How did your workout feel?"
                rows={3}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream resize-none"
              />
            </div>
          </div>

          {/* 2. Exercises */}
          <div className="bg-card rounded-card border border-border p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-text-dark">2. Exercises</p>
              <button
                onClick={() => { setShowAddExercise(true); setEditingIdx(null) }}
                className="flex items-center gap-1 text-rose text-sm font-medium hover:underline"
              >
                <Plus className="w-4 h-4" /> Add Exercise
              </button>
            </div>
            <p className="text-xs text-text-light mb-4">Add the exercises you performed.</p>

            {exerciseRows.length > 0 && (
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b border-border">
                    {['Exercise', 'Sets', 'Reps', 'Weight (kg)', 'Notes', 'Action'].map(h => (
                      <th key={h} className="text-left px-2 py-2 text-[10px] text-text-light uppercase tracking-wide font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exerciseRows.map((row, idx) => {
                    const setsCount = Math.max(
                      row.repsStr.split(',').filter(s => s.trim()).length,
                      row.weightStr.split(',').filter(s => s.trim()).length,
                    ) || 1
                    return (
                      <tr key={row.id} className="border-b border-border last:border-0 hover:bg-cream/40 transition-colors">
                        <td className="px-2 py-3">
                          <p className="font-medium text-text-dark">{row.exerciseName}</p>
                          {row.muscleGroup && <p className="text-[10px] text-text-light capitalize">{row.muscleGroup}</p>}
                        </td>
                        <td className="px-2 py-3 text-text-mid">{setsCount}</td>
                        <td className="px-2 py-3 text-text-mid">{row.repsStr || '—'}</td>
                        <td className="px-2 py-3 text-text-mid">{row.weightStr || '—'}</td>
                        <td className="px-2 py-3 text-text-light text-xs">{row.notes || '—'}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEdit(idx)} className="text-text-light hover:text-rose transition-colors">
                              ✏️
                            </button>
                            <button onClick={() => setExerciseRows(r => r.filter((_, i) => i !== idx))} className="text-text-light hover:text-rose transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* Add exercise inline form */}
            {showAddExercise && (
              <div className="border border-rose/30 rounded-xl p-4 bg-rose-bg/20">
                <p className="text-xs font-semibold text-text-dark mb-3">
                  {editingIdx !== null ? 'Edit Exercise' : 'Add Exercise'}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">Exercise</label>
                    <select
                      value={pickId} onChange={e => setPickId(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
                    >
                      <option value="">Select exercise…</option>
                      {gymExercises.map(e => (
                        <option key={e.id} value={String(e.id)}>
                          {e.name}{e.muscle_group ? ` (${e.muscle_group})` : ''}
                        </option>
                      ))}
                    </select>
                    {gymExercises.length === 0 && (
                      <p className="text-xs text-text-light mt-1">No exercises in library. Add some in the Exercises tab first.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">
                      Reps per set <span className="font-normal normal-case">(comma-separated)</span>
                    </label>
                    <input
                      type="text" value={pickReps} onChange={e => setPickReps(e.target.value)}
                      placeholder="8, 8, 6, 6"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">
                      Weight kg per set <span className="font-normal normal-case">(comma-separated, or blank for bodyweight)</span>
                    </label>
                    <input
                      type="text" value={pickWeight} onChange={e => setPickWeight(e.target.value)}
                      placeholder="80, 80, 85, 85"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">Notes</label>
                    <input
                      type="text" value={pickNotes} onChange={e => setPickNotes(e.target.value)}
                      placeholder="Felt strong, slow negatives…"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addExerciseRow}
                    disabled={!pickId}
                    className="flex-1 bg-rose text-white py-2 rounded-lg text-sm font-medium hover:bg-rose/90 disabled:opacity-50 transition-colors"
                  >
                    {editingIdx !== null ? 'Update Exercise' : 'Add Exercise'}
                  </button>
                  <button
                    onClick={() => { setShowAddExercise(false); setEditingIdx(null); setPickId(''); setPickReps(''); setPickWeight(''); setPickNotes('') }}
                    className="px-4 border border-border text-text-mid py-2 rounded-lg text-sm hover:bg-cream transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {exerciseRows.length === 0 && !showAddExercise && (
              <button
                onClick={() => setShowAddExercise(true)}
                className="w-full border border-dashed border-rose/30 text-rose/70 py-4 rounded-xl text-sm hover:bg-rose-bg/20 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Another Exercise
              </button>
            )}

            {exerciseRows.length > 0 && !showAddExercise && (
              <button
                onClick={() => setShowAddExercise(true)}
                className="w-full border border-dashed border-rose/30 text-rose/70 py-3 rounded-xl text-sm hover:bg-rose-bg/20 transition-colors mt-3"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Another Exercise
              </button>
            )}
          </div>

          {/* 3. How Was Your Workout */}
          <div className="bg-card rounded-card border border-border p-5">
            <p className="text-sm font-semibold text-text-dark mb-4">3. How Was Your Workout?</p>

            {/* Star rating */}
            <div className="mb-4">
              <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-2">Rate Your Workout</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={`w-7 h-7 transition-colors ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-border'}`} />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-text-mid mt-1">
                  {['', 'Terrible', 'Bad', 'Okay', 'Great workout!', 'Legendary!'][rating]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">Energy Level</label>
                <select value={energyLevel} onChange={e => setEnergyLevel(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream">
                  {ENERGY_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-1">Focus Level</label>
                <select value={focusLevel} onChange={e => setFocusLevel(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream">
                  {FOCUS_OPTS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* How did you feel chips */}
            <div className="mb-4">
              <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-2">How did you feel?</label>
              <div className="flex gap-2">
                {FEEL_OPTS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFeel(feel === f.toLowerCase() ? '' : f.toLowerCase())}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      feel === f.toLowerCase()
                        ? 'bg-rose text-white'
                        : 'border border-border text-text-mid hover:border-rose hover:text-rose'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Soreness */}
            <div>
              <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-2">Any soreness?</label>
              <div className="flex gap-2 mb-3">
                {['Yes', 'No'].map(v => (
                  <button
                    key={v}
                    onClick={() => setHasSoreness(v === 'Yes')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      hasSoreness === (v === 'Yes')
                        ? 'bg-rose text-white'
                        : 'border border-border text-text-mid hover:border-rose hover:text-rose'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {hasSoreness && (
                <div>
                  <label className="text-[10px] text-text-light uppercase tracking-wide font-medium block mb-2">Sore Areas (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {MUSCLE_GROUPS.map(m => (
                      <button
                        key={m}
                        onClick={() => toggleSoreArea(m)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                          soreAreas.includes(m)
                            ? 'bg-rose-light border-rose text-rose'
                            : 'border-border text-text-mid hover:border-rose'
                        }`}
                      >
                        {m}
                        {soreAreas.includes(m) && <span className="ml-0.5">×</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Post-Workout Note */}
          <div className="bg-card rounded-card border border-border p-5">
            <p className="text-sm font-semibold text-text-dark mb-3">
              5. Post-Workout Note <span className="text-text-light font-normal">(Optional)</span>
            </p>
            <textarea
              value={postNote} onChange={e => setPostNote(e.target.value)}
              placeholder="Any notes for your future self…"
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose bg-cream resize-none"
            />
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-4">
          {/* Workout Summary */}
          <div className="bg-card rounded-card border border-border p-4 sticky top-5">
            <p className="text-sm font-semibold text-text-dark mb-4">Workout Summary</p>
            <div className="flex flex-col gap-3">
              {[
                {
                  icon: '🔥', label: 'Calories Burned',
                  value: caloriesBurned ? `${caloriesBurned} kcal` : null,
                  input: <input type="number" value={caloriesBurned} onChange={e => setCaloriesBurned(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-24 text-right text-sm border border-border rounded-lg px-2 py-1 focus:outline-none focus:border-rose bg-cream text-rose font-semibold" />,
                },
                {
                  icon: '❤️', label: 'Avg. Heart Rate',
                  value: avgHeartRate ? `${avgHeartRate} bpm` : null,
                  input: <input type="number" value={avgHeartRate} onChange={e => setAvgHeartRate(e.target.value)}
                    placeholder="e.g. 128"
                    className="w-24 text-right text-sm border border-border rounded-lg px-2 py-1 focus:outline-none focus:border-rose bg-cream font-semibold" />,
                },
                { icon: '📊', label: 'Volume', value: volume > 0 ? `${volume.toLocaleString()} kg` : '—', input: null },
                { icon: '💪', label: 'Exercises', value: String(exerciseRows.length), input: null },
                { icon: '⏱', label: 'Duration', value: fmtDuration(duration), input: null },
              ].map(({ icon, label, value, input }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-sm text-text-mid">{label}</span>
                  </div>
                  {input ?? <span className="text-sm font-semibold text-text-dark">{value}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* 4. Progress Photo placeholder */}
          <div className="bg-card rounded-card border border-border p-4">
            <p className="text-sm font-semibold text-text-dark mb-3">
              4. Add Progress Photo <span className="text-text-light font-normal">(Optional)</span>
            </p>
            <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">📸</span>
              <p className="text-sm font-medium text-text-mid">Upload Photo</p>
              <p className="text-xs text-text-light">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={() => onTabChange('workout_log')}
          className="px-6 py-2.5 border border-border text-text-mid rounded-lg text-sm hover:bg-cream transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saveWorkout.isPending || !workoutType}
          className="flex items-center gap-2 bg-rose text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-rose/90 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saveWorkout.isPending ? 'Saving…' : 'Save Workout'}
        </button>
      </div>
    </div>
  )
}
