import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

// database.ts is stale — cast for tables added in migrations 012 + 019
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Types ────────────────────────────────────────────────────────────────────

export type DailyPlannerDay = {
  id: string
  date: string
  intention: string | null
  day_focus: string | null
  mood: string | null          // great / good / okay / bad / terrible
  energy_level: number | null  // 1-10
  productivity_score: number | null  // 1-10
  gratitude: string | null
  wins: string | null
  improvements: string | null
  reflection: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type TopPriority = {
  id: string
  date: string
  position: number  // 1-3
  task_id: string | null
  custom_title: string | null
  is_done: boolean
  completed_at: string | null
  task_title?: string | null   // joined from tasks
  task_status?: string | null
}

export type PlannerScheduleItem = {
  id: string
  date: string
  start_time: string
  end_time: string
  title: string
  category: string | null   // deep_work / meeting / break / personal / admin / study / health / other
  task_id: string | null
  is_done: boolean
  notes: string | null
  workspace_id: string | null  // from migration 019
  is_hard_block: boolean | null
  status: string | null        // planned / done / skipped
  created_at: string | null
}

export type PlannerTask = {
  id: string
  title: string
  priority: string | null
  status: string | null
  due_date: string | null
  workspace_id: string | null
  description: string | null
}

export type PlannerReminder = {
  id: string
  content: string
  type: string
  title: string | null
  due_date: string | null
  due_time: string | null
  is_hard_block: boolean | null
}

// ─── Daily Planner Day ───────────────────────────────────────────────────────

export function useDailyPlannerDay(date: string) {
  return useQuery({
    queryKey: ['daily_planner_day', date],
    queryFn: async () => {
      const { data, error } = await db
        .from('daily_planner_days')
        .select('*')
        .eq('date', date)
        .maybeSingle()
      if (error) throw error
      return data as DailyPlannerDay | null
    },
  })
}

export function useUpsertDailyPlannerDay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      date,
      existingId,
      ...fields
    }: { date: string; existingId?: string } & Partial<Omit<DailyPlannerDay, 'id' | 'date' | 'created_at' | 'updated_at'>>) => {
      if (existingId) {
        const { error } = await db
          .from('daily_planner_days')
          .update(fields)
          .eq('id', existingId)
        if (error) throw error
      } else {
        const { error } = await db
          .from('daily_planner_days')
          .insert({ date, ...fields })
        if (error) throw error
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['daily_planner_day', vars.date] })
    },
    onError: () => toast.error('Failed to save'),
  })
}

// ─── Top Priorities ──────────────────────────────────────────────────────────

export function useTopPriorities(date: string) {
  return useQuery({
    queryKey: ['top_priorities', date],
    queryFn: async () => {
      const { data, error } = await db
        .from('daily_planner_top_priorities')
        .select('*, tasks(title, status)')
        .eq('date', date)
        .order('position', { ascending: true })
      if (error) throw error
      return ((data ?? []) as any[]).map(row => ({
        id: String(row.id),
        date: row.date,
        position: row.position,
        task_id: row.task_id ? String(row.task_id) : null,
        custom_title: row.custom_title,
        is_done: row.is_done ?? false,
        completed_at: row.completed_at,
        task_title: row.tasks?.title ?? null,
        task_status: row.tasks?.status ?? null,
      })) as TopPriority[]
    },
  })
}

export function useUpsertTopPriority() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      date,
      position,
      task_id,
      custom_title,
    }: {
      date: string
      position: 1 | 2 | 3
      task_id?: string | null
      custom_title?: string | null
    }) => {
      const { error } = await db
        .from('daily_planner_top_priorities')
        .upsert(
          { date, position, task_id: task_id ?? null, custom_title: custom_title ?? null, is_done: false },
          { onConflict: 'date,position' },
        )
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['top_priorities', vars.date] })
    },
    onError: () => toast.error('Failed to save priority'),
  })
}

export function useToggleTopPriorityDone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_done, date }: { id: string; is_done: boolean; date: string }) => {
      const { error } = await db
        .from('daily_planner_top_priorities')
        .update({ is_done, completed_at: is_done ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
      return { date }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['top_priorities', vars.date] })
    },
    onError: () => toast.error('Failed to update priority'),
  })
}

export function useClearTopPriority() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const { error } = await db
        .from('daily_planner_top_priorities')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { date }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['top_priorities', vars.date] })
      toast.success('Priority cleared')
    },
    onError: () => toast.error('Failed to clear priority'),
  })
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export function usePlannerSchedule(date: string) {
  return useQuery({
    queryKey: ['planner_schedule', date],
    queryFn: async () => {
      const { data, error } = await db
        .from('daily_planner_schedule')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true })
      if (error) throw error
      return ((data ?? []) as any[]).map(row => ({
        ...row,
        id: String(row.id),
        task_id: row.task_id ? String(row.task_id) : null,
        workspace_id: row.workspace_id ? String(row.workspace_id) : null,
        is_done: row.is_done ?? false,
        is_hard_block: row.is_hard_block ?? false,
        status: row.status ?? 'planned',
      })) as PlannerScheduleItem[]
    },
  })
}

