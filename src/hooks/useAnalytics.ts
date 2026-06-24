import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Cast to any — analytics is read-only; avoids stale database.ts mismatches
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export type DateRangeKey = 'week' | 'month' | 'quarter' | 'all'

export function getFromDate(range: DateRangeKey): string | null {
  if (range === 'all') return null
  const d = new Date()
  if (range === 'week') d.setDate(d.getDate() - 7)
  else if (range === 'month') d.setMonth(d.getMonth() - 1)
  else if (range === 'quarter') d.setMonth(d.getMonth() - 3)
  return d.toISOString().split('T')[0]
}

function weekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// ─── Global Stats ─────────────────────────────────────────────────────────────

export type GlobalStats = {
  tasksDone: number
  habitsLogged: number
  deepWorkHours: number
  gymSessions: number
  prsMerged: number
  questionsSolved: number
}

export function useGlobalStats() {
  return useQuery<GlobalStats>({
    queryKey: ['analytics_global'],
    queryFn: async () => {
      const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
        // tasks: migration 012 status = 'completed' (not 'done')
        db.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        // habit_logs: migration 010 uses status varchar ('done'/'partial'/'missed'), not boolean done
        db.from('habit_logs').select('*', { count: 'exact', head: true }).eq('status', 'done'),
        // deep work hours from daily_planner_schedule (migration 012), not schedule_items
        db.from('daily_planner_schedule').select('start_time, end_time').in('category', ['deep_work', 'study']),
        // gym_workouts (migration 005), not workout_log
        db.from('gym_workouts').select('*', { count: 'exact', head: true }),
        // os_prs (migration 004), not pull_requests
        db.from('os_prs').select('*', { count: 'exact', head: true }).eq('status', 'merged'),
        // cs_questions (migration 001), not questions
        db.from('cs_questions').select('*', { count: 'exact', head: true }).eq('status', 'solved'),
        // focus_sessions (migration 022) — completed sessions only
        db.from('focus_sessions').select('duration_minutes').not('ended_at', 'is', null),
      ])
      const plannerHours = ((r3.data ?? []) as any[]).reduce((s: number, row: any) => {
        if (!row.start_time || !row.end_time) return s
        return s + (timeToMinutes(row.end_time) - timeToMinutes(row.start_time)) / 60
      }, 0)
      const focusHours = ((r7.data ?? []) as any[]).reduce((s: number, row: any) => {
        return s + (row.duration_minutes ?? 0) / 60
      }, 0)
      return {
        tasksDone: r1.count ?? 0,
        habitsLogged: r2.count ?? 0,
        deepWorkHours: Math.round((plannerHours + focusHours) * 10) / 10,
        gymSessions: r4.count ?? 0,
        prsMerged: r5.count ?? 0,
        questionsSolved: r6.count ?? 0,
      }
    },
    staleTime: 60_000,
  })
}

// ─── Tasks by Workspace ───────────────────────────────────────────────────────

export function useTasksByWorkspace(from: string | null) {
  return useQuery({
    queryKey: ['analytics_tasks_ws', from],
    queryFn: async () => {
      let q = db.from('tasks').select('workspace_id')
      if (from) q = q.gte('created_at', from)
      const [taskRes, wsRes] = await Promise.all([q, db.from('workspaces').select('id, name')])
      const wsMap: Record<string, string> = {}
      for (const w of (wsRes.data ?? []) as any[]) wsMap[String(w.id)] = w.name
      const counts: Record<string, number> = {}
      for (const t of (taskRes.data ?? []) as any[]) {
        const name = wsMap[String(t.workspace_id ?? '')] ?? 'No Workspace'
        counts[name] = (counts[name] ?? 0) + 1
      }
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
    },
  })
}

// ─── Tasks by Status ─────────────────────────────────────────────────────────

