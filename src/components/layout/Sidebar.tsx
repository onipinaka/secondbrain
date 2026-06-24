import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Brain, Settings, ChevronLeft, ChevronRight, Plus, X,
  LayoutDashboard, CalendarDays, CheckSquare, Zap, CalendarCheck, BarChart3,
  Code2, Monitor, Database, Network, FileCode, BookOpen,
  Rocket, Compass, GitBranch,
  Dumbbell, FolderOpen,
  Heart,
  type LucideIcon,
} from 'lucide-react'
import { useAllWorkspaces, useEnsureWorkspace, nameToSlug } from '../../hooks/useWorkspace'
import { useEnsureCsSubject } from '../../hooks/useCoreSubject'

type NavItem = { icon: LucideIcon; label: string; to: string }
type NavGroup = { label?: string; items: NavItem[] }
type Props = { collapsed: boolean; onToggle: () => void }

const CS_SLUG_ICONS: Record<string, LucideIcon> = {
  dsa: Code2,
  os: Monitor,
  dbms: Database,
  cn: Network,
  java: FileCode,
}

// workspaces that look like core_subject in DB but aren't CS subjects
const NON_CS_SLUGS = new Set([
  'gym', 'japanese', 'system_design', 'cp', 'proj',
  'opportunities', 'open_source', 'personal', 'reading',
  'learning_lab', 'chubs_media',
])

const topGroup: NavGroup = {
  items: [
    { icon: LayoutDashboard, label: 'Home Dashboard',       to: '/' },
    { icon: CalendarDays,    label: 'Daily Planner',        to: '/planner' },
    { icon: CheckSquare,     label: 'Master Tasks',         to: '/tasks' },
    { icon: Zap,             label: 'Quick Capture',        to: '/inbox' },
    { icon: CalendarCheck,   label: 'Consistency Calendar', to: '/calendar' },
    { icon: BarChart3,       label: 'Master Analytics',     to: '/analytics' },
  ],
}

