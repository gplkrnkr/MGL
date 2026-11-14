import { showPreviews } from '../../lib/config'

export const employerNavItems = [
  { to: '/employer', label: 'My jobs' },
  { to: '/employer/jobs/new', label: 'Post a job' },
  { to: '/employer/company', label: 'Company profile' },
  // Worker search needs /api/employer/workers, which the backend doesn't have yet.
  ...(showPreviews ? [{ to: '/employer/workers', label: 'Find workers' }] : []),
]
