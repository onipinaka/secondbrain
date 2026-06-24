import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

// workspaces schema changed (id: smallint, slug, category — no type/parent_id/priority)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Types ────────────────────────────────────────────────────────────────────

export type Workspace = {
  id: number
  slug: string
  name: string
  icon: string | null
  color: string | null
  description: string | null
  category: string          // core_subject / business / personal / growth / life
  table_prefix: string | null
  sort_order: number | null
  is_active: boolean
  is_pinned: boolean
  last_accessed_at: string | null
  created_at: string
  updated_at: string
}

// Legacy types kept for non-CS workspaces (will be updated per workspace type)
export type Topic = {
  id: string
  name: string
  status: string | null
  difficulty: string | null
  type: string | null
  hours_allocated: number | null
  hours_spent: number | null
  interview_frequency: string | null
  last_studied: string | null
  next_revision: string | null
  priority: number | null
  sort_order: number | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type Question = {
  id: string
  name: string
  difficulty: string | null
  status: string | null
  platform: string | null
  solution_url: string | null
  approach_notes: string | null
  attempts: number | null
  time_taken_mins: number | null
  subject: string | null
  tags: string[] | null
  topic_id: string | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type Resource = {
  id: string
  name: string
  type: string | null
  platform: string | null
  url: string | null
  status: string | null
  units_done: number | null
  total_units: number | null
  notes: string | null
  topic_id: string | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type InterviewQA = {
  id: string
  question: string
  my_answer: string | null
  confidence: string | null
  source: string | null
  type: string | null
  topic_id: string | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type WorkspaceNote = {
  id: string
  title: string
  content: unknown
  tags: string[] | null
  entity_type: string | null
  entity_id: string | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

// ─── Workspace hooks ──────────────────────────────────────────────────────────

export function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function useAllWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data, error } = await db
        .from('workspaces')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as Workspace[]
    },
    staleTime: 30_000,
  })
}

export function useWorkspaceBySlug(slug: string) {
  return useQuery({
    queryKey: ['workspace', 'slug', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await db
        .from('workspaces')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw error
      return data as Workspace | null
    },
  })
}

// Auto-creates a workspaces row if one doesn't exist for the slug
export function useEnsureWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ slug, name, category }: { slug: string; name: string; category: string }) => {
      const { data, error } = await db.from('workspaces').insert({
        slug,
        name,
        category,
        is_active: true,
        is_pinned: false,
        icon: '📚',
      }).select().single()
      if (error) throw error
      return data as Workspace
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['workspace', 'slug', vars.slug] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useUpdateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Workspace> & { id: number }) => {
      const { error } = await db.from('workspaces').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
    onError: () => toast.error('Failed to update workspace'),
  })
}

export function useWorkspaces() {
  return useAllWorkspaces()
}

// ─── Topics (legacy — for non-CS workspaces) ──────────────────────────────────

export function useTopics(workspaceId: string) {
  return useQuery({
    queryKey: ['topics', workspaceId],
    queryFn: async () => {
      const { data, error } = await db
        .from('topics')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as Topic[]
    },
  })
}

export function useAddTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Omit<Topic, 'id' | 'created_at' | 'updated_at'>> & { name: string; workspace_id: string }) => {
      const { data, error } = await db.from('topics').insert(payload).select().single()
      if (error) throw error
      return data as Topic
    },
    onSuccess: (_d: Topic, vars: { workspace_id: string }) => {
      qc.invalidateQueries({ queryKey: ['topics', vars.workspace_id] })
      toast.success('Topic added')
    },
    onError: () => toast.error('Failed to add topic'),
  })
}

export function useUpdateTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspace_id, ...updates }: Partial<Topic> & { id: string; workspace_id: string }) => {
      const { error } = await db.from('topics').update(updates).eq('id', id)
      if (error) throw error
      return { workspace_id }
    },
    onSuccess: (_d: unknown, vars: { workspace_id: string }) => qc.invalidateQueries({ queryKey: ['topics', vars.workspace_id] }),
    onError: () => toast.error('Failed to update topic'),
  })
}

export function useDeleteTopic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await db.from('topics').delete().eq('id', id)
      if (error) throw error
      return { workspaceId }
    },
    onSuccess: (_d: unknown, vars: { workspaceId: string }) => {
      qc.invalidateQueries({ queryKey: ['topics', vars.workspaceId] })
      toast.success('Topic deleted')
    },
    onError: () => toast.error('Failed to delete topic'),
  })
}

// ─── Questions (legacy) ───────────────────────────────────────────────────────

export function useQuestions(workspaceId: string) {
  return useQuery({
    queryKey: ['questions', workspaceId],
    queryFn: async () => {
      const { data, error } = await db
        .from('questions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Question[]
    },
  })
}

export function useAddQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Omit<Question, 'id' | 'created_at' | 'updated_at'>> & { name: string; workspace_id: string }) => {
      const { data, error } = await db.from('questions').insert(payload).select().single()
      if (error) throw error
      return data as Question
    },
    onSuccess: (_d: Question, vars: { workspace_id: string }) => {
      qc.invalidateQueries({ queryKey: ['questions', vars.workspace_id] })
      toast.success('Problem added')
    },
    onError: () => toast.error('Failed to add problem'),
  })
}

export function useUpdateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspace_id, ...updates }: Partial<Question> & { id: string; workspace_id: string }) => {
      const { error } = await db.from('questions').update(updates).eq('id', id)
      if (error) throw error
      return { workspace_id }
    },
    onSuccess: (_d: unknown, vars: { workspace_id: string }) => qc.invalidateQueries({ queryKey: ['questions', vars.workspace_id] }),
    onError: () => toast.error('Failed to update problem'),
  })
}

