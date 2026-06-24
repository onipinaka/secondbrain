import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

// cs_* tables not in auto-generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Types ────────────────────────────────────────────────────────────────────

export type CsSubject = {
  id: number
  core_subject_id: number  // smallint FK used by child tables
  core_subject_name: string
  slug: string | null
  color: string | null
  icon: string | null
  description: string | null
  sort_order: number | null
  created_at: string
  updated_at: string
}

export type CsTopic = {
  id: number
  core_subject_id: number
  topic_id: number         // smallint FK used by questions/resources
  title: string
  slug: string | null
  color: string | null
  status: string | null    // not_started / in_progress / done
  difficulty: string | null // easy / medium / hard
  timeline: string | null
  total_hours: number | null
  completed_hours: number | null
  description: string | null
  notes: string | null
  sort_order: number | null
  created_at: string
  updated_at: string
}

export type CsTopicResource = {
  id: number
  topic_id: number
  title: string
  url: string
  type: string | null  // video / article / docs / book / course
  created_at: string
  updated_at: string
}

export type CsQuestion = {
  id: number
  core_subject_id: number
  topic_id: number | null
  title: string
  link: string | null
  solution: string | null
  difficulty: string | null
  status: string | null    // todo / attempted / solved / revisit
  solved_at: string | null
  timer: number | null     // minutes
  attempt: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type CsInterviewQuestion = {
  id: number
  core_subject_id: number
  topic_id: number | null
  question: string
  answer: string | null
  tag: string | null
  difficulty: string | null
  viewed: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type CsRevisionSession = {
  id: number
  core_subject_id: number
  topic_id: number | null
  title: string
  description: string | null
  scheduled_at: string | null
  completed_at: string | null
  status: string | null    // scheduled / completed / skipped
  notes: string | null
  created_at: string
  updated_at: string
}

export type CsCheatSheet = {
  id: number
  core_subject_id: number
  topic_id: number | null
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export type CsNote = {
  id: number
  core_subject_id: number
  topic_id: number | null
  title: string
  content: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

// ─── Core Subjects ────────────────────────────────────────────────────────────

// Auto-creates a cs_core_subjects row if one doesn't exist for the slug
export function useEnsureCsSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ slug, name }: { slug: string; name: string }) => {
      const { data: existing } = await db.from('cs_core_subjects').select('*').eq('slug', slug).maybeSingle()
      if (existing) return existing as CsSubject
      const { data: maxRow } = await db.from('cs_core_subjects').select('core_subject_id').order('core_subject_id', { ascending: false }).limit(1).maybeSingle()
      const core_subject_id = ((maxRow as { core_subject_id: number } | null)?.core_subject_id ?? 0) + 1
      const { data, error } = await db.from('cs_core_subjects').insert({
        core_subject_id,
        core_subject_name: name,
        slug,
      }).select().single()
      if (error) throw error
      return data as CsSubject
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['cs_core_subjects', 'slug', vars.slug] })
      qc.invalidateQueries({ queryKey: ['cs_core_subjects'] })
    },
  })
}

export function useCsSubjects() {
  return useQuery({
    queryKey: ['cs_core_subjects'],
    queryFn: async () => {
      const { data, error } = await db
        .from('cs_core_subjects')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as CsSubject[]
    },
  })
}

export function useCsSubjectBySlug(slug: string) {
  return useQuery({
    queryKey: ['cs_core_subjects', 'slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await db
        .from('cs_core_subjects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      return data as CsSubject | null
    },
  })
}

// ─── Topics ───────────────────────────────────────────────────────────────────

export function useCsTopics(coreSubjectId: number | null) {
  return useQuery({
    queryKey: ['cs_topics', coreSubjectId],
    enabled: !!coreSubjectId,
    queryFn: async () => {
      const { data, error } = await db
        .from('cs_topics')
        .select('*')
        .eq('core_subject_id', coreSubjectId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as CsTopic[]
    },
  })
}

export function useAddCsTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { core_subject_id: number; title: string; difficulty?: string | null; status?: string; sort_order?: number }) => {
      // topic_id is NOT NULL UNIQUE (smallint) — generate as max+1
      const { data: maxRow } = await db.from('cs_topics').select('topic_id').order('topic_id', { ascending: false }).limit(1).maybeSingle()
      const topic_id = ((maxRow as { topic_id: number } | null)?.topic_id ?? 0) + 1
      const { data, error } = await db.from('cs_topics').insert({ ...payload, topic_id }).select().single()
      if (error) throw error
      return data as CsTopic
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_topics', vars.core_subject_id] }); toast.success('Topic added') },
    onError: () => toast.error('Failed to add topic'),
  })
}

export function useUpdateCsTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, core_subject_id, ...updates }: Partial<CsTopic> & { id: number; core_subject_id: number }) => {
      const { error } = await db.from('cs_topics').update(updates).eq('id', id)
      if (error) throw error
      return { core_subject_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['cs_topics', vars.core_subject_id] }),
    onError: () => toast.error('Failed to update topic'),
  })
}

