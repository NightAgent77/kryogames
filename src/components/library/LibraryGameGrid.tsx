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
}

export function LibraryGameGrid({ tab, games }: LibraryGameGridProps) {
  if (tab === 'favorites') {
    return (
      <section className="library-content" aria-labelledby="library-heading">
        <h2 id="library-heading" className="library-section-title">
          {titles[tab]}
        </h2>
        <p className="library-empty">No favorites yet</p>
      </section>
    )
  }

  const placeholders = Math.max(0, 8 - games.length)

  return (
    <section className="library-content" aria-labelledby="library-heading">
      <h2 id="library-heading" className="library-section-title">
        {titles[tab]}
      </h2>

      {games.length === 0 ? (
        <p className="library-empty">No games match your search.</p>
      ) : (
        <div className="library-grid">
          {games.map((game) => (
            <article key={game.id} className="library-card">
              {game.title}
            </article>
          ))}
          {Array.from({ length: placeholders }, (_, index) => (
            <div
              key={`empty-${index}`}
              className="library-card library-card--empty"
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </section>
  )
}
