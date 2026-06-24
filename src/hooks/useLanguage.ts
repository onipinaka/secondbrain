import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VocabularyItem = {
  id: string
  word: string
  reading: string | null
  romaji: string | null
  meaning: string | null
  example_sentence: string | null
  jlpt_level: string | null
  mastered: boolean | null
  srs_level: number | null
  last_reviewed: string | null
  created_at: string | null
  updated_at: string | null
}

export type KanjiItem = {
  id: string
  character: string
  on_reading: string | null
  kun_reading: string | null
  meaning: string | null
  stroke_count: number | null
  jlpt_level: string | null
  example_words: string | null
  mastered: boolean | null
  created_at: string | null
  updated_at: string | null
}

export type GrammarPoint = {
  id: string
  grammar_point: string
  structure: string | null
  meaning: string | null
  examples: string | null
  jlpt_level: string | null
  mastered: boolean | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type ImmersionEntry = {
  id: string
  log_date: string
  type: string | null
  content: string | null
  duration_mins: number | null
  comprehension: number | null
  notes: string | null
  topic: string | null
  created_at: string | null
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

export function useVocabulary() {
  return useQuery({
    queryKey: ['vocabulary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .order('jlpt_level', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as VocabularyItem[]
    },
  })
}

export function useAddVocab() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Omit<VocabularyItem, 'id' | 'created_at' | 'updated_at'>> & { word: string }) => {
      const { data, error } = await supabase.from('vocabulary').insert(payload).select().single()
      if (error) throw error
      return data as VocabularyItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocabulary'] })
      toast.success('Word added')
    },
    onError: () => toast.error('Failed to add word'),
  })
}

export function useUpdateVocab() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VocabularyItem> & { id: string }) => {
      const { error } = await supabase.from('vocabulary').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vocabulary'] }),
    onError: () => toast.error('Failed to update word'),
  })
}

export function useDeleteVocab() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vocabulary').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocabulary'] })
      toast.success('Word deleted')
    },
    onError: () => toast.error('Failed to delete word'),
  })
}

// ─── Kanji ────────────────────────────────────────────────────────────────────

export function useKanji() {
  return useQuery({
    queryKey: ['kanji'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanji')
        .select('*')
        .order('jlpt_level', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as KanjiItem[]
    },
  })
}

export function useAddKanji() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Omit<KanjiItem, 'id' | 'created_at' | 'updated_at'>> & { character: string }) => {
      const { data, error } = await supabase.from('kanji').insert(payload).select().single()
      if (error) throw error
      return data as KanjiItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanji'] })
      toast.success('Kanji added')
    },
    onError: () => toast.error('Failed to add kanji'),
  })
}

export function useUpdateKanji() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KanjiItem> & { id: string }) => {
      const { error } = await supabase.from('kanji').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanji'] }),
    onError: () => toast.error('Failed to update kanji'),
  })
}

export function useDeleteKanji() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kanji').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanji'] })
      toast.success('Kanji deleted')
    },
    onError: () => toast.error('Failed to delete kanji'),
  })
}

// ─── Grammar Points ───────────────────────────────────────────────────────────

export function useGrammar() {
  return useQuery({
    queryKey: ['grammar_points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grammar_points')
        .select('*')
        .order('jlpt_level', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as GrammarPoint[]
    },
  })
}

export function useAddGrammar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Omit<GrammarPoint, 'id' | 'created_at' | 'updated_at'>> & { grammar_point: string }) => {
      const { data, error } = await supabase.from('grammar_points').insert(payload).select().single()
      if (error) throw error
      return data as GrammarPoint
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grammar_points'] })
      toast.success('Grammar point added')
    },
    onError: () => toast.error('Failed to add grammar point'),
  })
}

export function useUpdateGrammar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GrammarPoint> & { id: string }) => {
      const { error } = await supabase.from('grammar_points').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grammar_points'] }),
    onError: () => toast.error('Failed to update grammar point'),
  })
}

export function useDeleteGrammar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('grammar_points').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grammar_points'] })
      toast.success('Grammar point deleted')
    },
    onError: () => toast.error('Failed to delete grammar point'),
  })
}

// ─── Immersion Log ────────────────────────────────────────────────────────────

export function useImmersionLog() {
  return useQuery({
    queryKey: ['immersion_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('immersion_log')
        .select('*')
        .order('log_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as ImmersionEntry[]
    },
  })
}

export function useAddImmersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Omit<ImmersionEntry, 'id' | 'created_at'>> & { log_date: string }) => {
      const { data, error } = await supabase.from('immersion_log').insert(payload).select().single()
      if (error) throw error
      return data as ImmersionEntry
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['immersion_log'] })
      toast.success('Session logged')
    },
    onError: () => toast.error('Failed to log session'),
  })
}

export function useUpdateImmersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImmersionEntry> & { id: string }) => {
      const { error } = await supabase.from('immersion_log').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['immersion_log'] }),
    onError: () => toast.error('Failed to update session'),
  })
}

export function useDeleteImmersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('immersion_log').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['immersion_log'] })
      toast.success('Session deleted')
    },
    onError: () => toast.error('Failed to delete session'),
  })
}
