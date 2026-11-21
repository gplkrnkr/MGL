import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JobList } from './JobList'
import { AuthProvider } from '../../context/AuthContext'
import * as apiClient from '../../api/client'
import type { Job } from '../../api/types'

vi.mock('../../api/client')

const base = {
  description: 'Work',
  wageMin: 700,
  wageMax: 900,
  wagePeriod: 'daily',
  employerName: 'ABC Builders',
  distanceKm: 0,
  openings: 2,
  isUrgent: false,
  status: 'open',
  createdAt: '2026-11-20T00:00:00Z',
}
const jobs = [
  { ...base, id: 'm1', title: 'Mason for apartment', location: 'Bengaluru', skillsRequired: ['Mason'] },
  { ...base, id: 'c1', title: 'Carpenter for interiors', location: 'Kochi', skillsRequired: ['Carpenter'] },
] as Job[]

function renderList() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/jobs']}>
        <AuthProvider>
          <JobList />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('public job list', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(apiClient.listJobs).mockResolvedValue(jobs)
  })

  it('shows jobs with search and trade chips when signed out', async () => {
    renderList()
    expect(await screen.findByText('Mason for apartment')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search jobs' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Carpenter' }))
    expect(screen.queryByText('Mason for apartment')).not.toBeInTheDocument()
    expect(screen.getByText('Carpenter for interiors')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'bengaluru' } })
    expect(screen.getByText('Mason for apartment')).toBeInTheDocument()
    expect(screen.queryByText('Carpenter for interiors')).not.toBeInTheDocument()
  })

  it('asks a signed-out visitor to sign in when they open a job, but still lets them view it', async () => {
    renderList()
    fireEvent.click(await screen.findByText('Mason for apartment'))
    const dialog = screen.getByRole('dialog', { name: 'Sign in to apply' })
    expect(within(dialog).getByRole('link', { name: 'Sign in / Create your MGL ID' })).toHaveAttribute(
      'href',
      '/login?next=%2Fjobs%2Fm1',
    )
    expect(within(dialog).getByRole('link', { name: 'Just view the job' })).toHaveAttribute('href', '/jobs/m1')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
