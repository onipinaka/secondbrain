import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

export type Goal = {
  id: string
  goal: string
  type: string | null
  status: string | null
  deadline: string | null
  why_it_matters: string | null
  progress_notes: string | null
  created_at: string | null
}

export type MeditationLog = {
  id: string
  log_date: string
  duration_mins: number | null
  type: string | null
  resource: string | null
  mood_before: number | null
  mood_after: number | null
  notes: string | null
  created_at: string | null
}

export type JournalEntry = {
  id: string
  logged_at: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export type Quote = {
  id: string
  quote: string
  author: string | null
  category: string | null
  is_favourite: boolean | null
  source: string | null
  created_at: string | null
}

export type GratitudeLog = {
  id: string
  log_date: string
  thing_1: string | null
  thing_2: string | null
  thing_3: string | null
  notes: string | null
  created_at: string | null
}

// --- Goals ---
export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Goal[]
    },
  })
}

export function useAddGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Goal>) => {
      const { data, error } = await supabase.from('goals').insert(patch as any).select().single()
      if (error) throw error
      return data as Goal
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); toast.success('Goal added') },
    onError: () => toast.error('Failed to add goal'),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Goal>) => {
      const { error } = await supabase.from('goals').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
    onError: () => toast.error('Failed to update goal'),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); toast.success('Goal deleted') },
    onError: () => toast.error('Failed to delete goal'),
  })
}

// --- Meditation Log ---
export function useMeditationLogs() {
  return useQuery({
    queryKey: ['meditation_log'],
    queryFn: async () => {
      const { data, error } = await supabase.from('meditation_log').select('*').order('log_date', { ascending: false })
      if (error) throw error
      return data as MeditationLog[]
    },
  })
}

export function useAddMeditationLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<MeditationLog>) => {
      const { data, error } = await supabase.from('meditation_log').insert(patch as any).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['meditation_log'] }); toast.success('Session added') },
    onError: () => toast.error('Failed to add session'),
  })
}

export function useUpdateMeditationLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<MeditationLog>) => {
      const { error } = await supabase.from('meditation_log').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meditation_log'] }),
    onError: () => toast.error('Failed to update session'),
  })
}

export function useDeleteMeditationLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meditation_log').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['meditation_log'] }); toast.success('Session deleted') },
    onError: () => toast.error('Failed to delete session'),
  })
}

// --- Journal Entries (personal_journal table) ---
export function useJournalEntries() {
  return useQuery({
    queryKey: ['personal_journal'],
    queryFn: async () => {
      const { data, error } = await sb.from('personal_journal').select('*').order('logged_at', { ascending: false })
      if (error) throw error
      return data as JournalEntry[]
    },
  })
}

export function useAddJournalEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<JournalEntry>) => {
      const { data, error } = await sb.from('personal_journal').insert(patch).select().single()
      if (error) throw error
      return data as JournalEntry
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personal_journal'] }); toast.success('Entry created') },
    onError: () => toast.error('Failed to create entry'),
  })
}

export function useUpdateJournalEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<JournalEntry>) => {
      const { error } = await sb.from('personal_journal').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal_journal'] }),
    onError: () => toast.error('Failed to update entry'),
  })
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('personal_journal').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personal_journal'] }); toast.success('Entry deleted') },
    onError: () => toast.error('Failed to delete entry'),
  })
}

// --- Quotes ---
export function useQuotes() {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data, error } = await sb.from('quotes').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Quote[]
    },
  })
}

export function useAddQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Quote>) => {
      const { data, error } = await sb.from('quotes').insert(patch).select().single()
      if (error) throw error
      return data as Quote
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); toast.success('Quote added') },
    onError: () => toast.error('Failed to add quote'),
  })
}

export function useUpdateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Quote>) => {
      const { error } = await sb.from('quotes').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
    onError: () => toast.error('Failed to update quote'),
  })
}

export function useDeleteQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('quotes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); toast.success('Quote deleted') },
    onError: () => toast.error('Failed to delete quote'),
  })
}

// --- Personal Goals (personal_goals table) ---
export type PersonalGoal = {
  id: string
  goal_type: string
  title: string
  content: string | null
  why_it_matters: string | null
  emoji: string | null
  status: string | null
  target_date: string | null
  achieved_at: string | null
  created_at: string
  updated_at: string
}

const sb = supabase as any

export function usePersonalGoals() {
  return useQuery({
    queryKey: ['personal_goals'],
    queryFn: async () => {
      const { data, error } = await sb.from('personal_goals').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as PersonalGoal[]
    },
  })
}

export function useAddPersonalGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<PersonalGoal>) => {
      const { data, error } = await sb.from('personal_goals').insert(patch).select().single()
      if (error) throw error
      return data as PersonalGoal
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personal_goals'] }); toast.success('Goal added') },
    onError: () => toast.error('Failed to add goal'),
  })
}

export function useUpdatePersonalGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<PersonalGoal>) => {
      const { error } = await sb.from('personal_goals').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal_goals'] }),
    onError: () => toast.error('Failed to update goal'),
  })
}

export function useDeletePersonalGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('personal_goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personal_goals'] }); toast.success('Goal deleted') },
    onError: () => toast.error('Failed to delete goal'),
  })
}

// --- Wishlist (personal_wishlist table) ---
export type WishlistItem = {
  id: string
  title: string
  content: string | null
  image_url: string | null
  price: number | null
  currency: string | null
  priority: string | null
  status: string | null
  already_have: boolean | null
  purchased_at: string | null
  created_at: string
  updated_at: string
}

export function useWishlistItems() {
  return useQuery({
    queryKey: ['personal_wishlist'],
    queryFn: async () => {
      const { data, error } = await sb.from('personal_wishlist').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as WishlistItem[]
    },
  })
}

export function useAddWishlistItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<WishlistItem>) => {
      const { data, error } = await sb.from('personal_wishlist').insert(patch).select().single()
      if (error) throw error
      return data as WishlistItem
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personal_wishlist'] }); toast.success('Item added') },
    onError: () => toast.error('Failed to add item'),
  })
}

export function useUpdateWishlistItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<WishlistItem>) => {
      const { error } = await sb.from('personal_wishlist').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal_wishlist'] }),
    onError: () => toast.error('Failed to update item'),
  })
}

export function useDeleteWishlistItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('personal_wishlist').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['personal_wishlist'] }); toast.success('Item deleted') },
    onError: () => toast.error('Failed to delete item'),
  })
}

// --- Gratitude Log ---
export function useGratitudeLogs() {
  return useQuery({
    queryKey: ['gratitude_log'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gratitude_log').select('*').order('log_date', { ascending: false })
      if (error) throw error
      return data as GratitudeLog[]
    },
  })
}

export function useAddGratitudeLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<GratitudeLog>) => {
      const { data, error } = await supabase.from('gratitude_log').insert(patch as any).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gratitude_log'] }),
    onError: () => toast.error('Failed to save gratitude'),
  })
}

export function useUpdateGratitudeLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<GratitudeLog>) => {
      const { error } = await supabase.from('gratitude_log').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gratitude_log'] }),
    onError: () => toast.error('Failed to save gratitude'),
  })
}
