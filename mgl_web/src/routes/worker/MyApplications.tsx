import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listJobs, listMyApplications } from '../../api/client'
import { PortalLayout } from '../../components/PortalLayout'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { workerNavItems } from './nav'

export function MyApplications() {
  const {
    data: applications,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['applications'],
    queryFn: listMyApplications,
  })
  const { data: jobs } = useQuery({ queryKey: ['jobs'], queryFn: listJobs })

  const jobTitle = (jobId: string) => jobs?.find((j) => j.id === jobId)?.title ?? 'Job'

  return (
    <PortalLayout title="Find work" homeTo="/jobs" navItems={workerNavItems}>
      <h1 className="text-2xl font-bold text-text mb-4">My applications</h1>
      {isLoading && <p className="text-text-muted">Loading…</p>}
      {isError && <ErrorBanner message="Couldn't load your applications. Try refreshing the page." />}
      <div className="flex flex-col gap-2 max-w-2xl">
        {applications?.map((app) => (
          <Link key={app.id} to={`/jobs/${app.jobId}`}>
            <Card className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-text">{jobTitle(app.jobId)}</p>
                <p className="text-sm text-text-muted">
                  Applied {new Date(app.appliedAt).toLocaleDateString()} · {app.applicationId}
                </p>
              </div>
              <Badge status={app.status} />
            </Card>
          </Link>
        ))}
      </div>
      {applications && applications.length === 0 && (
        <p className="text-text-muted">You haven't applied to any jobs yet.</p>
      )}
    </PortalLayout>
  )
}
