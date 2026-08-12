import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, type Theme } from '../../contexts/ThemeContext'
import {
  getAvatarUrl,
  getDisplayName,
  getInitials,
} from '../../lib/userDisplay'

type MenuPanel = 'main' | 'appearance'

interface LibraryTopBarProps {
  search: string
  onSearchChange: (value: string) => void
  onMenuToggle: () => void
  onViewProfile: () => void
}

export function LibraryTopBar({
  search,
  onSearchChange,
  onMenuToggle,
  onViewProfile,
}: LibraryTopBarProps) {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState<MenuPanel>('main')
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = user
    ? getDisplayName(
        user.email ?? 'Player',
        user.user_metadata?.username as string | undefined,
      )
    : 'Player'
  const avatarUrl = getAvatarUrl(user)

  useEffect(() => {
    if (!menuOpen) return

    const handlePointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointer)
    return () => document.removeEventListener('mousedown', handlePointer)
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) setPanel('main')
  }, [menuOpen])

  const chooseTheme = (next: Theme) => {
    setTheme(next)
  }

  return (
    <div className="library-topbar">
      <button
        type="button"
        className="library-menu-toggle"
        onClick={onMenuToggle}
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <rect x="3" y="5" width="14" height="1.5" rx="0.75" />
          <rect x="3" y="9.25" width="14" height="1.5" rx="0.75" />
          <rect x="3" y="13.5" width="14" height="1.5" rx="0.75" />
        </svg>
      </button>

      <label className="library-search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="visually-hidden">Search for games</span>
        <input
          type="search"
          placeholder="Search for games"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="library-profile-menu" ref={menuRef}>
        <button
          type="button"
          className="library-profile"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className="library-profile-avatar" aria-hidden="true">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="library-profile-avatar-img" />
            ) : (
              getInitials(displayName)
            )}
          </span>
          <span className="library-profile-name">{displayName}</span>
        </button>

        {menuOpen && (
          <div className="library-profile-dropdown" role="menu">
            {panel === 'main' ? (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onViewProfile()
                  }}
                >
                  View profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="library-profile-dropdown-row"
                  onClick={() => setPanel('appearance')}
                >
                  <span>Appearance</span>
                  <span className="library-profile-dropdown-chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </button>
                <div className="library-profile-dropdown-sep" role="separator" />
                <button
                  type="button"
                  role="menuitem"
                  className="library-profile-dropdown-danger"
                  onClick={async () => {
                    setMenuOpen(false)
                    await signOut()
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="library-profile-dropdown-row"
                  onClick={() => setPanel('main')}
                >
                  <span className="library-profile-dropdown-chevron library-profile-dropdown-chevron--back" aria-hidden="true">
                    ‹
                  </span>
                  <span>Appearance</span>
                </button>
                <div className="library-profile-dropdown-sep" role="separator" />
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={theme === 'dark'}
                  className="library-profile-dropdown-row"
                  onClick={() => chooseTheme('dark')}
                >
                  <span>Dark</span>
                  {theme === 'dark' && (
                    <span className="library-profile-dropdown-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={theme === 'light'}
                  className="library-profile-dropdown-row"
                  onClick={() => chooseTheme('light')}
                >
                  <span>Light</span>
                  {theme === 'light' && (
                    <span className="library-profile-dropdown-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
