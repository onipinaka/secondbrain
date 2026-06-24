import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export type CmNiche = {
  id: number
  niche_id: number
  name: string
  slug: string | null
  color: string | null
  icon: string | null
  sort_order: number | null
}

export type CmLead = {
  id: number
  created_at: string
  updated_at: string
  company_name: string | null
  contact_name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  instagram: string | null
  niche_id: number | null
  follow_up_status: string | null
  source: string | null
  last_contact: string | null
  next_follow_up: string | null
  best_time_to_call: string | null
  whatsapp_template_used: string | null
  response: string | null
  notes: string | null
}

export type CmEmail = {
  id: number
  created_at: string
  updated_at: string
  company: string | null
  contact_name: string | null
  email: string | null
  subject: string | null
  campaign: string | null
  status: string | null
  sent_on: string | null
  opened_at: string | null
  replied_at: string | null
  next_follow_up: string | null
  content: string | null
  niche_id: number | null
}

type UpdateLeadPayload = { id: number } & Partial<Omit<CmLead, 'id' | 'created_at' | 'updated_at'>>
type UpdateEmailPayload = { id: number } & Partial<Omit<CmEmail, 'id' | 'created_at' | 'updated_at'>>

export function useCmNiches() {
  return useQuery({
    queryKey: ['cm_niches'],
    queryFn: async () => {
      const { data, error } = await db
        .from('cm_niches')
        .select('*')
        .order('sort_order', { nullsFirst: false })
      if (error) throw error
      return data as CmNiche[]
    },
  })
}

export function useAddCmNiche() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, niche_id }: { name: string; niche_id: number }) => {
      const { error } = await db.from('cm_niches').insert({ name, niche_id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_niches'] })
      toast.success('Niche added')
    },
    onError: () => toast.error('Failed to add niche'),
  })
}

export function useDeleteCmNiche() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (niche_id: number) => {
      const { error } = await db.from('cm_niches').delete().eq('niche_id', niche_id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_niches'] })
      toast.success('Niche deleted')
    },
    onError: () => toast.error('Failed to delete niche'),
  })
}

export function useUpdateCmNiche() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ niche_id, name }: { niche_id: number; name: string }) => {
      const { error } = await db.from('cm_niches').update({ name }).eq('niche_id', niche_id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_niches'] })
      toast.success('Niche updated')
    },
    onError: () => toast.error('Failed to update niche'),
  })
}

export function useCmLeads() {
  return useQuery({
    queryKey: ['cm_leads'],
    queryFn: async () => {
      const { data, error } = await db
        .from('cm_leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CmLead[]
    },
  })
}

export function useAddCmLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (lead: Omit<CmLead, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await db.from('cm_leads').insert(lead)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_leads'] })
      toast.success('Lead added')
    },
    onError: () => toast.error('Failed to add lead'),
  })
}

export function useUpdateCmLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateLeadPayload) => {
      const { error } = await db.from('cm_leads').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_leads'] }),
    onError: () => toast.error('Failed to update lead'),
  })
}

export function useDeleteCmLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('cm_leads').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_leads'] })
      toast.success('Lead deleted')
    },
    onError: () => toast.error('Failed to delete lead'),
  })
}

// ─── Campaigns ───────────────────────────────────────────────────────────────

export type CmCampaign = {
  id: number
  created_at: string
  updated_at: string
  name: string
  subject: string | null
  niche_id: number | null
  content: string | null
  attachment: string | null
  status: string
  replied_count: number
}

export type CmCampaignContact = {
  id: number
  created_at: string
  campaign_id: number
  email: string | null
  company_name: string | null
  contact_name: string | null
  niche_id: number | null
}

type UpdateCampaignPayload = { id: number } & Partial<Omit<CmCampaign, 'id' | 'created_at' | 'updated_at'>>

export function useCmCampaigns() {
  return useQuery({
    queryKey: ['cm_campaigns'],
    queryFn: async () => {
      const { data, error } = await db
        .from('cm_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CmCampaign[]
    },
  })
}

export function useAddCmCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (campaign: Omit<CmCampaign, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await db.from('cm_campaigns').insert(campaign).select('id').single()
      if (error) throw error
      return data.id as number
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_campaigns'] })
      toast.success('Campaign created')
    },
    onError: () => toast.error('Failed to create campaign'),
  })
}

export function useUpdateCmCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCampaignPayload) => {
      const { error } = await db.from('cm_campaigns').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_campaigns'] }),
    onError: () => toast.error('Failed to update campaign'),
  })
}

export function useDeleteCmCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('cm_campaigns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_campaigns'] })
      toast.success('Campaign deleted')
    },
    onError: () => toast.error('Failed to delete campaign'),
  })
}

