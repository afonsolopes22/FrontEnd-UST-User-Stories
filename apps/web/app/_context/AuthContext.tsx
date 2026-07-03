'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type AuthUser = {
  user_id: number
  name: string
  email: string
  role: string
  organization_id: number | null
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextType = {
  status: AuthStatus
  user: AuthUser | null
  token: string | null
  signIn: (token: string, user: AuthUser) => void
  signOut: () => void
  updateUser: (updatedUser: AuthUser) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (!storedToken) {
      setStatus('unauthenticated')
      return
    }
    setToken(storedToken)
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${storedToken}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(userData => {
        if (userData) {
          setUser(userData)
          setStatus('authenticated')
        } else {
          localStorage.removeItem('auth_token')
          setStatus('unauthenticated')
        }
      })
      .catch(() => {
        localStorage.removeItem('auth_token')
        setStatus('unauthenticated')
      })
  }, [])

  const refreshUser = useCallback(async () => {
    const t = token ?? localStorage.getItem('auth_token')
    if (!t) return
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } })
      if (res.ok) {
        const userData = await res.json()
        if (userData) setUser(userData)
      }
    } catch {}
  }, [token])

  const signIn = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    setUser(newUser)
    setStatus('authenticated')
    // Enrich user with /auth/me to get organization_id (login response may omit it)
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${newToken}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(fullUser => { if (fullUser) setUser(fullUser) })
      .catch(() => {})
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser)
  }, [])

  return (
    <AuthContext.Provider value={{ status, user, token, signIn, signOut, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
