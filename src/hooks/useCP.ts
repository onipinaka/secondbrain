import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export type ContestEntry = {
  id: string
  platform: string
  name: string
  contest_date: string | null
  duration: string | null
  registered: boolean | null
  participated: boolean | null
  rating_before: number | null
  rating_after: number | null
  rank: number | null
  problems_solved: number | null
  notes: string | null
  created_at: string | null
}

export type CPRatingEntry = {
  id: string
  platform: string
  rating: number
  log_date: string
  created_at: string | null
}

export type EditorialEntry = {
  id: string
  problem_name: string
  contest_name: string | null
  what_went_wrong: string | null
  correct_approach: string | null
  date_reviewed: string | null
  question_id: string | null
  created_at: string | null
}

// ─── contests ────────────────────────────────────────────────────────────────

export function useContests() {
  return useQuery({
    queryKey: ['contests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .order('contest_date', { ascending: false, nullsFirst: false })
      if (error) throw error
      return data as ContestEntry[]
    },
  })
}

export function useAddContest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; platform: string } & Partial<ContestEntry>) => {
      const { error } = await supabase.from('contests').insert([payload])
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contests'] }); toast.success('Contest added') },
    onError: () => toast.error('Failed to add contest'),
  })
}

export function useUpdateContest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<ContestEntry> & { id: string }) => {
      const { error } = await supabase.from('contests').update(rest).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contests'] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteContest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contests').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contests'] }); toast.success('Contest deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── cp_rating_tracker ────────────────────────────────────────────────────────

export function useCPRating() {
  return useQuery({
    queryKey: ['cp_rating_tracker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cp_rating_tracker')
        .select('*')
        .order('log_date', { ascending: true })
      if (error) throw error
      return data as CPRatingEntry[]
    },
  })
}

export function useAddCPRating() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { platform: string; rating: number; log_date: string }) => {
      const { error } = await supabase.from('cp_rating_tracker').insert([payload])
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cp_rating_tracker'] }); toast.success('Rating logged') },
    onError: () => toast.error('Failed to log rating'),
  })
}

export function useDeleteCPRating() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cp_rating_tracker').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cp_rating_tracker'] }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── editorial_reviews ────────────────────────────────────────────────────────

export function useEditorials() {
  return useQuery({
    queryKey: ['editorial_reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('editorial_reviews')
        .select('*')
        .order('date_reviewed', { ascending: false, nullsFirst: false })
      if (error) throw error
      return data as EditorialEntry[]
    },
  })
}

export function useAddEditorial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { problem_name: string } & Partial<EditorialEntry>) => {
      const { error } = await supabase.from('editorial_reviews').insert([payload])
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['editorial_reviews'] }); toast.success('Editorial added') },
    onError: () => toast.error('Failed to add editorial'),
  })
}

export function useUpdateEditorial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<EditorialEntry> & { id: string }) => {
      const { error } = await supabase.from('editorial_reviews').update(rest).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['editorial_reviews'] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteEditorial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('editorial_reviews').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['editorial_reviews'] }); toast.success('Editorial deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}
