import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Lead = {
  id: string
  name: string
  company: string | null
  mobile: string | null
  whatsapp: string | null
  status: string | null
  last_contact: string | null
  next_follow_up: string | null
  source: string | null
  best_time_to_call: string | null
  response: string | null
  notes: string | null
  niche: string | null
  email: string | null
  tags: string[] | null
  response_rate: number | null
  whatsapp_template_used: string | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type Client = {
  id: string
  name: string
  niche: string | null
  project_type: string | null
  deliverables: string | null
  deadline: string | null
  amount_inr: number | null
  invoice_status: string | null
  progress_percent: number | null
  start_date: string | null
  notes: string | null
  satisfaction_notes: string | null
  upsell_opportunities: string | null
  login_credentials: string | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type ContentItem = {
  id: string
  content_idea: string
  platform: string | null
  type: string | null
  status: string | null
  scheduled_date: string | null
  performance_notes: string | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type AdTracker = {
  id: string
  campaign: string
  platform: string | null
  budget: number | null
  status: string | null
  results: string | null
  roi: string | null
  notes: string | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type OutreachTemplate = {
  id: string
  name: string
  platform: string | null
  use_case: string | null
  success_rate: string | null
  template_text: string | null
  notes: string | null
  workspace_id: string | null
  created_at: string | null
}

export type SaasProduct = {
  id: string
  name: string
  stage: string | null
  progress_percent: number | null
  mrr: number | null
  tech_stack: string | null
  github_url: string | null
  landing_page_url: string | null
  target_customer: string | null
  target_launch_date: string | null
  notes: string | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

export type NicheFinding = {
  id: string
  niche: string
  what_works: string | null
  common_objections: string | null
  best_hooks: string | null
  pricing_notes: string | null
  dos_and_donts: string | null
  best_platforms: string | null
  discovery_insights: string | null
  general_notes: string | null
  workspace_id: string | null
  created_at: string | null
  updated_at: string | null
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export function useLeads(workspaceId: string) {
  return useQuery({
    queryKey: ['leads', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Lead[]
    },
  })
}

export function useAddLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>> & { name: string; workspace_id: string },
    ) => {
      const { data, error } = await supabase.from('leads').insert(payload).select().single()
      if (error) throw error
      return data as Lead
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['leads', vars.workspace_id] })
      toast.success('Lead added')
    },
    onError: () => toast.error('Failed to add lead'),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspace_id, ...updates }: Partial<Lead> & { id: string; workspace_id: string }) => {
      const { error } = await supabase.from('leads').update(updates).eq('id', id)
      if (error) throw error
      return { workspace_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['leads', vars.workspace_id] }),
    onError: () => toast.error('Failed to update lead'),
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
      return { workspaceId }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['leads', vars.workspaceId] })
      toast.success('Lead deleted')
    },
    onError: () => toast.error('Failed to delete lead'),
  })
}

// ─── Niche Findings ───────────────────────────────────────────────────────────

export function useNicheFinding(workspaceId: string, niche: string) {
  return useQuery({
    queryKey: ['niche_findings', workspaceId, niche],
    enabled: !!niche,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('niche_findings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('niche', niche)
        .maybeSingle()
      if (error) throw error
      return data as NicheFinding | null
    },
  })
}

export function useUpsertNicheFinding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Partial<NicheFinding> & { niche: string; workspace_id: string },
    ) => {
      const { data: existing } = await supabase
        .from('niche_findings')
        .select('id')
        .eq('workspace_id', payload.workspace_id)
        .eq('niche', payload.niche)
        .maybeSingle()
      if (existing?.id) {
        const { data, error } = await supabase
          .from('niche_findings')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        return data as NicheFinding
      } else {
        const { data, error } = await supabase
          .from('niche_findings')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        return data as NicheFinding
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['niche_findings', vars.workspace_id, vars.niche] })
    },
    onError: () => toast.error('Failed to save findings'),
  })
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export function useClients(workspaceId: string) {
  return useQuery({
    queryKey: ['clients', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Client[]
    },
  })
}

export function useAddClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>> & { name: string; workspace_id: string },
    ) => {
      const { data, error } = await supabase.from('clients').insert(payload).select().single()
      if (error) throw error
      return data as Client
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['clients', vars.workspace_id] })
      toast.success('Client added')
    },
    onError: () => toast.error('Failed to add client'),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspace_id, ...updates }: Partial<Client> & { id: string; workspace_id: string }) => {
      const { error } = await supabase.from('clients').update(updates).eq('id', id)
      if (error) throw error
      return { workspace_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['clients', vars.workspace_id] }),
    onError: () => toast.error('Failed to update client'),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      return { workspaceId }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['clients', vars.workspaceId] })
      toast.success('Client deleted')
    },
    onError: () => toast.error('Failed to delete client'),
  })
}

// ─── Content Calendar ─────────────────────────────────────────────────────────

export function useContentItems(workspaceId: string) {
  return useQuery({
    queryKey: ['content_calendar', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('scheduled_date', { ascending: true, nullsFirst: false })
      if (error) throw error
      return (data ?? []) as ContentItem[]
    },
  })
}

