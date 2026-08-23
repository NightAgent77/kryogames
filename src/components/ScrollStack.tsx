import { useEffect, useRef, useState } from 'react'
import './ScrollStack.css'

export type ScrollStackItem = {
  eyebrow?: string
  title: string
  body: string
}

type ScrollStackProps = {
  items: ScrollStackItem[]
  scrollLength?: number
  peek?: number
  scaleStep?: number
  blur?: number
  dim?: number
  smooth?: number
  depth?: number
  cardWidth?: number
  cardHeight?: number
  borderRadius?: number
  showProgress?: boolean
  showCounter?: boolean
  className?: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function ScrollStack({
  items,
  scrollLength = 1.15,
  peek = 28,
  scaleStep = 0.06,
  blur = 5,
  dim = 0.22,
  smooth = 0.12,
  depth = 3,
  cardWidth = 880,
  cardHeight = 0.62,
  borderRadius = 22,
  showProgress = true,
  showCounter = true,
  className = '',
}: ScrollStackProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLElement | null)[]>([])
  const railRef = useRef<HTMLSpanElement>(null)
  const counterRef = useRef<HTMLParagraphElement>(null)
  const progress = useRef(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const count = items.length

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reduceMotion) return

    let raf = 0
    let last = performance.now()
    let running = true
    let lastActive = -1

    const apply = (p: number) => {
      const stageH = stageRef.current?.offsetHeight ?? 480
      const travel = stageH + 48

      items.forEach((_, index) => {
        const el = cardRefs.current[index]
        if (!el) return

        const delta = p - index
        let y = 0
        let scale = 1
        let rotate = 0
        let opacity = 1
        let filterBlur = 0
        let brightness = 1
        let z = 10

        if (delta < -1) {
          y = travel
          opacity = 0
          z = 5
        } else if (delta < 0) {
          const t = delta + 1
          y = (1 - t) * travel
          rotate = (1 - t) * 8
          opacity = 0.35 + t * 0.65
          z = 40 + index
        } else {
          const stacked = Math.min(delta, depth + 0.5)
          y = -stacked * peek
          scale = Math.max(0.78, 1 - stacked * scaleStep)
          rotate = -stacked * 1.4
          filterBlur = stacked * blur
          brightness = 1 - Math.min(stacked, 1.4) * dim
          opacity = stacked > depth ? 0 : 1
          z = 20 - index
        }

        el.style.opacity = String(opacity)
        el.style.transform = `translate3d(0, ${y}px, 0) scale(${scale}) rotateX(${rotate}deg)`
        el.style.filter = `blur(${filterBlur}px) brightness(${brightness})`
        el.style.zIndex = String(Math.round(z))
        el.style.pointerEvents = delta >= -0.04 && delta < 0.96 ? 'auto' : 'none'
        el.setAttribute('aria-hidden', delta < -0.2 || delta >= 1 ? 'true' : 'false')
      })

      const active = clamp(Math.round(p), 0, count - 1)
      if (railRef.current) {
        const rail = count <= 1 ? 1 : p / (count - 1)
        railRef.current.style.transform = `scaleX(${clamp(rail, 0, 1)})`
      }
      if (counterRef.current && active !== lastActive) {
        lastActive = active
        counterRef.current.textContent = `${pad(active + 1)} / ${pad(count)}`
      }
    }

    const tick = (now: number) => {
      if (!running) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const section = sectionRef.current
      if (section) {
        const total = Math.max(1, section.offsetHeight - window.innerHeight)
        const raw = clamp(-section.getBoundingClientRect().top / total, 0, 1)
        const target = raw * Math.max(count - 1, 0)
        const follow = 1 - Math.exp(-dt / Math.max(smooth, 0.04))
        progress.current += (target - progress.current) * follow
        apply(progress.current)
      }

      raf = requestAnimationFrame(tick)
    }

    apply(0)
    raf = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(raf)
    }
  }, [blur, count, depth, dim, items, peek, reduceMotion, scaleStep, smooth])

  return (
    <section
      ref={sectionRef}
      className={`scroll-stack${className ? ` ${className}` : ''}`}
      style={{
        height: reduceMotion ? undefined : `${Math.max(count, 1) * scrollLength * 100}vh`,
        ['--stack-card-width' as string]: `${cardWidth}px`,
        ['--stack-card-height' as string]: `${cardHeight}`,
        ['--stack-radius' as string]: `${borderRadius}px`,
      }}
      aria-label="About Kryo Games"
    >
      <div className="scroll-stack-pin">
        <div ref={stageRef} className="scroll-stack-stage">
          {items.map((item, index) => (
            <article
              key={item.title}
              ref={(node) => {
                cardRefs.current[index] = node
              }}
              className="scroll-stack-card"
            >
              {item.eyebrow ? (
                <p className="scroll-stack-card-eyebrow">{item.eyebrow}</p>
              ) : null}
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>

        {(showProgress || showCounter) && (
          <div className="scroll-stack-meta">
            {showProgress && (
              <div className="scroll-stack-progress" aria-hidden="true">
                <span ref={railRef} />
              </div>
            )}
            {showCounter && (
              <p ref={counterRef} className="scroll-stack-counter">
                {pad(1)} / {pad(count)}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
