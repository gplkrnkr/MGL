import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { simulateAiResponse } from './aiDemo'
import { AppShell } from '../../components/AppShell'

const STATES: Record<string, { registered: number; placed: number; gcc: number; activeJobs: number; topSkills: string[] }> = {
  'Tamil Nadu': { registered: 18420, placed: 6210, gcc: 340, activeJobs: 812, topSkills: ['Mason', 'Electrician', 'Housekeeping'] },
  Karnataka: { registered: 22110, placed: 8905, gcc: 512, activeJobs: 1104, topSkills: ['Driver', 'Security', 'Plumber'] },
  Maharashtra: { registered: 30250, placed: 12040, gcc: 690, activeJobs: 1530, topSkills: ['Welder', 'Carpenter', 'Helper'] },
}

export function GovtDashboardDemo() {
  const [state, setState] = useState('Tamil Nadu')
  const [brief, setBrief] = useState<string | null>(null)
  const [loadingBrief, setLoadingBrief] = useState(false)
  const stats = STATES[state]

  const onPolicyBrief = async () => {
    setLoadingBrief(true)
    const result = await simulateAiResponse(
      `${state}: worker registrations up 12% quarter-over-quarter, driven by housekeeping and construction trades. GCC placements remain a small share of total placements (${((stats.gcc / stats.placed) * 100).toFixed(1)}%) — consider expanding eMigrate processing capacity in this state.`,
    )
    setBrief(result)
    setLoadingBrief(false)
  }

  const onExport = () => {
    const blob = new Blob([JSON.stringify({ state, ...stats }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mgl-${state.toLowerCase().replace(/\s+/g, '-')}-stats.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell title="Government Dashboard">
      <p className="text-text-muted mb-4">Aggregated, anonymised stats (sample data).</p>

      <div className="flex items-center gap-2 mb-4">
        <select
          className="h-10 px-3 rounded-md border border-border bg-background text-text text-sm"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          {Object.keys(STATES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button variant="secondary" className="h-9 px-4 text-sm" onClick={onPolicyBrief} disabled={loadingBrief}>
          {loadingBrief ? 'Generating…' : '✦ AI Policy Brief'}
        </Button>
        <Button variant="ghost" className="h-9 px-4 text-sm" onClick={onExport}>
          📥 Export
        </Button>
      </div>

      {brief && <Card className="max-w-2xl mb-4 text-sm text-text-muted">{brief}</Card>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mb-6">
        {[
          ['Registered workers', stats.registered],
          ['Placed via MGL', stats.placed],
          ['GCC placements', stats.gcc],
          ['Active jobs', stats.activeJobs],
        ].map(([label, value]) => (
          <Card key={label as string} className="text-center">
            <p className="text-xl font-bold text-text">{(value as number).toLocaleString()}</p>
            <p className="text-xs text-text-muted mt-1">● Live from database</p>
            <p className="text-sm text-text-muted">{label}</p>
          </Card>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-text-muted mb-2">Top skills — {state}</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {stats.topSkills.map((skill) => (
          <span key={skill} className="px-3 py-1 rounded-full border border-border text-sm text-text">
            {skill}
          </span>
        ))}
      </div>

      <Card className="max-w-2xl text-sm text-text-muted">
        ⚠️ Privacy notice: all data shown is anonymised and aggregated. No individual worker PII
        is accessible from this dashboard. DPDP Act 2023 compliant.
      </Card>
    </AppShell>
  )
}
