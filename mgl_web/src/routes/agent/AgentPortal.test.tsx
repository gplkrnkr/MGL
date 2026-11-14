import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import * as apiClient from '../../api/client'
import type { Profile } from '../../api/types'
import { AgentPortal } from './AgentPortal'

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  listMyRegistrations: vi.fn(),
  registerWorker: vi.fn(),
}))
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ profile: { fullName: 'Agent A', phone: '+919800000001' }, logout: vi.fn() }),
}))

const worker = {
  id: 'w1',
  fullName: 'Ravi Kumar',
  phone: '+919876543210',
  workerId: 'MGL-BEN-01234',
  skills: ['Mason'],
  verificationStatus: 'pending',
} as Profile

function renderPortal() {
  // gcTime: Infinity stops React Query scheduling garbage-collection timers in tests.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AgentPortal />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ravi Kumar' } })
  fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '9876543210' } })
  fireEvent.change(screen.getByLabelText('Main skill'), { target: { value: 'Mason' } })
  fireEvent.change(screen.getByLabelText('State'), { target: { value: 'Karnataka' } })
  fireEvent.change(screen.getByLabelText('Town / city'), { target: { value: 'Bengaluru' } })
  fireEvent.click(screen.getByRole('button', { name: 'Register worker' }))
}

describe('AgentPortal', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.listMyRegistrations).mockResolvedValue([])
  })

  it("registers a worker and shows their MGL ID", async () => {
    vi.mocked(apiClient.registerWorker).mockResolvedValue(worker)
    renderPortal()
    fillAndSubmit()

    expect(await screen.findByRole('status')).toHaveTextContent('MGL-BEN-01234')
    expect(apiClient.registerWorker).toHaveBeenCalledWith({
      phone: '9876543210',
      fullName: 'Ravi Kumar',
      skills: ['Mason'],
      location: { state: 'Karnataka', district: '', town: 'Bengaluru', pinCode: '' },
    })
    await waitFor(() => expect(apiClient.listMyRegistrations).toHaveBeenCalledTimes(2))
  })

  it("shows the backend's reason when a number is already registered", async () => {
    vi.mocked(apiClient.registerWorker).mockRejectedValue(
      new AxiosError('Conflict', '409', undefined, undefined, {
        status: 409,
        statusText: 'Conflict',
        data: { detail: 'This mobile number is already registered' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }),
    )
    renderPortal()
    fillAndSubmit()

    expect(await screen.findByText('This mobile number is already registered')).toBeInTheDocument()
  })

  it("lists the agent's registrations", async () => {
    vi.mocked(apiClient.listMyRegistrations).mockResolvedValue([worker])
    renderPortal()
    expect(await screen.findByText('Ravi Kumar')).toBeInTheDocument()
    expect(screen.getByText(/MGL-BEN-01234/)).toBeInTheDocument()
  })
})
