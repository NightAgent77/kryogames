import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

function getDisplayName(email: string, username?: string) {
  if (username) return username
  return email.split('@')[0]
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}

interface LibraryTopBarProps {
  search: string
  onSearchChange: (value: string) => void
  onMenuToggle: () => void
}

export function LibraryTopBar({
  search,
  onSearchChange,
  onMenuToggle,
}: LibraryTopBarProps) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = user
    ? getDisplayName(
        user.email ?? 'Player',
        user.user_metadata?.username as string | undefined,
      )
    : 'Player'

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
            {getInitials(displayName)}
          </span>
          <span className="library-profile-name">{displayName}</span>
        </button>

        {menuOpen && (
          <div className="library-profile-dropdown" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setMenuOpen(false)
                await signOut()
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
