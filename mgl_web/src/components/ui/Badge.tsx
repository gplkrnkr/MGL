type Tone = 'default' | 'success' | 'warning' | 'danger'

const toneClasses: Record<Tone, string> = {
  default: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
}

const STATUS_TONE: Record<string, Tone> = {
  open: 'success',
  closed: 'default',
  pending: 'warning',
  verified: 'success',
  rejected: 'danger',
  submitted: 'default',
  under_review: 'warning',
  accepted: 'success',
}

export function Badge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? 'default'
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold capitalize ${toneClasses[tone]}`}>
      {label ?? status.replace('_', ' ')}
    </span>
  )
}
