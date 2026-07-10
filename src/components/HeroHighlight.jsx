import { useMotionValue, motion, useMotionTemplate } from 'motion/react'

// Dot grid that lights up (coral) around the cursor. Dark-theme tuned.
const DOTS = {
  base: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23262626' cx='10' cy='10' r='2.5'/%3E%3C/svg%3E")`,
  hover: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23d97757' cx='10' cy='10' r='2.5'/%3E%3C/svg%3E")`,
}

// `dotMask` (optional CSS mask-image) fades the dot layers — e.g. a bottom
// fade so the grid dissolves seamlessly into the next section.
export function HeroHighlight({ children, className = '', containerClassName = '', radius = 220, dotMask = null }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const onMove = ({ currentTarget, clientX, clientY }) => {
    if (!currentTarget) return
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const fadeStyle = dotMask ? { WebkitMaskImage: dotMask, maskImage: dotMask } : undefined

  return (
    <div className={`group relative w-full ${containerClassName}`} onMouseMove={onMove}>
      <div className="pointer-events-none absolute inset-0" style={fadeStyle}>
        {/* base dots */}
        <div className="absolute inset-0" style={{ backgroundImage: DOTS.base }} />
        {/* coral dots revealed around the cursor */}
        <motion.div
          className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            backgroundImage: DOTS.hover,
            WebkitMaskImage: useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`,
            maskImage: useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`,
          }}
        />
      </div>
      <div className={`relative z-20 ${className}`}>{children}</div>
    </div>
  )
}

// Animated sweep on the text itself — letters fill with Claude orange, left to right.
// Base text (from className) stays visible; a gradient-clipped clone paints over it.
export function Highlight({ children, className = '' }) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <motion.span
        aria-hidden="true"
        initial={{ backgroundSize: '0% 100%' }}
        animate={{ backgroundSize: '100% 100%' }}
        transition={{ duration: 1.6, ease: 'linear', delay: 0.6 }}
        style={{ backgroundRepeat: 'no-repeat', backgroundPosition: 'left center' }}
        className="absolute inset-0 bg-gradient-to-r from-claude-600 via-claude-500 to-claude-400 bg-clip-text text-transparent"
      >
        {children}
      </motion.span>
    </span>
  )
}
