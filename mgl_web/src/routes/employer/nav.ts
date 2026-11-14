import { showPreviews } from '../../lib/config'

export const employerNavItems = [
  { to: '/employer', label: 'Jobs' },
  // /employer/workers holds the company profile and, when previews are on, worker search.
  { to: '/employer/workers', label: showPreviews ? 'Employer Portal' : 'Company profile' },
]