export function useDeleteCsTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, coreSubjectId }: { id: number; coreSubjectId: number }) => {
      const { error } = await db.from('cs_topics').delete().eq('id', id)
      if (error) throw error
      return { coreSubjectId }
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_topics', vars.coreSubjectId] }); toast.success('Topic deleted') },
    onError: () => toast.error('Failed to delete topic'),
  })
}

// ─── Topic Resources ──────────────────────────────────────────────────────────

export function useCsTopicResources(topicId: number) {
  return useQuery({
    queryKey: ['cs_topic_resources', topicId],
    queryFn: async () => {
      const { data, error } = await db
        .from('cs_topic_resources')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as CsTopicResource[]
    },
  })
}

export function useAddCsTopicResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { topic_id: number; title: string; url: string; type?: string | null }) => {
      const { error } = await db.from('cs_topic_resources').insert(payload)
      if (error) throw error
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_topic_resources', vars.topic_id] }); toast.success('Resource added') },
    onError: () => toast.error('Failed to add resource'),
  })
}

export function useDeleteCsTopicResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, topicId }: { id: number; topicId: number }) => {
      const { error } = await db.from('cs_topic_resources').delete().eq('id', id)
      if (error) throw error
      return { topicId }
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_topic_resources', vars.topicId] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete resource'),
  })
}

export function useCsAllTopicResources(coreSubjectId: number | null) {
  return useQuery({
    queryKey: ['cs_topic_resources', 'all', coreSubjectId],
    enabled: !!coreSubjectId,
    queryFn: async () => {
      const { data: topics } = await db
        .from('cs_topics')
        .select('topic_id')
        .eq('core_subject_id', coreSubjectId)
      const topicIds = ((topics ?? []) as { topic_id: number }[]).map(t => t.topic_id)
      if (topicIds.length === 0) return []
      const { data, error } = await db
        .from('cs_topic_resources')
        .select('*')
        .in('topic_id', topicIds)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as CsTopicResource[]
    },
  })
}

// ─── Questions ────────────────────────────────────────────────────────────────

export function useCsQuestions(coreSubjectId: number | null) {
  return useQuery({
    queryKey: ['cs_questions', coreSubjectId],
    enabled: !!coreSubjectId,
    queryFn: async () => {
      const { data, error } = await db
        .from('cs_questions')
        .select('*')
        .eq('core_subject_id', coreSubjectId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as CsQuestion[]
    },
  })
}

export function useAddCsQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { core_subject_id: number; title: string; difficulty?: string | null; topic_id?: number | null; link?: string | null; status?: string }) => {
      const { data, error } = await db.from('cs_questions').insert({ ...payload, attempt: 0, status: payload.status ?? 'todo' }).select().single()
      if (error) throw error
      return data as CsQuestion
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_questions', vars.core_subject_id] }); toast.success('Problem added') },
    onError: () => toast.error('Failed to add problem'),
  })
}

export function useUpdateCsQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, core_subject_id, ...updates }: Partial<CsQuestion> & { id: number; core_subject_id: number }) => {
      const { error } = await db.from('cs_questions').update(updates).eq('id', id)
      if (error) throw error
      return { core_subject_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['cs_questions', vars.core_subject_id] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteCsQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, coreSubjectId }: { id: number; coreSubjectId: number }) => {
      const { error } = await db.from('cs_questions').delete().eq('id', id)
      if (error) throw error
      return { coreSubjectId }
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_questions', vars.coreSubjectId] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Interview Questions ──────────────────────────────────────────────────────

export function useCsInterviewQA(coreSubjectId: number | null) {
  return useQuery({
    queryKey: ['cs_interview_questions', coreSubjectId],
    enabled: !!coreSubjectId,
    queryFn: async () => {
      const { data, error } = await db
        .from('cs_interview_questions')
        .select('*')
        .eq('core_subject_id', coreSubjectId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as CsInterviewQuestion[]
    },
  })
}

export function useAddCsInterviewQA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { core_subject_id: number; question: string; answer?: string | null; tag?: string | null; difficulty?: string | null; topic_id?: number | null }) => {
      const { error } = await db.from('cs_interview_questions').insert({ ...payload, viewed: false })
      if (error) throw error
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_interview_questions', vars.core_subject_id] }); toast.success('Q&A added') },
    onError: () => toast.error('Failed to add Q&A'),
  })
}

export function useUpdateCsInterviewQA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, core_subject_id, ...updates }: Partial<CsInterviewQuestion> & { id: number; core_subject_id: number }) => {
      const { error } = await db.from('cs_interview_questions').update(updates).eq('id', id)
      if (error) throw error
      return { core_subject_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['cs_interview_questions', vars.core_subject_id] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteCsInterviewQA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, coreSubjectId }: { id: number; coreSubjectId: number }) => {
      const { error } = await db.from('cs_interview_questions').delete().eq('id', id)
      if (error) throw error
      return { coreSubjectId }
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_interview_questions', vars.coreSubjectId] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Revision Sessions ────────────────────────────────────────────────────────

export function useCsRevisionSessions(coreSubjectId: number | null) {
  return useQuery({
    queryKey: ['cs_revision_sessions', coreSubjectId],
    enabled: !!coreSubjectId,
    queryFn: async () => {
      const { data, error } = await db
        .from('cs_revision_sessions')
        .select('*')
        .eq('core_subject_id', coreSubjectId)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as CsRevisionSession[]
    },
  })
}

export function useAddCsRevisionSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { core_subject_id: number; title: string; topic_id?: number | null; scheduled_at?: string | null; description?: string | null }) => {
      const { error } = await db.from('cs_revision_sessions').insert({ ...payload, status: 'scheduled' })
      if (error) throw error
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_revision_sessions', vars.core_subject_id] }); toast.success('Session scheduled') },
    onError: () => toast.error('Failed to schedule session'),
  })
}

