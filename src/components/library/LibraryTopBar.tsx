import { useEffect, useRef, useState, type AriaRole, type ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, type Theme } from '../../contexts/ThemeContext'
import {
  getAvatarUrl,
  getDisplayName,
  getInitials,
} from '../../lib/userDisplay'
import Dock, { DockIcon, DockItem, useDockMotion } from './Dock'

type MenuPanel = 'main' | 'appearance'

interface LibraryTopBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  onMenuToggle: () => void
  onMenuHoverStart: () => void
  onMenuHoverEnd: () => void
  menuExpanded: boolean
  onViewProfile: () => void
}

function MenuDockItem({
  label,
  onClick,
  children,
  className = '',
  role = 'menuitem',
  active = false,
  ariaChecked,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  className?: string
  role?: AriaRole
  active?: boolean
  ariaChecked?: boolean
}) {
  const { mouseY, spring, distance, baseItemSize, magnification } = useDockMotion()

  return (
    <DockItem
      label={label}
      onClick={onClick}
      mouseY={mouseY}
      spring={spring}
      distance={distance}
      baseItemSize={baseItemSize}
      magnification={magnification}
      role={role}
      active={active}
      aria-checked={ariaChecked}
      className={`dock-item--menu${className ? ` ${className}` : ''}`}
    >
      <DockIcon className="dock-icon--menu">{children}</DockIcon>
    </DockItem>
  )
}

export function LibraryTopBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search for games',
  showSearch = true,
  onMenuToggle,
  onMenuHoverStart,
  onMenuHoverEnd,
  menuExpanded,
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
        onMouseEnter={onMenuHoverStart}
        onMouseLeave={onMenuHoverEnd}
        onFocus={onMenuHoverStart}
        onBlur={onMenuHoverEnd}
        aria-label="Open menu"
        aria-expanded={menuExpanded}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <rect x="3" y="5" width="14" height="1.5" rx="0.75" />
          <rect x="3" y="9.25" width="14" height="1.5" rx="0.75" />
          <rect x="3" y="13.5" width="14" height="1.5" rx="0.75" />
        </svg>
      </button>

      {showSearch ? (
        <label className="library-search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="visually-hidden">{searchPlaceholder}</span>
          <input
            type="search"
            name="kryo-library-filter"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="search"
            enterKeyHint="search"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            data-bwignore="true"
          />
        </label>
      ) : (
        <div className="library-topbar-spacer" aria-hidden="true" />
      )}

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
          <div className="library-profile-dropdown">
            <Dock
              className="dock-panel--menu"
              baseItemSize={36}
              magnification={48}
              distance={100}
              fill
              role="menu"
              aria-label="Profile menu"
            >
              {panel === 'main' ? (
                <>
                  <MenuDockItem
                    label="View profile"
                    onClick={() => {
                      setMenuOpen(false)
                      onViewProfile()
                    }}
                  >
                    View profile
                  </MenuDockItem>
                  <MenuDockItem label="Appearance" onClick={() => setPanel('appearance')}>
                    <span className="library-profile-dropdown-row">
                      <span>Appearance</span>
                      <span className="library-profile-dropdown-chevron" aria-hidden="true">
                        ›
                      </span>
                    </span>
                  </MenuDockItem>
                  <MenuDockItem label="Settings" onClick={() => setMenuOpen(false)}>
                    Settings
                  </MenuDockItem>
                  <div className="library-profile-dropdown-sep" role="separator" />
                  <MenuDockItem
                    label="Log out"
                    className="library-profile-dropdown-danger"
                    onClick={() => {
                      void (async () => {
                        setMenuOpen(false)
                        await signOut()
                      })()
                    }}
                  >
                    Log out
                  </MenuDockItem>
                </>
              ) : (
                <>
                  <MenuDockItem label="Back to menu" onClick={() => setPanel('main')}>
                    <span className="library-profile-dropdown-row">
                      <span
                        className="library-profile-dropdown-chevron library-profile-dropdown-chevron--back"
                        aria-hidden="true"
                      >
                        ‹
                      </span>
                      <span>Appearance</span>
                    </span>
                  </MenuDockItem>
                  <div className="library-profile-dropdown-sep" role="separator" />
                  <MenuDockItem
                    label="Dark"
                    role="menuitemradio"
                    active={theme === 'dark'}
                    ariaChecked={theme === 'dark'}
                    onClick={() => chooseTheme('dark')}
                  >
                    <span className="library-profile-dropdown-row">
                      <span>Dark</span>
                      {theme === 'dark' && (
                        <span className="library-profile-dropdown-check" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </span>
                  </MenuDockItem>
                  <MenuDockItem
                    label="Light"
                    role="menuitemradio"
                    active={theme === 'light'}
                    ariaChecked={theme === 'light'}
                    onClick={() => chooseTheme('light')}
                  >
                    <span className="library-profile-dropdown-row">
                      <span>Light</span>
                      {theme === 'light' && (
                        <span className="library-profile-dropdown-check" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </span>
                  </MenuDockItem>
                </>
              )}
            </Dock>
          </div>
        )}
      </div>
    </div>
  )
}
