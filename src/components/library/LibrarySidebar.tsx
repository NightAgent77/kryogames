import { useLayoutEffect, useRef, useState } from 'react'

export type LibraryTab = 'web' | 'favorites' | 'friends'

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
  const navRef = useRef<HTMLElement>(null)
  const gamesRef = useRef<HTMLButtonElement>(null)
  const favoritesRef = useRef<HTMLButtonElement>(null)
  const friendsRef = useRef<HTMLButtonElement>(null)
  const [indicator, setIndicator] = useState<IndicatorBox | null>(null)
  const [indicatorReady, setIndicatorReady] = useState(false)

  useLayoutEffect(() => {
    const nav = navRef.current
    const target =
      activeTab === 'web'
        ? gamesRef.current
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
    const observer = new ResizeObserver(update)
    observer.observe(nav)

    return () => {
      window.cancelAnimationFrame(readyId)
      observer.disconnect()
    }
  }, [activeTab])

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
          ref={gamesRef}
          type="button"
          className={`library-nav-item${activeTab === 'web' ? ' library-nav-item--active' : ''}`}
          onClick={() => onSelect('web')}
        >
          Games
        </button>

        <button
          ref={favoritesRef}
          type="button"
          className={`library-nav-item${activeTab === 'favorites' ? ' library-nav-item--active' : ''}`}
          onClick={() => onSelect('favorites')}
        >
          Favorites
        </button>

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
