import type { Game } from '../../data/games'
import type { LibraryTab } from './LibrarySidebar'

const titles: Record<LibraryTab, string> = {
  web: 'Web',
  android: 'Android',
  favorites: 'Favorites',
}

interface LibraryGameGridProps {
  tab: LibraryTab
  games: Game[]
  onSelectGame: (game: Game) => void
}

export function LibraryGameGrid({ tab, games, onSelectGame }: LibraryGameGridProps) {
  if (tab === 'favorites') {
    return (
      <section
        key={tab}
        className="library-content library-content--enter"
        aria-labelledby="library-heading"
      >
        <h2 id="library-heading" className="library-section-title">
          {titles[tab]}
        </h2>
        <p className="library-empty">No favorites yet</p>
      </section>
    )
  }

  const placeholders = Math.max(0, 8 - games.length)

  return (
    <section
      key={tab}
      className="library-content library-content--enter"
      aria-labelledby="library-heading"
    >
      <h2 id="library-heading" className="library-section-title">
        {titles[tab]}
      </h2>

      {games.length === 0 ? (
        <p className="library-empty">No games match your search.</p>
      ) : (
        <div className="library-grid">
          {games.map((game, index) => {
            const showTitle = game.status === 'playable' || Boolean(game.playUrl)

            return (
              <button
                key={game.id}
                type="button"
                className="library-card library-card--enter library-card--interactive"
                style={{ animationDelay: `${40 + index * 35}ms` }}
                onClick={() => onSelectGame(game)}
                aria-label={game.title}
              >
                {showTitle ? game.title : null}
              </button>
            )
          })}
          {Array.from({ length: placeholders }, (_, index) => (
            <div
              key={`empty-${index}`}
              className="library-card library-card--empty library-card--enter"
              style={{ animationDelay: `${40 + (games.length + index) * 35}ms` }}
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </section>
  )
}
