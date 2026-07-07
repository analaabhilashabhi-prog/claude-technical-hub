import { useMotionValue, motion, useMotionTemplate } from 'motion/react'

// Dot grid that lights up (coral) around the cursor. Dark-theme tuned.
const DOTS = {
  base: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23262626' cx='10' cy='10' r='2.5'/%3E%3C/svg%3E")`,
  hover: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23d97757' cx='10' cy='10' r='2.5'/%3E%3C/svg%3E")`,
}

export function HeroHighlight({ children, className = '', containerClassName = '', radius = 220 }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const onMove = ({ currentTarget, clientX, clientY }) => {
    if (!currentTarget) return
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div className={`group relative w-full ${containerClassName}`} onMouseMove={onMove}>
      {/* base dots */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: DOTS.base }} />
      {/* coral dots revealed around the cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          backgroundImage: DOTS.hover,
          WebkitMaskImage: useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`,
          maskImage: useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`,
        }}
      />
      <div className={`relative z-20 ${className}`}>{children}</div>
    </div>
  )
}
