import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from 'motion/react'
import React, {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import './Dock.css'

export type DockItemData = {
  icon: ReactNode
  label: ReactNode
  onClick: () => void
  className?: string
}

export type DockProps = {
  items?: DockItemData[]
  children?: ReactNode
  className?: string
  distance?: number
  panelHeight?: number
  baseItemSize?: number
  dockHeight?: number
  magnification?: number
  spring?: SpringOptions
  /** When true, outer height spring is skipped (sidebar owns layout). */
  fill?: boolean
  role?: React.AriaRole
  'aria-label'?: string
}

type DockItemProps = {
  className?: string
  children: ReactNode
  onClick?: () => void
  mouseY: MotionValue<number>
  spring: SpringOptions
  distance: number
  baseItemSize: number
  magnification: number
  label?: ReactNode
  active?: boolean
  /** Forwarded for active-indicator measurement */
  itemRef?: React.Ref<HTMLDivElement>
  role?: React.AriaRole
  tabIndex?: number
  'aria-expanded'?: boolean
  'aria-hidden'?: boolean
  'aria-checked'?: boolean | 'mixed'
}

type DockMotionContextValue = {
  mouseY: MotionValue<number>
  spring: SpringOptions
  distance: number
  baseItemSize: number
  magnification: number
  reduceMotion: boolean
}

const DockMotionContext = createContext<DockMotionContextValue | null>(null)

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduce(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduce
}

export function DockItem({
  children,
  className = '',
  onClick,
  mouseY,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
  active = false,
  itemRef,
  role = 'button',
  tabIndex = 0,
  'aria-expanded': ariaExpanded,
  'aria-hidden': ariaHidden,
  'aria-checked': ariaChecked,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isHovered = useMotionValue(0)
  const reduceMotion = usePrefersReducedMotion()

  const setRefs = (node: HTMLDivElement | null) => {
    ref.current = node
    if (typeof itemRef === 'function') itemRef(node)
    else if (itemRef && 'current' in itemRef) {
      ;(itemRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
  }

  const mouseDistance = useTransform(mouseY, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      y: 0,
      height: baseItemSize,
    }
    return val - rect.y - rect.height / 2
  })

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize],
  )
  const size = useSpring(targetSize, spring)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <motion.div
      ref={setRefs}
      style={
        reduceMotion
          ? { height: baseItemSize }
          : {
              height: size,
            }
      }
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`dock-item${active ? ' dock-item--active' : ''}${className ? ` ${className}` : ''}`}
      tabIndex={tabIndex}
      role={role}
      aria-haspopup={ariaExpanded !== undefined ? true : undefined}
      aria-label={typeof label === 'string' ? label : undefined}
      aria-expanded={ariaExpanded}
      aria-hidden={ariaHidden}
      aria-checked={ariaChecked}
    >
      {Children.map(children, (child) =>
        React.isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, {
              isHovered,
            })
          : child,
      )}
    </motion.div>
  )
}

type DockLabelProps = {
  className?: string
  children: ReactNode
  isHovered?: MotionValue<number>
}

export function DockLabel({ children, className = '', isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isHovered) return
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1)
    })
    return () => unsubscribe()
  }, [isHovered])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -4 }}
          transition={{ duration: 0.18 }}
          className={`dock-label${className ? ` ${className}` : ''}`}
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

type DockIconProps = {
  className?: string
  children: ReactNode
  isHovered?: MotionValue<number>
}

export function DockIcon({ children, className = '' }: DockIconProps) {
  return <div className={`dock-icon${className ? ` ${className}` : ''}`}>{children}</div>
}

/** Hook for composing custom Dock children that still get proximity springs. */
export function useDockMotion() {
  const ctx = useContext(DockMotionContext)
  if (!ctx) {
    throw new Error('useDockMotion must be used within a Dock')
  }
  return ctx
}

export default function Dock({
  items,
  children,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 58,
  distance = 140,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 42,
  fill = true,
  role = 'toolbar',
  'aria-label': ariaLabel = 'Library sections',
}: DockProps) {
  const mouseY = useMotionValue(Infinity)
  const isHovered = useMotionValue(0)
  const reduceMotion = usePrefersReducedMotion()

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight],
  )
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight])
  const height = useSpring(heightRow, spring)

  const ctx = useMemo(
    () => ({
      mouseY,
      spring,
      distance,
      baseItemSize,
      magnification,
      reduceMotion,
    }),
    [mouseY, spring, distance, baseItemSize, magnification, reduceMotion],
  )

  return (
    <DockMotionContext.Provider value={ctx}>
      <motion.div
        style={fill || reduceMotion ? undefined : { height, scrollbarWidth: 'none' }}
        className="dock-outer"
      >
        <motion.div
          onMouseMove={({ pageY }) => {
            isHovered.set(1)
            mouseY.set(pageY)
          }}
          onMouseLeave={() => {
            isHovered.set(0)
            mouseY.set(Infinity)
          }}
          className={`dock-panel${className ? ` ${className}` : ''}`}
          role={role}
          aria-label={ariaLabel}
        >
          {children
            ? children
            : items?.map((item, index) => (
                <DockItem
                  key={index}
                  onClick={item.onClick}
                  className={item.className}
                  mouseY={mouseY}
                  spring={spring}
                  distance={distance}
                  magnification={magnification}
                  baseItemSize={baseItemSize}
                  label={item.label}
                >
                  <DockIcon>{item.icon}</DockIcon>
                  <DockLabel>{item.label}</DockLabel>
                </DockItem>
              ))}
        </motion.div>
      </motion.div>
    </DockMotionContext.Provider>
  )
}
