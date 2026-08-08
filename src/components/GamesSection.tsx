import { games } from '../data/games'
import { GameCard } from './GameCard'

export function GamesSection() {
  return (
    <section id="games" className="section games-section" aria-labelledby="games-heading">
      <div className="section-header">
        <p className="section-eyebrow">Catalog</p>
        <h2 id="games-heading">Games</h2>
        <p className="section-lead">
          Web-first experiences with room to grow. Add your builds here as they
          ship.
        </p>
      </div>

      <div className="games-grid">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}
