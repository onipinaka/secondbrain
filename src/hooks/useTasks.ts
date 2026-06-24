import { localDateStr } from '../lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export type TaskFilters = {
  workspaceId?: string
  priority?: string
  status?: string
  tab?: 'all' | 'today' | 'this_week' | 'overdue' | 'high_priority' | 'in_progress' | 'blocked'
}

export type Task = {
  id: string
  title: string
  workspace_id: string | null
  linked_project_id: string | null
  priority: string | null
  status: string | null
  due_date: string | null
  due_time: string | null
  description: string | null
  tags: string[] | null
  created_at: string | null
}

export type Workspace = {
  id: string
  name: string
  color: string | null
}

export const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  skipped: 'Skipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const todayStr = () => localDateStr()

function getWeekEnd() {
  const d = new Date()
  d.setDate(d.getDate() + (7 - d.getDay()))
  return localDateStr(d)
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await supabase.from('workspaces').select('id, name, color').order('name')
      return (data ?? []) as Workspace[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let q = supabase.from('tasks').select('*').order('created_at', { ascending: false })

      if (filters.workspaceId) q = q.eq('workspace_id', filters.workspaceId)
      if (filters.priority) q = q.eq('priority', filters.priority)
      if (filters.status) q = q.eq('status', filters.status)

      const today = todayStr()
      const tab = filters.tab ?? 'all'
      if (tab === 'today') q = q.eq('due_date', today)
      else if (tab === 'this_week') q = q.lte('due_date', getWeekEnd()).gte('due_date', today)
      else if (tab === 'overdue') q = q.lt('due_date', today).neq('status', 'completed')
      else if (tab === 'high_priority') q = q.eq('priority', 'high')
      else if (tab === 'in_progress') q = q.eq('status', 'in_progress')
      else if (tab === 'blocked') q = q.eq('status', 'blocked')

      const { data } = await q
      return (data ?? []) as Task[]
    },
  })
}

export function useTaskStats() {
  return useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => {
      const today = todayStr()
      const weekStart = (() => {
        const d = new Date()
        d.setDate(d.getDate() - d.getDay())
        return localDateStr(d)
      })()

      const { data: all } = await supabase.from('tasks').select('id, status, priority, due_date')
      const tasks = all ?? []

      return {
        total: tasks.length,
        dueToday: tasks.filter(t => t.due_date === today).length,
        highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        blocked: tasks.filter(t => t.status === 'blocked').length,
        completedThisWeek: tasks.filter(
          t => t.status === 'completed' && t.due_date && t.due_date >= weekStart,
        ).length,
      }
    },
  })
}

export function useTodaysFocus() {
  return useQuery({
    queryKey: ['todays-focus'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, title, priority')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .eq('priority', 'high')
        .order('created_at', { ascending: false })
        .limit(3)
      return data ?? []
    },
  })
}

export function useTasksByWorkspace() {
  return useQuery({
    queryKey: ['tasks-by-workspace'],
    queryFn: async () => {
      const [tasksRes, workspacesRes] = await Promise.all([
        supabase.from('tasks').select('workspace_id').neq('status', 'completed'),
        supabase.from('workspaces').select('id, name'),
      ])
      const wsMap = new Map((workspacesRes.data ?? []).map(w => [w.id, w.name]))
      const counts: Record<string, number> = {}
      ;(tasksRes.data ?? []).forEach(t => {
        if (!t.workspace_id) return
        const name = wsMap.get(t.workspace_id) ?? 'Unknown'
        counts[name] = (counts[name] ?? 0) + 1
      })
      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    },
  })
}

export function useDeepWorkQueue() {
  return useQuery({
    queryKey: ['deep-work-queue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, title, due_date, priority')
        .eq('priority', 'high')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(5)
      return data ?? []
    },
  })
}

export function useUpcomingDeadlines() {
  return useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: async () => {
      const today = todayStr()
      const twoWeeks = new Date()
      twoWeeks.setDate(twoWeeks.getDate() + 14)
      const twoWeeksStr = localDateStr(twoWeeks)

      const { data } = await supabase
        .from('tasks')
        .select('id, title, due_date')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .gte('due_date', today)
        .lte('due_date', twoWeeksStr)
        .order('due_date', { ascending: true })
        .limit(3)

      return (data ?? []).map(t => ({
        ...t,
        daysLeft: Math.ceil(
          (new Date(t.due_date! + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) /
            86400000,
        ),
      }))
    },
  })
}

export function useTaskTimeline() {
  return useQuery({
    queryKey: ['task-timeline'],
    queryFn: async () => {
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 3)
      const end = new Date(today)
      end.setDate(today.getDate() + 3)

      const startStr = localDateStr(start)
      const endStr = localDateStr(end)
      const todayS = localDateStr(today)

      const { data } = await supabase
        .from('tasks')
        .select('due_date, status')
        .gte('due_date', startStr)
        .lte('due_date', endStr)

      const tasks = data ?? []
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const ds = localDateStr(d)
        const day = tasks.filter(t => t.due_date === ds)
        return {
          date: ds,
          day: String(d.getDate()),
          month: d.toLocaleDateString('en-US', { month: 'short' }),
          total: day.length,
          done: day.filter(t => t.status === 'completed').length,
          isToday: ds === todayS,
        }
      })
    },
  })
}

export function useAddTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Task> & { title: string }) => {
      const { data: inserted, error } = await supabase
        .from('tasks')
        .insert({ priority: 'medium', status: 'backlog', ...data })
        .select()
        .single()
      if (error) throw error
      return inserted
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task-stats'] })
      qc.invalidateQueries({ queryKey: ['todays-focus'] })
      qc.invalidateQueries({ queryKey: ['tasks-today'] })
      toast.success('Task added')
    },
    onError: () => toast.error('Failed to add task'),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task-stats'] })
      qc.invalidateQueries({ queryKey: ['tasks-today'] })
    },
    onError: () => toast.error('Failed to update task'),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['task-stats'] })
      qc.invalidateQueries({ queryKey: ['tasks-today'] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })
}

export function useScheduleTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      task_id: string
      workspace_id: string | null
      scheduled_date: string
      title: string
      category: string
      time_start?: string | null
      time_end?: string | null
    }) => {
      const start = data.time_start ?? '09:00'
      const end = data.time_end ?? '10:00'
      const { error } = await (supabase as any).from('daily_planner_schedule').insert({
        date: data.scheduled_date,
        title: data.title,
        start_time: start,
        end_time: end,
        task_id: data.task_id,
        workspace_id: data.workspace_id,
        category: data.category,
        status: 'planned',
        is_done: false,
        is_hard_block: false,
      })
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      toast.success(`Scheduled for ${vars.scheduled_date}`)
      qc.invalidateQueries({ queryKey: ['planner_schedule', vars.scheduled_date] })
      qc.invalidateQueries({ queryKey: ['tasks-today'] })
    },
    onError: () => toast.error('Failed to schedule task'),
  })
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const snapshots = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] }).map(([key, data]) => {
        qc.setQueryData<Task[]>(key, old =>
          (old ?? []).map(t => (t.id === id ? { ...t, status } : t)),
        )
        return { key, data }
      })
      return { snapshots }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(({ key, data }) => qc.setQueryData(key, data))
      toast.error('Failed to move task')
    },
    onSuccess: (_data, vars) => {
      toast.success(`Moved to ${STATUS_LABELS[vars.status] ?? vars.status}`)
      qc.invalidateQueries({ queryKey: ['task-stats'] })
      qc.invalidateQueries({ queryKey: ['tasks-today'] })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
