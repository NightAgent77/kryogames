import type { Game } from '../data/games'

const statusLabels: Record<Game['status'], string> = {
  playable: 'Play now',
  'coming-soon': 'Coming soon',
  downloadable: 'Download',
}

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  const isPlayable = game.status === 'playable'

  return (
    <article className="game-card">
      <div className="game-card-thumb" aria-hidden="true">
        <span className="game-card-genre">{game.genre}</span>
      </div>

      <div className="game-card-body">
        <div className="game-card-header">
          <h3>{game.title}</h3>
          <span className={`game-status game-status--${game.status}`}>
            {statusLabels[game.status]}
          </span>
        </div>

        <p className="game-card-description">{game.description}</p>

        <ul className="game-tags" aria-label="Game tags">
          {game.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        <div className="game-card-actions">
          {isPlayable ? (
            <a href={`/games/${game.id}`} className="btn btn-primary btn-sm">
              Play
            </a>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" disabled>
              {game.status === 'downloadable' ? 'Download' : 'Coming soon'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
