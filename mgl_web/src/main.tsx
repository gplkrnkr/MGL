import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { ConfigError } from './components/ConfigError'
import { ErrorBoundary } from './components/ErrorBoundary'
import { isConfigValid } from './lib/config'
import { initSentry } from './lib/sentry'

initSentry()

const queryClient = new QueryClient()

const root = createRoot(document.getElementById('root')!)

if (!isConfigValid) {
  root.render(
    <StrictMode>
      <ConfigError />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}
