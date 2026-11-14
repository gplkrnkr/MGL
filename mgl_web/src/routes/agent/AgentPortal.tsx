import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage, listMyRegistrations, registerWorker } from '../../api/client'
import type { AgentWorkerInput, Profile } from '../../api/types'
import { PortalLayout } from '../../components/PortalLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { TextField } from '../../components/ui/TextField'

const SKILLS = ['Mason', 'Electrician', 'Plumber', 'Carpenter', 'Housekeeping', 'Security', 'Driver', 'Welder', 'Helper']

const EMPTY_FORM = { fullName: '', phone: '', skill: '', state: '', district: '', town: '', pinCode: '' }

export function AgentPortal() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [registered, setRegistered] = useState<Profile | null>(null)

  const registrations = useQuery({ queryKey: ['agent-registrations'], queryFn: listMyRegistrations })

  const registerMutation = useMutation({
    mutationFn: (payload: AgentWorkerInput) => registerWorker(payload),
    onSuccess: (worker) => {
      setRegistered(worker)
      setForm(EMPTY_FORM)
      queryClient.invalidateQueries({ queryKey: ['agent-registrations'] })
    },
  })

  const set = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setRegistered(null)
    registerMutation.mutate({
      phone: form.phone,
      fullName: form.fullName,
      skills: form.skill ? [form.skill] : [],
      location: form.state
        ? { state: form.state, district: form.district, town: form.town, pinCode: form.pinCode }
        : null,
    })
  }

  return (
    <PortalLayout title="Field agent" navItems={[{ to: '/agent', label: 'Register workers' }]}>
      <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
        <Card>
          <h1 className="text-xl font-bold text-text mb-1">Register a worker</h1>
          <p className="text-sm text-text-muted mb-4">
            They get an MGL ID now, and can sign in later with this mobile number to take over the
            profile.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <TextField label="Full name" value={form.fullName} onChange={set('fullName')} required />
            <TextField
              label="Mobile number"
              type="tel"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={set('phone')}
              required
            />
            <label className="flex flex-col gap-1 text-sm font-semibold text-text">
              Main skill
              <select
                className="h-10 px-2 rounded-md border border-border bg-background text-sm font-normal"
                value={form.skill}
                onChange={set('skill')}
              >
                <option value="">Select a skill</option>
                {SKILLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="State" value={form.state} onChange={set('state')} />
              <TextField label="District" value={form.district} onChange={set('district')} />
              <TextField label="Town / city" value={form.town} onChange={set('town')} />
              <TextField label="PIN code" inputMode="numeric" value={form.pinCode} onChange={set('pinCode')} />
            </div>
            {registerMutation.isError && (
              <ErrorBanner message={apiErrorMessage(registerMutation.error, "Couldn't register this worker. Try again.")} />
            )}
            {registered && (
              <p className="text-sm text-success" role="status">
                Registered {registered.fullName} — MGL ID{' '}
                <span className="font-semibold">{registered.workerId}</span>
              </p>
            )}
            <Button type="submit" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Registering…' : 'Register worker'}
            </Button>
          </form>
        </Card>

        <div>
          <h2 className="text-lg font-bold text-text mb-3">My registrations</h2>
          {registrations.isLoading && <p className="text-text-muted">Loading…</p>}
          {registrations.isError && <ErrorBanner message="Couldn't load your registrations." />}
          {registrations.data?.length === 0 && <p className="text-text-muted">No workers registered yet.</p>}
          <div className="flex flex-col gap-2">
            {registrations.data?.map((w) => (
              <Card key={w.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-text">{w.fullName}</p>
                  <p className="text-sm text-text-muted">
                    {w.workerId} · {w.phone}
                    {w.skills[0] ? ` · ${w.skills[0]}` : ''}
                  </p>
                </div>
                <Badge status={w.verificationStatus} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
