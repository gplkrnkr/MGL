import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OtpLogin } from './OtpLogin'
import * as phoneAuth from '../lib/phoneAuth'

vi.mock('../lib/phoneAuth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/phoneAuth')>()),
  sendCode: vi.fn(),
}))

const confirm = vi.fn()

function renderLogin(onVerify = vi.fn().mockResolvedValue(undefined), onSuccess = vi.fn()) {
  render(<OtpLogin heading="Sign in" subheading="Workers" onVerify={onVerify} onSuccess={onSuccess} />)
  return { onVerify, onSuccess }
}

async function requestCode(phone = '9876543210') {
  fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: phone } })
  fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }))
}

describe('OtpLogin', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    confirm.mockResolvedValue('firebase-id-token')
    vi.mocked(phoneAuth.sendCode).mockResolvedValue(confirm)
  })

  it('verifies the code with Firebase and passes the ID token to onVerify', async () => {
    const { onVerify, onSuccess } = renderLogin()
    await requestCode()
    expect(phoneAuth.sendCode).toHaveBeenCalledWith('9876543210', 'recaptcha-container')

    fireEvent.change(await screen.findByLabelText('OTP code'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify & continue' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(confirm).toHaveBeenCalledWith('123456')
    expect(onVerify).toHaveBeenCalledWith('firebase-id-token')
  })

  it('shows a friendly error when sending the code fails', async () => {
    vi.mocked(phoneAuth.sendCode).mockRejectedValue({ code: 'auth/too-many-requests' })
    renderLogin()
    await requestCode()
    expect(await screen.findByText(/Too many attempts/)).toBeInTheDocument()
  })

  it('shows an error and stays on the code step for a wrong code', async () => {
    confirm.mockRejectedValue({ code: 'auth/invalid-verification-code' })
    const { onVerify } = renderLogin()
    await requestCode()
    fireEvent.change(await screen.findByLabelText('OTP code'), { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify & continue' }))

    expect(await screen.findByText(/code is incorrect/)).toBeInTheDocument()
    expect(onVerify).not.toHaveBeenCalled()
  })

  it('reports a backend failure separately from a wrong code', async () => {
    renderLogin(vi.fn().mockRejectedValue(new Error('500')))
    await requestCode()
    fireEvent.change(await screen.findByLabelText('OTP code'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify & continue' }))
    expect(await screen.findByText(/server could not start your session/)).toBeInTheDocument()
  })
})
