import { useEffect, useRef, useState } from 'react'

// Premium reveal variants — each a hidden/shown style pair with matching
// transform function lists so the transition interpolates smoothly.
const VARIANTS = {
  'fade-up': {
    hidden: { opacity: 0, transform: 'translate3d(0, 64px, 0)' },
    shown: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'fade-down': {
    hidden: { opacity: 0, transform: 'translate3d(0, -64px, 0)' },
    shown: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'slide-left': {
    hidden: { opacity: 0, transform: 'translate3d(-80px, 0, 0)' },
    shown: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'slide-right': {
    hidden: { opacity: 0, transform: 'translate3d(80px, 0, 0)' },
    shown: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  zoom: {
    hidden: { opacity: 0, transform: 'scale(0.9)' },
    shown: { opacity: 1, transform: 'scale(1)' },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(18px)', transform: 'translate3d(0, 24px, 0)' },
    shown: { opacity: 1, filter: 'blur(0px)', transform: 'translate3d(0, 0, 0)' },
  },
  fade: {
    hidden: { opacity: 0 },
    shown: { opacity: 1 },
  },
  tilt: {
    hidden: {
      opacity: 0,
      transform: 'perspective(1400px) rotateX(16deg) translate3d(0, 56px, 0)',
    },
    shown: {
      opacity: 1,
      transform: 'perspective(1400px) rotateX(0deg) translate3d(0, 0, 0)',
    },
  },
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)' // expo-out: quick lead, long cinematic settle

export default function SectionReveal({ children, variant = 'fade-up', duration = 1.25, className = '' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // trigger a touch after the section starts entering, so it reveals as you scroll to it
    const obs = new IntersectionObserver(([entry]) => setShown(entry.isIntersecting), {
      threshold: 0.1,
      rootMargin: '0px 0px -12% 0px',
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const v = VARIANTS[variant] || VARIANTS['fade-up']
  const style = {
    ...(shown ? v.shown : v.hidden),
    transition: `opacity ${duration * 0.9}s ${EASE}, transform ${duration}s ${EASE}, filter ${duration * 0.95}s ${EASE}`,
    willChange: 'transform, opacity, filter',
    transformStyle: 'preserve-3d',
  }

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
