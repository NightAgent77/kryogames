import { useEffect, useId, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export type AuthMode = 'login' | 'signup' | 'forgot'

interface AuthFormProps {
  mode: AuthMode
  onSwitchMode: (mode: AuthMode) => void
  onSuccess: () => void
}

export function AuthForm({ mode, onSwitchMode, onSuccess }: AuthFormProps) {
  const titleId = useId()
  const uid = useId()
  const { signIn, signUp, resetPassword } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isLogin = mode === 'login'
  const isForgot = mode === 'forgot'

  useEffect(() => {
    setError(null)
    setMessage(null)
  }, [mode])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    try {
      if (isForgot) {
        const result = await resetPassword(email)
        if (result.error) {
          setError(result.error)
        } else {
          setMessage('Check your email for a password reset link.')
        }
        return
      }

      if (isLogin) {
        const result = await signIn(email, password)
        if (result.error) {
          setError(result.error)
        } else {
          onSuccess()
        }
        return
      }

      const username = String(formData.get('username') ?? '').trim()
      const confirmPassword = String(formData.get('confirmPassword') ?? '')

      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      const result = await signUp(email, password, username)
      if (result.error) {
        setError(result.error)
      } else if (result.needsConfirmation) {
        setMessage('Account created. Check your email to confirm before logging in.')
      } else {
        onSuccess()
      }
    } finally {
      setLoading(false)
    }
  }

  const title = isForgot ? 'Reset password' : isLogin ? 'Log in' : 'Sign up'
  const lead = isForgot
    ? 'Enter your email and we will send you a reset link.'
    : isLogin
      ? 'Welcome back. Sign in to track your games and progress.'
      : 'Create an account to save progress and unlock features later.'

  return (
    <>
      <div className="auth-modal-header">
        <h2 id={titleId}>{title}</h2>
        <p className="auth-modal-lead">{lead}</p>
      </div>

      {error && (
        <p className="auth-alert auth-alert--error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="auth-alert auth-alert--success" role="status">
          {message}
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit} aria-labelledby={titleId}>
        {!isLogin && !isForgot && (
          <div className="auth-field">
            <label htmlFor={`${uid}-username`}>Username</label>
            <input
              id={`${uid}-username`}
              name="username"
              type="text"
              autoComplete="username"
              placeholder="PlayerOne"
              required
              disabled={loading}
            />
          </div>
        )}

        <div className="auth-field">
          <label htmlFor={`${uid}-email`}>Email</label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        {!isForgot && (
          <div className="auth-field">
            <label htmlFor={`${uid}-password`}>Password</label>
            <input
              id={`${uid}-password`}
              name="password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              minLength={8}
              required
              disabled={loading}
            />
          </div>
        )}

        {!isLogin && !isForgot && (
          <div className="auth-field">
            <label htmlFor={`${uid}-confirm`}>Confirm password</label>
            <input
              id={`${uid}-confirm`}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              required
              disabled={loading}
            />
          </div>
        )}

        {isLogin && (
          <div className="auth-form-extras">
            <button
              type="button"
              className="auth-link"
              onClick={() => onSwitchMode('forgot')}
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>
        )}

        <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
          {loading
            ? 'Please wait…'
            : isForgot
              ? 'Send reset link'
              : isLogin
                ? 'Log in'
                : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        {isForgot ? (
          <>
            Remember your password?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => onSwitchMode('login')}
              disabled={loading}
            >
              Log in
            </button>
          </>
        ) : isLogin ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => onSwitchMode('signup')}
              disabled={loading}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              className="auth-link"
              onClick={() => onSwitchMode('login')}
              disabled={loading}
            >
              Log in
            </button>
          </>
        )}
      </p>
    </>
  )
}
