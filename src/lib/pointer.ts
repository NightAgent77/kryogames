import { useEffect, useState } from 'react'

/** True when the menu can open on hover (desktop). iPhone / PWA uses tap only. */
export function useFineHover() {
  const [fine, setFine] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setFine(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return fine
}
