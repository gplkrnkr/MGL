import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextField } from '../../components/ui/TextField'
import { AppShell } from '../../components/AppShell'

const SKILLS = [
  'Mason',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Housekeeping',
  'Security',
  'Driver',
  'Welder',
  'Helper',
]

interface QueuedRegistration {
  name: string
  skill: string
  synced: boolean
}

export function AgentAppDemo() {
  const [offline, setOffline] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [skill, setSkill] = useState('')
  const [aadhaarLast4, setAadhaarLast4] = useState('')
  const [queue, setQueue] = useState<QueuedRegistration[]>([])

  const todayCount = queue.filter((q) => q.synced).length

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setQueue((q) => [...q, { name, skill, synced: !offline }])
    setName('')
    setPhone('')
    setSkill('')
    setAadhaarLast4('')
  }

  return (
    <AppShell title="Agent App (MSC)">
      <p className="text-text-muted mb-1">
        Field registrations — online saves immediately, offline queues locally (demo).
      </p>
      <Card className="max-w-md mb-4">
        <p className="font-semibold text-text">Agent session · Whitefield MSC</p>
        <p className="text-sm text-text-muted">Anwar Ahmed</p>
        <p className="text-2xl font-bold text-primary mt-2">{todayCount}</p>
        <p className="text-sm text-text-muted">today's registrations</p>
      </Card>

      <label className="flex items-center gap-2 mb-4">
        <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} />
        <span className="text-sm text-text">📵 Simulate offline mode</span>
      </label>

      <Card className="max-w-md flex flex-col gap-4">
        <h2 className="text-lg font-bold text-text">Register new worker</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <TextField label="Worker name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="State" value={state} onChange={(e) => setState(e.target.value)} />
            <TextField label="District" value={district} onChange={(e) => setDistrict(e.target.value)} />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-text">Primary skill</span>
            <select
              className="h-14 px-4 rounded-lg border border-border bg-background text-text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              required
            >
              <option value="" disabled>
                Select skill
              </option>
              {SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Aadhaar last 4 digits"
            value={aadhaarLast4}
            onChange={(e) => setAadhaarLast4(e.target.value)}
            maxLength={4}
          />
          <div className="border border-dashed border-border rounded-lg p-4 text-center text-text-muted text-sm">
            📷 Face photo captured (demo)
          </div>
          <Button type="submit">
            {offline ? '📵 Queue registration' : '✓ Submit to backend'}
          </Button>
        </form>
      </Card>

      {queue.length > 0 && (
        <div className="max-w-md mt-6">
          <h3 className="text-sm font-semibold text-text-muted mb-2">This session</h3>
          <div className="flex flex-col gap-2">
            {queue.map((q, i) => (
              <Card key={i} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text">{q.name}</p>
                  <p className="text-sm text-text-muted">{q.skill}</p>
                </div>
                <span className={`text-sm font-semibold ${q.synced ? 'text-success' : 'text-warning'}`}>
                  {q.synced ? '✓ Synced' : '📵 Queued'}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  )
}
