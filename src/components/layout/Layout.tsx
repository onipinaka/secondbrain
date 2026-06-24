import { useState, useRef } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Home, CheckSquare, Inbox, Calendar, MoreHorizontal, X } from 'lucide-react'

const MIN_W = 48
const MAX_W = 320
const DEFAULT_W = 192

const MORE_TOOLS = [
  { emoji: '📋', label: 'Consistency Calendar', to: '/calendar' },
  { emoji: '📊', label: 'Master Analytics', to: '/analytics' },
  { emoji: '⚙️', label: 'Settings', to: '/settings' },
]

const MORE_WORKSPACES = [
  { emoji: '💻', label: 'DSA Hub', to: '/w/dsa' },
  { emoji: '⚙️', label: 'Operating Systems', to: '/w/os' },
  { emoji: '🗄️', label: 'DBMS', to: '/w/dbms' },
  { emoji: '🌐', label: 'Computer Networks', to: '/w/cn' },
  { emoji: '☕', label: 'Java', to: '/w/java' },
  { emoji: '🧠', label: 'Learning Lab', to: '/w/learning-lab' },
  { emoji: '🚀', label: 'Chubs Media', to: '/w/chubs' },
  { emoji: '🎯', label: 'Opportunities', to: '/w/opportunities' },
  { emoji: '🔓', label: 'Open Source', to: '/w/open-source' },
  { emoji: '💪', label: 'Gym', to: '/w/gym' },
  { emoji: '🇯🇵', label: 'Japanese', to: '/w/japanese' },
  { emoji: '🏗️', label: 'System Design', to: '/w/system-design' },
  { emoji: '🏆', label: 'Competitive Prog.', to: '/w/cp' },
  { emoji: '🛠️', label: 'Projects', to: '/w/projects' },
  { emoji: '🧘', label: 'Personal', to: '/w/personal' },
  { emoji: '📖', label: 'Reading Hub', to: '/w/reading' },
]

const SHEET_LINK_CLS = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-sidebar-active text-text-dark font-medium'
      : 'text-text-mid hover:bg-rose-bg hover:text-text-dark'
  }`

export default function Layout() {
  const [moreOpen, setMoreOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_W)
  const isDragging = useRef(false)
  const prevWidth = useRef(DEFAULT_W)

  const collapsed = sidebarWidth <= MIN_W

  function closeMore() { setMoreOpen(false) }

  function handleToggle() {
    if (collapsed) {
      setSidebarWidth(prevWidth.current > MIN_W ? prevWidth.current : DEFAULT_W)
    } else {
      prevWidth.current = sidebarWidth
      setSidebarWidth(MIN_W)
    }
  }

  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault()
    isDragging.current = true
    const startX = e.clientX
    const startW = sidebarWidth

    function onMove(ev: MouseEvent) {
      const newW = Math.min(MAX_W, Math.max(MIN_W, startW + ev.clientX - startX))
      setSidebarWidth(newW)
    }
    function onUp() {
      isDragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <div
        className="hidden md:flex flex-shrink-0"
        style={{ width: sidebarWidth }}
      >
        <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      </div>

      {/* drag handle */}
      <div
        className="hidden md:block w-1 flex-shrink-0 cursor-col-resize hover:bg-rose/40 active:bg-rose/60 transition-colors z-10"
        onMouseDown={handleDragStart}
      />

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around px-2 py-2 z-50">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center p-2 ${isActive ? 'text-rose' : 'text-text-light'}`
          }
        >
          <Home size={20} />
        </NavLink>
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `flex flex-col items-center p-2 ${isActive ? 'text-rose' : 'text-text-light'}`
          }
        >
          <CheckSquare size={20} />
        </NavLink>
        <NavLink
          to="/inbox"
          className={({ isActive }) =>
            `flex flex-col items-center p-2 ${isActive ? 'text-rose' : 'text-text-light'}`
          }
        >
          <Inbox size={20} />
        </NavLink>
        <NavLink
          to="/planner"
          className={({ isActive }) =>
            `flex flex-col items-center p-2 ${isActive ? 'text-rose' : 'text-text-light'}`
          }
        >
          <Calendar size={20} />
        </NavLink>
        <button
          className={`flex flex-col items-center p-2 transition-colors ${moreOpen ? 'text-rose' : 'text-text-light'}`}
          onClick={() => setMoreOpen(v => !v)}
        >
          <MoreHorizontal size={20} />
        </button>
      </nav>

      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={closeMore}
          />
          <div className="fixed bottom-[56px] left-0 right-0 z-50 bg-card border-t border-border rounded-t-xl max-h-[70vh] overflow-y-auto md:hidden">
            <div className="sticky top-0 bg-card px-4 py-3 flex items-center justify-between border-b border-border">
              <span className="font-display font-semibold text-text-dark text-sm">More</span>
              <button onClick={closeMore} className="text-text-light hover:text-text-dark transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 space-y-4 pb-6">
              <div className="space-y-0.5">
                {MORE_TOOLS.map(item => (
                  <NavLink key={item.to} to={item.to} onClick={closeMore} className={SHEET_LINK_CLS}>
                    <span className="text-base leading-none">{item.emoji}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
              <div>
                <p className="text-text-light text-[10px] uppercase tracking-widest mb-1 px-3 pt-1">Workspaces</p>
                <div className="space-y-0.5">
                  {MORE_WORKSPACES.map(item => (
                    <NavLink key={item.to} to={item.to} onClick={closeMore} className={SHEET_LINK_CLS}>
                      <span className="text-base leading-none">{item.emoji}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
