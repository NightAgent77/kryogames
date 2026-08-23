import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthModal, type AuthMode } from './AuthModal'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import './IntroView.css'

const ThinkingDots = lazy(() => import('./ThinkingDots'))

const DOTS_THEME = {
  dark: {
    color: '#ff44af',
    accentColor: '#ff44af',
    backgroundColor: '#121212',
    ambient: 0.42,
  },
  light: {
    color: '#ff44af',
    accentColor: '#ff44af',
    backgroundColor: '#eef0f3',
    ambient: 0.38,
  },
} as const

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

export function IntroView() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const year = new Date().getFullYear()
  const dots = DOTS_THEME[theme]

  useEffect(() => {
    if (user) navigate('/play', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <div className="intro">
      <div className="intro-dots" aria-hidden="true">
        <BackdropErrorBoundary>
          <Suspense fallback={null}>
            <ThinkingDots
              color={dots.color}
              accentColor={dots.accentColor}
              backgroundColor={dots.backgroundColor}
              ambient={dots.ambient}
              paused={reduceMotion}
              cursorInteraction={!reduceMotion}
            />
          </Suspense>
        </BackdropErrorBoundary>
      </div>

      <header className="intro-header">
        <Link to="/" className="intro-brand">
          Home
        </Link>
      </header>

      <main className="intro-main">
        <div className="intro-hero">
          <h1>Kryo Games</h1>
          <p className="intro-lead">
            Small games you can launch in the browser. Sign in to open your
            library.
          </p>
          <div className="intro-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAuthMode('signup')}
            >
              Sign up
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAuthMode('login')}
            >
              Log in
            </button>
          </div>
        </div>

        <div className="intro-teaser" aria-hidden="true">
          <div className="intro-tile" />
          <div className="intro-tile" />
          <div className="intro-tile" />
          <div className="intro-tile" />
        </div>
      </main>

      <footer className="intro-footer">
        <p>&copy; {year} KryoGames</p>
      </footer>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={setAuthMode}
        />
      )}
    </div>
  )
}
