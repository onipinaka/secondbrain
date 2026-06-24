import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

export type Book = {
  id: string
  title: string
  author: string | null
  status: string | null
  current_page: number | null
  total_pages: number | null
  rating: number | null
  started_date: string | null
  finished_date: string | null
  created_at: string | null
}

export type Article = {
  id: string
  title: string
  source: string | null
  url: string | null
  status: string | null
  tags: string[] | null
  notes: string | null
  created_at: string | null
}

export type Course = {
  id: string
  name: string
  platform: string | null
  status: string | null
  current_unit: number | null
  total_units: number | null
  has_certificate: boolean | null
  notes: string | null
  created_at: string | null
}

export type Resource = {
  id: string
  workspace_id: string | null
  name: string
  url: string | null
  type: string | null
  platform: string | null
  status: string | null
  topic_id: string | null
  total_units: number | null
  units_done: number | null
  notes: string | null
  updated_at: string | null
  created_at: string | null
}

export type GeopoliticsNote = {
  id: string
  topic: string
  region: string | null
  key_learnings: string | null
  log_date: string
  created_at: string | null
}

// --- Books ---
export function useBooks() {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Book[]
    },
  })
}

export function useAddBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Book>) => {
      const { data, error } = await supabase.from('books').insert(patch as any).select().single()
      if (error) throw error
      return data as Book
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }); toast.success('Book added') },
    onError: () => toast.error('Failed to add book'),
  })
}

export function useUpdateBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Book>) => {
      const { error } = await supabase.from('books').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['books'] }),
    onError: () => toast.error('Failed to update book'),
  })
}

export function useDeleteBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('books').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }); toast.success('Book removed') },
    onError: () => toast.error('Failed to delete book'),
  })
}

// --- Articles ---
export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Article[]
    },
  })
}

export function useAddArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Article>) => {
      const { data, error } = await supabase.from('articles').insert(patch as any).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['articles'] }); toast.success('Article added') },
    onError: () => toast.error('Failed to add article'),
  })
}

export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Article>) => {
      const { error } = await supabase.from('articles').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
    onError: () => toast.error('Failed to update article'),
  })
}

export function useDeleteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('articles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['articles'] }); toast.success('Article deleted') },
    onError: () => toast.error('Failed to delete article'),
  })
}

// --- Courses ---
export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').order('status')
      if (error) throw error
      return data as Course[]
    },
  })
}

export function useAddCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Course>) => {
      const { data, error } = await supabase.from('courses').insert(patch as any).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course added') },
    onError: () => toast.error('Failed to add course'),
  })
}

export function useUpdateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Course>) => {
      const { error } = await supabase.from('courses').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
    onError: () => toast.error('Failed to update course'),
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course deleted') },
    onError: () => toast.error('Failed to delete course'),
  })
}

// --- Resources (for playlists / geopolitics sub-sections) ---
export function useResources(workspaceId: string, typeFilter?: string) {
  return useQuery({
    queryKey: ['resources', workspaceId, typeFilter],
    queryFn: async () => {
      let query = supabase.from('resources').select('*').eq('workspace_id', workspaceId)
      if (typeFilter) query = query.eq('type', typeFilter)
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data as Resource[]
    },
    enabled: !!workspaceId,
  })
}

export function useAddResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Resource>) => {
      const { data, error } = await supabase.from('resources').insert(patch as any).select().single()
      if (error) throw error
      return data as Resource
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['resources', (data as Resource).workspace_id] })
      toast.success('Resource added')
    },
    onError: () => toast.error('Failed to add resource'),
  })
}

export function useUpdateResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Resource>) => {
      const { data, error } = await supabase.from('resources').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data as Resource
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['resources', data.workspace_id] })
    },
    onError: () => toast.error('Failed to update resource'),
  })
}

export function useDeleteResource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('resources').delete().eq('id', id)
      if (error) throw error
      return workspaceId
    },
    onSuccess: (workspaceId) => {
      qc.invalidateQueries({ queryKey: ['resources', workspaceId] })
      toast.success('Resource deleted')
    },
    onError: () => toast.error('Failed to delete resource'),
  })
}

// --- Geopolitics Notes ---
export function useGeopoliticsNotes() {
  return useQuery({
    queryKey: ['geopolitics_notes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('geopolitics_notes').select('*').order('log_date', { ascending: false })
      if (error) throw error
      return data as GeopoliticsNote[]
    },
  })
}

export function useAddGeopoliticsNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<GeopoliticsNote>) => {
      const { data, error } = await supabase.from('geopolitics_notes').insert(patch as any).select().single()
      if (error) throw error
      return data as GeopoliticsNote
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geopolitics_notes'] }); toast.success('Note added') },
    onError: () => toast.error('Failed to add note'),
  })
}

export function useUpdateGeopoliticsNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<GeopoliticsNote>) => {
      const { error } = await supabase.from('geopolitics_notes').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['geopolitics_notes'] }),
    onError: () => toast.error('Failed to update note'),
  })
}

export function useDeleteGeopoliticsNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('geopolitics_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['geopolitics_notes'] }); toast.success('Note deleted') },
    onError: () => toast.error('Failed to delete note'),
  })
}
