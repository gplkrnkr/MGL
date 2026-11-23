import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { isSignedIn, markSignedIn, markSignedOut } from '../lib/session'
import * as apiClient from '../api/client'
import type { Profile } from '../api/types'
import { AxiosError, AxiosHeaders } from 'axios'
import { WrongRoleError } from '../lib/roleError'

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
  isAgent: false,
  registeredByAgent: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  markSignedOut()
  localStorage.clear()
  vi.clearAllMocks()
})

describe('AuthContext', () => {
  it('starts with no profile when there is no stored token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile).toBeNull()
  })

  it('loginAsWorker marks the browser signed in (no token stored) and sets the profile', async () => {
    vi.mocked(apiClient.verifyFirebaseToken).mockResolvedValue({
      access_token: null,
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
    expect(isSignedIn()).toBe(true)
    expect(localStorage.getItem('mgl_token')).toBeNull()
    expect(result.current.profile).toEqual(mockProfile)
  })

  it('loginAsEmployer calls selectEmployerRole instead of getMyProfile', async () => {
    vi.mocked(apiClient.verifyFirebaseToken).mockResolvedValue({
      access_token: null,
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

  it('logout asks the backend to clear the cookie and clears the profile', async () => {
    vi.mocked(apiClient.verifyFirebaseToken).mockResolvedValue({
      access_token: null,
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

    await act(async () => {
      await result.current.logout()
    })

    expect(apiClient.logoutSession).toHaveBeenCalled()
    expect(isSignedIn()).toBe(false)
    expect(result.current.profile).toBeNull()
  })

  it('ends an expired session on initial load', async () => {
    markSignedIn()
    vi.mocked(apiClient.getMyProfile).mockRejectedValue(new Error('401'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.profile).toBeNull()
    expect(isSignedIn()).toBe(false)
    expect(apiClient.logoutSession).toHaveBeenCalled()
  })

  it('removes a token left by the old localStorage sign-in', async () => {
    localStorage.setItem('mgl_token', 'old-token')

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(localStorage.getItem('mgl_token')).toBeNull()
    expect(apiClient.getMyProfile).not.toHaveBeenCalled()
  })

  it('does not ask who is signed in when the browser was never signed in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(apiClient.getMyProfile).not.toHaveBeenCalled()
  })

  it('rejects an employer number on the worker sign-in and leaves no session', async () => {
    vi.mocked(apiClient.verifyFirebaseToken).mockResolvedValue({
      access_token: null,
      token_type: 'bearer',
      user_id: 'p1',
      phone: '+911234567890',
    })
    vi.mocked(apiClient.getMyProfile).mockResolvedValue({ ...mockProfile, isEmployer: true })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(result.current.loginAsWorker('firebase-id-token')).rejects.toBeInstanceOf(WrongRoleError)
    })
    expect(isSignedIn()).toBe(false)
    expect(apiClient.logoutSession).toHaveBeenCalled()
    expect(result.current.profile).toBeNull()
  })

  it('turns the backend 409 into a wrong-role error on the employer sign-in', async () => {
    vi.mocked(apiClient.verifyFirebaseToken).mockResolvedValue({
      access_token: null,
      token_type: 'bearer',
      user_id: 'p1',
      phone: '+911234567890',
    })
    const conflict = new AxiosError('Conflict', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      data: { detail: 'registered as a worker' },
      headers: {},
      config: { headers: new AxiosHeaders() },
    })
    vi.mocked(apiClient.selectEmployerRole).mockRejectedValue(conflict)

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let caught: unknown
    await act(async () => {
      caught = await result.current.loginAsEmployer('firebase-id-token').catch((e: unknown) => e)
    })
    expect(caught).toBeInstanceOf(WrongRoleError)
    expect((caught as WrongRoleError).registeredAs).toBe('worker')
    expect(isSignedIn()).toBe(false)
    expect(apiClient.logoutSession).toHaveBeenCalled()
    expect(result.current.profile).toBeNull()
  })
})
