import { Navigate, useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { OtpLogin } from '../../components/OtpLogin'
import { useAuth } from '../../context/AuthContext'

export function EmployerLogin() {
  const { loginAsEmployer, profile } = useAuth()
  const navigate = useNavigate()

  if (profile?.isEmployer) return <Navigate to="/employer" replace />

  return (
    <AppShell>
      <OtpLogin
        heading="Hire workers"
        subheading="Sign in with your phone number to post jobs and review applicants."
        onVerify={loginAsEmployer}
        onSuccess={() => navigate('/employer')}
      />
    </AppShell>
  )
}