const TASK_STATUS_ORDER = ['backlog', 'in_progress', 'blocked', 'skipped', 'completed', 'cancelled']
const TASK_STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog', in_progress: 'In Progress', blocked: 'Blocked',
  skipped: 'Skipped', completed: 'Completed', cancelled: 'Cancelled',
}
const TASK_STATUS_COLORS: Record<string, string> = {
  backlog: '#9CA3AF', in_progress: '#6B8FD4', blocked: '#D4848A',
  skipped: '#D4A84B', completed: '#7EA58A', cancelled: '#6B7280',
}

export function useTasksByStatus(from: string | null) {
  return useQuery({
    queryKey: ['analytics_tasks_status', from],
    queryFn: async () => {
      let q = db.from('tasks').select('status')
      if (from) q = q.gte('created_at', from)
      const { data } = await q
      const counts: Record<string, number> = {}
      for (const row of (data ?? []) as any[]) {
        const s = row.status ?? 'backlog'
        counts[s] = (counts[s] ?? 0) + 1
      }
      return TASK_STATUS_ORDER
        .map(s => ({ status: s, label: TASK_STATUS_LABELS[s], count: counts[s] ?? 0, color: TASK_STATUS_COLORS[s] }))
        .filter(s => s.count > 0)
    },
  })
}

// ─── Projects by Status ───────────────────────────────────────────────────────

export function useProjectsByStatus(from: string | null) {
  return useQuery({
    queryKey: ['analytics_projects_status', from],
    queryFn: async () => {
      let q = db.from('proj_projects').select('status')
      if (from) q = q.gte('created_at', from)
      const { data } = await q
      const counts: Record<string, number> = {}
      for (const row of (data ?? []) as any[]) {
        const s = row.status ?? 'ideation'
        counts[s] = (counts[s] ?? 0) + 1
      }
      const ORDER = ['ideation', 'building', 'testing', 'completed', 'paused', 'dropped']
      return ORDER.map(s => ({ status: s, count: counts[s] ?? 0 })).filter(s => s.count > 0)
    },
  })
}

// ─── CS Topics Progress (per subject) ────────────────────────────────────────

export function useCSTopicsProgress() {
  return useQuery({
    queryKey: ['analytics_cs_topics'],
    queryFn: async () => {
      const [topicsRes, subjectsRes] = await Promise.all([
        db.from('cs_topics').select('core_subject_id, status'),
        db.from('cs_core_subjects').select('core_subject_id, core_subject_name'),
      ])
      const subjectMap: Record<string, string> = {}
      for (const s of (subjectsRes.data ?? []) as any[]) {
        subjectMap[String(s.core_subject_id)] = s.core_subject_name
      }
      const stats: Record<string, { name: string; done: number; in_progress: number; not_started: number }> = {}
      for (const t of (topicsRes.data ?? []) as any[]) {
        const sid = String(t.core_subject_id)
        if (!stats[sid]) stats[sid] = { name: subjectMap[sid] ?? `Subject ${sid}`, done: 0, in_progress: 0, not_started: 0 }
        if (t.status === 'done') stats[sid].done++
        else if (t.status === 'in_progress') stats[sid].in_progress++
        else stats[sid].not_started++
      }
      return Object.values(stats).sort((a, b) => a.name.localeCompare(b.name))
    },
  })
}

// ─── Gym: Workouts per Week ───────────────────────────────────────────────────

export function useGymWorkoutsPerWeek(from: string | null) {
  return useQuery({
    queryKey: ['analytics_gym_trend', from],
    queryFn: async () => {
      const effectiveFrom = from ?? (() => {
        const d = new Date(); d.setDate(d.getDate() - 56); return d.toISOString().split('T')[0]
      })()
      const { data } = await db.from('gym_workouts').select('date').gte('date', effectiveFrom).order('date')
      const weekCounts: Record<string, number> = {}
      for (const row of (data ?? []) as any[]) {
        if (!row.date) continue
        const w = weekStart(row.date)
        weekCounts[w] = (weekCounts[w] ?? 0) + 1
      }
      return Object.entries(weekCounts).sort(([a], [b]) => a.localeCompare(b)).map(([week, count]) => ({ week, count }))
    },
  })
}

