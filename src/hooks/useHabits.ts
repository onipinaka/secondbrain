import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

// habits/habit_logs schema changed — cast once to bypass stale generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export type Habit = {
  id: number
  created_at: string
  updated_at: string
  name: string
  icon: string | null
  color: string | null
  sort_order: number | null
  is_active: boolean
  started_on: string | null
  notes: string | null
  workspace_id: number | null
}

export type HabitLog = {
  id: number
  created_at: string
  updated_at: string
  habit_id: number
  date: string          // was log_date
  status: string        // 'done' | 'partial' | 'missed'  (was done: boolean)
  notes: string | null
}

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await db
        .from('habits')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Habit[]
    },
  })
}

export function useHabitLogs(year: number, month: number) {
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

  return useQuery({
    queryKey: ['habit_logs', year, month],
    queryFn: async () => {
      const { data, error } = await db
        .from('habit_logs')
        .select('*')
        .gte('date', firstDay)
        .lte('date', lastDay)
      if (error) throw error
      return (data ?? []) as HabitLog[]
    },
  })
}

export function useAddHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      color?: string | null
      icon?: string | null
      sort_order?: number
      workspace_id?: number | null
    }) => {
      const { data, error } = await db
        .from('habits')
        .insert({ ...payload, is_active: true })
        .select()
        .single()
      if (error) throw error
      return data as Habit
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); toast.success('Habit added') },
    onError: () => toast.error('Failed to add habit'),
  })
}

export function useUpdateHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Habit> & { id: number }) => {
      const { error } = await db.from('habits').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
    onError: () => toast.error('Failed to update habit'),
  })
}

export function useDeleteHabit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('habits').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); toast.success('Habit deleted') },
    onError: () => toast.error('Failed to delete habit'),
  })
}

export function useToggleHabitLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      habitId,
      logDate,
      currentlyDone,
    }: {
      habitId: number
      logDate: string
      currentlyDone: boolean
      year: number
      month: number
    }) => {
      if (currentlyDone) {
        const { error } = await db
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('date', logDate)
        if (error) throw error
      } else {
        const { error } = await db
          .from('habit_logs')
          .upsert(
            { habit_id: habitId, date: logDate, status: 'done' },
            { onConflict: 'habit_id,date' },
          )
        if (error) throw error
      }
    },
    onMutate: async ({ habitId, logDate, currentlyDone, year, month }) => {
      const queryKey = ['habit_logs', year, month]
      await qc.cancelQueries({ queryKey })
      const prev = qc.getQueryData<HabitLog[]>(queryKey)

      qc.setQueryData<HabitLog[]>(queryKey, old => {
        const list = old ?? []
        if (currentlyDone) {
          return list.filter(l => !(l.habit_id === habitId && l.date === logDate))
        }
        return [
          ...list,
          {
            id: -1,
            habit_id: habitId,
            date: logDate,
            status: 'done',
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
      })

      return { prev, queryKey }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(ctx.queryKey, ctx.prev)
      toast.error('Failed to update habit log')
    },
    onSettled: (_data, _err, { year, month }) => {
      qc.invalidateQueries({ queryKey: ['habit_logs', year, month] })
      qc.invalidateQueries({ queryKey: ['habits-stats'] })
      qc.invalidateQueries({ queryKey: ['habit-consistency'] })
      qc.invalidateQueries({ queryKey: ['weekly-progress'] })
    },
  })
}
