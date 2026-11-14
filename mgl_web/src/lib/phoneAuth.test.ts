import { beforeEach, describe, expect, it, vi } from 'vitest'

const firebase = vi.hoisted(() => ({
  confirm: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
  signOut: vi.fn(),
  verifierClear: vi.fn(),
  verifierArgs: [] as unknown[][],
}))

vi.mock('firebase/app', () => ({ getApps: () => [], initializeApp: vi.fn(() => ({})) }))
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  RecaptchaVerifier: class {
    constructor(...args: unknown[]) {
      firebase.verifierArgs.push(args)
    }
    clear = firebase.verifierClear
  },
  signInWithPhoneNumber: firebase.signInWithPhoneNumber,
  signOut: firebase.signOut,
}))

import { phoneAuthErrorMessage, PhoneAuthError, sendCode, toE164 } from './phoneAuth'

describe('toE164', () => {
  it.each([
    ['9876543210', '+919876543210'],
    ['+91 98765 43210', '+919876543210'],
    ['919876543210', '+919876543210'],
    ['098765-43210'.replace(/^0/, ''), '+919876543210'],
  ])('normalises %s', (input, expected) => {
    expect(toE164(input)).toBe(expected)
  })

  it.each(['12345', '5876543210', '+14155550123', ''])('rejects %p', (input) => {
    expect(() => toE164(input)).toThrow(PhoneAuthError)
  })
})

describe('phoneAuthErrorMessage', () => {
  it('maps Firebase error codes to friendly messages', () => {
    expect(phoneAuthErrorMessage({ code: 'auth/invalid-verification-code' })).toMatch(/incorrect/)
    expect(phoneAuthErrorMessage({ code: 'auth/too-many-requests' })).toMatch(/Too many/)
    expect(phoneAuthErrorMessage(new PhoneAuthError('Enter a valid 10-digit Indian mobile number.'))).toMatch(
      /10-digit/,
    )
    expect(phoneAuthErrorMessage(new Error('boom'))).toMatch(/Something went wrong/)
  })
})

describe('sendCode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    firebase.verifierArgs.length = 0
    firebase.signOut.mockResolvedValue(undefined)
    firebase.confirm.mockResolvedValue({ user: { getIdToken: vi.fn().mockResolvedValue('id-token') } })
    firebase.signInWithPhoneNumber.mockResolvedValue({ confirm: firebase.confirm })
  })

  it('sends the code to the E.164 number with an invisible reCAPTCHA', async () => {
    await sendCode('98765 43210', 'recaptcha-container')

    expect(firebase.verifierArgs[0][1]).toBe('recaptcha-container')
    expect(firebase.verifierArgs[0][2]).toEqual({ size: 'invisible' })
    expect(firebase.signInWithPhoneNumber).toHaveBeenCalledWith(expect.anything(), '+919876543210', expect.anything())
  })

  it('returns a confirm step that yields the ID token and drops the Firebase session', async () => {
    const confirm = await sendCode('9876543210', 'recaptcha-container')

    await expect(confirm(' 123456 ')).resolves.toBe('id-token')
    expect(firebase.confirm).toHaveBeenCalledWith('123456')
    expect(firebase.signOut).toHaveBeenCalled()
  })

  it('rejects an invalid number before calling Firebase', async () => {
    await expect(sendCode('12345', 'recaptcha-container')).rejects.toThrow(PhoneAuthError)
    expect(firebase.signInWithPhoneNumber).not.toHaveBeenCalled()
  })

  it('clears the previous reCAPTCHA when a code is re-requested', async () => {
    await sendCode('9876543210', 'recaptcha-container')
    const clearsBefore = firebase.verifierClear.mock.calls.length
    await sendCode('9876543210', 'recaptcha-container')
    expect(firebase.verifierClear.mock.calls.length - clearsBefore).toBe(1)
  })
})
