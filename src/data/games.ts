export type GameStatus = 'playable' | 'coming-soon' | 'downloadable'
export type GamePlatform = 'web' | 'android' | 'windows' | 'mac' | 'ios'

export interface Game {
  id: string
  title: string
  description: string
  genre: string
  status: GameStatus
  platform: GamePlatform
  tags: string[]
  /** External playable URL (e.g. Cloudflare R2 / Pages host) */
  playUrl?: string
  /** Cover art path under /public */
  coverImage?: string
  /** Width÷height of cover art — keeps media slot matched so art scales without crop/bars */
  coverAspectRatio?: number
}

export const games: Game[] = [
  {
    id: 'snake-run',
    title: 'Snake Run',
    description:
      'A fast arcade snake game you can play in the browser. Grow longer, dodge yourself, and chase a high score — no install required.',
    genre: 'Arcade',
    status: 'playable',
    platform: 'web',
    tags: ['Web', 'Arcade', 'Single-player'],
    playUrl:
      'https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/snake-run/index.html',
    coverImage: '/games/snake-run.png',
    coverAspectRatio: 1024 / 674,
  },
  {
    id: 'fruit-rally',
    title: 'Fruit Rally',
    description:
      'A comic-book arcade racer. Grab the red fruit, dodge the rest, and keep the run alive as the track speeds up — playable straight in the browser.',
    genre: 'Arcade Racer',
    status: 'playable',
    platform: 'web',
    tags: ['Web', 'Arcade', 'Single-player'],
    playUrl:
      'https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/fruit-rally/index.html',
    coverImage: '/games/fruit-rally.jpg',
    coverAspectRatio: 874 / 575,
  },
  {
    id: 'tut-1',
    title: 'Tutorial Game 1',
    description:
      'A short q5play platformer. Run and jump the red block over the grey steps to the gold finish — Enter to start, arrows to move, space to jump.',
    genre: 'Platformer',
    status: 'playable',
    platform: 'web',
    tags: ['Web', 'Platformer', 'Single-player'],
    playUrl:
      'https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/tut-1/index.html',
    coverImage: '/games/tut-1.png',
    coverAspectRatio: 874 / 575,
  },
  {
    id: 'tut-2',
    title: 'Tutorial Game 2',
    description:
      'A short q5play maze. Steer the blue block through red corridors across three rooms to escape — Enter or the button to start, arrows to move.',
    genre: 'Maze',
    status: 'playable',
    platform: 'web',
    tags: ['Web', 'Maze', 'Single-player'],
    playUrl:
      'https://pub-e379ba287a9f4d8ba4cdbd6b6095cb6c.r2.dev/tut-2/index.html',
    coverImage: '/games/tut-2.png',
    coverAspectRatio: 874 / 575,
  },
]
