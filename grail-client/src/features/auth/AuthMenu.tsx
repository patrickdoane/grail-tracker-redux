import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Stack } from '../../components/ui'
import { classNames } from '../../lib/classNames'
import { getApiErrorMessage } from '../../lib/apiClient'
import { useAuth } from './AuthContext'
import './AuthMenu.css'

type ActiveForm = 'login' | 'signup' | null

type BaseFormProps = {
  onSuccess: () => void
  onSwap: () => void
}

function LoginForm({ onSuccess, onSwap }: BaseFormProps) {
  const { login } = useAuth()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login({ usernameOrEmail, password })
      onSuccess()
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Unable to sign in. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = usernameOrEmail.trim().length > 0 && password.trim().length > 0

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Card className="auth-form__card">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to sync your grail progress across devices.</CardDescription>
        </CardHeader>
        <CardContent>
          <Stack gap="sm">
            <label className="auth-form__field">
              <span>Username or email</span>
            <input
              type="text"
              name="usernameOrEmail"
              autoComplete="username"
              value={usernameOrEmail}
              onChange={(event) => setUsernameOrEmail(event.target.value)}
              required
            />
          </label>
          <label className="auth-form__field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="auth-form__error" role="alert">{error}</p>}
          <Button type="submit" size="sm" loading={isSubmitting} disabled={!canSubmit}>
            Log in
          </Button>
        </Stack>
        </CardContent>
        <div className="auth-form__footer">
          <p>New to Grail Tracker?</p>
          <button type="button" onClick={onSwap} className="auth-form__swap">
            Create an account
          </button>
        </div>
      </Card>
    </form>
  )
}

function SignupForm({ onSuccess, onSwap }: BaseFormProps) {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await register({ username, email, password })
      onSuccess()
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Unable to create your account. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = username.trim().length > 0 && password.trim().length >= 8 && email.trim().length > 0

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Card className="auth-form__card">
        <CardHeader>
          <CardTitle>Join the hunt</CardTitle>
          <CardDescription>Track drops, sync rune ownership, and share progress with friends.</CardDescription>
        </CardHeader>
        <CardContent>
          <Stack gap="sm">
            <label className="auth-form__field">
              <span>Username</span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label className="auth-form__field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="auth-form__field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>
          <p className="auth-form__hint">Use at least 8 characters for the best security.</p>
          {error && <p className="auth-form__error" role="alert">{error}</p>}
          <Button type="submit" size="sm" loading={isSubmitting} disabled={!canSubmit}>
            Sign up
          </Button>
        </Stack>
        </CardContent>
        <div className="auth-form__footer">
          <p>Already have an account?</p>
          <button type="button" onClick={onSwap} className="auth-form__swap">
            Log in instead
          </button>
        </div>
      </Card>
    </form>
  )
}

function AuthMenu() {
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const [activeForm, setActiveForm] = useState<ActiveForm>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      setActiveForm(null)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveForm(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!activeForm) {
      return
    }

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) {
        return
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setActiveForm(null)
      }
    }

    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [activeForm])

  const toggleForm = useCallback((form: Exclude<ActiveForm, null>) => {
    setActiveForm((current) => (current === form ? null : form))
  }, [])

  const form = useMemo(() => {
    if (activeForm === 'login') {
      return <LoginForm onSuccess={() => setActiveForm(null)} onSwap={() => setActiveForm('signup')} />
    }
    if (activeForm === 'signup') {
      return <SignupForm onSuccess={() => setActiveForm(null)} onSwap={() => setActiveForm('login')} />
    }
    return null
  }, [activeForm])

  const showForm = Boolean(form)

  return (
    <div ref={containerRef} className={classNames('auth-menu', showForm && 'auth-menu--open')}>
      {isAuthenticated && user ? (
        <div className="auth-menu__status">
          <div className="auth-menu__details">
            <span className="auth-menu__eyebrow">Signed in</span>
            <span className="auth-menu__user">{user.username}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={logout} disabled={isLoading}>
            Log out
          </Button>
        </div>
      ) : (
        <div className="auth-menu__actions">
          <Button size="sm" variant="surface" onClick={() => toggleForm('login')}>
            Log in
          </Button>
          <Button size="sm" onClick={() => toggleForm('signup')}>
            Sign up
          </Button>
        </div>
      )}
      {showForm && <div className="auth-menu__popover">{form}</div>}
    </div>
  )
}

export default AuthMenu
