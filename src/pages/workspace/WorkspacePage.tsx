import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Plus,
  LayoutDashboard, BookOpen, Code2, Link2, MessageSquare, RefreshCw, ScrollText, BarChart2, PenLine,
  Target, Users, FileText, Megaphone, LayoutTemplate, Globe, Package, GitPullRequest, Bug,
  BookA, GraduationCap, Music, Newspaper, Book,
  Dumbbell, ListTodo, Award, Scale, Utensils, Footprints, Flame, TrendingUp, Activity, Droplets,
  FolderKanban, Trophy, Brain, Quote, Briefcase, Calendar, Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  useWorkspaceBySlug, useUpdateWorkspace,
  type Workspace,
} from '../../hooks/useWorkspace'
import { useCsSubjectBySlug, useEnsureCsSubject } from '../../hooks/useCoreSubject'
import OverviewTab from '../../components/workspace/tabs/OverviewTab'
import TopicsTab from '../../components/workspace/tabs/TopicsTab'
import QuestionsTab from '../../components/workspace/tabs/QuestionsTab'
import ResourcesTab from '../../components/workspace/tabs/ResourcesTab'
import InterviewQATab from '../../components/workspace/tabs/InterviewQATab'
import RevisionTab from '../../components/workspace/tabs/RevisionTab'
import CheatSheetsTab from '../../components/workspace/tabs/CheatSheetsTab'
import AnalyticsTab from '../../components/workspace/tabs/AnalyticsTab'
import NotesTab from '../../components/workspace/tabs/NotesTab'
import LeadsTab from '../../components/workspace/tabs/LeadsTab'
import ClientsTab from '../../components/workspace/tabs/ClientsTab'
import ContentTab from '../../components/workspace/tabs/ContentTab'
import AdsTab from '../../components/workspace/tabs/AdsTab'
import TemplatesTab from '../../components/workspace/tabs/TemplatesTab'
import SaasTab from '../../components/workspace/tabs/SaasTab'
import OpportunitiesTab from '../../components/workspace/tabs/OpportunitiesTab'
import ReposTab from '../../components/workspace/tabs/ReposTab'
import PullRequestsTab from '../../components/workspace/tabs/PullRequestsTab'
import IssuesTab from '../../components/workspace/tabs/IssuesTab'
import OpenSourceOverview from '../../components/workspace/tabs/OpenSourceOverview'
import ProjectIdeasTab from '../../components/workspace/tabs/ProjectIdeasTab'
import LearningPathTab from '../../components/workspace/tabs/LearningPathTab'
import VocabularyTab from '../../components/workspace/tabs/VocabularyTab'
import KanjiTab from '../../components/workspace/tabs/KanjiTab'
import GrammarTab from '../../components/workspace/tabs/GrammarTab'
import ImmersionLogTab from '../../components/workspace/tabs/ImmersionLogTab'
import LanguageNotesTab from '../../components/workspace/tabs/LanguageNotesTab'
import CaseStudiesTab from '../../components/workspace/tabs/CaseStudiesTab'
import ProjectsTab from '../../components/workspace/tabs/ProjectsTab'
import ContestsTab from '../../components/workspace/tabs/ContestsTab'
import GoalsTab from '../../components/workspace/tabs/personal/GoalsTab'
import MeditationTab from '../../components/workspace/tabs/personal/MeditationTab'
import JournalTab from '../../components/workspace/tabs/personal/JournalTab'
import QuotesTab from '../../components/workspace/tabs/personal/QuotesTab'
import BooksTab from '../../components/workspace/tabs/reading/BooksTab'
import ArticlesTab from '../../components/workspace/tabs/reading/ArticlesTab'
import CoursesTab from '../../components/workspace/tabs/reading/CoursesTab'
import PlaylistsTab from '../../components/workspace/tabs/reading/PlaylistsTab'
import GeopoliticsTab from '../../components/workspace/tabs/reading/GeopoliticsTab'
import GymDashboardTab from '../../components/workspace/tabs/gym/GymDashboardTab'
import WorkoutLogTab from '../../components/workspace/tabs/gym/WorkoutLogTab'
import LogWorkoutTab from '../../components/workspace/tabs/gym/LogWorkoutTab'
import ExercisesTab from '../../components/workspace/tabs/gym/ExercisesTab'
import PRsTab from '../../components/workspace/tabs/gym/PRsTab'
import BodyMetricsTab from '../../components/workspace/tabs/gym/BodyMetricsTab'
import DietTab from '../../components/workspace/tabs/gym/DietTab'
import StepsTab from '../../components/workspace/tabs/gym/StepsTab'
import CaloriesTab from '../../components/workspace/tabs/gym/CaloriesTab'
import PushupsTab from '../../components/workspace/tabs/gym/PushupsTab'
import CalisthenicsTab from '../../components/workspace/tabs/gym/CalisthenicsTab'
import WaterTab from '../../components/workspace/tabs/gym/WaterTab'
import RatingTab from '../../components/workspace/tabs/RatingTab'
import EditorialsTab from '../../components/workspace/tabs/EditorialsTab'
import BlockEditor from '../../components/shared/BlockEditor'
import PlaceholderTab from '../../components/workspace/PlaceholderTab'

