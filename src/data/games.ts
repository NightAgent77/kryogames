export type GameStatus = 'playable' | 'coming-soon' | 'downloadable'
export type GamePlatform = 'web' | 'android'

export interface Game {
  id: string
  title: string
  description: string
  genre: string
  status: GameStatus
  platform: GamePlatform
  tags: string[]
}

export const games: Game[] = [
  {
    id: 'placeholder-1',
    title: 'game placeholder',
    description:
      'A short teaser for your first browser game. Replace this with a real description when you are ready to ship.',
    genre: 'Arcade',
    status: 'coming-soon',
    platform: 'web',
    tags: ['Web', 'Single-player'],
  },
  {
    id: 'placeholder-2',
    title: 'Another Game',
    description:
      'Room for a second project — puzzle, platformer, or whatever you build next.',
    genre: 'Puzzle',
    status: 'coming-soon',
    platform: 'web',
    tags: ['Web', 'Casual'],
  },
  {
    id: 'placeholder-3',
    title: 'Desktop Build',
    description:
      'Some titles may also be available as downloads. This card is a placeholder for that flow.',
    genre: 'Adventure',
    status: 'coming-soon',
    platform: 'web',
    tags: ['Download', 'Web'],
  },
  {
    id: 'placeholder-4',
    title: 'Mobile Runner',
    description: 'Placeholder Android title for the mobile library tab.',
    genre: 'Action',
    status: 'coming-soon',
    platform: 'android',
    tags: ['Android', 'Casual'],
  },
  {
    id: 'placeholder-5',
    title: 'Pocket Puzzle',
    description: 'Another Android placeholder so the Android tab has more than one card.',
    genre: 'Puzzle',
    status: 'coming-soon',
    platform: 'android',
    tags: ['Android', 'Puzzle'],
  },
]
