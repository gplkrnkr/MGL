import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Dashboard } from './Dashboard'
import { AuthProvider } from '../../context/AuthContext'
import * as apiClient from '../../api/client'
import type { EmployerProfile } from '../../api/types'

vi.mock('../../api/client')

const company: EmployerProfile = {
  id: 'e1',
  profileId: 'p1',
  companyName: '',
  companyDescription: '',
  website: null,
  gstin: null,
  contactName: null,
  contactPhone: null,
  city: null,
  createdAt: '2026-01-01T00:00:00Z',
}

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(apiClient.listMyJobs).mockResolvedValue([])
})

describe('employer Dashboard', () => {
  it('asks for a company name when none is set', async () => {
    vi.mocked(apiClient.getEmployerProfile).mockResolvedValue(company)
    renderDashboard()
    await waitFor(() => expect(screen.getByText('Complete your company profile')).toBeInTheDocument())
  })

  it('does not nag once the company is named', async () => {
    vi.mocked(apiClient.getEmployerProfile).mockResolvedValue({ ...company, companyName: 'BuildRight' })
    renderDashboard()
    await waitFor(() => expect(screen.getByText("You haven't posted any jobs yet.")).toBeInTheDocument())
    expect(screen.queryByText('Complete your company profile')).not.toBeInTheDocument()
  })
})
