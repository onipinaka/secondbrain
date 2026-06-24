import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export type Opportunity = {
  id: number
  created_at: string
  updated_at: string
  name: string
  type: string | null        // hackathon / competition / internship / fellowship / grant
  status: string | null      // not_started / in_progress / submitted / accepted / rejected / dropped
  deadline: string | null
  priority: string | null    // low / medium / high
  theme: string | null
  notes: string | null
  ps: string | null
  solution: string | null
}

type Insert = Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>
type Update = { id: number } & Partial<Insert>

const QK = ['opp_opportunities']

export function useOpportunities() {
  return useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await db
        .from('opp_opportunities')
        .select('*')
        .order('deadline', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as Opportunity[]
    },
  })
}

export function useAddOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Insert) => {
      const { data, error } = await db.from('opp_opportunities').insert(row).select().single()
      if (error) throw error
      return data as Opportunity
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); toast.success('Opportunity added') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Update) => {
      const { error } = await db.from('opp_opportunities').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); toast.success('Saved') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('opp_opportunities').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK }); toast.success('Deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}
