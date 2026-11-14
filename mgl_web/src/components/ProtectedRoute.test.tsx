import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminRoute, AgentRoute, EmployerRoute, WorkerRoute } from './ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'
import { clearToken, setToken } from '../lib/session'
import * as apiClient from '../api/client'
import type { Profile } from '../api/types'

vi.mock('../api/client')

const baseProfile: Profile = {
  id: 'p1',
  phone: '+911234567890',
  fullName: 'Test User',
  preferredLanguage: null,
  photoUrl: null,
  dateOfBirth: null,
  gender: null,
  location: null,
  skills: [],
  skillExperience: {},
  preferredWorkLocation: null,
  preferredWorkTypes: [],
  willingToRelocate: null,
  availability: null,
  governmentIdType: null,
  workerId: null,
  verificationStatus: 'pending',
  isEmployer: false,
  isAdmin: false,
  isAgent: false,
  registeredByAgent: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderAt(path: string, guarded: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>worker login page</div>} />
          <Route path="/employer/login" element={<div>employer login page</div>} />
          <Route path="/admin/login" element={<div>admin login page</div>} />
          <Route path="/agent/login" element={<div>agent login page</div>} />
          <Route path={path} element={guarded} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  clearToken()
  vi.clearAllMocks()
})

describe('WorkerRoute', () => {
  it('redirects to /login when logged out', async () => {
    renderAt('/jobs', <WorkerRoute>content</WorkerRoute>)
    await waitFor(() => expect(screen.getByText('worker login page')).toBeInTheDocument())
  })

  it('renders children when a worker is logged in', async () => {
    setToken('tok-1')
    vi.mocked(apiClient.getMyProfile).mockResolvedValue(baseProfile)

    renderAt('/jobs', <WorkerRoute>protected content</WorkerRoute>)
    await waitFor(() => expect(screen.getByText('protected content')).toBeInTheDocument())
  })
})

describe('EmployerRoute', () => {
  it('redirects to /employer/login when logged out', async () => {
    renderAt('/employer', <EmployerRoute>content</EmployerRoute>)
    await waitFor(() => expect(screen.getByText('employer login page')).toBeInTheDocument())
  })

  it('redirects a non-employer worker to /employer/login', async () => {
    setToken('tok-2')
    vi.mocked(apiClient.getMyProfile).mockResolvedValue({ ...baseProfile, isEmployer: false })

    renderAt('/employer', <EmployerRoute>employer content</EmployerRoute>)
    await waitFor(() => expect(screen.getByText('employer login page')).toBeInTheDocument())
  })

  it('renders children for an employer', async () => {
    setToken('tok-3')
    vi.mocked(apiClient.getMyProfile).mockResolvedValue({ ...baseProfile, isEmployer: true })

    renderAt('/employer', <EmployerRoute>employer content</EmployerRoute>)
    await waitFor(() => expect(screen.getByText('employer content')).toBeInTheDocument())
  })
})

describe('AdminRoute', () => {
  it('redirects to /admin/login when logged out', async () => {
    renderAt('/admin/documents', <AdminRoute>content</AdminRoute>)
    await waitFor(() => expect(screen.getByText('admin login page')).toBeInTheDocument())
  })

  it('redirects a non-admin worker to /admin/login', async () => {
    setToken('tok-4')
    vi.mocked(apiClient.getMyProfile).mockResolvedValue({ ...baseProfile, isAdmin: false })

    renderAt('/admin/documents', <AdminRoute>admin content</AdminRoute>)
    await waitFor(() => expect(screen.getByText('admin login page')).toBeInTheDocument())
  })

  it('renders children for an admin', async () => {
    setToken('tok-5')
    vi.mocked(apiClient.getMyProfile).mockResolvedValue({ ...baseProfile, isAdmin: true })

    renderAt('/admin/documents', <AdminRoute>admin content</AdminRoute>)
    await waitFor(() => expect(screen.getByText('admin content')).toBeInTheDocument())
  })
})

describe('AgentRoute', () => {
  it('redirects to /agent/login when logged out', async () => {
    renderAt('/agent', <AgentRoute>content</AgentRoute>)
    await waitFor(() => expect(screen.getByText('agent login page')).toBeInTheDocument())
  })

  it('explains, rather than redirecting, when a signed-in user is not an agent', async () => {
    setToken('tok-6')
    vi.mocked(apiClient.getMyProfile).mockResolvedValue({ ...baseProfile, isAgent: false })

    renderAt('/agent', <AgentRoute>agent content</AgentRoute>)
    await waitFor(() => expect(screen.getByText(/isn.t a field agent account/)).toBeInTheDocument())
    expect(screen.queryByText('agent content')).not.toBeInTheDocument()
  })

  it('renders children for an agent', async () => {
    setToken('tok-7')
    vi.mocked(apiClient.getMyProfile).mockResolvedValue({ ...baseProfile, isAgent: true })

    renderAt('/agent', <AgentRoute>agent content</AgentRoute>)
    await waitFor(() => expect(screen.getByText('agent content')).toBeInTheDocument())
  })
})
