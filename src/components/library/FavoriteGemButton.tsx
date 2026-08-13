import { useEffect, useRef, useState } from 'react'

interface FavoriteGemButtonProps {
  favorited: boolean
  onToggle: () => void
}

type AnimState = 'idle' | 'pop' | 'release'

export function FavoriteGemButton({ favorited, onToggle }: FavoriteGemButtonProps) {
  const [anim, setAnim] = useState<AnimState>('idle')
  const prevFavorited = useRef(favorited)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (prevFavorited.current === favorited) return

    const next: AnimState = favorited ? 'pop' : 'release'
    prevFavorited.current = favorited
    setAnim(next)

    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setAnim('idle')
      timerRef.current = null
    }, favorited ? 520 : 380)

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [favorited])

  return (
    <button
      type="button"
      className={[
        'favorite-gem',
        favorited ? 'favorite-gem--on' : '',
        anim === 'pop' ? 'favorite-gem--pop' : '',
        anim === 'release' ? 'favorite-gem--release' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onToggle}
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span className="favorite-gem-burst" aria-hidden="true" />
      <svg
        className="favorite-gem-icon"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        {/* Outer diamond */}
        <path
          className="favorite-gem-outline"
          d="M12 2.5L21.5 12L12 21.5L2.5 12L12 2.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Inner diamond */}
        <path
          className="favorite-gem-core"
          d="M12 7.25L16.75 12L12 16.75L7.25 12L12 7.25Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Facet spokes */}
        <path
          className="favorite-gem-spokes"
          d="M12 2.5V7.25M21.5 12H16.75M12 21.5V16.75M2.5 12H7.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