// ─── Gym: Workouts by Muscle Group ───────────────────────────────────────────

export function useGymWorkoutsByMuscle(from: string | null) {
  return useQuery({
    queryKey: ['analytics_gym_muscle', from],
    queryFn: async () => {
      let q = db.from('gym_workouts').select('muscle_groups, duration_minutes')
      if (from) q = q.gte('date', from)
      const { data } = await q
      const counts: Record<string, number> = {}
      for (const row of (data ?? []) as any[]) {
        for (const mg of (row.muscle_groups ?? []) as string[]) {
          counts[mg] = (counts[mg] ?? 0) + 1
        }
      }
      return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
    },
  })
}

// ─── Questions Solved Over Time ───────────────────────────────────────────────

export function useQuestionsSolvedOverTime(from: string | null) {
  return useQuery({
    queryKey: ['analytics_questions', from],
    queryFn: async () => {
      // cs_questions (migration 001), not the non-existent 'questions' table
      let q = db.from('cs_questions').select('updated_at').eq('status', 'solved').order('updated_at')
      if (from) q = q.gte('updated_at', from)
      const { data } = await q
      const weekCounts: Record<string, number> = {}
      for (const row of (data ?? []) as any[]) {
        if (!row.updated_at) continue
        const w = weekStart(row.updated_at.split('T')[0])
        weekCounts[w] = (weekCounts[w] ?? 0) + 1
      }
      let running = 0
      return Object.entries(weekCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, count]) => { running += count; return { week, total: running } })
    },
  })
}

// ─── Opportunities by Status ──────────────────────────────────────────────────

export function useOpportunitiesByStatus(from: string | null) {
  return useQuery({
    queryKey: ['analytics_opps', from],
    queryFn: async () => {
      // opp_opportunities (migration 003), not 'opportunities'
      let q = db.from('opp_opportunities').select('status')
      if (from) q = q.gte('created_at', from)
      const { data } = await q
      const counts: Record<string, number> = {}
      for (const row of (data ?? []) as any[]) {
        const s = row.status ?? 'unknown'
        counts[s] = (counts[s] ?? 0) + 1
      }
      const ORDER = ['not_started', 'in_progress', 'submitted', 'accepted', 'rejected', 'dropped']
      const ordered = ORDER.filter(s => counts[s]).map(s => ({ status: s, count: counts[s] }))
      const rest = Object.entries(counts).filter(([s]) => !ORDER.includes(s)).map(([status, count]) => ({ status, count }))
      return [...ordered, ...rest]
    },
  })
}

// ─── Leads by Status ─────────────────────────────────────────────────────────

export function useLeadsByStatus(from: string | null) {
  return useQuery({
    queryKey: ['analytics_leads', from],
    queryFn: async () => {
      // cm_leads (migration 002), column is follow_up_status (not status)
      let q = db.from('cm_leads').select('follow_up_status')
      if (from) q = q.gte('created_at', from)
      const { data } = await q
      const counts: Record<string, number> = {}
      for (const row of (data ?? []) as any[]) {
        const s = row.follow_up_status ?? 'not_called'
        counts[s] = (counts[s] ?? 0) + 1
      }
      const ORDER = ['not_called', 'called', 'interested', 'follow_up', 'converted', 'not_interested', 'lost']
      const ordered = ORDER.filter(s => counts[s]).map(s => ({ status: s, count: counts[s] }))
      const rest = Object.entries(counts).filter(([s]) => !ORDER.includes(s)).map(([status, count]) => ({ status, count }))
      return [...ordered, ...rest]
    },
  })
}

// ─── Habit Consistency (last 30 days) ────────────────────────────────────────

