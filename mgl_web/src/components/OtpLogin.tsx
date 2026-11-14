import { useRef, useState } from 'react'
import { phoneAuthErrorMessage, sendCode } from '../lib/phoneAuth'
import { WrongRoleError } from '../lib/roleError'
import { Button } from './ui/Button'
import { TextField } from './ui/TextField'
import { Card } from './ui/Card'

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container'

interface Props {
  heading: string
  subheading: string
  /** Called with the Firebase ID token once the code is verified. */
  onVerify: (firebaseIdToken: string) => Promise<unknown>
  onSuccess: () => void
}

export function OtpLogin({ heading, subheading, onVerify, onSuccess }: Props) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const confirmCode = useRef<((code: string) => Promise<string>) | null>(null)

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      confirmCode.current = await sendCode(phone, RECAPTCHA_CONTAINER_ID)
      setStep('otp')
    } catch (err) {
      setError(phoneAuthErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmCode.current) {
      setStep('phone')
      return
    }
    setError(null)
    setBusy(true)
    let idToken: string
    try {
      idToken = await confirmCode.current(code)
    } catch (err) {
      setError(phoneAuthErrorMessage(err))
      setBusy(false)
      return
    }
    try {
      await onVerify(idToken)
      onSuccess()
    } catch (err) {
      setError(
        err instanceof WrongRoleError
          ? err.message
          : 'Signed in, but the server could not start your session. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">{heading}</h1>
          <p className="text-sm text-text-muted mt-1">{subheading}</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <TextField
              label="Mobile number"
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              Enter the code sent to <span className="font-semibold text-text">{phone}</span>
            </p>
            <TextField
              label="OTP code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify & continue'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStep('phone')
                setCode('')
                setError(null)
              }}
            >
              Use a different number
            </Button>
          </form>
        )}
        {/* Firebase renders its invisible reCAPTCHA here. */}
        <div id={RECAPTCHA_CONTAINER_ID} />
      </Card>
    </div>
  )
}
