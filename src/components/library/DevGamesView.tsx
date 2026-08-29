import type { Game } from '../../data/games'
import { LibraryGameGrid } from './LibraryGameGrid'

interface DevGamesViewProps {
  games: Game[]
  onSelectGame: (game: Game) => void
}

export function DevGamesView({ games, onSelectGame }: DevGamesViewProps) {
  return (
    <LibraryGameGrid
      tab="dev-games"
      games={games}
      onSelectGame={onSelectGame}
    />
  )
}
