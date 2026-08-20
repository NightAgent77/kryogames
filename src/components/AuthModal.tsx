import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export type AuthMode = 'login' | 'signup' | 'forgot'

interface AuthModalProps {
  mode: AuthMode
  onClose: () => void
  onSwitchMode: (mode: AuthMode) => void
}

export function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
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

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    dialog.showModal()

    const shell = dialog.querySelector('.auth-modal-shell')
    const shellCs = shell instanceof HTMLElement ? getComputedStyle(shell) : null
    let backdropFilter = 'unavailable'
    try {
      backdropFilter = getComputedStyle(dialog, '::backdrop').backdropFilter
    } catch {
      backdropFilter = 'error'
    }
    // #region agent log
    fetch('http://127.0.0.1:7925/ingest/7c8bdc85-ec08-485c-be11-237455f14496',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b1b1e4'},body:JSON.stringify({sessionId:'b1b1e4',runId:'pre-fix',hypothesisId:'A-D',location:'AuthModal.tsx:showModal',message:'auth modal frost computed styles',data:{dialogOpen:dialog.open,reducedTransparency:window.matchMedia('(prefers-reduced-transparency: reduce)').matches,shellBackdrop:shellCs?.backdropFilter ?? null,shellWebkitBackdrop:(shellCs as CSSStyleDeclaration & { webkitBackdropFilter?: string } | null)?.webkitBackdropFilter ?? null,shellBg:shellCs?.backgroundColor ?? null,shellOverflow:shellCs?.overflow ?? null,pseudoBackdrop:backdropFilter,href:location.href},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

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
          onClose()
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
        onClose()
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
    <dialog ref={dialogRef} className="auth-modal" aria-labelledby={titleId}>
      <div className="auth-modal-shell">
        <div className="auth-modal-panel">
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

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

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && !isForgot && (
            <div className="auth-field">
              <label htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
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
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
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
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
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
              <label htmlFor="auth-confirm">Confirm password</label>
              <input
                id="auth-confirm"
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

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
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
        </div>
      </div>
    </dialog>
  )
}
