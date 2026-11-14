import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '../lib/sentry'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info.componentStack)
    reportError(error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-page px-4">
          <div className="w-full max-w-sm bg-background border border-border rounded-lg p-4 flex flex-col gap-4 text-center">
            <h1 className="text-xl font-bold text-text">Something went wrong</h1>
            <p className="text-sm text-text-muted">
              An unexpected error occurred. Try reloading the page.
            </p>
            <button
              onClick={() => window.location.assign('/')}
              className="h-14 px-6 rounded-lg font-semibold bg-primary text-text-inverse"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