export function useAddContentItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Partial<Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>> & {
        content_idea: string
        workspace_id: string
      },
    ) => {
      const { data, error } = await supabase.from('content_calendar').insert(payload).select().single()
      if (error) throw error
      return data as ContentItem
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['content_calendar', vars.workspace_id] })
      toast.success('Content added')
    },
    onError: () => toast.error('Failed to add content'),
  })
}

export function useUpdateContentItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspace_id, ...updates }: Partial<ContentItem> & { id: string; workspace_id: string }) => {
      const { error } = await supabase.from('content_calendar').update(updates).eq('id', id)
      if (error) throw error
      return { workspace_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['content_calendar', vars.workspace_id] }),
    onError: () => toast.error('Failed to update content'),
  })
}

export function useDeleteContentItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('content_calendar').delete().eq('id', id)
      if (error) throw error
      return { workspaceId }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['content_calendar', vars.workspaceId] })
      toast.success('Content deleted')
    },
    onError: () => toast.error('Failed to delete content'),
  })
}

// ─── Ads Tracker ──────────────────────────────────────────────────────────────

export function useAds(workspaceId: string) {
  return useQuery({
    queryKey: ['ads_tracker', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads_tracker')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as AdTracker[]
    },
  })
}

export function useAddAd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Partial<Omit<AdTracker, 'id' | 'created_at' | 'updated_at'>> & {
        campaign: string
        workspace_id: string
      },
    ) => {
      const { data, error } = await supabase.from('ads_tracker').insert(payload).select().single()
      if (error) throw error
      return data as AdTracker
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['ads_tracker', vars.workspace_id] })
      toast.success('Ad campaign added')
    },
    onError: () => toast.error('Failed to add campaign'),
  })
}

export function useUpdateAd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspace_id, ...updates }: Partial<AdTracker> & { id: string; workspace_id: string }) => {
      const { error } = await supabase.from('ads_tracker').update(updates).eq('id', id)
      if (error) throw error
      return { workspace_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['ads_tracker', vars.workspace_id] }),
    onError: () => toast.error('Failed to update campaign'),
  })
}

export function useDeleteAd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('ads_tracker').delete().eq('id', id)
      if (error) throw error
      return { workspaceId }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['ads_tracker', vars.workspaceId] })
      toast.success('Campaign deleted')
    },
    onError: () => toast.error('Failed to delete campaign'),
  })
}

// ─── Outreach Templates ───────────────────────────────────────────────────────

export function useTemplates(workspaceId: string) {
  return useQuery({
    queryKey: ['outreach_templates', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outreach_templates')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as OutreachTemplate[]
    },
  })
}

export function useAddTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Partial<Omit<OutreachTemplate, 'id' | 'created_at'>> & { name: string; workspace_id: string },
    ) => {
      const { data, error } = await supabase.from('outreach_templates').insert(payload).select().single()
      if (error) throw error
      return data as OutreachTemplate
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['outreach_templates', vars.workspace_id] })
      toast.success('Template added')
    },
    onError: () => toast.error('Failed to add template'),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      workspace_id,
      ...updates
    }: Partial<OutreachTemplate> & { id: string; workspace_id: string }) => {
      const { error } = await supabase.from('outreach_templates').update(updates).eq('id', id)
      if (error) throw error
      return { workspace_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['outreach_templates', vars.workspace_id] }),
    onError: () => toast.error('Failed to update template'),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('outreach_templates').delete().eq('id', id)
      if (error) throw error
      return { workspaceId }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['outreach_templates', vars.workspaceId] })
      toast.success('Template deleted')
    },
    onError: () => toast.error('Failed to delete template'),
  })
}

// ─── SaaS Products ────────────────────────────────────────────────────────────

export function useSaasProducts(workspaceId: string) {
  return useQuery({
    queryKey: ['saas_products', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saas_products')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as SaasProduct[]
    },
  })
}

export function useAddSaasProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      payload: Partial<Omit<SaasProduct, 'id' | 'created_at' | 'updated_at'>> & {
        name: string
        workspace_id: string
      },
    ) => {
      const { data, error } = await supabase.from('saas_products').insert(payload).select().single()
      if (error) throw error
      return data as SaasProduct
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['saas_products', vars.workspace_id] })
      toast.success('Product added')
    },
    onError: () => toast.error('Failed to add product'),
  })
}

export function useUpdateSaasProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      workspace_id,
      ...updates
    }: Partial<SaasProduct> & { id: string; workspace_id: string }) => {
      const { error } = await supabase.from('saas_products').update(updates).eq('id', id)
      if (error) throw error
      return { workspace_id }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['saas_products', vars.workspace_id] }),
    onError: () => toast.error('Failed to update product'),
  })
}

export function useDeleteSaasProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase.from('saas_products').delete().eq('id', id)
      if (error) throw error
      return { workspaceId }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['saas_products', vars.workspaceId] })
      toast.success('Product deleted')
    },
    onError: () => toast.error('Failed to delete product'),
  })
}
