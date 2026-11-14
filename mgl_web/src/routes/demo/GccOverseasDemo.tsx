import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextField } from '../../components/ui/TextField'
import { simulateAiResponse } from './aiDemo'
import { AppShell } from '../../components/AppShell'

interface ChecklistItem {
  key: string
  label: string
  detail: string
  required: boolean
  done: boolean
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { key: 'passport', label: 'Valid Passport (10 yr)', detail: '3-4 weeks · ₹1,500', required: true, done: false },
  { key: 'medical', label: 'Medical Fitness Certificate', detail: '1-2 days · ₹800-1,200', required: true, done: false },
  { key: 'police', label: 'Police Clearance Certificate', detail: '7-10 days · ₹500', required: true, done: false },
  { key: 'emigrate', label: 'eMigrate Registration', detail: '1-2 days · Free', required: true, done: false },
  { key: 'insurance', label: 'Overseas Travel Insurance', detail: 'Same day · ₹2,000-4,000/yr', required: false, done: false },
  { key: 'language', label: 'Basic Arabic / English (A2)', detail: '4-6 weeks · Included in MGL package', required: false, done: false },
]

export function GccOverseasDemo() {
  const [mglId, setMglId] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST)
  const [plan, setPlan] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)

  const progress = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)

  const toggle = (key: string) =>
    setChecklist((c) => c.map((item) => (item.key === key ? { ...item, done: !item.done } : item)))

  const onLoad = () => setLoaded(Boolean(mglId))
  const onDemoWorker = () => {
    setMglId('MGL/KA/BEN/92749')
    setLoaded(true)
  }

  const onActionPlan = async () => {
    setLoadingPlan(true)
    const remaining = checklist.filter((c) => c.required && !c.done).map((c) => c.label)
    const text =
      remaining.length === 0
        ? 'All required documents complete — ready to proceed with GCC placement.'
        : `Next steps: complete ${remaining.join(', ')}. Estimated total time: 3-4 weeks if started in parallel.`
    const result = await simulateAiResponse(text)
    setPlan(result)
    setLoadingPlan(false)
  }

  return (
    <AppShell title="GCC Overseas Readiness">
      <p className="text-text-muted mb-4">Document tracker for Gulf-country migration (demo).</p>

      <Card className="max-w-md mb-6 flex flex-col gap-2">
        <p className="font-semibold text-text">Look up worker MGL ID to load their GCC status</p>
        <div className="flex gap-2">
          <TextField
            value={mglId}
            onChange={(e) => setMglId(e.target.value)}
            placeholder="MGL/KA/BEN/92749"
            className="flex-1"
          />
          <Button onClick={onLoad}>Load</Button>
        </div>
        <Button variant="ghost" className="w-fit h-9 px-4 text-sm" onClick={onDemoWorker}>
          Use demo worker
        </Button>
      </Card>

      {!loaded ? (
        <p className="text-text-muted">No worker loaded.</p>
      ) : (
        <>
          <div className="flex items-center gap-4 max-w-md mb-4">
            <div className="text-3xl font-bold text-primary">{progress}%</div>
            <div>
              <p className="font-semibold text-text">{mglId}</p>
              <p className="text-sm text-text-muted">GCC ready</p>
            </div>
          </div>

          <Card className="max-w-md mb-4 text-sm text-text-muted">
            ✅ MGL ILO commitment: zero placement fee charged to this worker. GCC placement fees
            are collected from employers only (USD 600-1,000). Workers pay only their own document
            costs — ₹2,499 total.
          </Card>

          <div className="flex flex-col gap-2 max-w-md mb-4">
            {checklist.map((item) => (
              <Card key={item.key} className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 flex-1">
                  <input type="checkbox" checked={item.done} onChange={() => toggle(item.key)} />
                  <span>
                    <span className="font-semibold text-text block">{item.label}</span>
                    <span className="text-sm text-text-muted">{item.detail}</span>
                  </span>
                </label>
                <span className={`text-xs font-semibold ${item.required ? 'text-warning' : 'text-text-muted'}`}>
                  {item.required ? 'Required' : 'Optional'}
                </span>
              </Card>
            ))}
          </div>

          {plan && <Card className="max-w-md mb-4 text-sm text-text-muted">{plan}</Card>}

          <div className="flex gap-2">
            <Button variant="secondary">💾 Save (demo)</Button>
            <Button onClick={onActionPlan} disabled={loadingPlan}>
              {loadingPlan ? 'Generating…' : '✦ Get Action Plan'}
            </Button>
          </div>
        </>
      )}
    </AppShell>
  )
}
