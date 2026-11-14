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

export function AgentRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <CenteredLoading />
  if (!profile) return <Navigate to="/agent/login" replace />
  // Agent status is granted by an admin, so a signed-in non-agent gets an explanation rather than
  // a redirect back to the login page they just came from.
  if (!profile.isAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center text-text-muted">
        <p>
          This account isn&apos;t a field agent account. Ask an MGL admin to give{' '}
          <span className="font-semibold text-text">{profile.phone}</span> agent access.
        </p>
      </div>
    )
  }
  return <>{children}</>
}

function CenteredLoading() {
  return <div className="min-h-screen flex items-center justify-center text-text-muted">Loading…</div>
}