export function useAddPlannerScheduleItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      date: string
      start_time: string
      end_time: string
      title: string
      category?: string | null
      task_id?: string | null
      workspace_id?: string | null
      is_hard_block?: boolean
      notes?: string | null
    }) => {
      const { error } = await db
        .from('daily_planner_schedule')
        .insert({
          date: payload.date,
          start_time: payload.start_time,
          end_time: payload.end_time,
          title: payload.title,
          category: payload.category ?? null,
          task_id: payload.task_id ?? null,
          workspace_id: payload.workspace_id ?? null,
          is_hard_block: payload.is_hard_block ?? false,
          is_done: false,
          status: 'planned',
          notes: payload.notes ?? null,
        })
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['planner_schedule', vars.date] })
      toast.success('Block added')
    },
    onError: () => toast.error('Failed to add block'),
  })
}

export function useUpdatePlannerScheduleItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      date,
      ...updates
    }: Partial<PlannerScheduleItem> & { id: string; date: string }) => {
      const { error } = await db
        .from('daily_planner_schedule')
        .update(updates)
        .eq('id', id)
      if (error) throw error
      return { date }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['planner_schedule', vars.date] })
    },
    onError: () => toast.error('Failed to update block'),
  })
}

export function useDeletePlannerScheduleItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const { error } = await db
        .from('daily_planner_schedule')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { date }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['planner_schedule', vars.date] })
      toast.success('Block deleted')
    },
    onError: () => toast.error('Failed to delete block'),
  })
}

// ─── Tasks for date ──────────────────────────────────────────────────────────

export function useTasksForDate(date: string) {
  return useQuery({
    queryKey: ['tasks_for_date', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, priority, status, due_date, workspace_id, description')
        .eq('due_date', date)
        .order('created_at', { ascending: true })
      if (error) throw error
      return ((data ?? []) as any[]).map(row => ({
        ...row,
        id: String(row.id),
        workspace_id: row.workspace_id ? String(row.workspace_id) : null,
      })) as PlannerTask[]
    },
  })
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string; dueDate: string }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks_for_date', vars.dueDate] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task-stats'] })
    },
    onError: () => toast.error('Failed to update task'),
  })
}

export function useAddTaskForDate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      date,
      title,
      priority = 'medium',
      workspace_id,
    }: {
      date: string
      title: string
      priority?: string
      workspace_id?: string | null
    }) => {
      const { error } = await supabase.from('tasks').insert({
        title,
        priority,
        status: 'backlog',
        due_date: date,
        workspace_id: workspace_id ?? null,
      })
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks_for_date', vars.date] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task-stats'] })
      toast.success('Task added for today')
    },
    onError: () => toast.error('Failed to add task'),
  })
}

// ─── Reminders (quick_capture) ───────────────────────────────────────────────

export function useRemindersForDate(date: string) {
  return useQuery({
    queryKey: ['reminders_for_date', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_capture')
        .select('id, content, type, title, due_date, due_time, is_hard_block')
        .eq('due_date', date)
        .in('type', ['reminder', 'time_block'])
        .order('due_time', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as PlannerReminder[]
    },
  })
}

export function useAddReminderForDate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      date,
      content,
      due_time,
      is_hard_block = false,
    }: {
      date: string
      content: string
      due_time?: string | null
      is_hard_block?: boolean
    }) => {
      const { error } = await supabase.from('quick_capture').insert({
        type: 'reminder',
        content,
        due_date: date,
        due_time: due_time ?? null,
        is_hard_block,
      })
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['reminders_for_date', vars.date] })
      toast.success('Reminder added')
    },
    onError: () => toast.error('Failed to add reminder'),
  })
}

// ─── QC Reminders for date (from Inbox/quick capture) ────────────────────────

export type QcReminderForPlanner = {
  id: number
  title: string
  date: string
  time: string | null
  is_all_day: boolean
  person: string | null
  notes: string | null
}

export function useQcRemindersForDate(date: string) {
  return useQuery({
    queryKey: ['qc_reminders_planner', date],
    queryFn: async () => {
      const { data, error } = await db
        .from('qc_reminders')
        .select('id, title, date, time, is_all_day, person, notes')
        .eq('date', date)
        .order('time', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as QcReminderForPlanner[]
    },
  })
}

export function useAddQcReminderForDate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ date, title, time }: { date: string; title: string; time?: string | null }) => {
      const { error } = await db
        .from('qc_reminders')
        .insert({ title, date, time: time ?? null, is_all_day: !time, person: null, notes: null })
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['qc_reminders_planner', vars.date] })
      toast.success('Reminder added')
    },
    onError: () => toast.error('Failed to add reminder'),
  })
}
