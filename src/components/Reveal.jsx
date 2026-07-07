import { useEffect, useRef, useState } from 'react'

// Scroll-triggered reveal. Fades + slides its children in the first time they
// enter the viewport. `delay` (ms) lets you stagger siblings for a flow effect.
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    // replay each time it enters view (cinematic, like the masonry tiles)
    const io = new IntersectionObserver(([entry]) => setShown(entry.isIntersecting), {
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms`, willChange: 'transform, opacity, filter' }}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        shown ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-8 opacity-0 blur-[5px]'
      } ${className}`}
    >
      {children}
    </Tag>
  )
}
