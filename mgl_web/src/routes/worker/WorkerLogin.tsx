import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { OtpLogin } from '../../components/OtpLogin'
import { PublicLayout } from '../../components/PublicLayout'
import { useAuth } from '../../context/AuthContext'
import { safeNext } from '../../lib/next'

export function WorkerLogin() {
  const { loginAsWorker, profile } = useAuth()
  const navigate = useNavigate()
  // Set by "Sign in to apply" on a public job page, so the worker lands back on that job.
  const next = safeNext(useSearchParams()[0].get('next'))

  if (profile) return <Navigate to={profile.isEmployer ? '/employer' : (next ?? '/jobs')} replace />

  return (
    <PublicLayout>
      <OtpLogin
        heading="Find work"
        subheading="Sign in with your phone number to register, browse jobs and apply."
        onVerify={loginAsWorker}
        onSuccess={() => navigate(next ?? '/jobs')}
      />
      <p className="text-sm text-text-muted text-center pb-10">
        Hiring?{' '}
        <Link to="/employer/login" className="text-primary font-semibold">
          Sign in as an employer
        </Link>
      </p>
    </PublicLayout>
  )
}
