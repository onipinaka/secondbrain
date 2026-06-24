import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

const sb = supabase as any

export type Project = {
  id: string
  name: string
  tagline: string | null
  description: string | null
  category: string | null
  status: string | null
  tech_stack: string[] | null
  start_date: string | null
  target_date: string | null
  completed_at: string | null
  github_link: string | null
  deployed_link: string | null
  roadmap: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ProjectFeature = {
  id: string
  project_id: string
  title: string
  description: string | null
  notes: string | null
  status: string | null
  priority: string | null
  deadline: string | null
  hours_spent: number | null
  sort_order: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type ProjectBug = {
  id: string
  project_id: string
  title: string
  notes: string | null
  status: string | null
  priority: string | null
  fixed_at: string | null
  created_at: string
  updated_at: string
}

// ─── Projects ──────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: ['proj_projects'],
    queryFn: async () => {
      const { data, error } = await sb.from('proj_projects').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Project[]
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['proj_project', id],
    queryFn: async () => {
      const { data, error } = await sb.from('proj_projects').select('*').eq('id', id).single()
      if (error) throw error
      return data as Project
    },
    enabled: !!id,
  })
}

export function useAddProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; category?: string | null; status?: string | null; tagline?: string | null }) => {
      const { data, error } = await sb.from('proj_projects').insert(input).select().single()
      if (error) throw error
      return data as Project
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proj_projects'] }); toast.success('Project added') },
    onError: () => toast.error('Failed to add project'),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Project> & { id: string }) => {
      const { error } = await sb.from('proj_projects').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_projects'] })
      qc.invalidateQueries({ queryKey: ['proj_project', String(vars.id)] })
      toast.success('Saved')
    },
    onError: () => toast.error('Failed to save'),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('proj_projects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proj_projects'] }); toast.success('Project deleted') },
    onError: () => toast.error('Failed to delete project'),
  })
}

// ─── All Features (for dashboard progress computation) ─────────────────────

export function useAllProjectFeatures() {
  return useQuery({
    queryKey: ['proj_features_all'],
    queryFn: async () => {
      const { data, error } = await sb
        .from('proj_features')
        .select('project_id, status')
      if (error) throw error
      return data as { project_id: string; status: string | null }[]
    },
  })
}

// ─── Features ──────────────────────────────────────────────────────────────

export function useProjectFeatures(projectId: string) {
  return useQuery({
    queryKey: ['proj_features', projectId],
    queryFn: async () => {
      const { data, error } = await sb
        .from('proj_features')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as ProjectFeature[]
    },
    enabled: !!projectId,
  })
}

export function useAddProjectFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { project_id: string; title: string; status?: string; priority?: string | null; description?: string | null; notes?: string | null; deadline?: string | null; sort_order: number }) => {
      const { data, error } = await sb.from('proj_features').insert(input).select().single()
      if (error) throw error
      return data as ProjectFeature
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_features', String(vars.project_id)] })
      toast.success('Feature added')
    },
    onError: () => toast.error('Failed to add feature'),
  })
}

export function useUpdateProjectFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id, ...patch }: Partial<ProjectFeature> & { id: string; project_id: string }) => {
      const { error } = await sb.from('proj_features').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_features', String(vars.project_id)] })
    },
    onError: () => toast.error('Failed to update feature'),
  })
}

export function useDeleteProjectFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string }) => {
      const { error } = await sb.from('proj_features').delete().eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_features', String(vars.project_id)] })
      toast.success('Feature deleted')
    },
    onError: () => toast.error('Failed to delete feature'),
  })
}

// ─── Bugs ──────────────────────────────────────────────────────────────────

export function useProjectBugs(projectId: string) {
  return useQuery({
    queryKey: ['proj_bugs', projectId],
    queryFn: async () => {
      const { data, error } = await sb
        .from('proj_bugs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ProjectBug[]
    },
    enabled: !!projectId,
  })
}

export function useAddProjectBug() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { project_id: string; title: string; priority?: string | null }) => {
      const { data, error } = await sb.from('proj_bugs').insert(input).select().single()
      if (error) throw error
      return data as ProjectBug
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_bugs', String(vars.project_id)] })
      toast.success('Bug added')
    },
    onError: () => toast.error('Failed to add bug'),
  })
}

