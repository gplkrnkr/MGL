import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextField } from '../../components/ui/TextField'
import { AppShell } from '../../components/AppShell'

interface MatchResult {
  name: string
  workerId: string
  score: number
  reason: string
}

const SAMPLE_NAMES = ['Ravi Kumar', 'Suresh Nair', 'Anil Menon', 'Manoj Das', 'Vikram Singh']

function runMockMatch(skill: string, location: string): MatchResult[] {
  return SAMPLE_NAMES.slice(0, 4).map((name, i) => ({
    name,
    workerId: `MGL/KA/BEN/${90000 + i}`,
    score: 95 - i * 7,
    reason: `${skill || 'Requested skill'} experience, based near ${location || 'the requested location'}, verified profile.`,
  }))
}

export function AiMatchingDemo() {
  const [skill, setSkill] = useState('')
  const [location, setLocation] = useState('')
  const [minExperience, setMinExperience] = useState('')
  const [wage, setWage] = useState('')
  const [results, setResults] = useState<MatchResult[] | null>(null)
  const [running, setRunning] = useState(false)

  const onRunMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setRunning(true)
    setResults(null)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setResults(runMockMatch(skill, location))
    setRunning(false)
  }

  return (
    <AppShell title="AI Matching Engine">
      <p className="text-text-muted mb-4">Matches job requirements against the worker pool (sample data).</p>

      <Card className="max-w-md mb-6">
        <form onSubmit={onRunMatch} className="flex flex-col gap-4">
          <TextField label="Skill required" value={skill} onChange={(e) => setSkill(e.target.value)} />
          <TextField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Min experience (years)"
              type="number"
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
            />
            <TextField
              label="Wage offered (₹/mo)"
              type="number"
              value={wage}
              onChange={(e) => setWage(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={running}>
            {running ? '● Matching…' : '⚡ Run AI Match'}
          </Button>
        </form>
      </Card>

      {results && (
        <div className="flex flex-col gap-2 max-w-2xl">
          {results.map((r) => (
            <Card key={r.workerId} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-text">{r.name}</p>
                <p className="text-sm text-text-muted">{r.workerId}</p>
                <p className="text-sm text-text-muted">{r.reason}</p>
              </div>
              <div className="text-center shrink-0">
                <p className="text-xl font-bold text-primary">{r.score}%</p>
                <p className="text-xs text-text-muted">match</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
