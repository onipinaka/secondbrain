import { localDateStr } from '../lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkoutLog = {
  id: string
  log_date: string
  workout_name: string
  type: string | null
  duration_mins: number | null
  intensity: string | null
  pr_hit: boolean | null
  notes: string | null
  created_at: string | null
}

export type Exercise = {
  id: string
  name: string
  muscle_group: string | null
  equipment: string | null
  form_notes: string | null
  video_url: string | null
  created_at: string | null
}

export type PRTracker = {
  id: string
  exercise_name: string
  exercise_id: string | null
  current_max: string | null
  date_achieved: string | null
  goal: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type BodyMetrics = {
  id: string
  logged_at: string
  weight_kg: number | null
  created_at: string | null
}

export type GymProfile = {
  id: string
  height_cm: number
  created_at: string
  updated_at: string
}

export type GymPushupLog = {
  id: string
  created_at: string
  logged_at: string
  count: number
  notes: string | null
}

export type GymPushupGoal = {
  id: string
  created_at: string
  effective_from: string
  daily_goal: number
}

export type GymWorkout = {
  id: string
  created_at: string
  updated_at: string
  date: string
  muscle_groups: string[] | null
  duration_minutes: number | null
  notes: string | null
  workout_type: string | null
  location: string | null
  start_time: string | null
  end_time: string | null
  calories_burned: number | null
  avg_heart_rate: number | null
  rating: number | null
  energy_level: string | null
  focus_level: string | null
  feel: string | null
  has_soreness: boolean | null
  sore_areas: string[] | null
  post_workout_note: string | null
}

export type GymExercise = {
  id: string
  created_at: string
  updated_at: string
  name: string
  muscle_group: string | null
  equipment: string | null
  notes: string | null
  form_notes: string | null
  video_url: string | null
}

export type GymWorkoutSet = {
  id: string
  created_at: string
  workout_id: string
  exercise_id: string
  set_number: number | null
  reps: number | null
  weight_kg: number | null
  is_warmup: boolean | null
  notes: string | null
}

export type DietLog = {
  id: string
  log_date: string
  meal: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fats_g: number | null
  notes: string | null
  created_at: string | null
}

export type StepsLog = {
  id: string
  log_date: string
  steps: number | null
  goal: number | null
  notes: string | null
  created_at: string | null
}

export type CaloriesLog = {
  id: string
  log_date: string
  total_calories: number | null
  goal: number | null
  notes: string | null
  created_at: string | null
}

export type PushupLog = {
  id: string
  log_date: string
  total_pushups: number | null
  sets_reps_breakdown: string | null
  goal: number | null
  personal_best_single_set: number | null
  notes: string | null
  created_at: string | null
}

export type CalisthenicsSkill = {
  id: string
  skill: string
  current_level: string | null
  target_level: string | null
  training_notes: string | null
  progression_plan: string | null
  video_url: string | null
  created_at: string | null
  updated_at: string | null
}

export type CalisthenicsSession = {
  id: string
  log_date: string
  skills_practiced: string | null
  duration_mins: number | null
  notes: string | null
  created_at: string | null
}

// ─── Workout Log ─────────────────────────────────────────────────────────────

export function useWorkoutLogs() {
  return useQuery({
    queryKey: ['workout_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_log')
        .select('*')
        .order('log_date', { ascending: false })
      if (error) throw error
      return data as WorkoutLog[]
    },
  })
}

export function useAddWorkoutLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { log_date: string; workout_name: string; type?: string | null }) => {
      const { data, error } = await supabase.from('workout_log').insert(input).select().single()
      if (error) throw error
      return data as WorkoutLog
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workout_logs'] }); toast.success('Workout added') },
    onError: () => toast.error('Failed to add workout'),
  })
}

export function useUpdateWorkoutLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<WorkoutLog> & { id: string }) => {
      const { error } = await supabase.from('workout_log').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout_logs'] }),
    onError: () => toast.error('Failed to update workout'),
  })
}

export function useDeleteWorkoutLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workout_log').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workout_logs'] }); toast.success('Workout deleted') },
    onError: () => toast.error('Failed to delete workout'),
  })
}

// ─── Exercises ───────────────────────────────────────────────────────────────

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as Exercise[]
    },
  })
}

