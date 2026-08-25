import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

export function initSentry(): void {
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: import.meta.env.PROD ? 'production' : 'development',
    tracesSampleRate: 0,
  })
}

// Safe to call even when Sentry was never initialized (no DSN set) -- it's a
// silent no-op in that case, same optional/no-op pattern as the backend's
// SENTRY_DSN handling.
export const reportError = Sentry.captureException
