import { useState } from 'react'
import { AuthModal, type AuthMode } from './AuthModal'
import { useTheme } from '../contexts/ThemeContext'
import './IntroView.css'

export function IntroView() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const { theme, setTheme } = useTheme()
  const year = new Date().getFullYear()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <div className="intro">
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