// ─── Tab config ──────────────────────────────────────────────────────────────

type TabKey =
  | 'overview' | 'cs_topics' | 'cs_questions' | 'cs_resources' | 'cs_interview_qa'
  | 'cs_revision' | 'cs_cheat_sheets' | 'cs_analytics' | 'cs_notes'
  | 'leads' | 'clients' | 'content' | 'ads' | 'templates' | 'saas'
  | 'opportunities'
  | 'os_overview' | 'os_repos' | 'os_prs' | 'os_issues'
  | 'll_project_ideas' | 'll_learning_path'
  | 'lang_vocab' | 'lang_kanji' | 'lang_grammar' | 'lang_sessions' | 'lang_immersion' | 'lang_notes'
  | 'sd_case_studies' | 'sd_notes'
  | 'cp_contests' | 'cp_rating' | 'cp_editorials' | 'cp_journal'
  | 'projects_list'
  | 'gym_dashboard' | 'gym_log_workout'
  | 'gym_workout' | 'gym_exercises' | 'gym_prs' | 'gym_body_metrics'
  | 'gym_diet' | 'gym_steps' | 'gym_calories' | 'gym_pushups' | 'gym_calisthenics' | 'gym_water'
  | 'personal_goals' | 'personal_meditation' | 'personal_journal' | 'personal_quotes'
  | 'reading_books' | 'reading_articles' | 'reading_courses' | 'reading_playlists' | 'reading_geopolitics'
  | 'notes'
  | 'placeholder'

type TabDef = { key: string; label: string; icon: LucideIcon; type: TabKey }

