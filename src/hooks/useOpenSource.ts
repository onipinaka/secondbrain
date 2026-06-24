import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Types ────────────────────────────────────────────────────────────────────

export type OsRepo = {
  id: number
  created_at: string
  updated_at: string
  repo_name: string
  github_link: string | null
  owner: string | null
  description: string | null
  theme: string | null
  tech_stack: string[] | null
  stars: number | null
  status: string | null      // exploring / contributing / paused / done
  difficulty: string | null  // easy / medium / hard
  priority: string | null    // low / medium / high
  is_assigned: boolean | null
  notes: string | null
}

export type OsIssue = {
  id: number
  created_at: string
  updated_at: string
  repo_id: number
  issue_number: number | null
  title: string
  link: string | null
  status: string | null      // open / assigned / in_progress / solved / abandoned
  is_assigned: boolean | null
  assigned_at: string | null
  solved_at: string | null
  difficulty: string | null
  labels: string[] | null
  notes: string | null
  os_repos?: { repo_name: string } | null
}

export type OsPr = {
  id: number
  created_at: string
  updated_at: string
  repo_id: number
  issue_id: number | null
  pr_number: number | null
  title: string
  link: string | null
  status: string | null     // draft / open / merged / closed
  opened_at: string | null
  merged_at: string | null
  closed_at: string | null
  notes: string | null
  os_repos?: { repo_name: string } | null
}

// Legacy aliases kept so any non-updated callers don't break at compile time
export type Repo = OsRepo
export type Issue = OsIssue
export type PullRequest = OsPr

// ─── Repos ────────────────────────────────────────────────────────────────────

export function useRepo(id: number) {
  return useQuery({
    queryKey: ['os_repos', id],
    queryFn: async () => {
      const { data, error } = await db.from('os_repos').select('*').eq('id', id).single()
      if (error) throw error
      return data as OsRepo
    },
    enabled: !!id,
  })
}

export function useRepos() {
  return useQuery({
    queryKey: ['os_repos'],
    queryFn: async () => {
      const { data, error } = await db
        .from('os_repos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as OsRepo[]
    },
  })
}

export function useAddRepo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Omit<OsRepo, 'id' | 'created_at' | 'updated_at'>> & { repo_name: string }) => {
      const { data, error } = await db.from('os_repos').insert(payload).select().single()
      if (error) throw error
      return data as OsRepo
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['os_repos'] }); toast.success('Repo added') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateRepo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OsRepo> & { id: number }) => {
      const { error } = await db.from('os_repos').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['os_repos'] }),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteRepo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('os_repos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['os_repos'] }); toast.success('Repo deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export function useIssues() {
  return useQuery({
    queryKey: ['os_issues'],
    queryFn: async () => {
      const { data, error } = await db
        .from('os_issues')
        .select('*, os_repos(repo_name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as OsIssue[]
    },
  })
}

export function useAddIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Partial<Omit<OsIssue, 'id' | 'created_at' | 'updated_at' | 'os_repos'>> & { title: string; repo_id: number }
    ) => {
      const { data, error } = await db.from('os_issues').insert(payload).select().single()
      if (error) throw error
      return data as OsIssue
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['os_issues'] }); toast.success('Issue added') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OsIssue> & { id: number }) => {
      const { error } = await db.from('os_issues').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['os_issues'] }),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteIssue() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('os_issues').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['os_issues'] }); toast.success('Issue deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Pull Requests ────────────────────────────────────────────────────────────

export function usePullRequests() {
  return useQuery({
    queryKey: ['os_prs'],
    queryFn: async () => {
      const { data, error } = await db
        .from('os_prs')
        .select('*, os_repos(repo_name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as OsPr[]
    },
  })
}

export function useAddPullRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Partial<Omit<OsPr, 'id' | 'created_at' | 'updated_at' | 'os_repos'>> & { title: string; repo_id: number }
    ) => {
      const { data, error } = await db.from('os_prs').insert(payload).select().single()
      if (error) throw error
      return data as OsPr
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['os_prs'] }); toast.success('PR added') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdatePullRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OsPr> & { id: number }) => {
      const { error } = await db.from('os_prs').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['os_prs'] }),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeletePullRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('os_prs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['os_prs'] }); toast.success('PR deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}
