import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { PublicHeader } from './PublicHeader'
import { ScrollStack } from './ScrollStack'
import './HomeView.css'

const ThinkingDots = lazy(() => import('./ThinkingDots'))

const DOTS_THEME = {
  dark: {
    color: '#ff44af',
    accentColor: '#ff44af',
    backgroundColor: '#121212',
    ambient: 0.42,
  },
  light: {
    color: '#ff44af',
    accentColor: '#ff44af',
    backgroundColor: '#eef0f3',
    ambient: 0.38,
  },
} as const

class BackdropErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

const ABOUT_CARDS = [
  {
    eyebrow: 'Studio',
    title: 'An indie shelf for small games',
    body: 'Kryo Games is a personal studio site. Titles live in the browser first — no install wall, no storefront maze. Just a library you can open and play.',
  },
  {
    eyebrow: 'Play',
    title: 'Launch in a tab',
    body: 'Snake Run, Fruit Rally, and the tutorial rooms all run from a Play button. Sessions stay light so you can drop in, chase a score, and leave without a download.',
  },
  {
    eyebrow: 'Library',
    title: 'A shelf that stays yours',
    body: 'Sign in and the catalog becomes your space — favorites, hours on the heatmap, and a count of games you have actually opened. Progress follows the account, not the machine.',
  },
  {
    eyebrow: 'Friends',
    title: 'See who is in the room',
    body: 'Search usernames, send requests, and watch the Online list light up when someone signs back in. The studio stays small on purpose: a circle, not a feed.',
  },
  {
    eyebrow: 'Kryo Play',
    title: 'Get started when you are ready',
    body: 'The signed-in app is Kryo Play — home, favorites, friends, and profile. Get started on this page to open the same frost sign-up you already know.',
  },
]

export function HomeView() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [reduceMotion, setReduceMotion] = useState(false)
  const year = new Date().getFullYear()
  const dots = DOTS_THEME[theme]

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <div className="home public-shell">
      <div className="home-dots" aria-hidden="true">
        <BackdropErrorBoundary>
          <Suspense fallback={null}>
            <ThinkingDots
              color={dots.color}
              accentColor={dots.accentColor}
              backgroundColor={dots.backgroundColor}
              ambient={dots.ambient}
              paused={reduceMotion}
              cursorInteraction={!reduceMotion}
            />
          </Suspense>
        </BackdropErrorBoundary>
      </div>

      <PublicHeader />

      <section className="home-hero">
        <div className="home-hero-title">
          <h1>
            <span className="visually-hidden">KryoGames</span>
            <span aria-hidden="true">Kryo</span>
            <span aria-hidden="true">Games</span>
          </h1>
          {user ? (
            <button
              type="button"
              className="home-get-started"
              onClick={() => navigate('/play')}
            >
              Enter library
            </button>
          ) : (
            <button
              type="button"
              className="home-get-started"
              onClick={() => navigate('/login')}
            >
              Get started
            </button>
          )}
        </div>
      </section>

      <ScrollStack items={ABOUT_CARDS} />

      <footer className="home-footer">
        <p>&copy; {year} KryoGames</p>
      </footer>
    </div>
  )
}
