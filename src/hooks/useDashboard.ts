import { localDateStr } from '../lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const todayStr = () => localDateStr()

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function useGreetingQuote() {
  return useQuery({
    queryKey: ['greeting-quote'],
    queryFn: async () => {
      const { data } = await supabase.from('quotes').select('quote, author').eq('is_favourite', true)
      if (!data || data.length === 0) return null
      return data[Math.floor(Math.random() * data.length)]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useHabitsStats() {
  return useQuery({
    queryKey: ['habits-stats', todayStr()],
    queryFn: async () => {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('id').eq('is_active', true),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from('habit_logs').select('status').eq('date', todayStr()),
      ])
      const total = (habitsRes.data ?? []).length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doneCount = (logsRes.data ?? []).filter((l: any) => l.status === 'done').length
      const score = total > 0 ? Math.round((doneCount / total) * 100) : 0
      return { doneCount, total, score }
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })
}

export function useTasksToday() {
  return useQuery({
    queryKey: ['tasks-today', todayStr()],
    queryFn: async () => {
      const today = todayStr()

      // All planner timeline entries for today (linked tasks + direct entries)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: entries } = await (supabase as any)
        .from('daily_planner_schedule')
        .select('task_id, is_done, status')
        .eq('date', today)

      const all: Array<{ task_id: string | null; is_done: boolean; status: string }> = entries ?? []
      const total = all.length
      if (total === 0) return { remaining: [], total: 0, remainingCount: 0 }

      // Fetch current status for linked tasks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linkedIds = [...new Set<string>(all.map((e: any) => e.task_id).filter(Boolean))]
      const taskStatusMap = new Map<string, string>()
      if (linkedIds.length > 0) {
        const { data: tasks } = await supabase.from('tasks').select('id, status').in('id', linkedIds)
        ;(tasks ?? []).forEach(t => taskStatusMap.set(t.id, t.status ?? ''))
      }

      const DONE = ['completed', 'cancelled', 'skipped']
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const remainingCount = all.filter((e: any) => {
        if (e.task_id) return !DONE.includes(taskStatusMap.get(e.task_id) ?? '')
        return !e.is_done && e.status !== 'completed'
      }).length

      return { remaining: [], total, remainingCount }
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })
}

export function useDeepWork() {
  return useQuery({
    queryKey: ['deep-work', todayStr()],
    queryFn: async () => {
      const todayStart = todayStr() + 'T00:00:00'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const [plannerRes, focusRes] = await Promise.all([
        db.from('daily_planner_schedule')
          .select('start_time, end_time')
          .eq('date', todayStr())
          .eq('category', 'deep_work'),
        db.from('focus_sessions')
          .select('duration_minutes')
          .gte('started_at', todayStart)
          .not('ended_at', 'is', null),
      ])
      const plannerHours = ((plannerRes.data ?? []) as Array<{ start_time: string | null; end_time: string | null }>)
        .reduce((sum, i) => {
          if (!i.start_time || !i.end_time) return sum
          const [sh, sm] = i.start_time.split(':').map(Number)
          const [eh, em] = i.end_time.split(':').map(Number)
          return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60
        }, 0)
      const focusHours = ((focusRes.data ?? []) as Array<{ duration_minutes: number | null }>)
        .reduce((sum, s) => sum + (s.duration_minutes ?? 0) / 60, 0)
      return plannerHours + focusHours
    },
  })
}

type FocusSession = { id: number; started_at: string }

export function useFocusSession() {
  const qc = useQueryClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const activeQuery = useQuery<FocusSession | null>({
    queryKey: ['focus-session-active'],
    queryFn: async () => {
      const { data } = await db
        .from('focus_sessions')
        .select('id, started_at')
        .is('ended_at', null)
        .gte('started_at', todayStr() + 'T00:00:00')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data as FocusSession | null
    },
  })

  const start = useMutation<FocusSession>({
    mutationFn: async () => {
      const { data, error } = await db
        .from('focus_sessions')
        .insert({ started_at: new Date().toISOString() })
        .select('id, started_at')
        .single()
      if (error) throw error
      return data as FocusSession
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['focus-session-active'] }),
  })

  const stop = useMutation<void, Error, { id: number; durationMinutes: number }>({
    mutationFn: async ({ id, durationMinutes }) => {
      const { error } = await db
        .from('focus_sessions')
        .update({ ended_at: new Date().toISOString(), duration_minutes: durationMinutes })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-session-active'] })
      qc.invalidateQueries({ queryKey: ['deep-work', todayStr()] })
    },
  })

  return { activeSession: activeQuery.data ?? null, isLoadingSession: activeQuery.isLoading, start, stop }
}

export function useHabitStreak() {
  return useQuery({
    queryKey: ['habit-streak'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('habit_logs')
        .select('date')
        .eq('status', 'done')
        .order('date', { ascending: false })
      if (!data || data.length === 0) return 0

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sortedDesc = [...new Set(data.map((l: any) => l.date))].sort().reverse()
      const now = new Date()
      now.setHours(0, 0, 0, 0)

      let streak = 0
      let prev: Date | null = null
      for (const ds of sortedDesc) {
        const d = new Date(ds + 'T00:00:00')
        if (!prev) {
          const diff = Math.round((now.getTime() - d.getTime()) / 86400000)
          if (diff <= 1) { streak = 1; prev = d }
          else break
        } else {
          const diff = Math.round((prev.getTime() - d.getTime()) / 86400000)
          if (diff === 1) { streak++; prev = d }
          else break
        }
      }
      return streak
    },
  })
}

export function useScheduleToday() {
  return useQuery({
    queryKey: ['schedule-today', todayStr()],
    queryFn: async () => {
      const { data } = await supabase
        .from('schedule_items')
        .select('id, entity_type, entity_id, custom_title, time_start')
        .eq('scheduled_date', todayStr())
        .order('time_start', { ascending: true })
      if (!data || data.length === 0) return []

      const taskIds = [...new Set(data.filter(i => i.entity_type === 'task' && i.entity_id).map(i => i.entity_id!))]
      const topicIds = [...new Set(data.filter(i => i.entity_type === 'topic' && i.entity_id).map(i => i.entity_id!))]

      let taskMap = new Map<string, string>()
      let topicMap = new Map<string, string>()

      if (taskIds.length > 0) {
        const { data: tasks } = await supabase.from('tasks').select('id, title').in('id', taskIds)
        taskMap = new Map((tasks ?? []).map(t => [t.id, t.title]))
      }
      if (topicIds.length > 0) {
        const { data: topics } = await supabase.from('topics').select('id, name').in('id', topicIds)
        topicMap = new Map((topics ?? []).map(t => [t.id, t.name]))
      }

      return data.map(item => {
        let title = item.custom_title ?? ''
        if (!title && item.entity_id) {
          if (item.entity_type === 'task') title = taskMap.get(item.entity_id) ?? 'Task'
          else if (item.entity_type === 'topic') title = topicMap.get(item.entity_id) ?? 'Topic'
        }
        return { ...item, title }
      })
    },
  })
}

export function useHabitConsistency() {
  return useQuery({
    queryKey: ['habit-consistency'],
    queryFn: async () => {
      const now = new Date()
      const monday = getMondayOfWeek(now)
      const mondayStr = localDateStr(monday)
      const today = todayStr()
      const ninetyAgoStr = localDateStr(new Date(now.getTime() - 90 * 86400000))

      const [habitsRes, weekLogsRes, allDoneRes] = await Promise.all([
        supabase.from('habits').select('id, name, color').eq('is_active', true).order('sort_order'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('habit_logs')
          .select('habit_id, date, status')
          .gte('date', mondayStr)
          .lte('date', today),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('habit_logs')
          .select('date')
          .eq('status', 'done')
          .gte('date', ninetyAgoStr)
          .order('date', { ascending: true }),
      ])

      const habits = habitsRes.data ?? []
      const weekLogs = weekLogsRes.data ?? []

      const lookup = new Map<string, boolean>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      weekLogs.forEach((l: any) => lookup.set(`${l.habit_id}_${l.date}`, l.status === 'done'))

      const weekDays: string[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        weekDays.push(localDateStr(d))
      }

      const pastDays = weekDays.filter(d => d <= today)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doneChecks = weekLogs.filter((l: any) => l.status === 'done').length
      const possibleChecks = habits.length * pastDays.length
      const weekScore = possibleChecks > 0 ? Math.round((doneChecks / possibleChecks) * 100) : 0

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allDates = [...new Set((allDoneRes.data ?? []).map((l: any) => l.date))].sort()
      let bestStreak = 0
      let curStreak = 0
      let prevDate: Date | null = null
      for (const ds of allDates) {
        const d = new Date(ds + 'T00:00:00')
        if (!prevDate) { curStreak = 1 }
        else {
          const diff = Math.round((d.getTime() - prevDate.getTime()) / 86400000)
          curStreak = diff === 1 ? curStreak + 1 : 1
        }
        bestStreak = Math.max(bestStreak, curStreak)
        prevDate = d
      }

      return { habits, weekDays, lookup, weekScore, bestStreak, today }
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })
}

export function useTasksOverview() {
  return useQuery({
    queryKey: ['tasks-overview'],
    queryFn: async () => {
      const { data } = await supabase.from('tasks').select('status')
      const all = data ?? []
      const groups: Record<string, number> = { completed: 0, in_progress: 0, backlog: 0, blocked: 0, skipped: 0, cancelled: 0 }
      all.forEach(t => {
        const s = t.status ?? 'backlog'
        groups[s] = (groups[s] ?? 0) + 1
      })
      return { groups, total: all.length }
    },
  })
}

export function useWeeklyProgress() {
  return useQuery({
    queryKey: ['weekly-progress'],
    queryFn: async () => {
      const monday = getMondayOfWeek(new Date())
      const mondayStr = localDateStr(monday)
      const today = todayStr()

      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('id').eq('is_active', true),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('habit_logs')
          .select('date, status')
          .gte('date', mondayStr)
          .lte('date', today),
      ])

      const totalHabits = (habitsRes.data ?? []).length
      const logs = logsRes.data ?? []

      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        const ds = localDateStr(d)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dayLogs = logs.filter((l: any) => l.date === ds)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const done = dayLogs.filter((l: any) => l.status === 'done').length
        const pct = totalHabits > 0 && ds <= today ? Math.round((done / totalHabits) * 100) : null
        return { label, pct }
      })
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })
}

type PriorityRow = {
  id: number
  position: number
  is_done: boolean
  task_id: number | null
  custom_title: string | null
  tasks: { title: string; priority: string | null; status: string | null } | null
}

export function useTodaysPriorities() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  return useQuery<PriorityRow[]>({
    queryKey: ['today-priorities', todayStr()],
    queryFn: async () => {
      const { data, error } = await db
        .from('daily_planner_top_priorities')
        .select('id, position, is_done, task_id, custom_title, tasks!task_id(title, priority, status)')
        .eq('date', todayStr())
        .order('position')
      if (error) throw error
      return (data ?? []) as PriorityRow[]
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })
}

export function useMarkPriorityDone() {
  const qc = useQueryClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  return useMutation({
    mutationFn: async ({ id, isDone }: { id: number; isDone: boolean }) => {
      const { error } = await db
        .from('daily_planner_top_priorities')
        .update({ is_done: isDone, completed_at: isDone ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today-priorities', todayStr()] })
      qc.invalidateQueries({ queryKey: ['tasks-today', todayStr()] })
    },
  })
}

export function useInboxPreview() {
  return useQuery({
    queryKey: ['inbox-preview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('quick_capture')
        .select('id, type, content, title')
        .eq('is_sorted', false)
        .order('created_at', { ascending: false })
        .limit(4)
      return data ?? []
    },
  })
}

export function useUpcomingReminders() {
  return useQuery({
    queryKey: ['upcoming-reminders', todayStr()],
    queryFn: async () => {
      const today = todayStr()
      const twoWeeksOut = localDateStr(new Date(Date.now() + 14 * 86400000))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('qc_reminders')
        .select('id, title, date')
        .gte('date', today)
        .lte('date', twoWeeksOut)
        .is('processed_at', null)
        .order('date', { ascending: true })
        .limit(5)
      return ((data ?? []) as Array<{ id: number; title: string; date: string }>)
        .map(r => ({ id: String(r.id), name: r.title, date: r.date }))
    },
  })
}

export function useMotivationQuote() {
  return useQuery({
    queryKey: ['motivation-quote'],
    queryFn: async () => {
      const { data } = await supabase.from('quotes').select('quote, author').eq('is_favourite', true)
      if (!data || data.length === 0) {
        return { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' }
      }
      return data[Math.floor(Math.random() * data.length)]
    },
    staleTime: 5 * 60 * 1000,
  })
}
