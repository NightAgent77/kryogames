export type GameStatus = 'playable' | 'coming-soon' | 'downloadable'

export interface Game {
  id: string
  title: string
  description: string
  genre: string
  status: GameStatus
  tags: string[]
}

export const games: Game[] = [
  {
    id: 'placeholder-1',
    title: 'Game Title',
    description:
      'A short teaser for your first browser game. Replace this with a real description when you are ready to ship.',
    genre: 'Arcade',
    status: 'coming-soon',
    tags: ['Web', 'Single-player'],
  },
  {
    id: 'placeholder-2',
    title: 'Another Game',
    description:
      'Room for a second project — puzzle, platformer, or whatever you build next.',
    genre: 'Puzzle',
    status: 'coming-soon',
    tags: ['Web', 'Casual'],
  },
  {
    id: 'placeholder-3',
    title: 'Desktop Build',
    description:
      'Some titles may also be available as downloads. This card is a placeholder for that flow.',
    genre: 'Adventure',
    status: 'coming-soon',
    tags: ['Download', 'Web'],
  },
]
