import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './Masonry.css'

const useMedia = (queries, values, defaultValue) => {
  const get = () => values[queries.findIndex((q) => matchMedia(q).matches)] ?? defaultValue

  const [value, setValue] = useState(get)

  useEffect(() => {
    const handler = () => setValue(get)
    queries.forEach((q) => matchMedia(q).addEventListener('change', handler))
    return () => queries.forEach((q) => matchMedia(q).removeEventListener('change', handler))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries])

  return value
}

const useMeasure = () => {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  return [ref, size]
}

const preloadImages = async (urls) => {
  await Promise.all(
    urls.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image()
          img.src = src
          img.onload = img.onerror = () => resolve()
        })
    )
  )
}

const Masonry = ({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.97,
  blurToFocus = true,
  onItemClick,
}) => {
  const columns = useMedia(
    ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [5, 4, 3, 2],
    2
  )

  const [containerRef, { width }] = useMeasure()
  const [imagesReady, setImagesReady] = useState(false)
  const [aspects, setAspects] = useState({}) // img src -> naturalHeight/naturalWidth
  const [inView, setInView] = useState(false)

  // Toggle inView so the entrance animation replays every time the grid
  // scrolls back into view (and resets when it leaves).
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.12 }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [containerRef])

  const getInitialPosition = (item) => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return { x: item.x, y: item.y }

    let direction = animateFrom
    if (animateFrom === 'random') {
      const directions = ['top', 'bottom', 'left', 'right']
      direction = directions[Math.floor(Math.random() * directions.length)]
    }

    switch (direction) {
      case 'top':
        return { x: item.x, y: -200 }
      case 'bottom':
        return { x: item.x, y: window.innerHeight + 200 }
      case 'left':
        return { x: -200, y: item.y }
      case 'right':
        return { x: window.innerWidth + 200, y: item.y }
      case 'center':
        return { x: containerRect.width / 2 - item.w / 2, y: containerRect.height / 2 - item.h / 2 }
      default:
        return { x: item.x, y: item.y + 100 }
    }
  }

  // Load each image and record its real aspect ratio (h/w) so tiles can match
  // the photo shape — a mix of squares, portraits and landscapes.
  useEffect(() => {
    let cancelled = false
    Promise.all(
      items.map(
        (i) =>
          new Promise((resolve) => {
            const img = new Image()
            img.src = i.img
            img.onload = () =>
              resolve([i.img, img.naturalWidth ? img.naturalHeight / img.naturalWidth : 0.7])
            img.onerror = () => resolve([i.img, 0.7])
          })
      )
    ).then((pairs) => {
      if (cancelled) return
      setAspects(Object.fromEntries(pairs))
      setImagesReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [items])

  const grid = useMemo(() => {
    if (!width) return []
    const colHeights = new Array(columns).fill(0)
    const columnWidth = width / columns // 8px wrapper padding provides the visual gap
    return items.map((child) => {
      const col = colHeights.indexOf(Math.min(...colHeights))
      const x = columnWidth * col
      const ar = aspects[child.img] || 0.7 // fall back to gentle landscape until measured
      const height = columnWidth * ar // tile height follows the photo's true shape
      const y = colHeights[col]
      colHeights[col] += height
      return { ...child, x, y, w: columnWidth, h: height }
    })
  }, [columns, items, width, aspects])

  // total height so the container doesn't collapse (items are absolute)
  const containerHeight = useMemo(
    () => (grid.length ? Math.max(...grid.map((i) => i.y + i.h)) : 0),
    [grid]
  )

  useLayoutEffect(() => {
    if (!imagesReady) return

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`
      const initialPos = getInitialPosition(item, index)
      const initialState = {
        opacity: 0,
        x: initialPos.x,
        y: initialPos.y,
        width: item.w,
        height: item.h,
        ...(blurToFocus && { filter: 'blur(10px)' }),
      }

      if (!inView) {
        // Out of view — reset hidden so it replays next time it enters.
        gsap.set(selector, initialState)
        return
      }

      // In view — play the entrance every time.
      gsap.fromTo(selector, initialState, {
        opacity: 1,
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
        ...(blurToFocus && { filter: 'blur(0px)' }),
        duration: 1.15,
        ease: 'power3.out',
        delay: index * stagger,
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, imagesReady, inView, stagger, animateFrom, blurToFocus, duration, ease])

  const handleMouseEnter = (item) => {
    if (scaleOnHover) gsap.to(`[data-key="${item.id}"]`, { scale: hoverScale, duration: 0.3, ease: 'power2.out' })
  }
  const handleMouseLeave = (item) => {
    if (scaleOnHover) gsap.to(`[data-key="${item.id}"]`, { scale: 1, duration: 0.3, ease: 'power2.out' })
  }

  return (
    <div ref={containerRef} className="masonry-list" style={{ height: containerHeight }}>
      {grid.map((item) => (
        <div
          key={item.id}
          data-key={item.id}
          className="masonry-item-wrapper"
          onClick={() =>
            onItemClick
              ? onItemClick(item)
              : item.url && item.url !== '#' && window.open(item.url, '_blank', 'noopener')
          }
          onMouseEnter={() => handleMouseEnter(item)}
          onMouseLeave={() => handleMouseLeave(item)}
        >
          <div className="masonry-item-img" style={{ backgroundImage: `url(${item.img})` }}>
            <div className="masonry-item-overlay" />
            <div className="masonry-item-caption">
              {item.category && <span className="masonry-item-cat">{item.category}</span>}
              {item.title && <h3 className="masonry-item-title">{item.title}</h3>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Masonry