export function useAddExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const { data, error } = await supabase.from('exercises').insert(input).select().single()
      if (error) throw error
      return data as Exercise
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exercises'] }); toast.success('Exercise added') },
    onError: () => toast.error('Failed to add exercise'),
  })
}

export function useUpdateExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Exercise> & { id: string }) => {
      const { error } = await supabase.from('exercises').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
    onError: () => toast.error('Failed to update exercise'),
  })
}

export function useDeleteExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercises').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exercises'] }); toast.success('Exercise deleted') },
    onError: () => toast.error('Failed to delete exercise'),
  })
}

// ─── PR Tracker ───────────────────────────────────────────────────────────────

export function usePRTrackers() {
  return useQuery({
    queryKey: ['pr_trackers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pr_tracker')
        .select('*')
        .order('exercise_name', { ascending: true })
      if (error) throw error
      return data as PRTracker[]
    },
  })
}

export function useAddPRTracker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { exercise_name: string }) => {
      const { data, error } = await supabase.from('pr_tracker').insert(input).select().single()
      if (error) throw error
      return data as PRTracker
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pr_trackers'] }); toast.success('PR entry added') },
    onError: () => toast.error('Failed to add PR entry'),
  })
}

export function useUpdatePRTracker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PRTracker> & { id: string }) => {
      const { error } = await supabase.from('pr_tracker').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pr_trackers'] }),
    onError: () => toast.error('Failed to update PR'),
  })
}

export function useDeletePRTracker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pr_tracker').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pr_trackers'] }); toast.success('PR deleted') },
    onError: () => toast.error('Failed to delete PR'),
  })
}

// ─── Body Metrics ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export function useBodyMetrics() {
  return useQuery({
    queryKey: ['gym_body_metrics'],
    queryFn: async () => {
      const { data, error } = await db
        .from('gym_body_metrics')
        .select('id, logged_at, weight_kg, created_at')
        .order('logged_at', { ascending: false })
      if (error) throw error
      return data as BodyMetrics[]
    },
  })
}

export function useAddBodyMetric() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { logged_at: string; weight_kg: number }) => {
      const { data, error } = await db.from('gym_body_metrics').insert(input).select().single()
      if (error) throw error
      return data as BodyMetrics
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_body_metrics'] }); toast.success('Weight logged') },
    onError: () => toast.error('Failed to log weight'),
  })
}

export function useDeleteBodyMetric() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('gym_body_metrics').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_body_metrics'] }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete entry'),
  })
}

// ─── Gym Profile ──────────────────────────────────────────────────────────────

export function useGymProfile() {
  return useQuery({
    queryKey: ['gym_profile'],
    queryFn: async () => {
      const { data, error } = await db
        .from('gym_profile')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as GymProfile | null
    },
  })
}

export function useUpsertGymProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ height_cm }: { height_cm: number }) => {
      const { data: existing } = await db.from('gym_profile').select('id').limit(1).maybeSingle()
      if (existing?.id) {
        const { error } = await db.from('gym_profile').update({ height_cm }).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await db.from('gym_profile').insert({ height_cm })
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_profile'] }); toast.success('Height saved') },
    onError: () => toast.error('Failed to save height'),
  })
}

// ─── Diet Log ─────────────────────────────────────────────────────────────────

export function useDietLogs() {
  return useQuery({
    queryKey: ['diet_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diet_log')
        .select('*')
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as DietLog[]
    },
  })
}

export function useAddDietLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { log_date: string; meal: string }) => {
      const { data, error } = await supabase.from('diet_log').insert(input).select().single()
      if (error) throw error
      return data as DietLog
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diet_logs'] }); toast.success('Meal added') },
    onError: () => toast.error('Failed to add meal'),
  })
}

export function useUpdateDietLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DietLog> & { id: string }) => {
      const { error } = await supabase.from('diet_log').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet_logs'] }),
    onError: () => toast.error('Failed to update meal'),
  })
}

export function useDeleteDietLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('diet_log').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diet_logs'] }); toast.success('Meal deleted') },
    onError: () => toast.error('Failed to delete meal'),
  })
}

// ─── Steps Log ────────────────────────────────────────────────────────────────

export function useStepsLogs() {
  return useQuery({
    queryKey: ['steps_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('steps_log')
        .select('*')
        .order('log_date', { ascending: false })
      if (error) throw error
      return data as StepsLog[]
    },
  })
}

