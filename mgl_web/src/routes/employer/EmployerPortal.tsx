import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getEmployerProfile, searchWorkers, updateEmployerProfile } from '../../api/client'
import { AppShell } from '../../components/AppShell'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { Field } from '../../components/ui/Field'
import { TextField } from '../../components/ui/TextField'
import { showPreviews } from '../../lib/config'
import { employerNavItems } from './nav'

type Tab = 'search' | 'company'

function SearchWorkersTab() {
  const [skill, setSkill] = useState('')
  const [location, setLocation] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const searchMutation = useMutation({
    mutationFn: () => searchWorkers({ skill, location, verifiedOnly }),
  })

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setHasSearched(true)
    searchMutation.mutate()
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSearch} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <TextField
          label="Skill"
          placeholder="e.g. Mason"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        />
        <TextField
          label="Location"
          placeholder="e.g. Chennai"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
          />
          <span className="text-sm text-text">Verified only</span>
        </label>
        <Button type="submit" disabled={searchMutation.isPending} className="w-fit">
          {searchMutation.isPending ? 'Searching…' : 'Search Workers'}
        </Button>
      </form>

      {searchMutation.isError && <ErrorBanner message="Couldn't search workers. Try again." />}

      <div className="flex flex-col gap-2">
        {searchMutation.data?.map((worker) => (
          <Card key={worker.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-text">{worker.fullName || 'Unnamed worker'}</p>
              <p className="text-sm text-text-muted">
                {[worker.locationTown, worker.locationDistrict, worker.locationState]
                  .filter(Boolean)
                  .join(', ') || 'No location set'}{' '}
                · {worker.workerId ?? 'No worker ID yet'}
              </p>
              {worker.skills.length > 0 && (
                <p className="text-sm text-text-muted">{worker.skills.join(', ')}</p>
              )}
            </div>
            <Badge status={worker.verificationStatus} />
          </Card>
        ))}
      </div>
      {hasSearched && searchMutation.data && searchMutation.data.length === 0 && (
        <p className="text-text-muted">No workers match those filters.</p>
      )}
      {!hasSearched && (
        <p className="text-text-muted">Search by skill or location to browse the worker pool.</p>
      )}
    </Card>
  )
}

function RegisterCompanyTab() {
  const queryClient = useQueryClient()
  const { data: company, isError } = useQuery({
    queryKey: ['employer-me'],
    queryFn: getEmployerProfile,
  })

  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [gstin, setGstin] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    if (company) {
      setCompanyName(company.companyName)
      setCompanyDescription(company.companyDescription)
      setWebsite(company.website ?? '')
      setGstin(company.gstin ?? '')
      setContactName(company.contactName ?? '')
      setContactPhone(company.contactPhone ?? '')
      setCity(company.city ?? '')
    }
  }, [company])

  const alreadyRegistered = Boolean(company?.companyName)
  const gstinLooksValid = gstin.length === 0 || gstin.length === 15

  const mutation = useMutation({
    mutationFn: () =>
      updateEmployerProfile({ companyName, companyDescription, website, gstin, contactName, contactPhone, city }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employer-me'] }),
  })

  return (
    <Card className="p-6 max-w-xl mx-auto flex flex-col gap-5">
      {isError && <ErrorBanner message="Couldn't load your company profile. Try refreshing the page." />}
      <h2 className="text-lg font-bold text-primary text-center">Register Your Company</h2>

      <Field label="Company name">
        <TextField
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Prestige Constructions Pvt Ltd"
        />
      </Field>

      <Field label="GSTIN">
        <TextField
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
        />
      </Field>
      <p className={`-mt-3 text-xs text-center ${gstinLooksValid ? 'text-text-muted' : 'text-danger'}`}>
        15-character GST identification number
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Contact name">
          <TextField value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="HR Manager name" />
        </Field>
        <Field label="Phone">
          <TextField value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91…" />
        </Field>
      </div>

      <Field label="City">
        <TextField value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Bengaluru" />
      </Field>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold tracking-widest text-text-muted uppercase text-center">Description</span>
        <textarea
          className="min-h-28 px-4 py-2 rounded-lg border border-border bg-background text-text focus:outline-none focus:border-primary"
          value={companyDescription}
          onChange={(e) => setCompanyDescription(e.target.value)}
        />
      </label>

      <Field label="Website">
        <TextField value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
      </Field>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !companyName.trim()}
        variant={alreadyRegistered ? 'primary' : 'secondary'}
        className={`self-center ${alreadyRegistered ? '' : 'bg-accent text-text-inverse hover:opacity-90'}`}
      >
        {mutation.isPending
          ? 'Saving…'
          : alreadyRegistered
            ? 'Save changes'
            : 'Register & Start Free Trial'}
      </Button>
      {mutation.isSuccess && <p className="text-sm text-success text-center">Saved.</p>}
      {mutation.isError && <ErrorBanner message="Couldn't save your company profile. Try again." />}
    </Card>
  )
}

export function EmployerPortal() {
  const [tab, setTab] = useState<Tab>('search')

  if (!showPreviews) {
    return (
      <AppShell portalTitle="Employer dashboard" portalNavItems={employerNavItems}>
        <h1 className="text-2xl font-bold text-text mb-1">Company profile</h1>
        <p className="text-text-muted mb-4">Workers see your company name on every job you post.</p>
        <RegisterCompanyTab />
      </AppShell>
    )
  }

  return (
    <AppShell portalTitle="Employer dashboard" portalNavItems={employerNavItems}>
      <h1 className="text-2xl font-bold text-text mb-1">Employer Portal</h1>
      <p className="text-text-muted mb-4">Search real workers and manage your company profile.</p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('search')}
          className={`flex-1 h-12 rounded-lg font-semibold flex items-center justify-center gap-2 ${
            tab === 'search' ? 'bg-primary text-text-inverse' : 'bg-background border border-border text-text'
          }`}
        >
          🔍 Search Workers
        </button>
        <button
          onClick={() => setTab('company')}
          className={`flex-1 h-12 rounded-lg font-semibold flex items-center justify-center gap-2 ${
            tab === 'company' ? 'bg-primary text-text-inverse' : 'bg-background border border-border text-text'
          }`}
        >
          🏢 Register Company
        </button>
      </div>

      {tab === 'search' ? <SearchWorkersTab /> : <RegisterCompanyTab />}
    </AppShell>
  )
}
