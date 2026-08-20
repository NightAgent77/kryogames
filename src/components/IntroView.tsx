import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { AuthModal, type AuthMode } from './AuthModal'
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
  const { theme, setTheme } = useTheme()
  const year = new Date().getFullYear()
  const dots = DOTS_THEME[theme]
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const logFrost = (phase: string) => {
      const intro = document.querySelector('.intro')
      const hero = document.querySelector('.intro-hero')
      const header = document.querySelector('.intro-header-actions')
      const canvas = document.querySelector('canvas.thinking-dots')
      const introCs = intro instanceof HTMLElement ? getComputedStyle(intro) : null
      const heroCs = hero instanceof HTMLElement ? getComputedStyle(hero) : null
      const headerCs = header instanceof HTMLElement ? getComputedStyle(header) : null
      const canvasCs = canvas instanceof HTMLElement ? getComputedStyle(canvas) : null
      // #region agent log
      fetch('http://127.0.0.1:7925/ingest/7c8bdc85-ec08-485c-be11-237455f14496',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b1b1e4'},body:JSON.stringify({sessionId:'b1b1e4',runId:'pre-fix',hypothesisId:'A-B-C-E',location:'IntroView.tsx:frost-probe',message:'intro frost computed styles',data:{phase,href:location.href,reducedTransparency:window.matchMedia('(prefers-reduced-transparency: reduce)').matches,reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches,heroBackdrop:heroCs?.backdropFilter ?? null,heroWebkitBackdrop:(heroCs as CSSStyleDeclaration & { webkitBackdropFilter?: string } | null)?.webkitBackdropFilter ?? null,heroBg:heroCs?.backgroundColor ?? null,headerBackdrop:headerCs?.backdropFilter ?? null,introIsolation:introCs?.isolation ?? null,introOverflow:introCs?.overflow ?? null,introFilter:introCs?.filter ?? null,introTransform:introCs?.transform ?? null,canvasPresent:!!canvas,canvasFilter:canvasCs?.filter ?? null,canvasTransform:canvasCs?.transform ?? null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
    logFrost('mount')
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => logFrost('raf2'))
    })
    let cancelled = false
    const waitCanvas = () => {
      if (cancelled) return
      const canvas = document.querySelector('canvas.thinking-dots')
      if (canvas instanceof HTMLCanvasElement) {
        const twoD = canvas.getContext('2d')
        // #region agent log
        fetch('http://127.0.0.1:7925/ingest/7c8bdc85-ec08-485c-be11-237455f14496',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b1b1e4'},body:JSON.stringify({sessionId:'b1b1e4',runId:'post-fix',hypothesisId:'B',location:'IntroView.tsx:canvas-ready',message:'intro canvas compositing target',data:{canvasPresent:true,canvasW:canvas.width,canvasH:canvas.height,is2d:!!twoD,introIsolation:getComputedStyle(document.querySelector('.intro')!).isolation,introOverflow:getComputedStyle(document.querySelector('.intro')!).overflow,heroBackdrop:getComputedStyle(document.querySelector('.intro-hero')!).backdropFilter},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return
      }
      requestAnimationFrame(waitCanvas)
    }
    requestAnimationFrame(waitCanvas)
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
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
        <span className="intro-brand">Kryo Games</span>
        <div className="intro-header-actions">
          <button
            type="button"
            className="intro-theme-toggle"
            onClick={() => setTheme(nextTheme)}
            aria-label={`Switch to ${nextTheme} mode`}
            title={`${nextTheme === 'light' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.75" />
                <path
                  d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20.2 14.05A7.75 7.75 0 0 1 9.95 3.8 7.9 7.9 0 1 0 20.2 14.05Z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setAuthMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setAuthMode('signup')}
          >
            Sign up
          </button>
        </div>
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
