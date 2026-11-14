import { useNavigate } from 'react-router-dom'
import { OtpLogin } from '../../components/OtpLogin'
import { useAuth } from '../../context/AuthContext'

export function AdminLogin() {
  const { loginAsWorker } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-page">
      <OtpLogin
        heading="Admin sign in"
        subheading="Sign in with your phone number to review documents and applications."
        onVerify={loginAsWorker}
        onSuccess={() => navigate('/admin/documents')}
      />
    </div>
  )
}
