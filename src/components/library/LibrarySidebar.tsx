import { useLayoutEffect, useRef, useState } from 'react'

export type LibraryTab = 'web' | 'my-games' | 'favorites' | 'friends'

interface LibrarySidebarProps {
  activeTab: LibraryTab
  onSelect: (tab: LibraryTab) => void
  open: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
}

interface IndicatorBox {
  top: number
  height: number
}

export function LibrarySidebar({
  activeTab,
  onSelect,
  open,
  onHoverStart,
  onHoverEnd,
}: LibrarySidebarProps) {
  const [libraryHovered, setLibraryHovered] = useState(false)
  const inGameLibrary = activeTab === 'my-games' || activeTab === 'favorites'
  const libraryExpanded = inGameLibrary || libraryHovered
  const navRef = useRef<HTMLElement>(null)
  const homeRef = useRef<HTMLButtonElement>(null)
  const libraryRef = useRef<HTMLButtonElement>(null)
  const myGamesRef = useRef<HTMLButtonElement>(null)
  const favoritesRef = useRef<HTMLButtonElement>(null)
  const friendsRef = useRef<HTMLButtonElement>(null)
  const [indicator, setIndicator] = useState<IndicatorBox | null>(null)
  const [indicatorReady, setIndicatorReady] = useState(false)

  useLayoutEffect(() => {
    const nav = navRef.current
    const target =
      activeTab === 'web'
        ? homeRef.current
        : activeTab === 'my-games'
          ? myGamesRef.current
          : activeTab === 'favorites'
            ? favoritesRef.current
            : friendsRef.current
    if (!nav || !target) return

    const update = () => {
      setIndicator({
        top: target.offsetTop,
        height: target.offsetHeight,
      })
    }

    update()

    // Enable transitions after the first layout so the pill doesn’t animate in from 0.
    const readyId = window.requestAnimationFrame(() => setIndicatorReady(true))

    // Keep the highlight aligned while the Game library submenu animates open/closed.
    const timers = [90, 180, 300].map((ms) => window.setTimeout(update, ms))
    const observer = new ResizeObserver(update)
    observer.observe(nav)

    return () => {
      window.cancelAnimationFrame(readyId)
      timers.forEach((id) => window.clearTimeout(id))
      observer.disconnect()
    }
  }, [activeTab, libraryExpanded])

  return (
    <aside
      className={`library-sidebar${open ? ' library-sidebar--open' : ''}`}
      aria-label="Library"
      aria-hidden={!open}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="library-brand">Kryo Games</div>

      <nav ref={navRef} className="library-nav" aria-label="Library sections">
        {indicator && (
          <div
            className={`library-nav-indicator${indicatorReady ? ' library-nav-indicator--ready' : ''}`}
            style={{
              transform: `translateY(${indicator.top}px)`,
              height: indicator.height,
            }}
            aria-hidden="true"
          />
        )}

        <button
          ref={homeRef}
          type="button"
          className={`library-nav-item${activeTab === 'web' ? ' library-nav-item--active' : ''}`}
          onClick={() => onSelect('web')}
        >
          Home
        </button>

        <div
          className="library-nav-group"
          onMouseEnter={() => setLibraryHovered(true)}
          onMouseLeave={() => setLibraryHovered(false)}
        >
          <button
            ref={libraryRef}
            type="button"
            className={`library-nav-item${inGameLibrary ? ' library-nav-item--active' : ''}`}
            onClick={() => onSelect('my-games')}
            aria-expanded={libraryExpanded}
          >
            Game library
          </button>

          <div
            className={`library-nav-sub${libraryExpanded ? ' library-nav-sub--open' : ''}`}
            aria-hidden={!libraryExpanded}
          >
            <div className="library-nav-sub-inner">
              <button
                ref={myGamesRef}
                type="button"
                className={`library-nav-item${activeTab === 'my-games' ? ' library-nav-item--active' : ''}`}
                onClick={() => onSelect('my-games')}
                tabIndex={libraryExpanded ? 0 : -1}
              >
                My Games
              </button>
              <button
                ref={favoritesRef}
                type="button"
                className={`library-nav-item${activeTab === 'favorites' ? ' library-nav-item--active' : ''}`}
                onClick={() => onSelect('favorites')}
                tabIndex={libraryExpanded ? 0 : -1}
              >
                Favorites
              </button>
            </div>
          </div>
        </div>

        <button
          ref={friendsRef}
          type="button"
          className={`library-nav-item${activeTab === 'friends' ? ' library-nav-item--active' : ''}`}
          onClick={() => onSelect('friends')}
        >
          Friends
        </button>
      </nav>
    </aside>
  )
}
