import type { Game } from '../../data/games'
import { PlatformIcon } from './PlatformIcon'
import type { LibraryTab } from './LibrarySidebar'

const titles: Record<Exclude<LibraryTab, 'friends'>, string> = {
  web: 'Home',
  'my-games': 'My Games',
  favorites: 'Favorites',
  'dev-games': 'Dev Games',
}

const emptyMessages: Record<Exclude<LibraryTab, 'friends'>, string> = {
  web: 'No games yet',
  'my-games': 'No games yet',
  favorites: 'No favorites yet',
  'dev-games': 'No dev games yet',
}

interface LibraryGameGridProps {
  tab: LibraryTab
  games: Game[]
  onSelectGame: (game: Game) => void
}

export function LibraryGameGrid({ tab, games, onSelectGame }: LibraryGameGridProps) {
  if (tab === 'friends') return null

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
        <p className="library-empty">{emptyMessages[tab]}</p>
      ) : (
        <div className="library-grid">
          {games.map((game, index) => (
            <button
              key={game.id}
              type="button"
              className="library-card library-card--enter library-card--interactive library-card--with-meta"
              style={{ animationDelay: `${40 + index * 35}ms` }}
              onClick={() => onSelectGame(game)}
              aria-label={`${game.title}, ${game.platform}`}
            >
              <div className="library-card-media">
                {game.coverImage ? (
                  <img
                    src={game.coverImage}
                    alt=""
                    className="library-card-cover"
                  />
                ) : null}
              </div>

              <div className="library-card-meta">
                <span className="library-card-title">{game.title}</span>
                <PlatformIcon
                  platform={game.platform}
                  className="library-card-platform"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
