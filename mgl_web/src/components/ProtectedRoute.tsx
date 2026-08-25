import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function WorkerRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <CenteredLoading />
  if (!profile) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function EmployerRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <CenteredLoading />
  if (!profile) return <Navigate to="/employer/login" replace />
  if (!profile.isEmployer) return <Navigate to="/employer/login" replace />
  return <>{children}</>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <CenteredLoading />
  if (!profile) return <Navigate to="/admin/login" replace />
  if (!profile.isAdmin) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

function CenteredLoading() {
  return <div className="min-h-screen flex items-center justify-center text-text-muted">Loading…</div>
}
