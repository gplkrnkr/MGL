import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/**
 * Shown when a signed-out visitor opens a job: invites them to sign in or create their free MGL
 * ID, but still lets them view the job (job pages stay public for search engines and visitors).
 */
export function SignInPrompt({
  jobId,
  jobTitle,
  onClose,
}: {
  jobId: string
  jobTitle: string
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const next = encodeURIComponent(`/jobs/${jobId}`)

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-primary/40 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-prompt-title"
        className="bg-background rounded-lg border border-border p-6 w-full max-w-sm flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 id="sign-in-prompt-title" className="text-xl font-bold text-text">
            Sign in to apply
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Create your free MGL ID with your phone number to apply for <strong>{jobTitle}</strong> and
            other jobs. Already registered? Sign in with the same number.
          </p>
        </div>
        <Link
          to={`/login?next=${next}`}
          className="h-14 px-6 rounded-lg font-semibold bg-primary text-text-inverse hover:bg-primary-dark flex items-center justify-center"
        >
          Sign in / Create your MGL ID
        </Link>
        <Link to={`/jobs/${jobId}`} className="text-center text-sm font-semibold text-primary">
          Just view the job
        </Link>
        <button type="button" onClick={onClose} className="text-center text-sm text-text-muted">
          Close
        </button>
      </div>
    </div>
  )
}
