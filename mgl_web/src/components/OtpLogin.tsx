import { useState } from 'react'
import { requestOtp } from '../api/client'
import { Button } from './ui/Button'
import { TextField } from './ui/TextField'
import { Card } from './ui/Card'

interface Props {
  heading: string
  subheading: string
  onVerify: (phone: string, code: string) => Promise<unknown>
  onSuccess: () => void
}

export function OtpLogin({ heading, subheading, onVerify, onSuccess }: Props) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await requestOtp(phone)
      setStep('otp')
    } catch {
      setError('Could not send OTP. Check the number and try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onVerify(phone, code)
      onSuccess()
    } catch {
      setError('Invalid or expired code.')
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
              label="Phone number"
              type="tel"
              placeholder="+91XXXXXXXXXX"
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
            <Button type="button" variant="ghost" onClick={() => setStep('phone')}>
              Use a different number
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
