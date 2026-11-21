import { describe, expect, it } from 'vitest'
import { jobPageHead, jobPostingJsonLd } from './seo'
import { safeNext } from './next'
import type { Job } from '../api/types'

const job: Job = {
  id: 'j1',
  title: 'Mason for apartment project',
  description: 'Brick and block work for a residential tower.',
  location: 'Whitefield, Bengaluru',
  skillsRequired: ['Mason'],
  wageMin: 750,
  wageMax: 900,
  wagePeriod: 'daily',
  employerName: 'Sunrise Builders',
  distanceKm: 0,
  openings: 6,
  isUrgent: false,
  status: 'open',
  createdAt: '2026-11-21T08:30:00Z',
} as Job

describe('jobPostingJsonLd', () => {
  it("has Google's required JobPosting fields for a real open job", () => {
    const ld = jobPostingJsonLd(job) as Record<string, any>
    expect(ld['@type']).toBe('JobPosting')
    expect(ld.title).toBe(job.title)
    expect(ld.description).toBe(job.description)
    expect(ld.datePosted).toBe('2026-11-21')
    expect(ld.hiringOrganization).toEqual({ '@type': 'Organization', name: 'Sunrise Builders' })
    expect(ld.jobLocation.address.addressCountry).toBe('IN')
    expect(ld.jobLocation.address.addressLocality).toBe('Whitefield, Bengaluru')
    expect(ld.baseSalary).toEqual({
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: { '@type': 'QuantitativeValue', minValue: 750, maxValue: 900, unitText: 'DAY' },
    })
    expect(ld.url).toBe('https://mygrandlabour.com/jobs/j1')
    expect(ld).not.toHaveProperty('directApply')
  })

  it('uses MONTH for monthly wages', () => {
    const ld = jobPostingJsonLd({ ...job, wagePeriod: 'monthly' }) as Record<string, any>
    expect(ld.baseSalary.value.unitText).toBe('MONTH')
  })

  it('gives no markup to sample, closed or incomplete jobs', () => {
    expect(jobPostingJsonLd({ ...job, isSample: true })).toBeNull()
    expect(jobPostingJsonLd({ ...job, status: 'closed' })).toBeNull()
    expect(jobPostingJsonLd({ ...job, employerName: '  ' })).toBeNull()
    expect(jobPostingJsonLd({ ...job, description: '' })).toBeNull()
    expect(jobPostingJsonLd({ ...job, description: job.title })).toBeNull()
  })
})

describe('jobPageHead', () => {
  it('sets a canonical URL and keeps real open jobs indexable', () => {
    const head = jobPageHead(job)
    expect(head.canonical).toBe('https://mygrandlabour.com/jobs/j1')
    expect(head.title).toBe('Mason for apartment project in Whitefield, Bengaluru · My Grand Labour')
    expect(head.description).toMatch(/₹750–900 per day/)
    expect(head.robots).toBeUndefined()
    expect(head.jsonLd).not.toBeNull()
  })

  it('noindexes sample and closed jobs', () => {
    expect(jobPageHead({ ...job, isSample: true }).robots).toBe('noindex')
    expect(jobPageHead({ ...job, status: 'closed' }).robots).toBe('noindex')
  })
})

describe('safeNext', () => {
  it('only accepts same-site paths', () => {
    expect(safeNext('/jobs/j1')).toBe('/jobs/j1')
    expect(safeNext(null)).toBeNull()
    expect(safeNext('https://evil.example')).toBeNull()
    expect(safeNext('//evil.example')).toBeNull()
    expect(safeNext('/\\evil.example')).toBeNull()
  })
})
