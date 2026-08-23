import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { AuthForm, type AuthMode } from './AuthForm'
import { PublicHeader } from './PublicHeader'
import './AuthPage.css'

const WarpTwister = lazy(() => import('./WarpTwister'))

class BackdropErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

const AUTH_PATH: Record<AuthMode, string> = {
  login: '/login',
  signup: '/signup',
  forgot: '/forgot',
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, loading } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (loading) {
    return (
      <div className="app-loading" role="status">
        Loading…
      </div>
    )
  }

  if (user) {
    return <Navigate to="/play" replace />
  }

  return (
    <div className="auth-page public-shell">
      <div className="auth-page-warp" aria-hidden="true">
        <BackdropErrorBoundary>
          <Suspense fallback={null}>
            <WarpTwister
              theme={theme}
              paused={reduceMotion}
              radius={1.35}
              narrow={1.7}
              length={10}
              spiralTight={0.55}
              rotSpeed={reduceMotion ? 0 : 0.08}
              hazeSpeed={0.4}
              hazeStrength={0.2}
              dustOpacity={0.07}
              cameraDistance={9.2}
              baseColor={[0.75, 0.42, 0.9]}
              baseColorLight={[0.27, 0.05, 0.58]}
            />
          </Suspense>
        </BackdropErrorBoundary>
      </div>

      <PublicHeader />

      <main className="auth-page-main">
        <div className="auth-modal-shell">
          <div className="auth-modal-panel">
            <AuthForm
              mode={mode}
              onSuccess={() => navigate('/play', { replace: true })}
              onSwitchMode={(next) => navigate(AUTH_PATH[next])}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
