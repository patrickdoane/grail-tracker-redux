import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchCurrentUser,
  loginUser,
  registerUser,
  type AuthResponse,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from './authApi'
import { clearAuthToken, getAuthToken, setAuthToken } from '../../lib/authToken'

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<AuthResponse>
  register: (input: RegisterInput) => Promise<AuthResponse>
  logout: () => void
  refreshUser: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthStatus = 'idle' | 'loading' | 'authenticated'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<AuthStatus>('idle')

  useEffect(() => {
    const existingToken = getAuthToken()
    if (!existingToken) {
      setStatus('idle')
      return
    }

    setToken(existingToken)
    setStatus('loading')
    fetchCurrentUser()
      .then((current) => {
        setUser(current)
        setStatus('authenticated')
      })
      .catch(() => {
        clearAuthToken()
        setToken(null)
        setUser(null)
        setStatus('idle')
      })
  }, [])

  const persistAuth = useCallback((response: AuthResponse) => {
    setToken(response.token)
    setUser(response.user)
    setAuthToken(response.token)
    setStatus('authenticated')
    return response
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    setStatus('loading')
    try {
      const response = await loginUser(input)
      return persistAuth(response)
    } catch (error) {
      setStatus(token ? 'authenticated' : 'idle')
      throw error
    }
  }, [persistAuth, token])

  const register = useCallback(async (input: RegisterInput) => {
    setStatus('loading')
    try {
      const response = await registerUser(input)
      return persistAuth(response)
    } catch (error) {
      setStatus(token ? 'authenticated' : 'idle')
      throw error
    }
  }, [persistAuth, token])

  const logout = useCallback(() => {
    clearAuthToken()
    setToken(null)
    setUser(null)
    setStatus('idle')
  }, [])

  const refreshUser = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null)
      setToken(null)
      setStatus('idle')
      return null
    }

    setStatus('loading')
    try {
      const current = await fetchCurrentUser()
      setUser(current)
      setStatus('authenticated')
      return current
    } catch (error) {
      logout()
      throw error
    }
  }, [logout])

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      refreshUser,
    }
  }, [login, logout, refreshUser, register, status, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
