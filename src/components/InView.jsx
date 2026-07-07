import { useEffect, useRef, useState } from 'react'

// Renders its children only while the wrapper is on (or near) the screen.
// Heavy WebGL scenes get unmounted when scrolled away so they stop eating
// CPU/GPU every frame — big smoothness win when several exist on one page.
export default function InView({ children, className = '', rootMargin = '150px', fallback = null }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin,
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin])

  return (
    <div ref={ref} className={className}>
      {visible ? children : fallback}
    </div>
  )
}
