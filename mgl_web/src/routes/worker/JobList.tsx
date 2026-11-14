import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createJob, listJobs, lookupWorker, selectEmployerRole } from '../../api/client'
import { PortalLayout } from '../../components/PortalLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { Field } from '../../components/ui/Field'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from '../../context/AuthContext'
import { workerNavItems } from './nav'

const SKILLS = [
  'Mason',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Housekeeping',
  'Security',
  'Driver',
  'Welder',
  'Painter',
  'Helper',
]

type Tab = 'feed' | 'post'

function JobFeedTab() {
  const { data: jobs, isLoading, isError } = useQuery({ queryKey: ['jobs'], queryFn: listJobs })

  return (
    <>
      {isLoading && <p className="text-text-muted">Loading jobs…</p>}
      {isError && <ErrorBanner message="Couldn't load jobs. Try refreshing the page." />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {jobs?.map((job) => (
          <Link key={job.id} to={`/jobs/${job.id}`}>
            <Card className="h-full flex flex-col gap-2 hover:border-primary transition-colors">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-text">{job.title}</h2>
                {job.isUrgent && <Badge status="warning" label="Urgent" />}
              </div>
              <p className="text-sm text-text-muted">{job.location}</p>
              <p className="text-sm text-text">
                ₹{job.wageMin}–{job.wageMax} / {job.wagePeriod}
              </p>
              <p className="text-sm text-text-muted line-clamp-2">{job.description}</p>
            </Card>
          </Link>
        ))}
      </div>
      {jobs && jobs.length === 0 && <p className="text-text-muted">No open jobs right now.</p>}
    </>
  )
}

function PostJobTab() {
  const { refresh } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [skill, setSkill] = useState('')
  const [location, setLocation] = useState('')
  const [monthlyWage, setMonthlyWage] = useState('')
  const [vacancies, setVacancies] = useState('1')
  const [isUrgent, setIsUrgent] = useState(false)

  const postMutation = useMutation({
    mutationFn: async () => {
      await selectEmployerRole()
      await refresh()
      return createJob({
        title: title.trim() || `${skill || 'Worker'} needed`,
        skillsRequired: skill ? [skill] : [],
        location,
        wageMin: Number(monthlyWage) || 0,
        wageMax: Number(monthlyWage) || 0,
        wagePeriod: 'monthly',
        openings: Number(vacancies) || 1,
        isUrgent,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      navigate('/employer')
    },
  })

  return (
    <Card className="p-6 max-w-xl mx-auto flex flex-col gap-5">
      <h2 className="text-lg font-bold text-primary text-center">Post a Job Requirement</h2>

      <Field label="Job title (optional)">
        <TextField value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mason for 3-month project" />
      </Field>

      <Field label="Skill required">
        <select
          className="h-14 px-4 rounded-lg border border-border bg-background text-text focus:outline-none focus:border-primary"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        >
          <option value="">Select skill</option>
          {SKILLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Location">
          <TextField value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Chennai" />
        </Field>
        <Field label="Monthly wage (₹)">
          <TextField
            type="number"
            value={monthlyWage}
            onChange={(e) => setMonthlyWage(e.target.value)}
            placeholder="e.g. 18000"
          />
        </Field>
      </div>

      <Field label="Vacancies">
        <TextField type="number" min={1} value={vacancies} onChange={(e) => setVacancies(e.target.value)} />
      </Field>

      <label className="flex items-center gap-2 justify-center">
        <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
        <span className="text-sm text-text">Urgent requirement</span>
      </label>

      <Button
        onClick={() => postMutation.mutate()}
        disabled={postMutation.isPending || !skill}
        className="self-center bg-accent text-text-inverse hover:opacity-90"
      >
        {postMutation.isPending ? 'Posting…' : 'Post Job Requirement'}
      </Button>
      {postMutation.isError && <ErrorBanner message="Couldn't post this job. Try again." />}
    </Card>
  )
}

function WorkerLookupBox() {
  const [workerId, setWorkerId] = useState('')

  const lookupMutation = useMutation({
    mutationFn: () => lookupWorker(workerId.trim()),
  })

  return (
    <Card className="mb-4 bg-primary-light border-primary/20">
      <p className="text-sm font-semibold text-primary text-center mb-2">
        🔍 Look up a registered worker by MGL ID
      </p>
      <div className="flex gap-2">
        <TextField
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          placeholder="e.g. MGL/KA/BEN/04821"
          className="flex-1"
        />
        <Button onClick={() => lookupMutation.mutate()} disabled={!workerId.trim() || lookupMutation.isPending}>
          {lookupMutation.isPending ? 'Looking…' : 'Look Up'}
        </Button>
      </div>
      {lookupMutation.isError && (
        <p className="text-sm text-danger mt-2 text-center">No worker found with that ID.</p>
      )}
      {lookupMutation.isSuccess && (
        <div className="flex items-center justify-between gap-4 mt-3 bg-background rounded-lg p-3">
          <div>
            <span className="font-semibold text-text">{lookupMutation.data.displayName}</span>
            <span className="text-sm text-text-muted">
              {' '}
              {[lookupMutation.data.skill, lookupMutation.data.locationState].filter(Boolean).join(' · ')}
            </span>
          </div>
          <Badge status={lookupMutation.data.verificationStatus} />
        </div>
      )}
    </Card>
  )
}

export function JobList() {
  const [tab, setTab] = useState<Tab>('feed')

  return (
    <PortalLayout title="Find work" homeTo="/jobs" navItems={workerNavItems}>
      <h1 className="text-2xl font-bold text-text mb-4">Worker App</h1>

      <WorkerLookupBox />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('feed')}
          className={`flex-1 h-12 rounded-lg font-semibold flex items-center justify-center gap-2 ${
            tab === 'feed' ? 'bg-primary text-text-inverse' : 'bg-background border border-border text-text'
          }`}
        >
          📋 Job Feed
        </button>
        <button
          onClick={() => setTab('post')}
          className={`flex-1 h-12 rounded-lg font-semibold flex items-center justify-center gap-2 ${
            tab === 'post' ? 'bg-primary text-text-inverse' : 'bg-background border border-border text-text'
          }`}
        >
          ➕ Post A Job
        </button>
      </div>

      {tab === 'feed' ? <JobFeedTab /> : <PostJobTab />}
    </PortalLayout>
  )
}