export function useUpdateCsRevisionSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, core_subject_id, ...updates }: Partial<CsRevisionSession> & { id: number; core_subject_id: number }) => {
      const { error } = await db.from('cs_revision_sessions').update(updates).eq('id', id)
      if (error) throw error
      return { core_subject_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['cs_revision_sessions', vars.core_subject_id] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteCsRevisionSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, coreSubjectId }: { id: number; coreSubjectId: number }) => {
      const { error } = await db.from('cs_revision_sessions').delete().eq('id', id)
      if (error) throw error
      return { coreSubjectId }
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_revision_sessions', vars.coreSubjectId] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Cheat Sheets ─────────────────────────────────────────────────────────────

export function useCsCheatSheets(coreSubjectId: number | null) {
  return useQuery({
    queryKey: ['cs_cheat_sheets', coreSubjectId],
    enabled: !!coreSubjectId,
    queryFn: async () => {
      const { data, error } = await db
        .from('cs_cheat_sheets')
        .select('*')
        .eq('core_subject_id', coreSubjectId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as CsCheatSheet[]
    },
  })
}

export function useAddCsCheatSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { core_subject_id: number; title: string; topic_id?: number | null }) => {
      const { data, error } = await db.from('cs_cheat_sheets').insert(payload).select().single()
      if (error) throw error
      return data as CsCheatSheet
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_cheat_sheets', vars.core_subject_id] }); toast.success('Cheat sheet created') },
    onError: () => toast.error('Failed to create cheat sheet'),
  })
}

export function useUpdateCsCheatSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, core_subject_id, ...updates }: Partial<CsCheatSheet> & { id: number; core_subject_id: number }) => {
      const { error } = await db.from('cs_cheat_sheets').update(updates).eq('id', id)
      if (error) throw error
      return { core_subject_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['cs_cheat_sheets', vars.core_subject_id] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteCsCheatSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, coreSubjectId }: { id: number; coreSubjectId: number }) => {
      const { error } = await db.from('cs_cheat_sheets').delete().eq('id', id)
      if (error) throw error
      return { coreSubjectId }
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_cheat_sheets', vars.coreSubjectId] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Daily Config ─────────────────────────────────────────────────────────────

export type CsDailyConfig = {
  id: number
  core_subject_id: number
  questions_daily_goal: number
  created_at: string
  updated_at: string
}

export function useCsDailyConfig(coreSubjectId: number | null) {
  return useQuery({
    queryKey: ['cs_daily_config', coreSubjectId],
    enabled: !!coreSubjectId && coreSubjectId > 0,
    queryFn: async () => {
      const { data } = await db.from('cs_daily_config').select('*').eq('core_subject_id', coreSubjectId).maybeSingle()
      return data as CsDailyConfig | null
    },
  })
}

export function useUpsertCsDailyConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ core_subject_id, questions_daily_goal }: { core_subject_id: number; questions_daily_goal: number }) => {
      const { error } = await db.from('cs_daily_config').upsert({ core_subject_id, questions_daily_goal }, { onConflict: 'core_subject_id' })
      if (error) throw error
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['cs_daily_config', vars.core_subject_id] }),
    onError: () => toast.error('Failed to save config'),
  })
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export function useCsNotes(coreSubjectId: number | null) {
  return useQuery({
    queryKey: ['cs_notes', coreSubjectId],
    enabled: !!coreSubjectId,
    queryFn: async () => {
      const { data, error } = await db
        .from('cs_notes')
        .select('*')
        .eq('core_subject_id', coreSubjectId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as CsNote[]
    },
  })
}

export function useAddCsNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { core_subject_id: number; title: string; topic_id?: number | null }) => {
      const { data, error } = await db.from('cs_notes').insert(payload).select().single()
      if (error) throw error
      return data as CsNote
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_notes', vars.core_subject_id] }); toast.success('Note created') },
    onError: () => toast.error('Failed to create note'),
  })
}

export function useUpdateCsNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, core_subject_id, ...updates }: Partial<CsNote> & { id: number; core_subject_id: number }) => {
      const { error } = await db.from('cs_notes').update(updates).eq('id', id)
      if (error) throw error
      return { core_subject_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['cs_notes', vars.core_subject_id] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteCsNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, coreSubjectId }: { id: number; coreSubjectId: number }) => {
      const { error } = await db.from('cs_notes').delete().eq('id', id)
      if (error) throw error
      return { coreSubjectId }
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['cs_notes', vars.coreSubjectId] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}
