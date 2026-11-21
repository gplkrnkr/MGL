import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PortalLayout } from '../../components/PortalLayout'
import { PublicLayout } from '../../components/PublicLayout'
import { useAuth } from '../../context/AuthContext'
import { workerNavItems } from './nav'

/**
 * Job pages are public. Signed-in workers see their usual portal; everyone else (signed out, or
 * an employer) gets the public header with a way to sign in.
 */
export function JobsLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  if (profile && !profile.isEmployer) {
    return (
      <PortalLayout title="Find work" homeTo="/jobs" navItems={workerNavItems}>
        {children}
      </PortalLayout>
    )
  }
  const actions = profile?.isEmployer ? (
    <Link to="/employer" className="text-primary font-semibold">
      Employer dashboard
    </Link>
  ) : (
    <>
      <Link to="/employer/login" className="text-text-muted hidden sm:inline">
        Hiring?
      </Link>
      <Link to="/login" className="text-primary font-semibold">
        Sign in
      </Link>
    </>
  )
  return (
    <PublicLayout actions={actions}>
      <div className="py-6">{children}</div>
    </PublicLayout>
  )
}
