import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import './KryoCursor.css'

const REST_TILT = 18
const SETTLE_MS = 320
const AIM_SPEED = 6
const HEADING_DEADZONE = 16
const VELOCITY_SMOOTH = 0.18
const NATIVE_HEADING = (Math.atan2(-10.7, -21.4) * 180) / Math.PI
const TILT_SPRING = { stiffness: 140, damping: 26, mass: 0.8 }

function nearestAngle(from: number, to: number) {
  const delta = ((to - from + 540) % 360) - 180
  return from + delta
}

function angleDelta(from: number, to: number) {
  return Math.abs(((to - from + 540) % 360) - 180)
}

const TEXT_TARGET = 'input, textarea, select, [contenteditable="true"]'
const INTERACTIVE_TARGET =
  'a, button, [role="button"], [role="menuitem"], summary, label, select, .dock-item'

function isCoarsePointer() {
  return window.matchMedia('(pointer: coarse)').matches
}

function KryoShard() {
  return (
    <svg className="kryo-cursor-shard" viewBox="0 0 28 28" aria-hidden="true">
      <path
        className="kryo-cursor-shard-body"
        d="M3.2 2.4 24.6 13.1 13.8 15.4 11.2 25.6Z"
      />
      <path
        className="kryo-cursor-shard-facet"
        d="M5.1 5.2 18.4 12.6 13.2 14.1 11.6 20.4Z"
      />
      <path className="kryo-cursor-shard-core" d="M7.2 7.4 13.8 11.2 11.8 12Z" />
    </svg>
  )
}

export function KryoCursor() {
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const [overText, setOverText] = useState(false)
  const visibleRef = useRef(false)
  const overTextRef = useRef(false)
  const interactiveRef = useRef(false)

  const x = useMotionValue(-80)
  const y = useMotionValue(-80)
  const rawTilt = useMotionValue(REST_TILT)
  const tilt = useSpring(rawTilt, TILT_SPRING)

  useEffect(() => {
    const pointerMq = window.matchMedia('(pointer: coarse)')
    const update = () => setEnabled(!pointerMq.matches && !isCoarsePointer())
    update()
    pointerMq.addEventListener('change', update)
    return () => pointerMq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (!enabled) {
      root.classList.remove('kryo-cursor-on')
      return
    }
    root.classList.toggle('kryo-cursor-on', visible && !overText)
    return () => root.classList.remove('kryo-cursor-on')
  }, [enabled, overText, visible])

  useEffect(() => {
    if (!enabled) return

    let lastX = 0
    let lastY = 0
    let primed = false
    let vx = 0
    let vy = 0
    let lastTarget = REST_TILT
    let settleTimer = 0

    const aimAt = (degrees: number) => {
      const target = nearestAngle(rawTilt.get(), degrees)
      if (angleDelta(lastTarget, target) < HEADING_DEADZONE && lastTarget !== REST_TILT) {
        return
      }
      lastTarget = target
      rawTilt.set(target)
    }

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)

      if (!primed) {
        lastX = event.clientX
        lastY = event.clientY
        primed = true
      }

      const dx = event.clientX - lastX
      const dy = event.clientY - lastY
      lastX = event.clientX
      lastY = event.clientY

      vx += (dx - vx) * VELOCITY_SMOOTH
      vy += (dy - vy) * VELOCITY_SMOOTH
      const speed = Math.hypot(vx, vy)

      if (speed > AIM_SPEED) {
        const heading = (Math.atan2(vy, vx) * 180) / Math.PI
        aimAt(heading - NATIVE_HEADING)
        window.clearTimeout(settleTimer)
        settleTimer = window.setTimeout(() => {
          lastTarget = REST_TILT
          rawTilt.set(nearestAngle(rawTilt.get(), REST_TILT))
          vx = 0
          vy = 0
        }, SETTLE_MS)
      }

      if (!visibleRef.current) {
        visibleRef.current = true
        setVisible(true)
      }

      const node = event.target
      if (!(node instanceof Element)) return

      const nextOverText = Boolean(node.closest(TEXT_TARGET))
      if (nextOverText !== overTextRef.current) {
        overTextRef.current = nextOverText
        setOverText(nextOverText)
      }

      const nextHot = Boolean(node.closest(INTERACTIVE_TARGET))
      if (nextHot !== interactiveRef.current) {
        interactiveRef.current = nextHot
        setInteractive(nextHot)
      }
    }

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') setPressed(true)
    }
    const onUp = () => setPressed(false)
    const onLeave = () => {
      visibleRef.current = false
      interactiveRef.current = false
      window.clearTimeout(settleTimer)
      lastTarget = REST_TILT
      primed = false
      vx = 0
      vy = 0
      rawTilt.set(REST_TILT)
      setVisible(false)
      setPressed(false)
      setInteractive(false)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.clearTimeout(settleTimer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [enabled, rawTilt, x, y])

  if (!enabled) return null

  return (
    <div
      className={`kryo-cursor${visible && !overText ? ' kryo-cursor--on' : ''}${
        interactive ? ' kryo-cursor--hot' : ''
      }${pressed ? ' kryo-cursor--press' : ''}`}
      aria-hidden="true"
    >
      <motion.div
        className="kryo-cursor-tip"
        style={{
          x,
          y,
          rotate: tilt,
          scale: pressed ? 0.92 : interactive ? 1.04 : 1,
        }}
      >
        <KryoShard />
      </motion.div>
    </div>
  )
}
