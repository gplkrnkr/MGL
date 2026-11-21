import { matchPath } from 'react-router-dom'

const SITE = 'My Grand Labour'

// Browser-tab title for each app route. More specific patterns first.
const TITLES: [pattern: string, title: string][] = [
  ['/login', 'Sign in'],
  ['/jobs/:jobId', 'Job details'],
  ['/jobs', 'Jobs near you'],
  ['/applications', 'My applications'],
  ['/profile', 'My profile'],
  ['/worker/verify/digilocker', 'Aadhaar verification'],
  ['/employer/login', 'Employer sign in'],
  ['/employer/jobs/new', 'Post a job'],
  ['/employer/jobs/:jobId/applicants', 'Applicants'],
  ['/employer/jobs/:jobId', 'Edit job'],
  ['/employer/company', 'Company profile'],
  ['/employer/workers', 'Find workers'],
  ['/employer', 'Employer dashboard'],
  ['/admin/login', 'Admin sign in'],
  ['/admin/documents', 'Document review'],
  ['/admin/applications', 'Application review'],
  ['/admin/agents', 'Agents'],
  ['/agent/login', 'Agent sign in'],
  ['/agent', 'Agent portal'],
  ['/demo/*', 'Preview'],
]

export function pageTitle(pathname: string): string {
  if (pathname === '/') return SITE
  const match = TITLES.find(([pattern]) => matchPath(pattern, pathname))
  return `${match ? match[1] : 'Page not found'} · ${SITE}`
}
