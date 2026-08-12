import { useLayoutEffect, useRef, useState } from 'react'

export type LibraryTab = 'web' | 'android' | 'favorites'

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
  const gamesOpen = activeTab === 'web' || activeTab === 'android'
  const navRef = useRef<HTMLElement>(null)
  const gamesRef = useRef<HTMLButtonElement>(null)
  const favoritesRef = useRef<HTMLButtonElement>(null)
  const [indicator, setIndicator] = useState<IndicatorBox | null>(null)
  const [indicatorReady, setIndicatorReady] = useState(false)

  useLayoutEffect(() => {
    const nav = navRef.current
    const target = gamesOpen ? gamesRef.current : favoritesRef.current
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

    // Keep the highlight aligned while the Web/Android submenu animates.
    const timers = [90, 180, 300].map((ms) => window.setTimeout(update, ms))
    const observer = new ResizeObserver(update)
    observer.observe(nav)

    return () => {
      window.cancelAnimationFrame(readyId)
      timers.forEach((id) => window.clearTimeout(id))
      observer.disconnect()
    }
  }, [activeTab, gamesOpen])

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
          className={`library-nav-item${gamesOpen ? ' library-nav-item--active' : ''}`}
          onClick={() => onSelect('web')}
          aria-expanded={gamesOpen}
        >
          Games
        </button>

        <div
          className={`library-nav-sub${gamesOpen ? ' library-nav-sub--open' : ''}`}
          aria-hidden={!gamesOpen}
        >
          <div className="library-nav-sub-inner">
            <button
              type="button"
              className={`library-nav-item${activeTab === 'web' ? ' library-nav-item--active' : ''}`}
              onClick={() => onSelect('web')}
              tabIndex={gamesOpen ? 0 : -1}
            >
              Web
            </button>
            <button
              type="button"
              className={`library-nav-item${activeTab === 'android' ? ' library-nav-item--active' : ''}`}
              onClick={() => onSelect('android')}
              tabIndex={gamesOpen ? 0 : -1}
            >
              Android
            </button>
          </div>
        </div>

        <button
          ref={favoritesRef}
          type="button"
          className={`library-nav-item${activeTab === 'favorites' ? ' library-nav-item--active' : ''}`}
          onClick={() => onSelect('favorites')}
        >
          Favorites
        </button>
      </nav>
    </aside>
  )
}
