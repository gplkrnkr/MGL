import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { applyToJob, getJob, listMyApplications } from '../../api/client'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { useAuth } from '../../context/AuthContext'
import type { Job } from '../../api/types'
import { jobPageHead, usePageHead } from '../../lib/seo'
import { JobsLayout } from './JobsLayout'

function buildJobTips(job: Job, workerSkills: string[]): string[] {
  const tips: string[] = []
  const normalizedWorkerSkills = workerSkills.map((s) => s.toLowerCase())
  const matched = job.skillsRequired.filter((s) => normalizedWorkerSkills.includes(s.toLowerCase()))

  if (job.skillsRequired.length === 0) {
    tips.push('This job has no specific skill requirements listed — most workers can apply.')
  } else if (matched.length === job.skillsRequired.length) {
    tips.push(`Strong match: all ${matched.length} required skill(s) are on your profile.`)
  } else if (matched.length > 0) {
    tips.push(`Partial match: you have ${matched.length} of ${job.skillsRequired.length} required skills.`)
  } else {
    tips.push("None of this job's required skills are on your profile yet — consider adding them if you have them.")
  }

  tips.push(`Pays ₹${job.wageMin}–${job.wageMax} per ${job.wagePeriod === 'daily' ? 'day' : 'month'}.`)
  tips.push(
    job.openings > 1
      ? `${job.openings} openings available — good odds if you apply soon.`
      : 'Only 1 opening — apply promptly if interested.',
  )
  return tips
}

export function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const [applied, setApplied] = useState(false)
  const [tips, setTips] = useState<string[] | null>(null)
  const [loadingTips, setLoadingTips] = useState(false)

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId!),
    enabled: !!jobId,
  })

  const navigate = useNavigate()
  const isWorker = !!profile && !profile.isEmployer

  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: listMyApplications,
    enabled: isWorker,
  })

  usePageHead(job ? jobPageHead(job) : null)

  const alreadyApplied = applied || applications?.some((a) => a.jobId === jobId)

  const applyMutation = useMutation({
    mutationFn: () => applyToJob(jobId!),
    onSuccess: () => {
      setApplied(true)
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })

  return (
    <JobsLayout>
      {isLoading && <p className="text-text-muted">Loading…</p>}
      {isError && <ErrorBanner message="Couldn't load this job. Try refreshing the page." />}
      {job && (
        <Card className="max-w-2xl flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text">{job.title}</h1>
              <p className="text-text-muted">{job.location}</p>
            </div>
            <div className="flex gap-2">
              {job.isSample && <Badge status="default" label="Sample" />}
              {job.isUrgent && <Badge status="warning" label="Urgent" />}
              <Badge status={job.status} />
            </div>
          </div>
          {job.isSample && (
            <p className="text-sm text-text-muted bg-primary-light rounded-lg px-3 py-2">
              This is a sample job to show how My Grand Labour works. Applications don&apos;t reach a
              real employer.
            </p>
          )}
          <p className="text-text">
            ₹{job.wageMin}–{job.wageMax} / {job.wagePeriod} · {job.openings} opening(s)
          </p>
          {job.skillsRequired.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.skillsRequired.map((skill) => (
                <span key={skill} className="px-2 py-1 rounded-full border border-border text-xs text-text-muted">
                  {skill}
                </span>
              ))}
            </div>
          )}
          <p className="text-text">{job.description}</p>
          <p className="text-sm text-text-muted">Posted by {job.employerName || 'My Grand Labour'}</p>

          <div>
            <Button
              variant="secondary"
              className="w-fit h-9 px-4 text-sm"
              disabled={loadingTips}
              onClick={async () => {
                setLoadingTips(true)
                await new Promise((resolve) => setTimeout(resolve, 500))
                setTips(buildJobTips(job, profile?.skills ?? []))
                setLoadingTips(false)
              }}
            >
              {loadingTips ? 'Thinking…' : '💡 Tips for this job'}
            </Button>
            {tips && (
              <ul className="mt-2 flex flex-col gap-1 text-sm text-text-muted list-disc list-inside">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            )}
          </div>

          {!profile ? (
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => navigate(`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`)}
                disabled={job.status !== 'open'}
                className="w-fit"
              >
                Sign in to apply
              </Button>
              <p className="text-sm text-text-muted">
                Free for workers. Sign in with your phone number, then apply in one tap.
              </p>
            </div>
          ) : profile.isEmployer ? (
            <p className="text-sm text-text-muted">
              You&apos;re signed in as an employer. Workers apply with their own phone number.
            </p>
          ) : alreadyApplied ? (
            <p className="text-success font-semibold">You've applied to this job.</p>
          ) : (
            <Button
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending || job.status !== 'open'}
              className="w-fit"
            >
              {applyMutation.isPending ? 'Applying…' : 'Apply now'}
            </Button>
          )}
          {applyMutation.isError && (
            <ErrorBanner message="Couldn't submit your application. Try again." />
          )}
        </Card>
      )}
    </JobsLayout>
  )
}
