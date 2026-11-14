import { Navigate, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { OtpLogin } from '../../components/OtpLogin'
import { useAuth } from '../../context/AuthContext'

export function WorkerLogin() {
  const { loginAsWorker, profile } = useAuth()
  const navigate = useNavigate()

  if (profile) return <Navigate to="/jobs" replace />

  return (
    <AppShell>
      <OtpLogin
        heading="Find work"
        subheading="Sign in with your phone number to browse and apply to jobs."
        onVerify={loginAsWorker}
        onSuccess={() => navigate('/jobs')}
      />
    </AppShell>
  )
}
