import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getMyProfile, selectEmployerRole, verifyFirebaseToken } from '../api/client'
import { clearToken, getToken, setToken } from '../lib/session'
import type { Profile } from '../api/types'

interface AuthContextValue {
  profile: Profile | null
  loading: boolean
  loginAsWorker: (firebaseIdToken: string) => Promise<Profile>
  loginAsEmployer: (firebaseIdToken: string) => Promise<Profile>
  logout: () => void
  refresh: () => Promise<Profile | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async (): Promise<Profile | null> => {
    if (!getToken()) {
      setProfile(null)
      setLoading(false)
      return null
    }
    try {
      const me = await getMyProfile()
      setProfile(me)
      return me
    } catch {
      clearToken()
      setProfile(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loginAsWorker = async (firebaseIdToken: string) => {
    const token = await verifyFirebaseToken(firebaseIdToken)
    setToken(token.access_token)
    const me = await getMyProfile()
    setProfile(me)
    return me
  }

  const loginAsEmployer = async (firebaseIdToken: string) => {
    const token = await verifyFirebaseToken(firebaseIdToken)
    setToken(token.access_token)
    const me = await selectEmployerRole()
    setProfile(me)
    return me
  }

  const logout = () => {
    clearToken()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ profile, loading, loginAsWorker, loginAsEmployer, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
