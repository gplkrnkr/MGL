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

export interface JobFilter {
  trade: string
  query: string
}

const FILTER_KEY = 'mgl_job_filter'
const DEFAULT_FILTER: JobFilter = { trade: 'All', query: '' }

/**
 * The trade chip and search this browser last used on the job list, so visitors come back to the
 * same view. Device-only and nothing personal; blocked storage or bad data gives the defaults.
 */
export function loadJobFilter(): JobFilter {
  try {
    const saved = JSON.parse(window.localStorage.getItem(FILTER_KEY) ?? 'null') as Partial<JobFilter> | null
    const trade = saved?.trade === 'All' || TRADES.includes(saved?.trade ?? '') ? saved!.trade! : 'All'
    const query = typeof saved?.query === 'string' ? saved.query.slice(0, 100) : ''
    return { trade, query }
  } catch {
    return DEFAULT_FILTER
  }
}

export function saveJobFilter(filter: JobFilter): void {
  try {
    window.localStorage.setItem(FILTER_KEY, JSON.stringify(filter))
  } catch {
    // Storage blocked (private mode, site data cleared): just don't remember.
  }
}
