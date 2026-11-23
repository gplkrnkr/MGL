import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createJob, listJobs, lookupWorker, selectEmployerRole } from '../../api/client'
import { filterJobs, loadJobFilter, saveJobFilter, TRADES } from '../../lib/jobFilters'
import { usePageHead, SITE_URL } from '../../lib/seo'
import { SignInPrompt } from '../../components/SignInPrompt'
import { JobsLayout } from './JobsLayout'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { Field } from '../../components/ui/Field'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from '../../context/AuthContext'

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
  const { profile } = useAuth()
  const [trade, setTrade] = useState(() => loadJobFilter().trade)
  const [query, setQuery] = useState(() => loadJobFilter().query)
  useEffect(() => saveJobFilter({ trade, query }), [trade, query])
  const [prompt, setPrompt] = useState<{ id: string; title: string } | null>(null)
  const visible = filterJobs(jobs ?? [], trade, query)

  return (
    <>
      <div className="flex flex-col gap-3 mb-4">
        <label className="relative block">
          <span className="sr-only">Search jobs</span>
          <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, skills or places"
            className="w-full h-12 pl-11 pr-4 rounded-lg border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter by trade">
          {['All', ...TRADES].map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={trade === t}
              onClick={() => setTrade(t)}
              className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold border transition-colors ${
                trade === t
                  ? 'bg-primary text-text-inverse border-primary'
                  : 'bg-background text-text border-border hover:border-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-text-muted">Loading jobs…</p>}
      {isError && <ErrorBanner message="Couldn't load jobs. Try refreshing the page." />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visible.map((job) => (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            onClick={(e) => {
              // Signed-out visitors are invited to sign in first; the link stays real for crawlers.
              if (!profile) {
                e.preventDefault()
                setPrompt({ id: job.id, title: job.title })
              }
            }}
          >
            <Card className="h-full flex flex-col gap-2 hover:border-primary transition-colors">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-text">{job.title}</h2>
                <div className="flex gap-1 shrink-0">
                  {job.isSample && <Badge status="default" label="Sample" />}
                  {job.isUrgent && <Badge status="warning" label="Urgent" />}
                </div>
              </div>
              <p className="text-sm text-text-muted">{job.location}</p>
              <p className="text-sm text-text">
                ₹{job.wageMin}–{job.wageMax} / {job.wagePeriod}
              </p>
              {job.skillsRequired.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {job.skillsRequired.map((skill) => (
                    <span key={skill} className="px-2 py-0.5 rounded-full bg-primary-light text-xs font-semibold text-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-text-muted line-clamp-2">{job.description}</p>
            </Card>
          </Link>
        ))}
      </div>
      {jobs && jobs.length === 0 && <p className="text-text-muted">No open jobs right now.</p>}
      {jobs && jobs.length > 0 && visible.length === 0 && (
        <p className="text-text-muted">No jobs match. Try a different search or trade.</p>
      )}
      {prompt && <SignInPrompt jobId={prompt.id} jobTitle={prompt.title} onClose={() => setPrompt(null)} />}
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
        className="self-center bg-accent text-primary hover:opacity-90"
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
  const { profile } = useAuth()
  const isWorker = !!profile && !profile.isEmployer

  usePageHead({
    title: 'Jobs near you · My Grand Labour',
    description:
      'Browse jobs for masons, electricians, plumbers, welders, drivers, housekeeping staff and more across India. Free for workers.',
    canonical: `${SITE_URL}/jobs`,
  })

  // Public view (signed out, or an employer): just the job feed.
  if (!isWorker) {
    return (
      <JobsLayout>
        <h1 className="text-2xl font-bold text-text mb-1">Jobs near you</h1>
        <p className="text-text-muted mb-4">
          Browse open jobs. Sign in with your phone number to apply. It&apos;s free for workers.
        </p>
        <JobFeedTab />
      </JobsLayout>
    )
  }

  return (
    <JobsLayout>
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
    </JobsLayout>
  )
}
