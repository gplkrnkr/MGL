import { useMutation, useQuery } from '@tanstack/react-query'
import { digilockerStatusKey, getDigilockerStatus, startDigilockerVerification } from '../api/client'
import { Button } from './ui/Button'
import { ErrorBanner } from './ui/ErrorBanner'

/**
 * "Verify with DigiLocker" box for the worker profile. Renders nothing until the
 * backend reports the feature is on, so it can ship before DigiLocker approves MGL.
 */
export function DigilockerVerify() {
  const statusQuery = useQuery({ queryKey: digilockerStatusKey, queryFn: getDigilockerStatus })
  const startMutation = useMutation({
    mutationFn: startDigilockerVerification,
    onSuccess: (authorizeUrl) => window.location.assign(authorizeUrl),
  })

  const status = statusQuery.data
  if (!status) return null

  if (status.verified) {
    return (
      <div className="bg-success-light border border-success/20 rounded-lg p-4 text-sm text-center">
        <p className="font-semibold text-success">Aadhaar verified</p>
        <p className="text-text-muted">Aadhaar ending {status.last4}, verified through DigiLocker</p>
      </div>
    )
  }

  if (!status.enabled) return null

  return (
    <div className="border border-border rounded-lg p-4 flex flex-col gap-3 text-sm">
      <p className="font-semibold text-text">Verify your Aadhaar with DigiLocker</p>
      <p className="text-text-muted">
        You'll sign in to DigiLocker, the Government of India's document app, and agree to share your
        Aadhaar with My Grand Labour. We keep only the result: that it's verified, the date, the last 4
        digits, whether the name matches your profile, and your DigiLocker account ID (so one Aadhaar
        can't be used on two accounts). We never store your Aadhaar number, photo or address.
      </p>
      <Button
        onClick={() => startMutation.mutate()}
        disabled={startMutation.isPending || startMutation.isSuccess}
        className="w-fit"
      >
        {startMutation.isPending || startMutation.isSuccess ? 'Opening DigiLocker…' : 'Verify with DigiLocker'}
      </Button>
      {startMutation.isError && <ErrorBanner message="Couldn't open DigiLocker. Try again in a moment." />}
      <p className="text-text-muted text-xs">Don't use DigiLocker? Upload a photo of your ID below instead.</p>
    </div>
  )
}