export function useCmAllCampaignContactsCount() {
  return useQuery({
    queryKey: ['cm_campaign_contacts_count'],
    queryFn: async () => {
      const { count, error } = await db
        .from('cm_campaign_contacts')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return count ?? 0
    },
  })
}

export function useCmCampaignContacts(campaignId: number | null) {
  return useQuery({
    queryKey: ['cm_campaign_contacts', campaignId],
    queryFn: async () => {
      const { data, error } = await db
        .from('cm_campaign_contacts')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as CmCampaignContact[]
    },
    enabled: campaignId != null,
  })
}

export function useAddCmCampaignContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contact: Omit<CmCampaignContact, 'id' | 'created_at'>) => {
      const { error } = await db.from('cm_campaign_contacts').insert(contact)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cm_campaign_contacts', vars.campaign_id] })
      toast.success('Contact added')
    },
    onError: () => toast.error('Failed to add contact'),
  })
}

export function useDeleteCmCampaignContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { id: number; campaign_id: number }) => {
      const { error } = await db.from('cm_campaign_contacts').delete().eq('id', vars.id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cm_campaign_contacts', vars.campaign_id] })
      toast.success('Contact removed')
    },
    onError: () => toast.error('Failed to remove contact'),
  })
}

// ─── Call Scripts ─────────────────────────────────────────────────────────────

export type CmCallScript = {
  id: number
  created_at: string
  updated_at: string
  headline: string
  content: string | null
}

type UpdateScriptPayload = { id: number } & Partial<Omit<CmCallScript, 'id' | 'created_at' | 'updated_at'>>

export function useCmCallScripts() {
  return useQuery({
    queryKey: ['cm_call_scripts'],
    queryFn: async () => {
      const { data, error } = await db
        .from('cm_call_scripts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CmCallScript[]
    },
  })
}

export function useAddCmCallScript() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await db
        .from('cm_call_scripts')
        .insert({ headline: 'Untitled', content: '' })
        .select('id')
        .single()
      if (error) throw error
      return data.id as number
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_call_scripts'] }),
    onError: () => toast.error('Failed to create script'),
  })
}

export function useUpdateCmCallScript() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateScriptPayload) => {
      const { error } = await db.from('cm_call_scripts').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_call_scripts'] }),
    onError: () => toast.error('Failed to save script'),
  })
}

export function useDeleteCmCallScript() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('cm_call_scripts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_call_scripts'] })
      toast.success('Script deleted')
    },
    onError: () => toast.error('Failed to delete script'),
  })
}

// ─── General Notes ────────────────────────────────────────────────────────────

export type CmGeneralNote = {
  id: number
  created_at: string
  updated_at: string
  headline: string
  content: string | null
}

type UpdateGeneralNotePayload = { id: number } & Partial<Omit<CmGeneralNote, 'id' | 'created_at' | 'updated_at'>>

export function useCmGeneralNotes() {
  return useQuery({
    queryKey: ['cm_general_notes'],
    queryFn: async () => {
      const { data, error } = await db
        .from('cm_general_notes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CmGeneralNote[]
    },
  })
}

export function useAddCmGeneralNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await db
        .from('cm_general_notes')
        .insert({ headline: 'Untitled', content: '' })
        .select('id')
        .single()
      if (error) throw error
      return data.id as number
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_general_notes'] }),
    onError: () => toast.error('Failed to create note'),
  })
}

export function useUpdateCmGeneralNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateGeneralNotePayload) => {
      const { error } = await db.from('cm_general_notes').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_general_notes'] }),
    onError: () => toast.error('Failed to save note'),
  })
}

export function useDeleteCmGeneralNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('cm_general_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_general_notes'] })
      toast.success('Note deleted')
    },
    onError: () => toast.error('Failed to delete note'),
  })
}

// ─── Legacy cm_emails (kept for DB compat, not used in UI) ───────────────────

export function useCmEmails() {
  return useQuery({
    queryKey: ['cm_emails'],
    queryFn: async () => {
      const { data, error } = await db
        .from('cm_emails')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CmEmail[]
    },
  })
}

export function useAddCmEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (email: Omit<CmEmail, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await db.from('cm_emails').insert(email)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_emails'] })
      toast.success('Email saved')
    },
    onError: () => toast.error('Failed to save email'),
  })
}

export function useUpdateCmEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateEmailPayload) => {
      const { error } = await db.from('cm_emails').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cm_emails'] }),
    onError: () => toast.error('Failed to update email'),
  })
}

export function useDeleteCmEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.from('cm_emails').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cm_emails'] })
      toast.success('Email deleted')
    },
    onError: () => toast.error('Failed to delete email'),
  })
}
