import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, verifyFirebaseToken } from './client'
import { getToken, setToken } from '../lib/session'

describe('verifyFirebaseToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('posts the Firebase ID token and returns the raw snake_case token response', async () => {
    const postSpy = vi.spyOn(http, 'post').mockResolvedValue({
      data: { access_token: 'abc', token_type: 'bearer', user_id: 'p1', phone: '+911234567890' },
    })

    const result = await verifyFirebaseToken('firebase-id-token')

    expect(postSpy).toHaveBeenCalledWith('/api/auth/firebase/verify', { idToken: 'firebase-id-token' })
    // Unlike the rest of the API (camelCase via serialization_alias), the auth
    // endpoints intentionally return snake_case fields -- see mgl_backend's
    // TokenResponse schema, which has no aliases.
    expect(result).toEqual({
      access_token: 'abc',
      token_type: 'bearer',
      user_id: 'p1',
      phone: '+911234567890',
    })
  })
})

describe('401 response interceptor', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setToken('some-token')
  })

  it('clears the session and redirects to / on a 401 while a token is set', async () => {
    const assignSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, pathname: '/jobs', assign: assignSpy },
      writable: true,
    })

    const rejected = (http.interceptors.response as unknown as { handlers: Array<{ rejected: (e: unknown) => Promise<unknown> }> })
      .handlers[0].rejected

    const axiosError = Object.assign(new Error('Unauthorized'), {
      isAxiosError: true,
      response: { status: 401 },
    })
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)

    await expect(rejected(axiosError)).rejects.toBe(axiosError)

    expect(getToken()).toBeNull()
    expect(assignSpy).toHaveBeenCalledWith('/')
  })
})

describe('apiErrorMessage', () => {
  it("returns the backend's detail string", async () => {
    const { apiErrorMessage } = await import('./client')
    const error = Object.assign(new Error('x'), { isAxiosError: true, response: { data: { detail: 'Nope' } } })
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)
    expect(apiErrorMessage(error, 'fallback')).toBe('Nope')
  })

  it('unwraps the first validation message', async () => {
    const { apiErrorMessage } = await import('./client')
    const error = Object.assign(new Error('x'), {
      isAxiosError: true,
      response: { data: { detail: [{ msg: 'Value error, Enter a valid 10-digit Indian mobile number' }] } },
    })
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true)
    expect(apiErrorMessage(error, 'fallback')).toBe('Enter a valid 10-digit Indian mobile number')
  })

  it('falls back for anything else', async () => {
    const { apiErrorMessage } = await import('./client')
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false)
    expect(apiErrorMessage(new Error('x'), 'fallback')).toBe('fallback')
  })
})
