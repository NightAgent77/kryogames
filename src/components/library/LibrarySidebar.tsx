import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import Dock, {
  DockIcon,
  DockItem,
  DockLabel,
  useDockMotion,
} from './Dock'

export type LibraryTab = 'web' | 'my-games' | 'favorites' | 'dev-games' | 'friends'

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

/** Dock item that reads proximity springs from the parent Dock context. */
function NavDockItem({
  label,
  active,
  onClick,
  itemRef,
  children,
  ariaExpanded,
}: {
  label: string
  active?: boolean
  onClick: () => void
  itemRef?: Ref<HTMLDivElement>
  children: ReactNode
  ariaExpanded?: boolean
}) {
  const { mouseY, spring, distance, baseItemSize, magnification } = useDockMotion()

  return (
    <DockItem
      label={label}
      active={active}
      onClick={onClick}
      itemRef={itemRef}
      mouseY={mouseY}
      spring={spring}
      distance={distance}
      baseItemSize={baseItemSize}
      magnification={magnification}
      aria-expanded={ariaExpanded}
      className="library-nav-item"
    >
      <DockIcon>{children}</DockIcon>
      <DockLabel>{label}</DockLabel>
    </DockItem>
  )
}

export function LibrarySidebar({
  activeTab,
  onSelect,
  open,
  onHoverStart,
  onHoverEnd,
}: LibrarySidebarProps) {
  const [libraryHovered, setLibraryHovered] = useState(false)
  const inGameLibrary =
    activeTab === 'my-games' ||
    activeTab === 'favorites' ||
    activeTab === 'dev-games'
  const libraryExpanded = inGameLibrary || libraryHovered
  const navRef = useRef<HTMLDivElement>(null)
  const homeRef = useRef<HTMLDivElement>(null)
  const libraryRef = useRef<HTMLDivElement>(null)
  const myGamesRef = useRef<HTMLButtonElement>(null)
  const favoritesRef = useRef<HTMLButtonElement>(null)
  const devGamesRef = useRef<HTMLButtonElement>(null)
  const friendsRef = useRef<HTMLDivElement>(null)
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
            : activeTab === 'dev-games'
              ? devGamesRef.current
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

    // Keep the highlight aligned while the Game library submenu animates open/closed,
    // and while dock magnification springs settle.
    const timers = [90, 180, 300, 480].map((ms) => window.setTimeout(update, ms))
    const observer = new ResizeObserver(update)
    observer.observe(nav)
    for (const el of [
      homeRef.current,
      libraryRef.current,
      friendsRef.current,
      myGamesRef.current,
      favoritesRef.current,
      devGamesRef.current,
    ]) {
      if (el) observer.observe(el)
    }

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

      <Dock
        className="library-nav"
        baseItemSize={42}
        magnification={58}
        distance={140}
        fill
      >
        <div ref={navRef} className="library-nav-track">
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

          <NavDockItem
            label="Home"
            active={activeTab === 'web'}
            onClick={() => onSelect('web')}
            itemRef={homeRef}
          >
            Home
          </NavDockItem>

          <div
            className="library-nav-group"
            onMouseEnter={() => setLibraryHovered(true)}
            onMouseLeave={() => setLibraryHovered(false)}
          >
            <NavDockItem
              label="Game library"
              active={inGameLibrary}
              onClick={() => onSelect('my-games')}
              itemRef={libraryRef}
              ariaExpanded={libraryExpanded}
            >
              Game library
            </NavDockItem>

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
                <button
                  ref={devGamesRef}
                  type="button"
                  className={`library-nav-item${activeTab === 'dev-games' ? ' library-nav-item--active' : ''}`}
                  onClick={() => onSelect('dev-games')}
                  tabIndex={libraryExpanded ? 0 : -1}
                >
                  Dev Games
                </button>
              </div>
            </div>
          </div>

          <NavDockItem
            label="Friends"
            active={activeTab === 'friends'}
            onClick={() => onSelect('friends')}
            itemRef={friendsRef}
          >
            Friends
          </NavDockItem>
        </div>
      </Dock>
    </aside>
  )
}