const TYPE_TABS: Record<string, TabDef[]> = {
  core_subject: [
    { key: 'overview',      label: 'Overview',        icon: LayoutDashboard, type: 'overview' },
    { key: 'topics',        label: 'Topics',          icon: BookOpen,        type: 'cs_topics' },
    { key: 'problems',      label: 'Problems',        icon: Code2,           type: 'cs_questions' },
    { key: 'resources',     label: 'Resources',       icon: Link2,           type: 'cs_resources' },
    { key: 'interview_qa',  label: 'Interview Q&A',   icon: MessageSquare,   type: 'cs_interview_qa' },
    { key: 'revision',      label: 'Revision Center', icon: RefreshCw,       type: 'cs_revision' },
    { key: 'cheat_sheets',  label: 'Cheat Sheets',    icon: ScrollText,      type: 'cs_cheat_sheets' },
    { key: 'analytics',     label: 'Analytics',       icon: BarChart2,       type: 'cs_analytics' },
    { key: 'notes',         label: 'Notes',           icon: PenLine,         type: 'cs_notes' },
  ],
  chubs_media: [
    { key: 'leads',      label: 'Leads',      icon: Target,         type: 'leads' },
    { key: 'clients',    label: 'Clients',    icon: Users,          type: 'clients' },
    { key: 'content',    label: 'Content',    icon: FileText,       type: 'content' },
    { key: 'ads',        label: 'Ads',        icon: Megaphone,      type: 'ads' },
    { key: 'templates',  label: 'Templates',  icon: LayoutTemplate, type: 'templates' },
    { key: 'saas',       label: 'SaaS',       icon: Globe,          type: 'saas' },
    { key: 'notes',      label: 'Notes',      icon: PenLine,        type: 'notes' },
  ],
  opportunities: [
    { key: 'all',          label: 'All',          icon: Globe,          type: 'opportunities' },
    { key: 'hackathons',   label: 'Hackathons',   icon: Zap,            type: 'opportunities' },
    { key: 'competitions', label: 'Competitions', icon: Trophy,         type: 'opportunities' },
    { key: 'internships',  label: 'Internships',  icon: Briefcase,      type: 'opportunities' },
    { key: 'fellowships',  label: 'Fellowships',  icon: GraduationCap,  type: 'opportunities' },
    { key: 'calendar',     label: 'Calendar',     icon: Calendar,       type: 'opportunities' },
  ],
  open_source: [
    { key: 'overview',       label: 'Overview',       icon: LayoutDashboard, type: 'os_overview' },
    { key: 'repos',          label: 'Repos',          icon: Package,        type: 'os_repos' },
    { key: 'pull_requests',  label: 'Pull Requests',  icon: GitPullRequest, type: 'os_prs' },
    { key: 'issues',         label: 'Issues',         icon: Bug,            type: 'os_issues' },
  ],
  personal: [
    { key: 'goals',      label: 'Goals',      icon: Target,   type: 'personal_goals' },
    { key: 'meditation', label: 'Meditation', icon: Brain,    type: 'personal_meditation' },
    { key: 'journal',    label: 'Journal',    icon: BookA,    type: 'personal_journal' },
    { key: 'quotes',     label: 'Quotes',     icon: Quote,    type: 'personal_quotes' },
  ],
  reading: [
    { key: 'books',       label: 'Books',       icon: Book,          type: 'reading_books' },
    { key: 'articles',    label: 'Articles',    icon: Newspaper,     type: 'reading_articles' },
    { key: 'courses',     label: 'Courses',     icon: GraduationCap, type: 'reading_courses' },
    { key: 'playlists',   label: 'Playlists',   icon: Music,         type: 'reading_playlists' },
    { key: 'geopolitics', label: 'Geopolitics', icon: Globe,         type: 'reading_geopolitics' },
  ],
  gym: [
    { key: 'dashboard',     label: 'Dashboard',       icon: LayoutDashboard, type: 'gym_dashboard' },
    { key: 'log_workout',   label: 'Log Workout',      icon: Plus,      type: 'gym_log_workout' },
    { key: 'workout_log',   label: 'Workouts',         icon: Dumbbell,  type: 'gym_workout' },
    { key: 'exercises',     label: 'Exercises',        icon: ListTodo,  type: 'gym_exercises' },
    { key: 'body_metrics',  label: 'Body Metrics',     icon: Scale,     type: 'gym_body_metrics' },
    { key: 'pushups',       label: 'Pushup Tracker',   icon: TrendingUp, type: 'gym_pushups' },
    { key: 'steps',         label: 'Steps',            icon: Footprints, type: 'gym_steps' },
    { key: 'calories',      label: 'Diet',             icon: Flame,     type: 'gym_calories' },
    { key: 'water',         label: 'Water',            icon: Droplets,  type: 'gym_water' },
  ],
  proj: [
    { key: 'projects', label: 'Projects', icon: FolderKanban, type: 'projects_list' },
    { key: 'notes',    label: 'Notes',    icon: PenLine,      type: 'notes' },
  ],
  standalone: [
    { key: 'notes', label: 'Notes', icon: PenLine, type: 'notes' },
  ],
}

function getTabType(workspace: Workspace): string {
  if (workspace.category === 'core_subject') return 'core_subject'
  return TYPE_TABS[workspace.slug] ? workspace.slug : 'standalone'
}

// ─── Emoji picker ─────────────────────────────────────────────────────────────

