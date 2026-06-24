import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Command, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from 'cmdk'
import {
  LayoutDashboard, CheckSquare, CalendarDays, Inbox, BarChart2,
  FolderOpen, Plus, Zap, Lightbulb, StickyNote, BookOpen,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useUIStore } from '../../stores/uiStore'
import { useAllWorkspaces, nameToSlug } from '../../hooks/useWorkspace'
import { useAddTask } from '../../hooks/useTasks'
import { useAddQuickCapture } from '../../hooks/useQuickCapture'
import { supabase } from '../../lib/supabase'

type ActiveModal = null | 'add_task' | 'quick_capture'
type QCType = 'sudden_task' | 'idea'

function matches(text: string, q: string) {
  return !q || text.toLowerCase().includes(q.toLowerCase())
}

// ─── Add Task Panel ───────────────────────────────────────────────────────────

function AddTaskPanel({
  workspaces,
  onClose,
}: {
  workspaces: { id: string; name: string }[]
  onClose: () => void
}) {
  const addTask = useAddTask()
  const [form, setForm] = useState({
    title: '',
    workspace_id: '',
    priority: 'medium',
    status: 'not_started',
    due_date: '',
    effort: '',
  })

  function set(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    addTask.mutate({
      title: form.title.trim(),
      workspace_id: form.workspace_id || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      effort: form.effort || null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card rounded-card border border-border shadow-xl w-full max-w-md p-6">
        <h2 className="font-display text-xl font-semibold text-text-dark mb-5">Add New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-text-mid block mb-1">Title *</label>
            <input
              autoFocus
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
              placeholder="Task title..."
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-mid block mb-1">Workspace</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-white"
                value={form.workspace_id}
                onChange={e => set('workspace_id', e.target.value)}
              >
                <option value="">None</option>
                {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-mid block mb-1">Priority</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-white"
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-mid block mb-1">Status</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-white"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-mid block mb-1">Effort</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose bg-white"
                value={form.effort}
                onChange={e => set('effort', e.target.value)}
              >
                <option value="">None</option>
                <option value="quick">Quick</option>
                <option value="medium">Medium</option>
                <option value="deep">Deep</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-mid block mb-1">Due Date</label>
            <input
              type="date"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-rose text-white rounded-lg py-2 text-sm font-medium hover:bg-rose/90 transition-colors"
            >
              Add Task
            </button>
            <button
              type="button"
              className="px-4 border border-border rounded-lg py-2 text-sm text-text-mid hover:bg-rose-bg transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Quick Capture Panel ──────────────────────────────────────────────────────

function QuickCapturePanel({ type, onClose }: { type: QCType; onClose: () => void }) {
  const addCapture = useAddQuickCapture()
  const [content, setContent] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    addCapture.mutate({
      type,
      content: content.trim(),
      title: null,
      category: null,
      url: null,
      tags: null,
      due_date: null,
      due_time: null,
      is_hard_block: null,
      is_sorted: null,
      person_involved: null,
      workspace_id: null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-card rounded-card border border-border shadow-xl w-full max-w-md p-6">
        <h2 className="font-display text-xl font-semibold text-text-dark mb-5">
          {type === 'idea' ? 'New Idea' : 'Quick Capture'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-text-mid block mb-1">Content *</label>
            <input
              autoFocus
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-rose"
              placeholder={type === 'idea' ? "What's the idea?" : 'What needs to be done?'}
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-rose text-white rounded-lg py-2 text-sm font-medium hover:bg-rose/90 transition-colors"
            >
              Capture
            </button>
            <button
              type="button"
              className="px-4 border border-border rounded-lg py-2 text-sm text-text-mid hover:bg-rose-bg transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Command Palette ──────────────────────────────────────────────────────────

const ITEM_CLS =
  'px-4 py-2.5 text-sm text-text-dark data-[selected=true]:bg-rose-bg cursor-pointer flex items-center gap-3 rounded-lg mx-1'
const HEADING_CLS = 'px-4 pt-3 pb-1 text-text-light text-xs uppercase tracking-wide font-sans'

export default function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette } = useUIStore()
  const navigate = useNavigate()
  const { data: workspaces = [] } = useAllWorkspaces()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [qcType, setQcType] = useState<QCType>('sudden_task')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setQuery('')
      setDebouncedQuery('')
    }
  }, [isCommandPaletteOpen])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && isCommandPaletteOpen) closeCommandPalette()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isCommandPaletteOpen, closeCommandPalette])

  const { data: taskResults = [] } = useQuery({
    queryKey: ['cmd_tasks', debouncedQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, title, workspace_id')
        .ilike('title', `%${debouncedQuery}%`)
        .limit(5)
      return (data ?? []) as { id: string; title: string; workspace_id: string | null }[]
    },
    enabled: debouncedQuery.length > 1,
    staleTime: 10_000,
  })

  const { data: topicResults = [] } = useQuery({
    queryKey: ['cmd_topics', debouncedQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('topics')
        .select('id, name, workspace_id')
        .ilike('name', `%${debouncedQuery}%`)
        .limit(3)
      return (data ?? []) as { id: string; name: string; workspace_id: string | null }[]
    },
    enabled: debouncedQuery.length > 1,
    staleTime: 10_000,
  })

  function go(path: string) {
    navigate(path)
    closeCommandPalette()
  }

  function openAddTask() {
    closeCommandPalette()
    setActiveModal('add_task')
  }

  function openQuickCapture(type: QCType) {
    setQcType(type)
    closeCommandPalette()
    setActiveModal('quick_capture')
  }

  function handleNewNote() {
    const match = window.location.pathname.match(/^\/w\/(.+)/)
    const target = match
      ? window.location.pathname
      : workspaces[0]
        ? `/w/${nameToSlug(workspaces[0].name)}`
        : '/inbox'
    go(target)
  }

  function wsSlugFor(workspaceId: string | null) {
    if (!workspaceId) return null
    const ws = workspaces.find(w => w.id === workspaceId)
    return ws ? nameToSlug(ws.name) : null
  }

  const NAV_ITEMS = [
    { label: 'Go to Dashboard', icon: <LayoutDashboard size={15} />, path: '/' },
    { label: 'Go to Tasks', icon: <CheckSquare size={15} />, path: '/tasks' },
    { label: 'Go to Daily Planner', icon: <CalendarDays size={15} />, path: '/planner' },
    { label: 'Go to Quick Capture', icon: <Inbox size={15} />, path: '/inbox' },
    { label: 'Go to Consistency Calendar', icon: <CalendarDays size={15} />, path: '/calendar' },
    { label: 'Go to Analytics', icon: <BarChart2 size={15} />, path: '/analytics' },
  ]

  const QUICK_ADD = [
    { label: 'New Task', keywords: 'add task create', icon: <Plus size={15} />, onSelect: openAddTask },
    { label: 'Quick Capture', keywords: 'capture sudden task', icon: <Zap size={15} />, onSelect: () => openQuickCapture('sudden_task') },
    { label: 'New Idea', keywords: 'idea brainstorm', icon: <Lightbulb size={15} />, onSelect: () => openQuickCapture('idea') },
    { label: 'New Note', keywords: 'note write block', icon: <StickyNote size={15} />, onSelect: handleNewNote },
  ]

  const filteredNav = NAV_ITEMS.filter(item => matches(item.label, query))
  const filteredWs = workspaces.filter(ws => matches(`Go to ${ws.name}`, query))
  const filteredQuickAdd = QUICK_ADD.filter(item => matches(item.label, query) || matches(item.keywords, query))

  const hasNavItems = filteredNav.length > 0 || filteredWs.length > 0
  const hasQuickAdd = filteredQuickAdd.length > 0
  const hasSearchResults = debouncedQuery.length > 1 && (taskResults.length > 0 || topicResults.length > 0)
  const isEmpty = !hasNavItems && !hasQuickAdd && !hasSearchResults

  if (!isCommandPaletteOpen && activeModal === null) return null

  return (
    <>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeCommandPalette}
          />
          <div className="relative w-full max-w-xl bg-card rounded-card border border-border shadow-xl overflow-hidden">
            <Command shouldFilter={false} loop>
              <div className="border-b border-border flex items-center">
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search or type a command..."
                  className="outline-none px-4 py-3 text-sm flex-1 bg-transparent font-sans text-text-dark placeholder:text-text-light"
                />
              </div>
              <CommandList className="max-h-[400px] overflow-y-auto py-2">
                {isEmpty && (
                  <CommandEmpty className="px-4 py-8 text-center text-text-light text-sm font-sans">
                    No results found.
                  </CommandEmpty>
                )}

                {hasNavItems && (
                  <CommandGroup>
                    <p className={HEADING_CLS}>Navigation</p>
                    {filteredNav.map(item => (
                      <CommandItem
                        key={item.path}
                        value={item.label}
                        onSelect={() => go(item.path)}
                        className={ITEM_CLS}
                      >
                        <span className="text-text-mid shrink-0">{item.icon}</span>
                        {item.label}
                        <span className="ml-auto text-text-light text-xs">↵ open</span>
                      </CommandItem>
                    ))}
                    {filteredWs.map(ws => (
                      <CommandItem
                        key={ws.id}
                        value={`Go to ${ws.name}`}
                        onSelect={() => go(`/w/${nameToSlug(ws.name)}`)}
                        className={ITEM_CLS}
                      >
                        <FolderOpen size={15} className="text-text-mid shrink-0" />
                        Go to {ws.name}
                        <span className="ml-auto text-text-light text-xs">↵ open</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {hasNavItems && hasQuickAdd && (
                  <CommandSeparator className="my-1 border-b border-border/50" />
                )}

                {hasQuickAdd && (
                  <CommandGroup>
                    <p className={HEADING_CLS}>Quick Add</p>
                    {filteredQuickAdd.map(item => (
                      <CommandItem
                        key={item.label}
                        value={item.label}
                        onSelect={item.onSelect}
                        className={ITEM_CLS}
                      >
                        <span className="text-text-mid shrink-0">{item.icon}</span>
                        {item.label}
                        <span className="ml-auto text-text-light text-xs">↵ open</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {hasSearchResults && (
                  <>
                    {(hasNavItems || hasQuickAdd) && (
                      <CommandSeparator className="my-1 border-b border-border/50" />
                    )}
                    <CommandGroup>
                      <p className={HEADING_CLS}>Search Results</p>
                      {taskResults.map(t => (
                        <CommandItem
                          key={`task_${t.id}`}
                          value={`task ${t.title}`}
                          onSelect={() => go('/tasks')}
                          className={ITEM_CLS}
                        >
                          <CheckSquare size={15} className="text-text-mid shrink-0" />
                          <span className="flex-1 truncate">{t.title}</span>
                          <span className="text-text-light text-xs px-1.5 py-0.5 bg-rose-bg rounded">task</span>
                          <span className="text-text-light text-xs">↵ open</span>
                        </CommandItem>
                      ))}
                      {topicResults.map(t => {
                        const slug = wsSlugFor(t.workspace_id)
                        return (
                          <CommandItem
                            key={`topic_${t.id}`}
                            value={`topic ${t.name}`}
                            onSelect={() => { if (slug) go(`/w/${slug}`) }}
                            className={ITEM_CLS}
                          >
                            <BookOpen size={15} className="text-text-mid shrink-0" />
                            <span className="flex-1 truncate">{t.name}</span>
                            <span className="text-text-light text-xs px-1.5 py-0.5 bg-sage/20 rounded">topic</span>
                            <span className="text-text-light text-xs">↵ open</span>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </div>
        </div>
      )}

      {activeModal === 'add_task' && (
        <AddTaskPanel workspaces={workspaces} onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'quick_capture' && (
        <QuickCapturePanel type={qcType} onClose={() => setActiveModal(null)} />
      )}
    </>
  )
}
