import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listAllApplications, updateAdminApplicationStatus } from '../../api/client'
import { PortalLayout } from '../../components/PortalLayout'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import type { Application } from '../../api/types'
import { adminNavItems } from './nav'

const STATUS_OPTIONS: Application['status'][] = ['submitted', 'under_review', 'accepted', 'rejected']

export function ApplicationReview() {
  const queryClient = useQueryClient()

  const {
    data: applications,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['admin-applications'], queryFn: listAllApplications })

  const statusMutation = useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string
      status: Application['status']
    }) => updateAdminApplicationStatus(applicationId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-applications'] }),
  })

  return (
    <PortalLayout title="Admin" homeTo="/admin/documents" navItems={adminNavItems}>
      <h1 className="text-2xl font-bold text-text mb-4">Application review</h1>

      {isLoading && <p className="text-text-muted">Loading…</p>}
      {isError && <ErrorBanner message="Couldn't load applications. Try refreshing the page." />}
      <div className="flex flex-col gap-2 max-w-2xl">
        {applications?.map((app) => (
          <Card key={app.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-text">{app.fullName || app.phone}</p>
              <p className="text-sm text-text-muted">
                {app.phone} · {app.workerId ?? 'No worker ID yet'}
              </p>
              <p className="text-sm text-text-muted">
                Applied to <span className="font-semibold">{app.jobTitle}</span> ·{' '}
                {app.applicationId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={app.status} />
              <select
                className="h-9 px-2 rounded-md border border-border bg-background text-sm text-text"
                value={app.status}
                onChange={(e) =>
                  statusMutation.mutate({
                    applicationId: app.id,
                    status: e.target.value as Application['status'],
                  })
                }
              >
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
      {applications && applications.length === 0 && (
        <p className="text-text-muted">No applications yet.</p>
      )}
    </PortalLayout>
  )
}
