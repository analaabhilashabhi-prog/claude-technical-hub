import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue } from 'motion/react'

// Draggable, looping carousel where each slide is authored at a fixed design
// size and scaled to fit the container. Smooth spring transitions + autoplay.
const SPRING = { type: 'spring', stiffness: 260, damping: 30 }
const VELOCITY = 500

export default function ScreenCarousel({
  items,
  renderItem,
  designW = 1000,
  designH = 566,
  autoplay = true,
  delay = 4200,
  pauseOnHover = true,
  onIndexChange,
  background = 'transparent',
  className = '',
}) {
  const containerRef = useRef(null)
  const [width, setWidth] = useState(1)
  const [pos, setPos] = useState(1)
  const [jumping, setJumping] = useState(false)
  const [hovered, setHovered] = useState(false)
  const x = useMotionValue(0)
  const scale = width / designW

  const list = useMemo(
    () => (items.length ? [items[items.length - 1], ...items, items[0]] : []),
    [items]
  )

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth || 1)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    })
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!autoplay || list.length <= 1 || (pauseOnHover && hovered)) return
    const id = setInterval(() => setPos((p) => Math.min(p + 1, list.length - 1)), delay)
    return () => clearInterval(id)
  }, [autoplay, delay, pauseOnHover, hovered, list.length])

  const activeIndex = items.length ? (((pos - 1) % items.length) + items.length) % items.length : 0
  useEffect(() => {
    onIndexChange?.(activeIndex)
  }, [activeIndex, onIndexChange])

  const transition = jumping ? { duration: 0 } : SPRING

  const onDragEnd = (_, info) => {
    const { offset, velocity } = info
    const dir = offset.x < -20 || velocity.x < -VELOCITY ? 1 : offset.x > 20 || velocity.x > VELOCITY ? -1 : 0
    if (!dir) return
    setPos((p) => Math.max(0, Math.min(p + dir, list.length - 1)))
  }

  const onComplete = () => {
    if (list.length <= 1) return
    if (pos === list.length - 1) {
      setJumping(true)
      setPos(1)
      x.set(-1 * width)
      requestAnimationFrame(() => setJumping(false))
    } else if (pos === 0) {
      setJumping(true)
      setPos(items.length)
      x.set(-items.length * width)
      requestAnimationFrame(() => setJumping(false))
    }
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ background }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className="flex h-full cursor-grab active:cursor-grabbing"
        style={{ x }}
        drag="x"
        dragElastic={0.16}
        onDragEnd={onDragEnd}
        animate={{ x: -pos * width }}
        transition={transition}
        onAnimationComplete={onComplete}
      >
        {list.map((item, i) => (
          <div key={i} className="h-full shrink-0 overflow-hidden" style={{ width }}>
            <div
              className="relative origin-top-left"
              style={{ width: designW, height: designH, transform: `scale(${scale})` }}
            >
              {renderItem(item, i)}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