const WORKSPACE_EMOJIS = [
  '🧠','📚','💻','🔬','⚡','🎯','🚀','💡','🔧','📊',
  '🏆','💰','🌐','🔗','📱','🎨','🌱','🏋️','🎓','💼',
  '⭐','🌟','🔥','💎','🧩','📐','🔑','🗝️','🎲','📋',
  '🌍','🎵','📓','🤝','📢','💬','🧘','🌿','🐍','⚙️',
]

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-card shadow-lg p-3 w-60">
      <div className="grid grid-cols-10 gap-0.5">
        {WORKSPACE_EMOJIS.map(e => (
          <button key={e} onClick={() => { onSelect(e); onClose() }}
            className="text-lg w-7 h-7 flex items-center justify-center hover:bg-rose-bg/50 rounded transition-colors"
          >{e}</button>
        ))}
      </div>
    </div>
  )
}

// ─── Tab content renderer ─────────────────────────────────────────────────────

function TabContent({
  tab,
  workspace,
  coreSubjectId,
  onTabChange,
}: {
  tab: TabDef
  workspace: Workspace
  coreSubjectId: number | null
  onTabChange: (key: string) => void
}) {
  const wsId = String(workspace.id)

  switch (tab.type) {
    case 'overview':         return <OverviewTab workspace={workspace} coreSubjectId={coreSubjectId} onTabChange={onTabChange} />
    // CS tabs
    case 'cs_topics':        return <TopicsTab coreSubjectId={coreSubjectId} workspaceId={wsId} workspaceName={workspace.name} onViewProblems={() => onTabChange('problems')} />
    case 'cs_questions':     return <QuestionsTab coreSubjectId={coreSubjectId} workspaceId={wsId} />
    case 'cs_resources':     return <ResourcesTab coreSubjectId={coreSubjectId} />
    case 'cs_interview_qa':  return <InterviewQATab coreSubjectId={coreSubjectId} workspaceId={wsId} />
    case 'cs_revision':      return <RevisionTab coreSubjectId={coreSubjectId} />
    case 'cs_cheat_sheets':  return <CheatSheetsTab coreSubjectId={coreSubjectId} workspaceId={wsId} />
    case 'cs_analytics':     return <AnalyticsTab coreSubjectId={coreSubjectId} />
    case 'cs_notes':         return <NotesTab coreSubjectId={coreSubjectId} workspaceId={wsId} />
    // Business (chubs_media)
    case 'leads':            return <LeadsTab workspaceId={wsId} />
    case 'clients':          return <ClientsTab workspaceId={wsId} />
    case 'content':          return <ContentTab workspaceId={wsId} />
    case 'ads':              return <AdsTab workspaceId={wsId} />
    case 'templates':        return <TemplatesTab workspaceId={wsId} />
    case 'saas':             return <SaasTab workspaceId={wsId} />
    case 'opportunities':    return <OpportunitiesTab workspaceId={wsId} filter={tab.key as never} />
    case 'os_overview':      return <OpenSourceOverview onTabChange={onTabChange} />
    case 'os_repos':         return <ReposTab workspaceId={wsId} />
    case 'os_prs':           return <PullRequestsTab workspaceId={wsId} />
    case 'os_issues':        return <IssuesTab workspaceId={wsId} />
    case 'll_project_ideas': return <ProjectIdeasTab workspaceId={wsId} />
    case 'll_learning_path': return <LearningPathTab workspaceId={wsId} />
    case 'lang_vocab':       return <VocabularyTab workspaceId={wsId} />
    case 'lang_kanji':       return <KanjiTab workspaceId={wsId} />
    case 'lang_grammar':     return <GrammarTab workspaceId={wsId} />
    case 'lang_sessions':    return <ResourcesTab coreSubjectId={-1} />
    case 'lang_immersion':   return <ImmersionLogTab workspaceId={wsId} />
    case 'lang_notes':       return <LanguageNotesTab workspaceId={wsId} />
    case 'sd_case_studies':  return <CaseStudiesTab workspaceId={wsId} />
    case 'sd_notes':         return <div className="p-6"><BlockEditor entityType="workspace_notes" entityId={wsId} workspaceId={wsId} placeholder="Start writing notes..." /></div>
    case 'cp_contests':      return <ContestsTab workspaceId={wsId} />
    case 'cp_rating':        return <RatingTab workspaceId={wsId} />
    case 'cp_editorials':    return <EditorialsTab workspaceId={wsId} />
    case 'cp_journal':       return <div className="p-6"><BlockEditor entityType="cp_journal" entityId={wsId} workspaceId={wsId} placeholder="Write contest reflections, strategy notes, goals..." /></div>
    case 'projects_list':    return <ProjectsTab workspaceId={wsId} />
    case 'gym_dashboard':    return <GymDashboardTab workspaceId={wsId} onTabChange={onTabChange} />
    case 'gym_log_workout':  return <LogWorkoutTab workspaceId={wsId} onTabChange={onTabChange} />
    case 'gym_workout':      return <WorkoutLogTab workspaceId={wsId} onTabChange={onTabChange} />
    case 'gym_exercises':    return <ExercisesTab workspaceId={wsId} />
    case 'gym_prs':          return <PRsTab workspaceId={wsId} />
    case 'gym_body_metrics': return <BodyMetricsTab workspaceId={wsId} />
    case 'gym_diet':         return <DietTab workspaceId={wsId} />
    case 'gym_steps':        return <StepsTab workspaceId={wsId} />
    case 'gym_calories':     return <CaloriesTab workspaceId={wsId} />
    case 'gym_pushups':      return <PushupsTab workspaceId={wsId} />
    case 'gym_calisthenics': return <CalisthenicsTab workspaceId={wsId} />
    case 'gym_water':        return <WaterTab workspaceId={wsId} />
    case 'personal_goals':       return <GoalsTab workspaceId={wsId} />
    case 'personal_meditation':  return <MeditationTab workspaceId={wsId} />
    case 'personal_journal':     return <JournalTab workspaceId={wsId} />
    case 'personal_quotes':      return <QuotesTab workspaceId={wsId} />
    case 'reading_books':        return <BooksTab workspaceId={wsId} />
    case 'reading_articles':     return <ArticlesTab workspaceId={wsId} />
    case 'reading_courses':      return <CoursesTab workspaceId={wsId} />
    case 'reading_playlists':    return <PlaylistsTab workspaceId={wsId} />
    case 'reading_geopolitics':  return <GeopoliticsTab workspaceId={wsId} />
    case 'notes':                return <div className="p-6"><BlockEditor entityType="workspace_notes" entityId={wsId} workspaceId={wsId} placeholder="Start writing notes..." /></div>
    default:                     return <PlaceholderTab tabName={tab.label} workspaceId={wsId} />
  }
}