export function useHabitConsistency() {
  return useQuery({
    queryKey: ['analytics_habit_consistency'],
    queryFn: async () => {
      const since = (() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
      })()
      const [habitsRes, logsRes] = await Promise.all([
        db.from('habits').select('id, name').eq('is_active', true).order('sort_order'),
        db.from('habit_logs').select('habit_id, status').gte('date', since),
      ])
      const habits = (habitsRes.data ?? []) as any[]
      const logs = (logsRes.data ?? []) as any[]
      const doneCounts: Record<string, number> = {}
      const totalCounts: Record<string, number> = {}
      for (const log of logs) {
        const hid = String(log.habit_id)
        totalCounts[hid] = (totalCounts[hid] ?? 0) + 1
        if (log.status === 'done') doneCounts[hid] = (doneCounts[hid] ?? 0) + 1
      }
      return habits
        .map(h => {
          const hid = String(h.id)
          const done = doneCounts[hid] ?? 0
          const total = totalCounts[hid] ?? 0
          return { name: h.name, pct: total > 0 ? Math.round((done / total) * 100) : 0, done, total }
        })
        .sort((a, b) => b.pct - a.pct)
    },
  })
}

// ─── Weekly Deep Work Hours (from daily_planner_schedule) ────────────────────

export function useWeeklyDeepWork(from: string | null) {
  return useQuery({
    queryKey: ['analytics_deepwork', from],
    queryFn: async () => {
      const effectiveFrom = from ?? (() => {
        const d = new Date(); d.setDate(d.getDate() - 56); return d.toISOString().split('T')[0]
      })()
      const [plannerRes, focusRes] = await Promise.all([
        // daily_planner_schedule (migration 012)
        db
          .from('daily_planner_schedule')
          .select('date, start_time, end_time')
          .gte('date', effectiveFrom)
          .in('category', ['deep_work', 'study'])
          .order('date'),
        // focus_sessions (migration 022) — completed sessions only
        db
          .from('focus_sessions')
          .select('started_at, duration_minutes')
          .gte('started_at', effectiveFrom + 'T00:00:00')
          .not('ended_at', 'is', null),
      ])

      const weekHours: Record<string, number> = {}

      for (const row of (plannerRes.data ?? []) as any[]) {
        if (!row.date || !row.start_time || !row.end_time) continue
        const w = weekStart(row.date)
        const hrs = (timeToMinutes(row.end_time) - timeToMinutes(row.start_time)) / 60
        weekHours[w] = (weekHours[w] ?? 0) + hrs
      }

      for (const row of (focusRes.data ?? []) as any[]) {
        if (!row.started_at || !row.duration_minutes) continue
        const w = weekStart(row.started_at.split('T')[0])
        weekHours[w] = (weekHours[w] ?? 0) + row.duration_minutes / 60
      }

      return Object.entries(weekHours)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, hours]) => ({ week, hours: Math.round(hours * 10) / 10 }))
    },
  })
}

// ─── Japanese Progress ────────────────────────────────────────────────────────

export function useJapaneseProgress() {
  return useQuery({
    queryKey: ['analytics_japanese'],
    queryFn: async () => {
      const [vocab, kanji, grammar] = await Promise.all([
        db.from('vocabulary').select('mastered'),
        db.from('kanji').select('mastered'),
        db.from('grammar_points').select('mastered'),
      ])
      function pct(rows: any[] | null) {
        if (!rows || rows.length === 0) return 0
        return Math.round((rows.filter((r: any) => r.mastered).length / rows.length) * 100)
      }
      return [
        { subject: 'Vocabulary', value: pct(vocab.data as any), total: vocab.data?.length ?? 0 },
        { subject: 'Kanji', value: pct(kanji.data as any), total: kanji.data?.length ?? 0 },
        { subject: 'Grammar', value: pct(grammar.data as any), total: grammar.data?.length ?? 0 },
      ]
    },
  })
}
