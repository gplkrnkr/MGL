import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { getJob, listApplicants, updateApplicantStatus } from '../../api/client'
import { PortalLayout } from '../../components/PortalLayout'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import type { Application } from '../../api/types'
import { employerNavItems } from './nav'

const STATUS_OPTIONS: Application['status'][] = ['under_review', 'accepted', 'rejected']

export function JobApplicants() {
  const { jobId } = useParams<{ jobId: string }>()
  const queryClient = useQueryClient()

  const { data: job } = useQuery({ queryKey: ['job', jobId], queryFn: () => getJob(jobId!), enabled: !!jobId })
  const {
    data: applicants,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['applicants', jobId],
    queryFn: () => listApplicants(jobId!),
    enabled: !!jobId,
  })

  const statusMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: Application['status'] }) =>
      updateApplicantStatus(applicationId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicants', jobId] }),
  })

  return (
    <PortalLayout title="Hire workers" homeTo="/employer" navItems={employerNavItems}>
      <h1 className="text-2xl font-bold text-text mb-1">Applicants</h1>
      {job && <p className="text-text-muted mb-4">{job.title}</p>}

      {isLoading && <p className="text-text-muted">Loading…</p>}
      {isError && <ErrorBanner message="Couldn't load applicants. Try refreshing the page." />}
      <div className="flex flex-col gap-2 max-w-2xl">
        {applicants?.map((applicant) => (
          <Card key={applicant.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-text">{applicant.fullName || applicant.phone}</p>
              <p className="text-sm text-text-muted">
                {applicant.phone} · {applicant.workerId ?? 'No worker ID yet'}
              </p>
              {applicant.skills.length > 0 && (
                <p className="text-sm text-text-muted">{applicant.skills.join(', ')}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge status={applicant.status} />
              <select
                className="h-9 px-2 rounded-md border border-border bg-background text-sm text-text"
                value={applicant.status}
                onChange={(e) =>
                  statusMutation.mutate({
                    applicationId: applicant.id,
                    status: e.target.value as Application['status'],
                  })
                }
              >
                <option value="submitted" disabled>
                  submitted
                </option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        ))}
      </div>
      {applicants && applicants.length === 0 && (
        <p className="text-text-muted">No applicants yet.</p>
      )}
    </PortalLayout>
  )
}
