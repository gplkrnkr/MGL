import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { clearToken, getToken } from '../lib/session'
import * as apiClient from '../api/client'
import type { Profile } from '../api/types'

vi.mock('../api/client')

const mockProfile: Profile = {
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
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  clearToken()
  vi.clearAllMocks()
})

describe('AuthContext', () => {
  it('starts with no profile when there is no stored token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile).toBeNull()
  })

  it('loginAsWorker stores the token and sets the profile', async () => {
    vi.mocked(apiClient.verifyFirebaseToken).mockResolvedValue({
      access_token: 'tok-123',
      token_type: 'bearer',
      user_id: 'p1',
      phone: '+911234567890',
    })
    vi.mocked(apiClient.getMyProfile).mockResolvedValue(mockProfile)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.loginAsWorker('firebase-id-token')
    })

    expect(apiClient.verifyFirebaseToken).toHaveBeenCalledWith('firebase-id-token')
    expect(getToken()).toBe('tok-123')
    expect(result.current.profile).toEqual(mockProfile)
  })

  it('loginAsEmployer calls selectEmployerRole instead of getMyProfile', async () => {
    vi.mocked(apiClient.verifyFirebaseToken).mockResolvedValue({
      access_token: 'tok-456',
      token_type: 'bearer',
      user_id: 'p1',
      phone: '+911234567890',
    })
    vi.mocked(apiClient.selectEmployerRole).mockResolvedValue({ ...mockProfile, isEmployer: true })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.loginAsEmployer('firebase-id-token')
    })

    expect(apiClient.selectEmployerRole).toHaveBeenCalled()
    expect(apiClient.getMyProfile).not.toHaveBeenCalled()
    expect(result.current.profile?.isEmployer).toBe(true)
  })

  it('logout clears the token and profile', async () => {
    vi.mocked(apiClient.verifyFirebaseToken).mockResolvedValue({
      access_token: 'tok-789',
      token_type: 'bearer',
      user_id: 'p1',
      phone: '+911234567890',
    })
    vi.mocked(apiClient.getMyProfile).mockResolvedValue(mockProfile)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.loginAsWorker('firebase-id-token')
    })

    act(() => result.current.logout())

    expect(getToken()).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('clears an invalid stored token on initial load', async () => {
    localStorage.setItem('mgl_token', 'stale-token')
    vi.mocked(apiClient.getMyProfile).mockRejectedValue(new Error('401'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.profile).toBeNull()
    expect(getToken()).toBeNull()
  })
})
