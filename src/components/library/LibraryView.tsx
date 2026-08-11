import { useMemo, useState } from 'react'
import { games, type Game } from '../../data/games'
import { GameDetail } from './GameDetail'
import { LibraryGameGrid } from './LibraryGameGrid'
import { LibrarySidebar, type LibraryTab } from './LibrarySidebar'
import { LibraryTopBar } from './LibraryTopBar'
import './LibraryView.css'

export function LibraryView() {
  const [tab, setTab] = useState<LibraryTab>('web')
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  const filteredGames = useMemo(() => {
    if (tab === 'favorites') return []

    const query = search.trim().toLowerCase()
    return games.filter((game) => {
      if (game.platform !== tab) return false
      if (!query) return true
      return game.title.toLowerCase().includes(query)
    })
  }, [tab, search])

  const handleSelect = (next: LibraryTab) => {
    setTab(next)
    setSelectedGame(null)
    setSidebarOpen(false)
  }

  return (
    <div className="library">
      {sidebarOpen && (
        <button
          type="button"
          className="library-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <LibrarySidebar
        activeTab={tab}
        onSelect={handleSelect}
        open={sidebarOpen}
      />

      <div className="library-main">
        <LibraryTopBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setSelectedGame(null)
          }}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
        />

        {selectedGame ? (
          <GameDetail game={selectedGame} onBack={() => setSelectedGame(null)} />
        ) : (
          <LibraryGameGrid
            tab={tab}
            games={filteredGames}
            onSelectGame={setSelectedGame}
          />
        )}
      </div>
    </div>
  )
}
