import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, verifyOtp } from './client'
import { getToken, setToken } from '../lib/session'

describe('verifyOtp', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('posts to the auth endpoint and returns the raw snake_case token response', async () => {
    const postSpy = vi.spyOn(http, 'post').mockResolvedValue({
      data: { access_token: 'abc', token_type: 'bearer', user_id: 'p1', phone: '+911234567890' },
    })

    const result = await verifyOtp('+911234567890', '123456')

    expect(postSpy).toHaveBeenCalledWith('/api/auth/otp/verify', {
      phone: '+911234567890',
      token: '123456',
    })
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
