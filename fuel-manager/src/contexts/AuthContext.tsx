import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import axiosInstance from '../api/axiosInstance'
import { authApi } from '../api/auth.api'
import type { AuthSuccessDTO } from '../types/api.types'

// What we store locally — the tokens plus decoded display info
interface AuthSession {
  accessToken: string
  refreshToken: string
}

interface AuthContextValue {
  session: AuthSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const SESSION_KEY = 'fs_manager_session'

function applyToken(token: string) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

function clearToken() {
  delete axiosInstance.defaults.headers.common['Authorization']
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (stored) {
        const s: AuthSession = JSON.parse(stored)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSession(s)
        applyToken(s.accessToken)
      }
    } catch { /* ignore corrupted storage */ }
    setLoading(false)
  }, [])

  const persist = (dto: AuthSuccessDTO) => {
    const s: AuthSession = {
      accessToken:  dto.accessToken,
      refreshToken: dto.refreshToken,
    }
    setSession(s)
    localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    applyToken(s.accessToken)
  }

  const signIn = async (email: string, password: string) => {
    const { data } = await authApi.signIn({ email, password })
    persist(data)
  }

  const signUp = async (name: string, email: string, password: string) => {
    const { data } = await authApi.signUp({ name, email, password, role: 'Dispatcher' })
    persist(data)
  }

  const signOut = () => {
    setSession(null)
    localStorage.removeItem(SESSION_KEY)
    clearToken()
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}