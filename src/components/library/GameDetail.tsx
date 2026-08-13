import type { Game } from '../../data/games'
import { FavoriteGemButton } from './FavoriteGemButton'

interface GameDetailProps {
  game: Game
  favorited: boolean
  onToggleFavorite: () => void
  onBack: () => void
}

export function GameDetail({
  game,
  favorited,
  onToggleFavorite,
  onBack,
}: GameDetailProps) {
  const canPlay = game.status === 'playable' && Boolean(game.playUrl)

  return (
    <section
      className={`game-detail library-content--enter${game.coverImage ? ' game-detail--has-art' : ''}`}
      aria-labelledby="game-detail-title"
    >
      <button type="button" className="game-detail-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M10 3L5 8l5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      <div className="game-detail-layout">
        <div className="game-detail-media">
          {game.coverImage ? (
            <img
              src={game.coverImage}
              alt=""
              className="game-detail-cover"
            />
          ) : (
            <span className="game-detail-media-label" aria-hidden="true">
              Image placeholder
            </span>
          )}
        </div>

        <div className="game-detail-info">
          <p className="game-detail-genre">{game.genre}</p>
          <h2 id="game-detail-title" className="game-detail-title">
            {game.title}
          </h2>
          <p className="game-detail-description">{game.description}</p>

          <ul className="game-detail-tags" aria-label="Tags">
            {game.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>

          <div className="game-detail-actions">
            {canPlay ? (
              <a
                className="btn btn-primary game-detail-play"
                href={game.playUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Play
              </a>
            ) : (
              <button type="button" className="btn btn-secondary game-detail-play" disabled>
                Coming soon
              </button>
            )}
            <FavoriteGemButton favorited={favorited} onToggle={onToggleFavorite} />
          </div>
        </div>
      </div>
    </section>
  )
}