export function useAddStepsLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { log_date: string }) => {
      const { data, error } = await supabase.from('steps_log').insert(input).select().single()
      if (error) throw error
      return data as StepsLog
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['steps_logs'] }); toast.success('Steps added') },
    onError: () => toast.error('Failed to add steps'),
  })
}

export function useUpdateStepsLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<StepsLog> & { id: string }) => {
      const { error } = await supabase.from('steps_log').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['steps_logs'] }),
    onError: () => toast.error('Failed to update steps'),
  })
}

export function useDeleteStepsLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('steps_log').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['steps_logs'] }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete entry'),
  })
}

// ─── Calories Log ─────────────────────────────────────────────────────────────

export function useCaloriesLogs() {
  return useQuery({
    queryKey: ['calories_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calories_log')
        .select('*')
        .order('log_date', { ascending: false })
      if (error) throw error
      return data as CaloriesLog[]
    },
  })
}

export function useAddCaloriesLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { log_date: string }) => {
      const { data, error } = await supabase.from('calories_log').insert(input).select().single()
      if (error) throw error
      return data as CaloriesLog
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calories_logs'] }); toast.success('Entry added') },
    onError: () => toast.error('Failed to add entry'),
  })
}

export function useUpdateCaloriesLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CaloriesLog> & { id: string }) => {
      const { error } = await supabase.from('calories_log').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calories_logs'] }),
    onError: () => toast.error('Failed to update entry'),
  })
}

export function useDeleteCaloriesLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calories_log').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calories_logs'] }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete entry'),
  })
}

// ─── Pushup Log ───────────────────────────────────────────────────────────────

export function usePushupLogs() {
  return useQuery({
    queryKey: ['pushup_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pushup_log')
        .select('*')
        .order('log_date', { ascending: false })
      if (error) throw error
      return data as PushupLog[]
    },
  })
}

export function useAddPushupLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { log_date: string }) => {
      const { data, error } = await supabase.from('pushup_log').insert(input).select().single()
      if (error) throw error
      return data as PushupLog
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pushup_logs'] }); toast.success('Pushup log added') },
    onError: () => toast.error('Failed to add pushup log'),
  })
}

export function useUpdatePushupLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PushupLog> & { id: string }) => {
      const { error } = await supabase.from('pushup_log').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pushup_logs'] }),
    onError: () => toast.error('Failed to update pushup log'),
  })
}

export function useDeletePushupLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pushup_log').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pushup_logs'] }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete entry'),
  })
}

// ─── Calisthenics Skills ──────────────────────────────────────────────────────

export function useCalisthenicsSkills() {
  return useQuery({
    queryKey: ['calisthenics_skills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calisthenics_skills')
        .select('*')
        .order('skill', { ascending: true })
      if (error) throw error
      return data as CalisthenicsSkill[]
    },
  })
}

export function useAddCalisthenicsSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { skill: string }) => {
      const { data, error } = await supabase.from('calisthenics_skills').insert(input).select().single()
      if (error) throw error
      return data as CalisthenicsSkill
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calisthenics_skills'] }); toast.success('Skill added') },
    onError: () => toast.error('Failed to add skill'),
  })
}

export function useUpdateCalisthenicsSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CalisthenicsSkill> & { id: string }) => {
      const { error } = await supabase.from('calisthenics_skills').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calisthenics_skills'] }),
    onError: () => toast.error('Failed to update skill'),
  })
}

export function useDeleteCalisthenicsSkill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calisthenics_skills').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calisthenics_skills'] }); toast.success('Skill deleted') },
    onError: () => toast.error('Failed to delete skill'),
  })
}

// ─── Calisthenics Sessions ────────────────────────────────────────────────────

export function useCalisthenicsSessions() {
  return useQuery({
    queryKey: ['calisthenics_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calisthenics_sessions')
        .select('*')
        .order('log_date', { ascending: false })
      if (error) throw error
      return data as CalisthenicsSession[]
    },
  })
}

export function useAddCalisthenicsSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { log_date: string }) => {
      const { data, error } = await supabase.from('calisthenics_sessions').insert(input).select().single()
      if (error) throw error
      return data as CalisthenicsSession
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calisthenics_sessions'] }); toast.success('Session added') },
    onError: () => toast.error('Failed to add session'),
  })
}

export function useUpdateCalisthenicsSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CalisthenicsSession> & { id: string }) => {
      const { error } = await supabase.from('calisthenics_sessions').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calisthenics_sessions'] }),
    onError: () => toast.error('Failed to update session'),
  })
}

export function useDeleteCalisthenicsSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calisthenics_sessions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calisthenics_sessions'] }); toast.success('Session deleted') },
    onError: () => toast.error('Failed to delete session'),
  })
}

// ─── Gym Pushup Logs (new schema) ─────────────────────────────────────────────

export function useGymPushupLogs() {
  return useQuery({
    queryKey: ['gym_pushup_logs'],
    queryFn: async () => {
      const { data, error } = await db
        .from('gym_pushup_logs')
        .select('*')
        .order('logged_at', { ascending: false })
      if (error) throw error
      return data as GymPushupLog[]
    },
  })
}

export function useAddGymPushupLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { count: number; logged_at: string }) => {
      const { data, error } = await db.from('gym_pushup_logs').insert(input).select().single()
      if (error) throw error
      return data as GymPushupLog
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_pushup_logs'] }); toast.success('Pushups logged') },
    onError: () => toast.error('Failed to log pushups'),
  })
}

export function useDeleteGymPushupLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('gym_pushup_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_pushup_logs'] }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Gym Pushup Goals (new schema) ────────────────────────────────────────────

export function useGymPushupGoals() {
  return useQuery({
    queryKey: ['gym_pushup_goals'],
    queryFn: async () => {
      const { data, error } = await db
        .from('gym_pushup_goals')
        .select('*')
        .order('effective_from', { ascending: false })
      if (error) throw error
      return data as GymPushupGoal[]
    },
  })
}

export function useSetGymPushupGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (daily_goal: number) => {
      const today = localDateStr()
      const { error } = await db
        .from('gym_pushup_goals')
        .upsert({ effective_from: today, daily_goal }, { onConflict: 'effective_from' })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_pushup_goals'] }); toast.success('Goal updated') },
    onError: () => toast.error('Failed to update goal'),
  })
}

// ─── Gym Workouts (new schema) ────────────────────────────────────────────────

export function useGymWorkouts() {
  return useQuery({
    queryKey: ['gym_workouts'],
    queryFn: async () => {
      const { data, error } = await db
        .from('gym_workouts')
        .select('*')
        .order('date', { ascending: false })
      if (error) throw error
      return data as GymWorkout[]
    },
  })
}

export function useDeleteGymWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('gym_workouts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_workouts'] }); toast.success('Workout deleted') },
    onError: () => toast.error('Failed to delete workout'),
  })
}

export function useSaveGymWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      workout,
      sets,
    }: {
      workout: Omit<GymWorkout, 'id' | 'created_at' | 'updated_at'>
      sets: { exercise_id: string; set_number: number; reps: number | null; weight_kg: number | null; notes: string | null }[]
    }) => {
      const { data, error } = await db.from('gym_workouts').insert(workout).select('id').single()
      if (error) throw error
      const workoutId = data.id
      if (sets.length > 0) {
        const { error: setsError } = await db.from('gym_workout_sets').insert(
          sets.map(s => ({ ...s, workout_id: workoutId }))
        )
        if (setsError) throw setsError
      }
      return workoutId
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_workouts'] }); toast.success('Workout saved!') },
    onError: () => toast.error('Failed to save workout'),
  })
}

export function useGymWorkoutSets(workoutId: string | null) {
  return useQuery({
    queryKey: ['gym_workout_sets', workoutId],
    enabled: !!workoutId,
    queryFn: async () => {
      const { data, error } = await db
        .from('gym_workout_sets')
        .select('*, gym_exercises(name, muscle_group)')
        .eq('workout_id', workoutId)
        .order('set_number', { ascending: true })
      if (error) throw error
      return data as (GymWorkoutSet & { gym_exercises: { name: string; muscle_group: string | null } | null })[]
    },
  })
}

// ─── Gym Exercises (new schema) ───────────────────────────────────────────────

export function useGymExercises() {
  return useQuery({
    queryKey: ['gym_exercises'],
    queryFn: async () => {
      const { data, error } = await db
        .from('gym_exercises')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as GymExercise[]
    },
  })
}

export function useAddGymExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; muscle_group?: string; equipment?: string; notes?: string; form_notes?: string }) => {
      const { data, error } = await db.from('gym_exercises').insert(input).select().single()
      if (error) throw error
      return data as GymExercise
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_exercises'] }); toast.success('Exercise added') },
    onError: () => toast.error('Failed to add exercise'),
  })
}

