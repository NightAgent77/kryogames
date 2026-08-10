import { useState } from 'react'
import { AuthModal, type AuthMode } from './AuthModal'
import './IntroView.css'

export function IntroView() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const year = new Date().getFullYear()

  return (
    <div className="intro">
      <header className="intro-header">
        <span className="intro-brand">Kryo Games</span>
        <div className="intro-header-actions">
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
