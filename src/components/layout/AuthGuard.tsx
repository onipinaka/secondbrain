import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AuthGuard() {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading…</span>
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