// slug → category map for known non-CS workspaces
// all other slugs default to 'core_subject' (user-created CS subjects)
const SLUG_CATEGORY: Record<string, string> = {
  gym:           'gym',
  japanese:      'language',
  system_design: 'system_design',
  cp:            'competitive_prog',
  proj:          'projects',
  opportunities: 'opportunities',
  open_source:   'open_source',
  personal:      'personal',
  reading:       'reading',
  learning_lab:  'learning_lab',
  chubs_media:   'business',
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const { slug: rawSlug } = useParams<{ slug: string }>()
  const slug = rawSlug?.replace(/-/g, '_')
  const { data: rawWorkspace, isLoading } = useWorkspaceBySlug(slug ?? '')
  const { data: csSubject, isLoading: csLoading } = useCsSubjectBySlug(slug ?? '')
  const ensureCsSubject = useEnsureCsSubject()
  const updateWs = useUpdateWorkspace()

  const [activeTab, setActiveTab] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [navW, setNavW] = useState(208)
  const prevNavW = useRef(208)
  const navCollapsed = navW <= 44

  const handleNavDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = navW
    function onMove(ev: MouseEvent) {
      setNavW(Math.min(320, Math.max(44, startW + ev.clientX - startX)))
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [navW])

  function toggleNav() {
    if (navCollapsed) {
      setNavW(prevNavW.current > 44 ? prevNavW.current : 208)
    } else {
      prevNavW.current = navW
      setNavW(44)
    }
  }

  // Fallback only for hook dependencies (tabs, effects) — real render guards below
  const workspace: Workspace = rawWorkspace ?? {
    id: 0,
    slug: slug ?? '',
    name: slug ?? 'Workspace',
    category: SLUG_CATEGORY[slug ?? ''] ?? 'core_subject',
    table_prefix: null,
    icon: '📚',
    color: null,
    description: null,
    sort_order: null,
    is_active: true,
    is_pinned: false,
    last_accessed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // -1 when no DB row: hooks return 0 rows → empty states
  const coreSubjectId = csSubject?.core_subject_id ?? -1

  const tabs = TYPE_TABS[getTabType(workspace)] ?? [{ key: 'notes', label: 'Notes', icon: PenLine, type: 'notes' as TabKey }]

  useEffect(() => {
    if (tabs.length > 0) setActiveTab(tabs[0].key)
  }, [workspace.id])

  // Auto-recover missing cs_core_subjects row (e.g. after DB reset)
  useEffect(() => {
    if (!csLoading && !csSubject && rawWorkspace?.category === 'core_subject' && slug && rawWorkspace.name) {
      ensureCsSubject.mutate({ slug, name: rawWorkspace.name })
    }
  }, [csLoading, csSubject, rawWorkspace?.category, slug, rawWorkspace?.name])

  useEffect(() => {
    if (editingName && nameInputRef.current) nameInputRef.current.focus()
  }, [editingName])

  function saveName() {
    if (!rawWorkspace) return
    const trimmed = nameVal.trim()
    if (trimmed && trimmed !== workspace.name) {
      updateWs.mutate({ id: workspace.id, name: trimmed })
    }
    setEditingName(false)
  }

  function saveIcon(icon: string) {
    if (!rawWorkspace) return
    updateWs.mutate({ id: workspace.id, icon })
  }

  const currentTab = tabs.find(t => t.key === activeTab) ?? tabs[0]

  if (isLoading || csLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-text-light text-sm">
        Loading...
      </div>
    )
  }

  if (!rawWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-text-light">
        <p className="font-display text-xl text-text-dark">Workspace not found</p>
        <p className="text-sm">No workspace with slug <code className="bg-rose-bg px-1.5 py-0.5 rounded text-rose">{slug}</code></p>
        <p className="text-xs">Create it from the sidebar using the <strong>+</strong> button next to Core Subjects.</p>
      </div>
    )
  }

  // core_subject: always two-panel layout (sidebar + content), overview included
  if (workspace.category === 'core_subject' && currentTab) {
    return (
      <div className="flex bg-cream" style={{ minHeight: '100vh' }}>
        <aside
          className="shrink-0 bg-card border-r border-border flex flex-col overflow-hidden"
          style={{ width: navW }}
        >
          {navCollapsed ? (
            <div className="flex flex-col items-center py-3 gap-2 h-full">
              <button onClick={toggleNav} title="Expand" className="text-text-light hover:text-rose transition-colors mb-1">
                <ChevronRight size={15} />
              </button>
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    title={tab.label}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      activeTab === tab.key ? 'bg-rose-bg/60 text-rose' : 'text-rose/60 hover:bg-rose-bg/20 hover:text-rose'
                    }`}
                  >
                    <Icon size={15} />
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <div className="px-4 pt-4 pb-3 border-b border-border flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-sm text-text-dark truncate">{workspace.name}</p>
                </div>
                <button onClick={toggleNav} title="Collapse" className="text-text-light hover:text-rose transition-colors shrink-0 mt-1">
                  <ChevronLeft size={14} />
                </button>
              </div>
              <nav className="p-2 flex-1 overflow-y-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors text-left ${
                        activeTab === tab.key
                          ? 'bg-rose-bg/60 text-rose font-medium'
                          : 'text-rose/60 hover:bg-rose-bg/20 hover:text-rose'
                      }`}
                    >
                      <Icon size={15} className="shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </>
          )}
        </aside>

        {/* drag handle */}
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-rose/40 active:bg-rose/60 transition-colors"
          onMouseDown={handleNavDragStart}
        />

        <main className="flex-1 overflow-auto bg-cream">
          <TabContent tab={currentTab} workspace={workspace} coreSubjectId={coreSubjectId} onTabChange={setActiveTab} />
        </main>
      </div>
    )
  }

  // Gym workspace: dedicated sidebar layout (no generic header / tab bar)
  if (workspace.slug === 'gym' && currentTab) {
    return (
      <div className="flex bg-cream" style={{ minHeight: '100vh' }}>
        <aside
          className="shrink-0 bg-card border-r border-border flex flex-col overflow-hidden"
          style={{ width: navW }}
        >
          {navCollapsed ? (
            <div className="flex flex-col items-center py-3 gap-2 h-full">
              <span className="text-xl leading-none mb-1"><Dumbbell/></span>
              <button
                onClick={toggleNav}
                title="Expand"
                className="text-text-light hover:text-rose transition-colors"
              >
                <ChevronRight size={15} />
              </button>
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    title={tab.label}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      isActive ? 'bg-sidebar-active text-rose' : 'text-text-light hover:bg-sidebar-active/60 hover:text-text-dark'
                    }`}
                  >
                    <Icon size={15} />
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <div className="px-4 py-4 border-b border-border flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl leading-none shrink-0"><Dumbbell/></span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-text-dark leading-tight truncate">Fitness</p>
                    <p className="text-[10px] text-text-light mt-0.5">Track. Train. Transform.</p>
                  </div>
                </div>
                <button
                  onClick={toggleNav}
                  title="Collapse"
                  className="text-text-light hover:text-rose transition-colors shrink-0 mt-1"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
              <nav className="p-2 flex-1 overflow-y-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors text-left ${
                        isActive
                          ? 'bg-sidebar-active text-rose font-medium'
                          : 'text-text-mid hover:bg-sidebar-active/60 hover:text-text-dark'
                      }`}
                    >
                      <Icon
                        size={15}
                        className={`shrink-0 transition-colors ${isActive ? 'text-rose' : 'text-text-light'}`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </>
          )}
        </aside>

        {/* drag handle */}
        <div
          className="w-1 shrink-0 cursor-col-resize hover:bg-rose/40 active:bg-rose/60 transition-colors"
          onMouseDown={handleNavDragStart}
        />

        <main className="flex-1 overflow-auto bg-cream">
          <TabContent
            tab={currentTab}
            workspace={workspace}
            coreSubjectId={coreSubjectId}
            onTabChange={setActiveTab}
          />
        </main>
      </div>
    )
  }

  // Some workspaces render their own hero header inside the tab component
  const selfContainedHeader = workspace.slug === 'opportunities' || workspace.slug === 'open_source'
  const hideWorkspaceHeader = selfContainedHeader || workspace.slug === 'personal'

  return (
    <div className="min-h-screen bg-cream">
      {/* Header — hidden for workspaces that render their own hero */}
      {!hideWorkspaceHeader && (
        <div className="bg-card border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowEmoji(v => !v)}
                  className="text-3xl w-12 h-12 flex items-center justify-center bg-rose-bg/50 rounded-card border border-border hover:bg-rose-bg transition-colors"
                >
                  {workspace.icon ?? '📁'}
                </button>
                {showEmoji && (
                  <EmojiPicker onSelect={saveIcon} onClose={() => setShowEmoji(false)} />
                )}
              </div>

              <div>
                {editingName ? (
                  <input
                    ref={nameInputRef}
                    value={nameVal}
                    onChange={e => setNameVal(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveName()
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                    className="font-display text-3xl text-text-dark bg-transparent border-b-2 border-rose outline-none"
                  />
                ) : (
                  <h1
                    onClick={() => { setNameVal(workspace.name); setEditingName(true) }}
                    className="font-display text-3xl text-text-dark cursor-text hover:opacity-80 transition-opacity"
                  >
                    {workspace.name}
                  </h1>
                )}
                {workspace.description && (
                  <p className="text-sm text-text-mid mt-0.5">{workspace.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar (hidden for core_subject overview and self-contained workspaces) */}
      {!selfContainedHeader && !(workspace.category === 'core_subject' && activeTab === 'overview') && (
        <div className="bg-card border-b border-border px-6">
          <div className="flex items-center gap-0 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-rose text-rose font-medium'
                      : 'border-transparent text-rose/60 hover:text-rose'
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Custom nav for open_source (replaces hidden tab bar) */}
      {workspace.slug === 'open_source' && (
        <div className="bg-card border-b border-border px-8 sticky top-0 z-30">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-5 py-4 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-rose text-rose font-medium'
                      : 'border-transparent text-text-mid hover:text-text-dark'
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-cream">
        {currentTab && (
          <TabContent tab={currentTab} workspace={workspace} coreSubjectId={coreSubjectId} onTabChange={setActiveTab} />
        )}
      </div>
    </div>
  )
}
