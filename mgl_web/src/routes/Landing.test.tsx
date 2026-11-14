import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Landing } from './Landing'
import { AuthProvider } from '../context/AuthContext'

describe('Landing', () => {
  it('renders both worker and employer entry points', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Landing />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /continue as a worker/i })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.getByRole('link', { name: /continue as an employer/i })).toHaveAttribute(
      'href',
      '/employer/login',
    )
  })
})
