import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { games, type Game } from '../../data/games'
import { loadFavorites, saveFavorites, toggleFavoriteId } from '../../lib/favorites'
import { upsertProfileFromUser } from '../../lib/friends'
import { startPresence, stopPresence } from '../../lib/presence'
import { flushPlaySession, startPlaySession } from '../../lib/playActivity'
import { recordPlayedGame } from '../../lib/playedGames'
import { FriendToasts } from './FriendToasts'
import { FriendsView } from './FriendsView'
import { GameDetail } from './GameDetail'
import { LibraryGameGrid } from './LibraryGameGrid'
import { LibrarySidebar, type LibraryTab } from './LibrarySidebar'
import { LibraryTopBar } from './LibraryTopBar'
import { ProfileView } from './ProfileView'
import './LibraryView.css'

const WASH_MS = 420

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function LibraryView() {
  const { user } = useAuth()
  const [tab, setTab] = useState<LibraryTab>('web')
  const [search, setSearch] = useState('')
  const [friendsSearch, setFriendsSearch] = useState('')
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [washGame, setWashGame] = useState<Game | null>(null)
  const [washExiting, setWashExiting] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const hideTimerRef = useRef<number | null>(null)
  const washTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setFavoriteIds([])
      return
    }
    setFavoriteIds(loadFavorites(user.id))
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    void upsertProfileFromUser(user)
  }, [user])

  useEffect(() => {
    if (!user?.id) {
      void stopPresence()
      return
    }
    void startPresence(user.id)
    return () => {
      void stopPresence()
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    const flush = () => {
      void flushPlaySession(user.id)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') flush()
    }

    window.addEventListener('focus', flush)
    document.addEventListener('visibilitychange', onVisibility)
    flush()

    return () => {
      window.removeEventListener('focus', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [user?.id])

  const sidebarOpen = sidebarPinned || sidebarHovered
  const washActive = Boolean(washGame) && !washExiting

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const clearWashTimer = () => {
    if (washTimerRef.current !== null) {
      window.clearTimeout(washTimerRef.current)
      washTimerRef.current = null
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

  const openGame = (game: Game) => {
    clearWashTimer()
    setShowProfile(false)
    setSelectedGame(game)
    setWashExiting(false)
    setWashGame(game.coverImage ? game : null)
  }

  const closeGameView = () => {
    setSelectedGame(null)
    if (!washGame) return

    if (prefersReducedMotion()) {
      clearWashTimer()
      setWashGame(null)
      setWashExiting(false)
      return
    }

    if (washExiting) return

    setWashExiting(true)
    clearWashTimer()
    washTimerRef.current = window.setTimeout(() => {
      setWashGame(null)
      setWashExiting(false)
      washTimerRef.current = null
    }, WASH_MS)
  }

  useEffect(
    () => () => {
      clearHideTimer()
      clearWashTimer()
    },
    [],
  )

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase()
    const favoriteSet = new Set(favoriteIds)

    if (tab === 'friends' || tab === 'my-games') return []

    return games.filter((game) => {
      if (tab === 'favorites') {
        if (!favoriteSet.has(game.id)) return false
      } else if (game.platform !== tab) {
        return false
      }
      if (!query) return true
      return game.title.toLowerCase().includes(query)
    })
  }, [tab, search, favoriteIds])

  const toggleFavorite = (gameId: string) => {
    if (!user?.id) return
    setFavoriteIds((prev) => {
      const next = toggleFavoriteId(prev, gameId)
      saveFavorites(user.id, next)
      return next
    })
  }

  const handleSelect = (next: LibraryTab) => {
    setTab(next)
    if (next === 'friends') {
      setFriendsSearch('')
    } else {
      setSearch('')
    }
    closeGameView()
    setShowProfile(false)
    setSidebarPinned(false)
    setSidebarHovered(false)
    clearHideTimer()
  }

  return (
    <div
      className={`library${washActive ? ' library--game' : ''}${showProfile ? ' library--profile' : ''}`}
    >
      {washGame ? (
        <div
          className={`library-wash${washExiting ? ' library-wash--exit' : ''}`}
          aria-hidden="true"
        >
          <img src={washGame.coverImage} alt="" />
        </div>
      ) : null}

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

      <div
        className={[
          'library-main',
          washActive ? 'library-main--game' : '',
          showProfile ? 'library-main--profile' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <LibraryTopBar
          search={tab === 'friends' ? friendsSearch : search}
          searchPlaceholder={
            tab === 'friends' ? 'Search usernames' : 'Search for games'
          }
          showSearch={!showProfile}
          onSearchChange={(value) => {
            if (tab === 'friends') {
              setFriendsSearch(value)
              setShowProfile(false)
              return
            }
            setSearch(value)
            closeGameView()
            setShowProfile(false)
          }}
          onMenuToggle={() => setSidebarPinned((open) => !open)}
          onMenuHoverStart={revealSidebar}
          onMenuHoverEnd={scheduleHideSidebar}
          menuExpanded={sidebarOpen}
          onViewProfile={() => {
            closeGameView()
            setShowProfile(true)
          }}
        />

        <FriendToasts />

        {showProfile ? (
          <ProfileView />
        ) : selectedGame ? (
          <GameDetail
            game={selectedGame}
            favorited={favoriteIds.includes(selectedGame.id)}
            onToggleFavorite={() => toggleFavorite(selectedGame.id)}
            onPlay={() => {
              if (!user?.id) return
              void recordPlayedGame(user.id, selectedGame.id)
              startPlaySession(user.id)
            }}
            onBack={closeGameView}
          />
        ) : tab === 'friends' ? (
          <FriendsView query={friendsSearch} />
        ) : (
          <LibraryGameGrid
            tab={tab}
            games={filteredGames}
            onSelectGame={openGame}
          />
        )}
      </div>
    </div>
  )
}
