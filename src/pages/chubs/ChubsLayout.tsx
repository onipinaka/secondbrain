import { useState } from 'react'
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import {
  Briefcase, FolderOpen,
  List, Mail, RefreshCw, Star, CheckCircle2,
  FileText, ChevronLeft, ChevronRight, Plus, Tag,
  type LucideIcon,
} from 'lucide-react'

type NavItem = { icon: LucideIcon; label: string; to: string; end?: boolean }

const mainNav: NavItem[] = [
  { icon: Briefcase,  label: 'Acquisition', to: '/chubs/client-acquisition', end: true },
  { icon: FolderOpen, label: 'General',      to: '/chubs/general' },
]

const acquisitionNav: NavItem[] = [
  { icon: List,         label: 'Lead List',                to: '/chubs/client-acquisition/leads' },
  { icon: Mail,         label: 'Email Outreach',           to: '/chubs/client-acquisition/email' },
  { icon: RefreshCw,    label: 'Follow Ups',               to: '/chubs/client-acquisition/follow-ups' },
  { icon: Star,         label: 'Interested Leads',         to: '/chubs/client-acquisition/interested' },
  { icon: CheckCircle2, label: 'Converted Clients',        to: '/chubs/client-acquisition/converted' },
  { icon: FileText,     label: 'Call Scripts & Templates', to: '/chubs/client-acquisition/scripts' },
  { icon: Tag,          label: 'Manage Niches',            to: '/chubs/client-acquisition/niches' },
]

function SidebarLink({ icon: Icon, label, to, end, collapsed }: NavItem & { collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center transition-colors ${
          collapsed
            ? `justify-center px-2 py-2 rounded-lg ${isActive ? 'bg-rose-light/60 text-rose' : 'text-text-mid hover:bg-rose-bg hover:text-text-dark'}`
            : `gap-2.5 px-3 py-[7px] rounded-lg text-[13px] ${isActive ? 'bg-rose-light/60 text-rose font-medium' : 'text-text-mid hover:bg-rose-bg hover:text-text-dark'}`
        }`
      }
    >
      <Icon size={14} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

export default function ChubsLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const inAcquisition = location.pathname.includes('/chubs/client-acquisition')

  return (
    <div className="flex min-h-full">
      {/* Chubs sub-sidebar */}
      <div
        className={`sticky top-0 h-screen flex-shrink-0 bg-card border-r border-border flex flex-col overflow-y-auto transition-all duration-200 ${
          collapsed ? 'w-12' : 'w-[210px]'
        }`}
      >
        {/* Header */}
        <div className={`flex-shrink-0 ${collapsed ? 'flex flex-col items-center gap-2 px-1 pt-3 pb-2' : 'px-4 pt-4 pb-3'}`}>
          {collapsed ? (
            <>
              <Briefcase size={16} className="text-rose" />
              <button
                onClick={() => setCollapsed(false)}
                title="Expand"
                className="text-text-light hover:text-rose transition-colors"
              >
                <ChevronRight size={13} />
              </button>
            </>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase size={15} className="text-rose flex-shrink-0" />
                  <span className="font-display font-bold text-text-dark text-[14px]">Chubs Media</span>
                </div>
                <p className="text-[10px] text-rose font-semibold pl-[23px] mt-0.5">Build. Sell. Scale.</p>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse"
                className="text-text-light hover:text-rose transition-colors mt-0.5 flex-shrink-0"
              >
                <ChevronLeft size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Main nav */}
        <nav className={`flex-shrink-0 space-y-0.5 ${collapsed ? 'px-1' : 'px-2'}`}>
          {mainNav.map(item => (
            <SidebarLink key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Acquisition sub-nav */}
        {inAcquisition && (
          <div className={`mt-3 flex-shrink-0 ${collapsed ? 'px-1' : ''}`}>
            {!collapsed && (
              <p className="text-text-light text-[10px] uppercase tracking-widest px-5 py-1.5">
                Acquisition
              </p>
            )}
            {collapsed && <div className="border-t border-border/50 mx-1 my-1" />}
            <div className={`space-y-0.5 ${collapsed ? '' : 'px-2'}`}>
              {acquisitionNav.map(item => (
                <SidebarLink key={item.to} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Add Lead */}
        {!collapsed && (
          <div className="px-3 mt-4 flex-shrink-0">
            <Link
              to="/chubs/client-acquisition/leads?add=true"
              className="w-full flex items-center gap-2 text-[12px] text-rose border border-rose/30 bg-rose-bg/40 rounded-lg px-3 py-2 hover:bg-rose-bg transition-colors"
            >
              <Plus size={13} />
              Quick Add Lead
            </Link>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
