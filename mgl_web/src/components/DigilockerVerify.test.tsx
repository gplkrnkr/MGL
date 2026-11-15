import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DigilockerVerify } from './DigilockerVerify'
import * as apiClient from '../api/client'
import type { DigilockerStatus } from '../api/types'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  getDigilockerStatus: vi.fn(),
  startDigilockerVerification: vi.fn(),
}))

const off: DigilockerStatus = { enabled: false, verified: false, verifiedAt: null, last4: null, nameMatch: null }

function renderBox() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DigilockerVerify />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DigilockerVerify', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders nothing while the feature is off', async () => {
    vi.mocked(apiClient.getDigilockerStatus).mockResolvedValue(off)
    const { container } = renderBox()
    await waitFor(() => expect(apiClient.getDigilockerStatus).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('starts DigiLocker sign-in when enabled', async () => {
    vi.mocked(apiClient.getDigilockerStatus).mockResolvedValue({ ...off, enabled: true })
    vi.mocked(apiClient.startDigilockerVerification).mockResolvedValue('https://example.test/authorize')
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })

    renderBox()
    fireEvent.click(await screen.findByRole('button', { name: /verify with digilocker/i }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://example.test/authorize'))
    vi.unstubAllGlobals()
  })

  it('shows the verified state with the last 4 digits', async () => {
    vi.mocked(apiClient.getDigilockerStatus).mockResolvedValue({
      enabled: true,
      verified: true,
      verifiedAt: '2026-11-15T00:00:00Z',
      last4: '1234',
      nameMatch: true,
    })
    renderBox()
    expect(await screen.findByText('Aadhaar verified')).toBeInTheDocument()
    expect(screen.getByText(/ending 1234/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
