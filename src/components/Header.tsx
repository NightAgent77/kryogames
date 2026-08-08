import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { AuthModal, type AuthMode } from './AuthModal'

const navLinks = [
  { href: '#games', label: 'Games' },
  { href: '#about', label: 'About' },
  { href: '#downloads', label: 'Downloads' },
]

function getDisplayName(email: string, username?: string) {
  if (username) return username
  return email.split('@')[0]
}

export function Header() {
  const { user, loading, signOut } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)

  const openAuth = (mode: AuthMode) => setAuthMode(mode)
  const closeAuth = () => setAuthMode(null)

  const handleSignOut = async () => {
    await signOut()
  }

  const displayName = user
    ? getDisplayName(
        user.email ?? 'Player',
        user.user_metadata?.username as string | undefined,
      )
    : null

  return (
    <>
      <header className="site-header">
        <a href="#" className="logo" aria-label="KyroGames home">
          <span className="logo-mark" aria-hidden="true">
            K
          </span>
          <span className="logo-text">
            Kyro<span className="logo-accent">Games</span>
          </span>
        </a>

        <div className="header-right">
          <nav className="site-nav" aria-label="Main">
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-auth">
            {loading ? (
              <span className="header-auth-loading" aria-hidden="true">
                …
              </span>
            ) : user ? (
              <>
                <span className="header-user" title={user.email ?? undefined}>
                  {displayName}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleSignOut}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => openAuth('login')}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => openAuth('signup')}
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={closeAuth}
          onSwitchMode={setAuthMode}
        />
      )}
    </>
  )
}