export function useUpdateProjectBug() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id, ...patch }: Partial<ProjectBug> & { id: string; project_id: string }) => {
      const { error } = await sb.from('proj_bugs').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_bugs', String(vars.project_id)] })
    },
    onError: () => toast.error('Failed to update bug'),
  })
}

export function useDeleteProjectBug() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string }) => {
      const { error } = await sb.from('proj_bugs').delete().eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_bugs', String(vars.project_id)] })
      toast.success('Bug deleted')
    },
    onError: () => toast.error('Failed to delete bug'),
  })
}

// ─── Roadmap Phases ────────────────────────────────────────────────────────

export type RoadmapPhase = {
  id: string
  project_id: string
  title: string
  description: string | null
  status: string
  sort_order: number
  target_date: string | null
  created_at: string
  updated_at: string
}

export function useRoadmapPhases(projectId: string) {
  return useQuery({
    queryKey: ['proj_roadmap', projectId],
    queryFn: async () => {
      const { data, error } = await sb
        .from('proj_roadmap_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as RoadmapPhase[]
    },
    enabled: !!projectId,
  })
}

export function useAddRoadmapPhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { project_id: string; title: string; description?: string | null; status?: string; target_date?: string | null; sort_order: number }) => {
      const { data, error } = await sb.from('proj_roadmap_phases').insert(input).select().single()
      if (error) throw error
      return data as RoadmapPhase
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_roadmap', String(vars.project_id)] })
      toast.success('Phase added')
    },
    onError: () => toast.error('Failed to add phase'),
  })
}

export function useUpdateRoadmapPhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id, ...patch }: Partial<RoadmapPhase> & { id: string; project_id: string }) => {
      const { error } = await sb.from('proj_roadmap_phases').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_roadmap', String(vars.project_id)] })
    },
    onError: () => toast.error('Failed to update phase'),
  })
}

export function useDeleteRoadmapPhase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string }) => {
      const { error } = await sb.from('proj_roadmap_phases').delete().eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_roadmap', String(vars.project_id)] })
      toast.success('Phase deleted')
    },
    onError: () => toast.error('Failed to delete phase'),
  })
}

export function useRoadmapPhase(id: string) {
  return useQuery({
    queryKey: ['proj_roadmap_phase', id],
    queryFn: async () => {
      const { data, error } = await sb.from('proj_roadmap_phases').select('*').eq('id', id).single()
      if (error) throw error
      return data as RoadmapPhase
    },
    enabled: !!id,
  })
}

// ─── Documents ─────────────────────────────────────────────────────────────

export type ProjectDocument = {
  id: string
  project_id: string
  doc_type: string
  title: string
  content: string | null
  link: string | null
  sort_order: number | null
  created_at: string
  updated_at: string
}

export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: ['proj_documents', projectId],
    queryFn: async () => {
      const { data, error } = await sb
        .from('proj_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ProjectDocument[]
    },
    enabled: !!projectId,
  })
}

export function useAddProjectDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { project_id: string; title: string; doc_type: string; link?: string | null; content?: string | null; sort_order?: number }) => {
      const { data, error } = await sb.from('proj_documents').insert(input).select().single()
      if (error) throw error
      return data as ProjectDocument
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_documents', String(vars.project_id)] })
      toast.success('Document added')
    },
    onError: () => toast.error('Failed to add document'),
  })
}

export function useUpdateProjectDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id, ...patch }: Partial<ProjectDocument> & { id: string; project_id: string }) => {
      const { error } = await sb.from('proj_documents').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_documents', String(vars.project_id)] })
    },
    onError: () => toast.error('Failed to update document'),
  })
}

export function useDeleteProjectDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string }) => {
      const { error } = await sb.from('proj_documents').delete().eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_d: any, vars: any) => {
      qc.invalidateQueries({ queryKey: ['proj_documents', String(vars.project_id)] })
      toast.success('Document deleted')
    },
    onError: () => toast.error('Failed to delete document'),
  })
}
