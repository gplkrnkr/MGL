import { Link, Navigate, useNavigate } from 'react-router-dom'
import { OtpLogin } from '../../components/OtpLogin'
import { PublicLayout } from '../../components/PublicLayout'
import { useAuth } from '../../context/AuthContext'

export function EmployerLogin() {
  const { loginAsEmployer, profile } = useAuth()
  const navigate = useNavigate()

  if (profile?.isEmployer) return <Navigate to="/employer" replace />
  // A signed-in registered worker belongs on the worker side.
  if (profile?.workerId) return <Navigate to="/jobs" replace />

  return (
    <PublicLayout>
      <OtpLogin
        heading="Hire workers"
        subheading="Sign in with your phone number to post jobs and review applicants."
        onVerify={loginAsEmployer}
        onSuccess={() => navigate('/employer')}
      />
      <p className="text-sm text-text-muted text-center pb-10">
        Looking for work?{' '}
        <Link to="/login" className="text-primary font-semibold">
          Sign in as a worker
        </Link>
      </p>
    </PublicLayout>
  )
}
