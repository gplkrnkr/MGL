import { describe, expect, it } from 'vitest'
import { filterJobs, TRADES } from './jobFilters'
import type { Job } from '../api/types'

const job = (over: Partial<Job>): Job =>
  ({
    id: 'j',
    title: 'Job',
    description: '',
    location: 'Chennai',
    skillsRequired: [],
    wageMin: 600,
    wageMax: 800,
    wagePeriod: 'daily',
    employerName: 'ABC',
    distanceKm: 0,
    openings: 1,
    isUrgent: false,
    status: 'open',
    createdAt: '2026-11-20T00:00:00Z',
    ...over,
  }) as Job

const jobs = [
  job({ id: 'a', title: 'Mason for apartment', skillsRequired: ['Mason'], location: 'Bengaluru' }),
  job({ id: 'b', title: 'Carpenter for interiors', skillsRequired: ['Carpenter'], employerName: 'Sunrise' }),
  job({ id: 'c', title: 'Site helper', skillsRequired: ['General Helper'], location: 'Thrissur' }),
]
const ids = (list: Job[]) => list.map((j) => j.id)

describe('filterJobs', () => {
  it('shows everything for All', () => {
    expect(ids(filterJobs(jobs, 'All', ''))).toEqual(['a', 'b', 'c'])
  })

  it('filters by trade chip', () => {
    expect(ids(filterJobs(jobs, 'Carpenter', ''))).toEqual(['b'])
    expect(ids(filterJobs(jobs, 'General Helper', ''))).toEqual(['c'])
  })

  it('searches title, employer, location and skills, ignoring case', () => {
    expect(ids(filterJobs(jobs, 'All', 'bengaluru'))).toEqual(['a'])
    expect(ids(filterJobs(jobs, 'All', 'SUNRISE'))).toEqual(['b'])
    expect(ids(filterJobs(jobs, 'All', ' helper '))).toEqual(['c'])
  })

  it('combines a chip with search', () => {
    expect(ids(filterJobs(jobs, 'Mason', 'thrissur'))).toEqual([])
  })

  it('uses the app skill names', () => {
    expect(TRADES).toEqual(expect.arrayContaining(['Mason', 'Carpenter', 'Electrician', 'General Helper']))
  })
})