export function useUpdateGymExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<GymExercise> & { id: string }) => {
      const { error } = await db.from('gym_exercises').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gym_exercises'] }),
    onError: () => toast.error('Failed to update exercise'),
  })
}

export function useDeleteGymExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('gym_exercises').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_exercises'] }); toast.success('Exercise deleted') },
    onError: () => toast.error('Failed to delete exercise'),
  })
}

// ─── Gym Steps Log (new schema) ───────────────────────────────────────────────

export type GymStepsLog = {
  id: string
  created_at: string
  log_date: string
  steps: number
  goal: number | null
  notes: string | null
}

export function useGymStepsLogs() {
  return useQuery({
    queryKey: ['gym_steps_log'],
    queryFn: async () => {
      const { data, error } = await db
        .from('gym_steps_log')
        .select('*')
        .order('log_date', { ascending: false })
      if (error) throw error
      return data as GymStepsLog[]
    },
  })
}

export function useAddGymStepsLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { log_date: string; steps: number; goal?: number; notes?: string }) => {
      const { data, error } = await db.from('gym_steps_log').insert(input).select().single()
      if (error) throw error
      return data as GymStepsLog
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_steps_log'] }); toast.success('Steps logged') },
    onError: () => toast.error('Failed to log steps'),
  })
}

export function useUpdateGymStepsLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<GymStepsLog> & { id: string }) => {
      const { error } = await db.from('gym_steps_log').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gym_steps_log'] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteGymStepsLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('gym_steps_log').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_steps_log'] }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ──── Water ────────────────────────────────────────────────────

export type GymWaterLog = {
  id: string; created_at: string; logged_at: string
  amount_ml: number; notes: string | null
}

export type GymWaterGoal = {
  id: string; created_at: string; daily_goal_ml: number; effective_from: string
}

export function useGymWaterLogs() {
  return useQuery({
    queryKey: ['gym_water_log'],
    queryFn: async () => {
      const { data, error } = await db.from('gym_water_log')
        .select('*').order('logged_at', { ascending: false })
      if (error) throw error
      return data as GymWaterLog[]
    },
  })
}

export function useAddGymWaterLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { amount_ml: number; logged_at?: string; notes?: string }) => {
      const { data, error } = await db.from('gym_water_log').insert({
        ...input,
        logged_at: input.logged_at ?? new Date().toISOString(),
      }).select().single()
      if (error) throw error
      return data as GymWaterLog
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_water_log'] }); toast.success('Water logged') },
    onError: () => toast.error('Failed to log water'),
  })
}

export function useDeleteGymWaterLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('gym_water_log').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_water_log'] }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

export function useGymWaterGoals() {
  return useQuery({
    queryKey: ['gym_water_goal'],
    queryFn: async () => {
      const { data, error } = await db.from('gym_water_goal')
        .select('*').order('effective_from', { ascending: false })
      if (error) throw error
      return data as GymWaterGoal[]
    },
  })
}

export function useSetGymWaterGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (daily_goal_ml: number) => {
      const { error } = await db.from('gym_water_goal').insert({
        daily_goal_ml,
        effective_from: localDateStr(),
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_water_goal'] }); toast.success('Goal updated') },
    onError: () => toast.error('Failed to update goal'),
  })
}

// ──── Diet / Macros ────────────────────────────────────────────

export type GymDietLog = {
  id: string; created_at: string; logged_at: string
  meal_type: string; name: string | null
  calories: number | null; protein_g: number | null
  fat_g: number | null; carbs_g: number | null
  notes: string | null
}

export function useGymDietLogs() {
  return useQuery({
    queryKey: ['gym_diet_log'],
    queryFn: async () => {
      const { data, error } = await db.from('gym_diet_log')
        .select('*').order('logged_at', { ascending: false })
      if (error) throw error
      return data as GymDietLog[]
    },
  })
}

export function useAddGymDietLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<GymDietLog, 'id' | 'created_at'>) => {
      const { data, error } = await db.from('gym_diet_log').insert(input).select().single()
      if (error) throw error
      return data as GymDietLog
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_diet_log'] }); toast.success('Meal logged') },
    onError: () => toast.error('Failed to log meal'),
  })
}

export function useDeleteGymDietLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('gym_diet_log').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gym_diet_log'] }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}
