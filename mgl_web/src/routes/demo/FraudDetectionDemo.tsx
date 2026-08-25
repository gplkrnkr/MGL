import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { simulateAiResponse } from './aiDemo'
import { AppShell } from '../../components/AppShell'

type Severity = 'Critical' | 'High' | 'Medium'

interface FraudFlag {
  id: string
  severity: Severity
  type: string
  detail: string
  action: string
  resolved: boolean
  analysis?: string
}

const SEVERITY_COLOR: Record<Severity, string> = {
  Critical: 'text-danger bg-danger-light',
  High: 'text-warning bg-warning-light',
  Medium: 'text-text-muted bg-page',
}

const INITIAL_FLAGS: FraudFlag[] = [
  {
    id: 'f1',
    severity: 'Critical',
    type: 'Bulk Registration',
    detail: '47 registrations from a single GPS location in 28 minutes',
    action: 'Batch held',
    resolved: false,
  },
  {
    id: 'f2',
    severity: 'High',
    type: 'Duplicate Aadhaar',
    detail: 'Same Aadhaar VID used across 3 different phone numbers',
    action: 'Account frozen',
    resolved: false,
  },
  {
    id: 'f3',
    severity: 'High',
    type: 'Fake Employer',
    detail: 'GSTIN failed validation. 340 profiles viewed, 0 offers made',
    action: 'Account suspended',
    resolved: false,
  },
  {
    id: 'f4',
    severity: 'Medium',
    type: 'False Skill Claim',
    detail: 'Claims Master Electrician, 0 employer verifications',
    action: 'Skill downgraded',
    resolved: true,
  },
]

export function FraudDetectionDemo() {
  const [flags, setFlags] = useState(INITIAL_FLAGS)
  const [analysing, setAnalysing] = useState<string | null>(null)

  const total = flags.length
  const open = flags.filter((f) => !f.resolved).length
  const resolved = total - open

  const onAddTestFlag = () => {
    setFlags((f) => [
      {
        id: `f${f.length + 1}`,
        severity: 'Medium',
        type: 'Suspicious Login',
        detail: 'Login from a new device and unusual location',
        action: 'Flagged for review',
        resolved: false,
      },
      ...f,
    ])
  }

  const onAnalyse = async (id: string) => {
    setAnalysing(id)
    const result = await simulateAiResponse(
      'Pattern consistent with coordinated fraud. Recommend manual review before reinstating access.',
    )
    setFlags((fs) => fs.map((f) => (f.id === id ? { ...f, analysis: result } : f)))
    setAnalysing(null)
  }

  return (
    <AppShell title="Fraud Detection">
      <p className="text-text-muted mb-4">Live fraud flags (sample data).</p>

      <div className="grid grid-cols-3 gap-2 max-w-md mb-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-text">{total}</p>
          <p className="text-sm text-text-muted">Total flags</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-danger">{open}</p>
          <p className="text-sm text-text-muted">Open</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-success">{resolved}</p>
          <p className="text-sm text-text-muted">Resolved</p>
        </Card>
      </div>

      <Button variant="secondary" className="mb-4" onClick={onAddTestFlag}>
        + Add Test Flag
      </Button>

      <div className="flex flex-col gap-2 max-w-2xl">
        {flags.map((flag) => (
          <Card key={flag.id} className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${SEVERITY_COLOR[flag.severity]}`}>
                  {flag.severity}
                </span>
                <p className="font-semibold text-text mt-1">{flag.type}</p>
                <p className="text-sm text-text-muted">{flag.detail}</p>
                <p className="text-sm text-text-muted">Action: {flag.action}</p>
              </div>
              {flag.resolved && <span className="text-success text-sm font-semibold">Resolved</span>}
            </div>
            {flag.analysis && (
              <p className="text-sm text-text-muted bg-page p-2 rounded-md">{flag.analysis}</p>
            )}
            <Button
              variant="ghost"
              className="h-9 px-4 text-sm w-fit"
              onClick={() => onAnalyse(flag.id)}
              disabled={analysing === flag.id}
            >
              {analysing === flag.id ? 'Analysing…' : '✦ AI Analyse'}
            </Button>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
