import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listMyJobs } from '../../api/client'
import { AppShell } from '../../components/AppShell'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { employerNavItems } from './nav'

export function Dashboard() {
  const { data: jobs, isLoading, isError } = useQuery({ queryKey: ['my-jobs'], queryFn: listMyJobs })

  return (
    <AppShell portalTitle="Employer dashboard" portalNavItems={employerNavItems}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text">Your job postings</h1>
        <Link to="/employer/jobs/new">
          <Button>Post a job</Button>
        </Link>
      </div>

      {isLoading && <p className="text-text-muted">Loading…</p>}
      {isError && <ErrorBanner message="Couldn't load your job postings. Try refreshing the page." />}
      <div className="flex flex-col gap-2">
        {jobs?.map((job) => (
          <Card key={job.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-text">{job.title}</p>
              <p className="text-sm text-text-muted">
                {job.location || 'No location set'} · {job.openings} opening(s)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge status={job.status} />
              <Link to={`/employer/jobs/${job.id}/applicants`}>
                <Button variant="secondary" className="h-9 px-4 text-sm">
                  Applicants
                </Button>
              </Link>
              <Link to={`/employer/jobs/${job.id}`}>
                <Button variant="ghost" className="h-9 px-4 text-sm">
                  Edit
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
      {jobs && jobs.length === 0 && (
        <p className="text-text-muted">You haven't posted any jobs yet.</p>
      )}
    </AppShell>
  )
}
