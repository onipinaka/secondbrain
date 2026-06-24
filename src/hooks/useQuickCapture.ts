import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

// qc_* tables aren't in the auto-generated types yet — cast once here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Types ────────────────────────────────────────────────────────────────────

export type QcTask = {
  id: number
  created_at: string
  task: string
  due_date: string | null
  due_time: string | null
  workspace_id: number | null
  is_done: boolean
  done_at: string | null
  processed_at: string | null
}

export type QcReminder = {
  id: number
  created_at: string
  title: string
  date: string | null
  time: string | null
  is_all_day: boolean
  person: string | null
  notes: string | null
  processed_at: string | null
}

export type QcTimeBlock = {
  id: number
  created_at: string
  name: string
  recurrence: string
  weekdays: number[] | null
  specific_date: string | null
  start_time: string | null
  end_time: string | null
  type: string | null
  notes: string | null
  is_active: boolean
}

export type QcIdea = {
  id: number
  created_at: string
  idea: string
  category: string | null
  is_sorted: boolean
  sorted_to_workspace_id: number | null
  processed_at: string | null
}

export type QcLink = {
  id: number
  created_at: string
  title: string | null
  url: string
  tags: string[] | null
  processed_at: string | null
}

export type QcNote = {
  id: number
  created_at: string
  content: string
  processed_at: string | null
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export function useQcTasks() {
  return useQuery({
    queryKey: ['qc_tasks'],
    queryFn: async () => {
      const { data, error } = await db
        .from('qc_tasks')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as QcTask[]
    },
  })
}

export function useAddQcTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<QcTask, 'id' | 'created_at' | 'done_at' | 'processed_at'>) => {
      const { error } = await db.from('qc_tasks').insert(payload)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_tasks'] }); toast.success('Task added') },
    onError: () => toast.error('Failed to add task'),
  })
}

export function useUpdateQcTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QcTask> & { id: number }) => {
      const { error } = await db.from('qc_tasks').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qc_tasks'] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteQcTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('qc_tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_tasks'] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export function useQcReminders() {
  return useQuery({
    queryKey: ['qc_reminders'],
    queryFn: async () => {
      const { data, error } = await db
        .from('qc_reminders')
        .select('*')
        .order('date', { ascending: true })
      if (error) throw error
      return (data ?? []) as QcReminder[]
    },
  })
}

export function useAddQcReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<QcReminder, 'id' | 'created_at' | 'processed_at'>) => {
      const { error } = await db.from('qc_reminders').insert(payload)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_reminders'] }); toast.success('Reminder added') },
    onError: () => toast.error('Failed to add reminder'),
  })
}

export function useUpdateQcReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QcReminder> & { id: number }) => {
      const { error } = await db.from('qc_reminders').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qc_reminders'] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteQcReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('qc_reminders').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_reminders'] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Time Blocks ─────────────────────────────────────────────────────────────

export function useQcTimeBlocks() {
  return useQuery({
    queryKey: ['qc_time_blocks'],
    queryFn: async () => {
      const { data, error } = await db
        .from('qc_time_blocks')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: true })
      if (error) throw error
      return (data ?? []) as QcTimeBlock[]
    },
  })
}

export function useAddQcTimeBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<QcTimeBlock, 'id' | 'created_at'>) => {
      const { error } = await db.from('qc_time_blocks').insert(payload)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_time_blocks'] }); toast.success('Time block added') },
    onError: () => toast.error('Failed to add time block'),
  })
}

export function useUpdateQcTimeBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QcTimeBlock> & { id: number }) => {
      const { error } = await db.from('qc_time_blocks').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qc_time_blocks'] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteQcTimeBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('qc_time_blocks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_time_blocks'] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Ideas ───────────────────────────────────────────────────────────────────

export function useQcIdeas() {
  return useQuery({
    queryKey: ['qc_ideas'],
    queryFn: async () => {
      const { data, error } = await db
        .from('qc_ideas')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as QcIdea[]
    },
  })
}

export function useAddQcIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<QcIdea, 'id' | 'created_at' | 'processed_at'>) => {
      const { error } = await db.from('qc_ideas').insert(payload)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_ideas'] }); toast.success('Idea saved') },
    onError: () => toast.error('Failed to add idea'),
  })
}

export function useUpdateQcIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QcIdea> & { id: number }) => {
      const { error } = await db.from('qc_ideas').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qc_ideas'] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteQcIdea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('qc_ideas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_ideas'] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Links ───────────────────────────────────────────────────────────────────

export function useQcLinks() {
  return useQuery({
    queryKey: ['qc_links'],
    queryFn: async () => {
      const { data, error } = await db
        .from('qc_links')
        .select('*')
        .is('processed_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as QcLink[]
    },
  })
}

export function useAddQcLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<QcLink, 'id' | 'created_at' | 'processed_at'>) => {
      const { error } = await db.from('qc_links').insert(payload)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_links'] }); toast.success('Link saved') },
    onError: () => toast.error('Failed to add link'),
  })
}

export function useUpdateQcLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QcLink> & { id: number }) => {
      const { error } = await db.from('qc_links').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qc_links'] }),
    onError: () => toast.error('Failed to update'),
  })
}

export function useDeleteQcLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('qc_links').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_links'] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export function useQcNotes() {
  return useQuery({
    queryKey: ['qc_notes'],
    queryFn: async () => {
      const { data, error } = await db
        .from('qc_notes')
        .select('*')
        .is('processed_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as QcNote[]
    },
  })
}

export function useAddQcNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (content: string) => {
      const { error } = await db.from('qc_notes').insert({ content })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_notes'] }); toast.success('Note saved') },
    onError: () => toast.error('Failed to add note'),
  })
}

export function useDeleteQcNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('qc_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['qc_notes'] }); toast.success('Deleted') },
    onError: () => toast.error('Failed to delete'),
  })
}

// ─── Generic quick capture (used by CommandPalette) ───────────────────────────

type QuickCapturePayload = {
  type: 'sudden_task' | 'idea'
  content: string
  workspace_id?: string | null
  [key: string]: unknown
}

export function useAddQuickCapture() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ type, content, workspace_id }: QuickCapturePayload) => {
      if (type === 'idea') {
        const { error } = await db.from('qc_ideas').insert({ content })
        if (error) throw error
      } else {
        const { error } = await db.from('qc_tasks').insert({ content, workspace_id: workspace_id ?? null })
        if (error) throw error
      }
    },
    onSuccess: (_, vars) => {
      if (vars.type === 'idea') qc.invalidateQueries({ queryKey: ['qc_ideas'] })
      else qc.invalidateQueries({ queryKey: ['qc_tasks'] })
      toast.success('Captured!')
    },
    onError: () => toast.error('Failed to capture'),
  })
}
