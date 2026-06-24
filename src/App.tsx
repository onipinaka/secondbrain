import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import Layout from './components/layout/Layout'
import AuthGuard from './components/layout/AuthGuard'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Inbox from './pages/Inbox'
import Planner from './pages/Planner'
import Calendar from './pages/Calendar'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import WorkspacePage from './pages/workspace/WorkspacePage'
import ProjectDetail from './pages/ProjectDetail'
import PhaseNotesPage from './pages/PhaseNotesPage'
import RepoDetail from './pages/workspace/RepoDetail'
import CommandPalette from './components/shared/CommandPalette'
import { useUIStore } from './stores/uiStore'
import ChubsLayout from './pages/chubs/ChubsLayout'
import ChubsLeadList from './pages/chubs/ChubsLeadList'
import ChubsEmailOutreach from './pages/chubs/ChubsEmailOutreach'
import ChubsCallScripts from './pages/chubs/ChubsCallScripts'
import ChubsGeneral from './pages/chubs/ChubsGeneral'
import ChubsClientAcquisition from './pages/chubs/ChubsClientAcquisition'
import ChubsFollowUps from './pages/chubs/ChubsFollowUps'
import ChubsNiches from './pages/chubs/ChubsNiches'

const queryClient = new QueryClient()

function App() {
  const openCommandPalette = useUIStore(s => s.openCommandPalette)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openCommandPalette()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [openCommandPalette])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthGuard />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="planner" element={<Planner />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="w/:slug" element={<WorkspacePage />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="projects/:projectId/phase/:phaseId/notes" element={<PhaseNotesPage />} />
            <Route path="os/repo/:repoId" element={<RepoDetail />} />
            <Route path="settings" element={<Settings />} />
          <Route path="chubs" element={<ChubsLayout />}>
            <Route index element={<Navigate to="/chubs/client-acquisition" replace />} />
            <Route path="client-acquisition" element={<ChubsClientAcquisition />} />
            <Route path="client-acquisition/leads" element={<ChubsLeadList />} />
            <Route path="client-acquisition/email" element={<ChubsEmailOutreach />} />
            <Route path="client-acquisition/follow-ups" element={<ChubsFollowUps />} />
            <Route path="client-acquisition/interested" element={<ChubsLeadList />} />
            <Route path="client-acquisition/converted" element={<ChubsLeadList />} />
            <Route path="client-acquisition/scripts" element={<ChubsCallScripts />} />
            <Route path="client-acquisition/niches" element={<ChubsNiches />} />
            <Route path="general" element={<ChubsGeneral />} />
          </Route>
          </Route>
          </Route>
        </Routes>
        <CommandPalette />
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  )
}

export default App
