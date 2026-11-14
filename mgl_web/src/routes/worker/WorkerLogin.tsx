import { Link, Navigate, useNavigate } from 'react-router-dom'
import { OtpLogin } from '../../components/OtpLogin'
import { PublicLayout } from '../../components/PublicLayout'
import { useAuth } from '../../context/AuthContext'

export function WorkerLogin() {
  const { loginAsWorker, profile } = useAuth()
  const navigate = useNavigate()

  if (profile) return <Navigate to={profile.isEmployer ? '/employer' : '/jobs'} replace />

  return (
    <PublicLayout>
      <OtpLogin
        heading="Find work"
        subheading="Sign in with your phone number to register, browse jobs and apply."
        onVerify={loginAsWorker}
        onSuccess={() => navigate('/jobs')}
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
