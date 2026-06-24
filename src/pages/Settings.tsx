import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDebounce } from '../hooks/useDebounce'
import type { Database } from '../types/database'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

type SettingsRow = Database['public']['Tables']['settings']['Row']
type Workspace = Database['public']['Tables']['workspaces']['Row']

type CSWorkspace = {
  id: number
  name: string
  icon: string | null
  slug: string
  is_active: boolean
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

function useFetchSettings() {
  return useQuery<SettingsRow | null>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*').limit(1).single()
      if (error && error.code !== 'PGRST116') throw error
      return data ?? null
    },
    staleTime: 30_000,
  })
}

function useUpsertSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Database['public']['Tables']['settings']['Update']) => {
      const { error } = await supabase
        .from('settings')
        .upsert({ ...patch, id: SETTINGS_ID, updated_at: new Date().toISOString() })
      if (error) throw error
    },
    onError: () => toast.error('Failed to save settings'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

function useWorkspacesPriority() {
  return useQuery<Workspace[]>({
    queryKey: ['workspaces_priority'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, icon, priority, color, type, parent_id, sort_order, description, created_at, updated_at')
        .is('parent_id', null)
        .order('priority', { ascending: false })
      if (error) throw error
      return (data ?? []) as Workspace[]
    },
    staleTime: 30_000,
  })
}

// ─── Save indicator ────────────────────────────────────────────────────────────

function useSaveStatus(isSaving: boolean) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isSaving) {
      setStatus('saving')
      if (timerRef.current) clearTimeout(timerRef.current)
    } else if (status === 'saving') {
      setStatus('saved')
      timerRef.current = setTimeout(() => setStatus('idle'), 2000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [isSaving])

  return status
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-card border border-border p-6 space-y-4">
      <div>
        <h2 className="font-display font-semibold text-text-dark text-base">{title}</h2>
        {description && <p className="text-text-light text-sm mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

// ─── Section 1: Workspace Priorities ──────────────────────────────────────────

function WorkspacePrioritiesSection() {
  const { data: workspaces = [], isLoading } = useWorkspacesPriority()
  const qc = useQueryClient()
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, number>>({})

  const priorityCounts: Record<number, number> = {}
  for (const ws of workspaces) {
    const p = pendingUpdates[ws.id] ?? (ws.priority ?? 0)
    priorityCounts[p] = (priorityCounts[p] ?? 0) + 1
  }

  async function handleBlur(id: string, value: number) {
    const { error } = await supabase.from('workspaces').update({ priority: value }).eq('id', id)
    if (error) {
      toast.error('Failed to update priority')
    } else {
      toast.success('Priority updated')
      qc.invalidateQueries({ queryKey: ['workspaces_priority'] })
    }
    setPendingUpdates(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  if (isLoading) return <p className="text-text-light text-sm">Loading…</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-text-light font-normal pb-2 pr-4">Workspace</th>
            <th className="text-left text-text-light font-normal pb-2 w-28">Priority (0–10)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {workspaces.map(ws => {
            const currentPriority = pendingUpdates[ws.id] ?? (ws.priority ?? 0)
            const isZero = currentPriority === 0
            const isEqual = priorityCounts[currentPriority] > 1 && currentPriority > 0
            return (
              <tr key={ws.id} className={isZero ? 'opacity-50' : ''}>
                <td className="py-2.5 pr-4 flex items-center gap-2">
                  <span className="text-base leading-none">{ws.icon ?? '📁'}</span>
                  <span className={`text-text-dark ${isZero ? 'line-through text-text-light' : ''}`}>
                    {ws.name}
                  </span>
                  {isEqual && (
                    <span className="text-text-light text-xs">(equal)</span>
                  )}
                </td>
                <td className="py-2.5">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={currentPriority}
                    onChange={e => setPendingUpdates(prev => ({ ...prev, [ws.id]: Number(e.target.value) }))}
                    onBlur={e => handleBlur(ws.id, Math.min(10, Math.max(0, Number(e.target.value))))}
                    className="w-20 bg-bg border border-border rounded-lg px-2 py-1 text-sm text-text-dark text-center focus:outline-none focus:border-rose"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Auto-save textarea/input sections ────────────────────────────────────────

function TextareaField({
  value,
  onChange,
  rows,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  rows: number
  placeholder: string
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text-dark placeholder:text-text-light font-sans resize-none focus:outline-none focus:border-rose"
    />
  )
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-text-light text-xs">{label}</label>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-dark focus:outline-none focus:border-rose"
      />
    </div>
  )
}

function NumberInput({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-text-light text-xs">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-24 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-dark focus:outline-none focus:border-rose"
        />
        {unit && <span className="text-text-light text-xs">{unit}</span>}
      </div>
    </div>
  )
}

// ─── Section: Delete Core Subject Workspace ───────────────────────────────────

function DeleteCoreSubjectSection() {
  const qc = useQueryClient()
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const { data: workspaces = [], isLoading } = useQuery<CSWorkspace[]>({
    queryKey: ['cs_workspaces_manage'],
    queryFn: async () => {
      const { data, error } = await db
        .from('workspaces')
        .select('id, name, icon, slug, is_active')
        .eq('category', 'core_subject')
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
  })

  const { mutate: softDelete, isPending } = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db
        .from('workspaces')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Workspace deleted')
      setConfirmId(null)
      qc.invalidateQueries({ queryKey: ['cs_workspaces_manage'] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: () => toast.error('Failed to delete workspace'),
  })

  const { mutate: restore } = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db
        .from('workspaces')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Workspace restored')
      qc.invalidateQueries({ queryKey: ['cs_workspaces_manage'] })
      qc.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: () => toast.error('Failed to restore workspace'),
  })

  if (isLoading) return <p className="text-text-light text-sm">Loading…</p>
  if (workspaces.length === 0) return <p className="text-text-light text-sm">No core subject workspaces found.</p>

  return (
    <div className="space-y-2">
      {workspaces.map(ws => (
        <div
          key={ws.id}
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${ws.is_active ? 'border-border bg-bg' : 'border-border bg-bg opacity-50'}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{ws.icon ?? '📁'}</span>
            <span className={`text-sm text-text-dark ${!ws.is_active ? 'line-through text-text-light' : ''}`}>
              {ws.name}
            </span>
            {!ws.is_active && (
              <span className="text-xs text-text-light bg-border px-1.5 py-0.5 rounded">deleted</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!ws.is_active ? (
              <button
                onClick={() => restore(ws.id)}
                className="text-xs text-rose hover:underline"
              >
                Restore
              </button>
            ) : confirmId === ws.id ? (
              <>
                <span className="text-xs text-text-light">Sure?</span>
                <button
                  onClick={() => softDelete(ws.id)}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:underline font-medium"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs text-text-light hover:underline"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmId(ws.id)}
                className="text-text-light hover:text-red-500 transition-colors"
                title="Delete workspace"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
      <p className="text-text-light text-xs pt-1">Soft delete — workspace hidden from sidebar, data preserved. Restore anytime.</p>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Settings() {
  const { data: settings } = useFetchSettings()
  const { mutate: upsert, isPending } = useUpsertSettings()
  const saveStatus = useSaveStatus(isPending)

  const [schedulingRules, setSchedulingRules] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [workingStart, setWorkingStart] = useState('')
  const [workingEnd, setWorkingEnd] = useState('')
  const [peakStart, setPeakStart] = useState('')
  const [peakEnd, setPeakEnd] = useState('')
  const [breakDuration, setBreakDuration] = useState('')
  const [breakFrequency, setBreakFrequency] = useState('')
  const [todayOverrides, setTodayOverrides] = useState('')

  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!settings || hydrated) return
    setSchedulingRules(settings.scheduling_rules ?? '')
    setCustomPrompt(settings.custom_prompt ?? '')
    setWorkingStart(settings.working_hours_start ?? '')
    setWorkingEnd(settings.working_hours_end ?? '')
    setPeakStart(settings.peak_energy_start ?? '')
    setPeakEnd(settings.peak_energy_end ?? '')
    setBreakDuration(settings.break_duration_mins != null ? String(settings.break_duration_mins) : '')
    setBreakFrequency(settings.break_frequency_mins != null ? String(settings.break_frequency_mins) : '')
    setTodayOverrides(settings.today_special_overrides ?? '')
    setHydrated(true)
  }, [settings])

  const dSchedulingRules = useDebounce(schedulingRules, 500)
  const dCustomPrompt = useDebounce(customPrompt, 500)
  const dWorkingStart = useDebounce(workingStart, 500)
  const dWorkingEnd = useDebounce(workingEnd, 500)
  const dPeakStart = useDebounce(peakStart, 500)
  const dPeakEnd = useDebounce(peakEnd, 500)
  const dBreakDuration = useDebounce(breakDuration, 500)
  const dBreakFrequency = useDebounce(breakFrequency, 500)
  const dTodayOverrides = useDebounce(todayOverrides, 500)

  useEffect(() => {
    if (!hydrated) return
    upsert({ scheduling_rules: dSchedulingRules || null })
  }, [dSchedulingRules])

  useEffect(() => {
    if (!hydrated) return
    upsert({ custom_prompt: dCustomPrompt || null })
  }, [dCustomPrompt])

  useEffect(() => {
    if (!hydrated) return
    upsert({ working_hours_start: dWorkingStart || null, working_hours_end: dWorkingEnd || null })
  }, [dWorkingStart, dWorkingEnd])

  useEffect(() => {
    if (!hydrated) return
    upsert({ peak_energy_start: dPeakStart || null, peak_energy_end: dPeakEnd || null })
  }, [dPeakStart, dPeakEnd])

  useEffect(() => {
    if (!hydrated) return
    const dur = dBreakDuration !== '' ? Number(dBreakDuration) : null
    const freq = dBreakFrequency !== '' ? Number(dBreakFrequency) : null
    upsert({ break_duration_mins: dur, break_frequency_mins: freq })
  }, [dBreakDuration, dBreakFrequency])

  useEffect(() => {
    if (!hydrated) return
    upsert({ today_special_overrides: dTodayOverrides || null })
  }, [dTodayOverrides])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-text-dark text-2xl">Settings</h1>
        <span className="text-text-light text-xs font-sans">
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved ✓'}
        </span>
      </div>

      <Section
        title="Workspace Scheduling Priorities"
        description="0 = never schedule. Same number = equal priority. Higher = scheduled first."
      >
        <WorkspacePrioritiesSection />
      </Section>

      <Section
        title="Scheduling Rules"
        description="Plain English. One rule per line. AI reads these every morning."
      >
        <TextareaField
          value={schedulingRules}
          onChange={setSchedulingRules}
          rows={8}
          placeholder={`Don't schedule DSA before 9am\nAlways schedule gym before 8pm\nLeave 30 min buffer between deep work blocks\nNever schedule more than 3 hours of DSA in one day`}
        />
      </Section>

      <Section
        title="Custom AI Prompt"
        description="AI includes this on every scheduling run. Use for personal preferences."
      >
        <TextareaField
          value={customPrompt}
          onChange={setCustomPrompt}
          rows={4}
          placeholder="I'm preparing for placements. Prioritize DSA and System Design. Keep evening free for Chubs Media."
        />
      </Section>

      <Section title="Working Hours">
        <div className="flex gap-6">
          <TimeInput label="Start Time" value={workingStart} onChange={setWorkingStart} />
          <TimeInput label="End Time" value={workingEnd} onChange={setWorkingEnd} />
        </div>
      </Section>

      <Section
        title="Peak Energy Hours"
        description="Deep work sessions scheduled in this window."
      >
        <div className="flex gap-6">
          <TimeInput label="Peak Start" value={peakStart} onChange={setPeakStart} />
          <TimeInput label="Peak End" value={peakEnd} onChange={setPeakEnd} />
        </div>
      </Section>

      <Section title="Break Preferences">
        <div className="flex gap-6">
          <NumberInput label="Break Duration" value={breakDuration} onChange={setBreakDuration} unit="mins" />
          <NumberInput label="Every X mins" value={breakFrequency} onChange={setBreakFrequency} unit="mins of work" />
        </div>
      </Section>

      <Section
        title="Today's Special Overrides"
        description="One-time instructions for today's schedule only. Cleared daily."
      >
        <TextareaField
          value={todayOverrides}
          onChange={setTodayOverrides}
          rows={3}
          placeholder="Only 2 hours available today. Doctor at 3pm. Skip gym."
        />
        <p className="text-text-light text-xs">These will be cleared automatically tomorrow.</p>
      </Section>

      <Section
        title="Delete Core Subject Workspace"
        description="Soft delete hides the workspace from the sidebar. All data preserved."
      >
        <DeleteCoreSubjectSection />
      </Section>
    </div>
  )
}
