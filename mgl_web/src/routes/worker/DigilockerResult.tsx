import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { digilockerStatusKey } from '../../api/client'
import { PortalLayout } from '../../components/PortalLayout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { workerNavItems } from './nav'

// The backend's /api/digilocker/callback redirects here with ?result=<code>.
const MESSAGES: Record<string, { title: string; body: string }> = {
  verified: {
    title: 'Aadhaar verified',
    body: 'Thank you. Your profile now shows that your Aadhaar is verified.',
  },
  denied: {
    title: 'Verification cancelled',
    body: "You didn't agree to share your Aadhaar in DigiLocker. You can try again, or upload a photo of your ID instead.",
  },
  expired: {
    title: 'That link has expired',
    body: 'Please start the verification again from your profile.',
  },
  aadhaar_not_linked: {
    title: 'Aadhaar not found in DigiLocker',
    body: 'Your DigiLocker account has no Aadhaar linked. Link it in the DigiLocker app, then try again.',
  },
  already_used: {
    title: 'Aadhaar already in use',
    body: 'This Aadhaar is already verified on another My Grand Labour account. Contact us if this is a mistake.',
  },
  integrity_failed: {
    title: "We couldn't verify that",
    body: "The data from DigiLocker didn't pass our security check. Please try again.",
  },
  unavailable: {
    title: 'Verification not available yet',
    body: 'Aadhaar verification through DigiLocker is coming soon.',
  },
}

const FALLBACK = {
  title: 'Something went wrong',
  body: "We couldn't complete the verification. Please try again in a moment.",
}

export function DigilockerResult() {
  const [params] = useSearchParams()
  const result = params.get('result') ?? ''
  const message = MESSAGES[result] ?? FALLBACK
  const queryClient = useQueryClient()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: digilockerStatusKey })
  }, [queryClient])

  return (
    <PortalLayout title="Verify Aadhaar" homeTo="/jobs" navItems={workerNavItems}>
      <div className="max-w-md mx-auto">
        <Card className="flex flex-col gap-3 items-center text-center">
          <h1 className={`text-lg font-bold ${result === 'verified' ? 'text-success' : 'text-primary'}`}>
            {message.title}
          </h1>
          <p className="text-sm text-text-muted">{message.body}</p>
          <Link to="/profile">
            <Button className="w-fit">Back to my profile</Button>
          </Link>
        </Card>
      </div>
    </PortalLayout>
  )
}
