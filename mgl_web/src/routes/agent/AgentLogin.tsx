import { useNavigate } from 'react-router-dom'
import { OtpLogin } from '../../components/OtpLogin'
import { useAuth } from '../../context/AuthContext'

export function AgentLogin() {
  const { loginAsWorker } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-page">
      <OtpLogin
        heading="Field agent sign in"
        subheading="Sign in with your phone number to register workers."
        onVerify={loginAsWorker}
        onSuccess={() => navigate('/agent')}
      />
    </div>
  )
}
