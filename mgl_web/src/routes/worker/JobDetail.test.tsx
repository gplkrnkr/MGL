import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JobDetail } from './JobDetail'
import { AuthProvider } from '../../context/AuthContext'
import * as apiClient from '../../api/client'
import type { Job } from '../../api/types'

vi.mock('../../api/client')

const job: Job = {
  id: 'j1',
  title: 'Mason for apartment project',
  description: 'Brick work',
  location: 'Whitefield, Bengaluru',
  skillsRequired: ['Mason'],
  wageMin: 750,
  wageMax: 900,
  wagePeriod: 'daily',
  employerName: 'MGL Demo Builders',
  distanceKm: 0,
  openings: 6,
  isUrgent: false,
  status: 'open',
  createdAt: '2026-11-21T00:00:00Z',
} as Job

function renderDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/jobs/j1']}>
        <AuthProvider>
          <Routes>
            <Route path="/jobs/:jobId" element={<JobDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('JobDetail sample jobs', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(apiClient.listMyApplications).mockResolvedValue([])
  })

  it('labels a sample job and explains it', async () => {
    vi.mocked(apiClient.getJob).mockResolvedValue({ ...job, isSample: true })
    renderDetail()
    expect(await screen.findByText('Sample')).toBeInTheDocument()
    expect(screen.getByText(/sample job to show how My Grand Labour works/)).toBeInTheDocument()
  })

  it('shows nothing extra for a real job', async () => {
    vi.mocked(apiClient.getJob).mockResolvedValue(job)
    renderDetail()
    expect(await screen.findByText(job.title)).toBeInTheDocument()
    expect(screen.queryByText('Sample')).not.toBeInTheDocument()
  })
})

describe('JobDetail when signed out', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('offers "Sign in to apply", adds JobPosting data and skips the applications query', async () => {
    vi.mocked(apiClient.getJob).mockResolvedValue(job)
    renderDetail()
    expect(await screen.findByRole('button', { name: 'Sign in to apply' })).toBeInTheDocument()
    expect(apiClient.listMyApplications).not.toHaveBeenCalled()
    const ld = document.head.querySelector('script[type="application/ld+json"]')
    expect(JSON.parse(ld!.textContent!)['@type']).toBe('JobPosting')
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://mygrandlabour.com/jobs/j1',
    )
  })

  it('marks a sample job noindex with no JobPosting data', async () => {
    vi.mocked(apiClient.getJob).mockResolvedValue({ ...job, isSample: true })
    renderDetail()
    await screen.findByText('Sample')
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull()
  })
})
