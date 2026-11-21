import type { Job } from '../api/types'

/**
 * Trade filters for the job list. Same names as the mobile app's skill list
 * (Mgl_app_Expo src/constants/skills.ts), so a chip matches the skills on jobs.
 */
export const TRADES = [
  'Mason',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Welder',
  'Driver',
  'Housekeeping',
  'Security',
  'Cook',
  'Tailor',
  'General Helper',
]

/** A trade chip ("All" for none) plus free-text search, the same rules as the app's job list. */
export function filterJobs(jobs: Job[], trade: string, query: string): Job[] {
  const byTrade =
    trade === 'All'
      ? jobs
      : jobs.filter((job) => job.skillsRequired.some((s) => s.toLowerCase() === trade.toLowerCase()))
  const q = query.trim().toLowerCase()
  if (!q) return byTrade
  return byTrade.filter((job) =>
    [job.title, job.employerName, job.location, ...job.skillsRequired].some((field) =>
      field.toLowerCase().includes(q),
    ),
  )
}
