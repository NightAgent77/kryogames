import { useEffect, useMemo, useRef, useState } from 'react'
import { games, type Game } from '../../data/games'
import { GameDetail } from './GameDetail'
import { LibraryGameGrid } from './LibraryGameGrid'
import { LibrarySidebar, type LibraryTab } from './LibrarySidebar'
import { LibraryTopBar } from './LibraryTopBar'
import { ProfileView } from './ProfileView'
import './LibraryView.css'

export function LibraryView() {
  const [tab, setTab] = useState<LibraryTab>('web')
  const [search, setSearch] = useState('')
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

  const sidebarOpen = sidebarPinned || sidebarHovered

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const revealSidebar = () => {
    clearHideTimer()
    setSidebarHovered(true)
  }

  const scheduleHideSidebar = () => {
    clearHideTimer()
    hideTimerRef.current = window.setTimeout(() => {
      setSidebarHovered(false)
      hideTimerRef.current = null
    }, 280)
  }

  useEffect(() => () => clearHideTimer(), [])

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
    setShowProfile(false)
    setSidebarPinned(false)
    setSidebarHovered(false)
    clearHideTimer()
  }

  return (
    <div className="library">
      {sidebarPinned && (
        <button
          type="button"
          className="library-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarPinned(false)}
        />
      )}

      <LibrarySidebar
        activeTab={tab}
        onSelect={handleSelect}
        open={sidebarOpen}
        onHoverStart={revealSidebar}
        onHoverEnd={scheduleHideSidebar}
      />

      <div className="library-main">
        <LibraryTopBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setSelectedGame(null)
            setShowProfile(false)
          }}
          onMenuToggle={() => setSidebarPinned((open) => !open)}
          onMenuHoverStart={revealSidebar}
          onMenuHoverEnd={scheduleHideSidebar}
          menuExpanded={sidebarOpen}
          onViewProfile={() => {
            setSelectedGame(null)
            setShowProfile(true)
          }}
        />

        {showProfile ? (
          <ProfileView onBack={() => setShowProfile(false)} />
        ) : selectedGame ? (
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
