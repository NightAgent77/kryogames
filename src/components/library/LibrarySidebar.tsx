export type LibraryTab = 'web' | 'android' | 'favorites'

interface LibrarySidebarProps {
  activeTab: LibraryTab
  onSelect: (tab: LibraryTab) => void
  open: boolean
}

export function LibrarySidebar({ activeTab, onSelect, open }: LibrarySidebarProps) {
  const gamesOpen = activeTab === 'web' || activeTab === 'android'

  return (
    <aside
      className={`library-sidebar${open ? ' library-sidebar--open' : ''}`}
      aria-label="Library"
    >
      <div className="library-brand">Kryo Games</div>

      <nav className="library-nav" aria-label="Library sections">
        <button
          type="button"
          className={`library-nav-item${gamesOpen ? ' library-nav-item--active' : ''}`}
          onClick={() => onSelect('web')}
          aria-expanded={gamesOpen}
        >
          Games
        </button>

        {gamesOpen && (
          <div className="library-nav-sub">
            <button
              type="button"
              className={`library-nav-item${activeTab === 'web' ? ' library-nav-item--active' : ''}`}
              onClick={() => onSelect('web')}
            >
              Web
            </button>
            <button
              type="button"
              className={`library-nav-item${activeTab === 'android' ? ' library-nav-item--active' : ''}`}
              onClick={() => onSelect('android')}
            >
              Android
            </button>
          </div>
        )}

        <button
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
