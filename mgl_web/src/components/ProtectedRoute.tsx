import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { WrongRoleError } from '../lib/roleError'
import { Button } from './ui/Button'

export function WorkerRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <CenteredLoading />
  if (!profile) return <Navigate to="/login" replace />
  // One number, one role: employers don't get the worker pages.
  if (profile.isEmployer) return <WrongRole registeredAs="employer" />
  return <>{children}</>
}

export function EmployerRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <CenteredLoading />
  if (!profile) return <Navigate to="/employer/login" replace />
  // A registered worker can't use the employer pages. A blank profile (signed in, no role yet)
  // goes to the employer sign-in, which makes it an employer.
  if (!profile.isEmployer && profile.workerId) return <WrongRole registeredAs="worker" />
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

function WrongRole({ registeredAs }: { registeredAs: 'worker' | 'employer' }) {
  const { logout } = useAuth()
  const ownHome = registeredAs === 'employer' ? '/employer' : '/jobs'
  const signOut = () => {
    logout()
    window.location.assign('/')
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-text max-w-md">{new WrongRoleError(registeredAs).message}</p>
      <div className="flex gap-3">
        <Link to={ownHome}>
          <Button>{registeredAs === 'employer' ? 'Go to my jobs' : 'Go to find work'}</Button>
        </Link>
        <Button variant="secondary" onClick={signOut}>
          Log out
        </Button>
      </div>
    </div>
  )
}

function CenteredLoading() {
  return <div className="min-h-screen flex items-center justify-center text-text-muted">Loading…</div>
}