const staticGroups: NavGroup[] = [
  {
    label: 'BUSINESS & CAREER',
    items: [
      { icon: Rocket,    label: 'Chubs Media',   to: '/chubs' },
      { icon: Compass,   label: 'Opportunities', to: '/w/opportunities' },
      { icon: GitBranch, label: 'Open Source',   to: '/w/open-source' },
    ],
  },
  {
    label: 'PERSONAL GROWTH',
    items: [
      { icon: Dumbbell,   label: 'Gym',      to: '/w/gym' },
      { icon: FolderOpen, label: 'Projects', to: '/w/proj' },
    ],
  },
  {
    label: 'LIFE & KNOWLEDGE',
    items: [
      { icon: Heart, label: 'Personal', to: '/w/personal' },
    ],
  },
]

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center w-full transition-colors ${
          collapsed
            ? `justify-center px-2 py-2 rounded-lg ${isActive ? 'bg-sidebar-active text-rose' : 'text-rose/90 hover:bg-rose-bg hover:text-rose'}`
            : `gap-2.5 px-3 py-[7px] text-sm ${isActive ? 'bg-sidebar-active text-rose font-medium border-l-2 border-rose rounded-lg rounded-l-none' : 'text-rose/90 rounded-lg hover:bg-rose-bg hover:text-rose'}`
        }`
      }
    >
      <Icon size={15} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, onToggle }: Props) {
  const navigate = useNavigate()
  const { data: allWorkspaces = [] } = useAllWorkspaces()
  const ensureWorkspace = useEnsureWorkspace()
  const ensureCsSubject = useEnsureCsSubject()

  const [showAddCS, setShowAddCS] = useState(false)
  const [newCSName, setNewCSName] = useState('')
  const addInputRef = useRef<HTMLInputElement>(null)

  const coreSubjects = allWorkspaces.filter(
    w => w.category === 'core_subject' && !NON_CS_SLUGS.has(w.slug)
  )

  useEffect(() => {
    if (showAddCS) addInputRef.current?.focus()
  }, [showAddCS])

  async function handleAddCS(e: React.FormEvent) {
    e.preventDefault()
    const name = newCSName.trim()
    if (!name) return
    const urlSlug = nameToSlug(name)
    const dbSlug = urlSlug.replace(/-/g, '_')
    try {
      await ensureWorkspace.mutateAsync({ slug: dbSlug, name, category: 'core_subject' })
      await ensureCsSubject.mutateAsync({ slug: dbSlug, name })
      setShowAddCS(false)
      setNewCSName('')
      navigate(`/w/${urlSlug}`)
    } catch {
      // errors handled by mutation
    }
  }

  const adding = ensureWorkspace.isPending || ensureCsSubject.isPending

  return (
    <div className="flex flex-col w-full h-full bg-card border-r border-border overflow-y-auto">
      <div className={`flex-shrink-0 ${collapsed ? 'px-1 pt-3 pb-2 flex flex-col items-center gap-2' : 'px-4 pt-5 pb-4'}`}>
        {collapsed ? (
          <>
            <Brain size={18} className="text-rose" />
            <button
              onClick={onToggle}
              title="Expand sidebar"
              className="text-text-light hover:text-rose transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain size={20} className="text-rose flex-shrink-0" />
                <span className="font-display font-semibold text-text-dark text-sm leading-tight">Vivek's Second Brain</span>
              </div>
              <button
                onClick={onToggle}
                title="Collapse sidebar"
                className="text-text-light hover:text-rose transition-colors ml-1 flex-shrink-0"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
            <span className="inline-block bg-rose-light text-rose text-xs px-2 py-0.5 rounded-full">NeuroOS</span>
          </>
        )}
      </div>

      <nav className={`flex-1 pb-2 space-y-3 ${collapsed ? 'px-1' : 'px-3'}`}>
        {/* Top group (no label) */}
        <div>
          <div className="space-y-0.5">
            {topGroup.items.map((item) => (
              <NavItemLink key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        </div>

        {/* CORE SUBJECTS — dynamic */}
        <div>
          {!collapsed && (
            <div className="flex items-center justify-between px-3 pt-1 mb-1">
              <p className="text-text-light text-[10px] uppercase tracking-widest">Core Subjects</p>
              <button
                onClick={() => { setShowAddCS(v => !v); setNewCSName('') }}
                title="Add core subject"
                className="text-rose/40 hover:text-rose transition-colors"
              >
                {showAddCS ? <X size={12} /> : <Plus size={12} />}
              </button>
            </div>
          )}
          {collapsed && <div className="border-t border-border/50 mx-1 my-1" />}

          <div className="space-y-0.5">
            {coreSubjects.map(ws => {
              const Icon = CS_SLUG_ICONS[ws.slug] ?? BookOpen
              const urlSlug = ws.slug.replace(/_/g, '-')
              const to = `/w/${urlSlug}`
              return (
                <NavItemLink
                  key={ws.id}
                  item={{ icon: Icon, label: ws.name, to }}
                  collapsed={collapsed}
                />
              )
            })}
          </div>

          {showAddCS && !collapsed && (
            <form onSubmit={handleAddCS} className="mt-1 px-2">
              <div className="flex items-center gap-1">
                <input
                  ref={addInputRef}
                  value={newCSName}
                  onChange={e => setNewCSName(e.target.value)}
                  placeholder="Subject name…"
                  disabled={adding}
                  className="flex-1 text-xs bg-rose-bg/40 border border-border rounded px-2 py-1.5 text-text-dark placeholder:text-text-light focus:outline-none focus:border-rose"
                />
                <button
                  type="submit"
                  disabled={adding || !newCSName.trim()}
                  className="shrink-0 text-rose hover:text-rose/70 disabled:opacity-40 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Static groups */}
        {staticGroups.map((group, i) => (
          <div key={i}>
            {group.label && !collapsed && (
              <p className="text-text-light text-[10px] uppercase tracking-widest mb-1 px-3 pt-1">
                {group.label}
              </p>
            )}
            {group.label && collapsed && <div className="border-t border-border/50 mx-1 my-1" />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItemLink key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 mt-auto border-t border-border">
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            `flex items-center w-full transition-colors ${
              collapsed
                ? `justify-center px-2 py-3 ${isActive ? 'bg-sidebar-active text-rose' : 'text-rose/60 hover:bg-rose-bg hover:text-rose'}`
                : `gap-2.5 px-5 py-3 text-sm ${isActive ? 'bg-sidebar-active text-rose font-medium border-l-2 border-rose' : 'text-rose/60 hover:bg-rose-bg hover:text-rose'}`
            }`
          }
        >
          <Settings size={15} className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        {!collapsed && (
          <div className="px-4 py-3">
            <p className="text-text-light text-xs italic">Small progress everyday adds up to big results.</p>
            <p className="mt-1">🌸</p>
          </div>
        )}
      </div>
    </div>
  )
}