export function useDeleteQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await db.from('questions').delete().eq('id', id)
      if (error) throw error
      return { workspaceId }
    },
    onSuccess: (_d: unknown, vars: { workspaceId: string }) => {
      qc.invalidateQueries({ queryKey: ['questions', vars.workspaceId] })
      toast.success('Problem deleted')
    },
    onError: () => toast.error('Failed to delete problem'),
  })
}

// ─── Resources (legacy) ───────────────────────────────────────────────────────

export function useResources(workspaceId: string) {
  return useQuery({
    queryKey: ['resources', workspaceId],
    queryFn: async () => {
      const { data, error } = await db
        .from('resources')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Resource[]
    },
  })
}

export function useAddResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Omit<Resource, 'id' | 'created_at' | 'updated_at'>> & { name: string; workspace_id: string }) => {
      const { data, error } = await db.from('resources').insert(payload).select().single()
      if (error) throw error
      return data as Resource
    },
    onSuccess: (_d: Resource, vars: { workspace_id: string }) => {
      qc.invalidateQueries({ queryKey: ['resources', vars.workspace_id] })
      toast.success('Resource added')
    },
    onError: () => toast.error('Failed to add resource'),
  })
}

export function useUpdateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspace_id, ...updates }: Partial<Resource> & { id: string; workspace_id: string }) => {
      const { error } = await db.from('resources').update(updates).eq('id', id)
      if (error) throw error
      return { workspace_id }
    },
    onSuccess: (_d: unknown, vars: { workspace_id: string }) => qc.invalidateQueries({ queryKey: ['resources', vars.workspace_id] }),
    onError: () => toast.error('Failed to update resource'),
  })
}

export function useDeleteResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await db.from('resources').delete().eq('id', id)
      if (error) throw error
      return { workspaceId }
    },
    onSuccess: (_d: unknown, vars: { workspaceId: string }) => {
      qc.invalidateQueries({ queryKey: ['resources', vars.workspaceId] })
      toast.success('Resource deleted')
    },
    onError: () => toast.error('Failed to delete resource'),
  })
}

// ─── Interview Q&A (legacy) ───────────────────────────────────────────────────

export function useInterviewQA(workspaceId: string) {
  return useQuery({
    queryKey: ['interview_qa', workspaceId],
    queryFn: async () => {
      const { data, error } = await db
        .from('interview_qa')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as InterviewQA[]
    },
  })
}

export function useAddInterviewQA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Omit<InterviewQA, 'id' | 'created_at' | 'updated_at'>> & { question: string; workspace_id: string }) => {
      const { data, error } = await db.from('interview_qa').insert(payload).select().single()
      if (error) throw error
      return data as InterviewQA
    },
    onSuccess: (_d: InterviewQA, vars: { workspace_id: string }) => {
      qc.invalidateQueries({ queryKey: ['interview_qa', vars.workspace_id] })
      toast.success('Q&A added')
    },
    onError: () => toast.error('Failed to add Q&A'),
  })
}

export function useUpdateInterviewQA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspace_id, ...updates }: Partial<InterviewQA> & { id: string; workspace_id: string }) => {
      const { error } = await db.from('interview_qa').update(updates).eq('id', id)
      if (error) throw error
      return { workspace_id }
    },
    onSuccess: (_d: unknown, vars: { workspace_id: string }) => qc.invalidateQueries({ queryKey: ['interview_qa', vars.workspace_id] }),
    onError: () => toast.error('Failed to update Q&A'),
  })
}

export function useDeleteInterviewQA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await db.from('interview_qa').delete().eq('id', id)
      if (error) throw error
      return { workspaceId }
    },
    onSuccess: (_d: unknown, vars: { workspaceId: string }) => {
      qc.invalidateQueries({ queryKey: ['interview_qa', vars.workspaceId] })
      toast.success('Q&A deleted')
    },
    onError: () => toast.error('Failed to delete Q&A'),
  })
}

// ─── Workspace Notes / Cheat Sheets (legacy) ──────────────────────────────────

export function useWorkspaceNotes(workspaceId: string, entityType: string = 'note') {
  return useQuery({
    queryKey: ['note_pages', workspaceId, entityType],
    queryFn: async () => {
      const { data, error } = await db
        .from('note_pages')
        .select('id, title, tags, entity_type, entity_id, workspace_id, created_at, updated_at')
        .eq('workspace_id', workspaceId)
        .eq('entity_type', entityType)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as WorkspaceNote[]
    },
  })
}

export function useAddWorkspaceNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ workspaceId, title, entityType = 'note' }: { workspaceId: string; title: string; entityType?: string }) => {
      const { data, error } = await db
        .from('note_pages')
        .insert({ workspace_id: workspaceId, title, entity_type: entityType, entity_id: workspaceId })
        .select()
        .single()
      if (error) throw error
      return data as WorkspaceNote
    },
    onSuccess: (_d: WorkspaceNote, vars: { workspaceId: string; entityType?: string }) => {
      qc.invalidateQueries({ queryKey: ['note_pages', vars.workspaceId, vars.entityType ?? 'note'] })
      toast.success('Note created')
    },
    onError: () => toast.error('Failed to create note'),
  })
}

export function useDeleteWorkspaceNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId, entityType = 'note' }: { id: string; workspaceId: string; entityType?: string }) => {
      const { error } = await db.from('note_pages').delete().eq('id', id)
      if (error) throw error
      return { workspaceId, entityType }
    },
    onSuccess: (_d: unknown, vars: { workspaceId: string; entityType?: string }) => {
      qc.invalidateQueries({ queryKey: ['note_pages', vars.workspaceId, vars.entityType] })
      toast.success('Note deleted')
    },
    onError: () => toast.error('Failed to delete note'),
  })
}
