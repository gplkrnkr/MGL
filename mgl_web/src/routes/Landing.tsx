import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { showPreviews } from '../lib/config'

const modules = [
  {
    to: '/demo/agent-app',
    icon: '🧑‍💼',
    label: 'Agent App (MSC)',
    description: 'Field agents register workers, with an offline queue for poor connectivity.',
  },
  {
    to: '/demo/fraud-detection',
    icon: '🛡️',
    label: 'Fraud Detection',
    description: 'Flags suspicious activity — bulk registrations, duplicate IDs, fake employers.',
  },
  {
    to: '/demo/govt-dashboard',
    icon: '📊',
    label: 'Govt Dashboard',
    description: 'Anonymised, aggregated stats for government oversight, DPDP-compliant.',
  },
  {
    to: '/demo/ai-matching',
    icon: '🤖',
    label: 'AI Matching Engine',
    description: 'Matches workers to job requirements automatically.',
  },
  {
    to: '/demo/gcc-overseas',
    icon: '✈️',
    label: 'GCC Overseas',
    description: 'Document readiness tracker for Gulf-country migration.',
  },
]

export function Landing() {
  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-primary mb-1">MyGrandLabour</h1>
        <p className="text-text-muted mb-6">Connecting workers with local job opportunities.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Card className="flex flex-col gap-4 items-center py-8">
            <h2 className="text-xl font-bold text-text">I'm looking for work</h2>
            <p className="text-sm text-text-muted text-center">
              Browse jobs near you and apply in minutes.
            </p>
            <Link to="/login" className="w-full">
              <Button className="w-full">Continue as a worker</Button>
            </Link>
          </Card>

          <Card className="flex flex-col gap-4 items-center py-8">
            <h2 className="text-xl font-bold text-text">I'm hiring</h2>
            <p className="text-sm text-text-muted text-center">
              Post jobs and review applicants.
            </p>
            <Link to="/employer/login" className="w-full">
              <Button variant="secondary" className="w-full">
                Continue as an employer
              </Button>
            </Link>
          </Card>
        </div>

        {showPreviews && (
          <>
            <p className="text-sm text-text-muted text-center mb-8">
              Field agent?{' '}
              <Link to="/agent/login" className="text-primary font-semibold">
                Sign in to register workers
              </Link>
            </p>

            <h2 className="text-lg font-bold text-text mb-1">Explore where we're headed</h2>
            <p className="text-sm text-text-muted mb-4">
              Sample screens using demo data and simulated AI responses, not the live platform.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules.map((m) => (
                <Link key={m.to} to={m.to}>
                  <Card className="h-full flex flex-col gap-2 hover:border-primary transition-colors">
                    <span className="text-2xl">{m.icon}</span>
                    <h3 className="text-lg font-bold text-text">{m.label}</h3>
                    <p className="text-sm text-text-muted">{m.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
