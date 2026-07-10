import { useEffect, useRef, useState } from 'react'
import claudeLogo from '../assets/claude-logo.svg'
import techHubLogo from '../assets/darklogo.png'

/* Aceternity background-gradient-animation, adapted: plain JSX, Tailwind v3,
   theme colours (Technical Hub green x Claude coral), scoped CSS vars (no
   document.body pollution), rectangle banner instead of full screen. */

const THEME_VARS = {
  '--gradient-background-start': 'rgb(3, 14, 8)',
  '--gradient-background-end': 'rgb(11, 7, 5)',
  '--first-color': '0, 135, 55', // Technical Hub green
  '--second-color': '217, 119, 87', // Claude coral
  '--third-color': '82, 183, 136', // brand mint
  '--fourth-color': '221, 133, 99', // light coral
  '--fifth-color': '31, 156, 92', // deep mint
  '--pointer-color': '217, 119, 87',
  '--size': '80%',
  '--blending-value': 'soft-light',
}

const blob = (extra) =>
  `absolute h-[var(--size)] w-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] [mix-blend-mode:var(--blending-value)] ${extra}`

export default function GradientBanner() {
  const interactiveRef = useRef(null)
  const pos = useRef({ curX: 0, curY: 0, tgX: 0, tgY: 0 })

  // smooth pointer-follow for the interactive blob
  useEffect(() => {
    let raf
    const move = () => {
      const p = pos.current
      p.curX += (p.tgX - p.curX) / 20
      p.curY += (p.tgY - p.curY) / 20
      if (interactiveRef.current) {
        interactiveRef.current.style.transform = `translate(${Math.round(p.curX)}px, ${Math.round(p.curY)}px)`
      }
      raf = requestAnimationFrame(move)
    }
    raf = requestAnimationFrame(move)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    pos.current.tgX = e.clientX - rect.left
    pos.current.tgY = e.clientY - rect.top
  }

  const [isSafari, setIsSafari] = useState(false)
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent))
  }, [])

  return (
    <section className="relative z-10 bg-black pb-10 pt-1 sm:pb-12 sm:pt-2">
      <div
        onMouseMove={handleMouseMove}
        style={THEME_VARS}
        className="relative h-[10.5rem] w-full overflow-hidden border-y border-white/10 bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))] xs:h-[11rem] sm:h-[12.5rem] md:h-[13rem] lg:h-[14rem]"
      >
        {/* goo filter */}
        <svg className="hidden">
          <defs>
            <filter id="banner-goo">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>

        {/* animated blobs — kept minimal */}
        <div
          className={`gradients-container h-full w-full opacity-45 blur-lg ${
            isSafari ? 'blur-2xl' : '[filter:url(#banner-goo)_blur(40px)]'
          }`}
        >
          <div className={blob('[background:radial-gradient(circle_at_center,_rgba(var(--first-color),_0.8)_0,_rgba(var(--first-color),_0)_50%)_no-repeat] [transform-origin:center_center] animate-first opacity-100')} />
          <div className={blob('[background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat] [transform-origin:calc(50%-400px)] animate-second opacity-100')} />
          <div className={blob('[background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat] [transform-origin:calc(50%+400px)] animate-third opacity-100')} />
          <div className={blob('[background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat] [transform-origin:calc(50%-200px)] animate-fourth opacity-70')} />
          <div className={blob('[background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat] [transform-origin:calc(50%-800px)_calc(50%+800px)] animate-fifth opacity-100')} />
          {/* pointer-follow blob */}
          <div
            ref={interactiveRef}
            className="absolute -left-1/2 -top-1/2 h-full w-full opacity-40 [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat] [mix-blend-mode:var(--blending-value)]"
          />
        </div>

        {/* logos — pinned to the top-left corner, aligned with the site's content edge */}
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2.5 xs:left-6 xs:top-5 xs:gap-3 sm:left-10 lg:left-16 xl:left-24">
          <img src={claudeLogo} alt="Claude" className="h-4 w-auto drop-shadow-lg xs:h-5 sm:h-6" />
          <span className="h-3.5 w-px bg-white/25 xs:h-4 sm:h-5" />
          <img src={techHubLogo} alt="Technical Hub" className="h-4 w-auto drop-shadow-lg xs:h-5 sm:h-6" />
        </div>

        {/* centred wordmark — smooth size ramp across every breakpoint */}
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-5 text-center xs:gap-2.5">
          <p className="bg-gradient-to-b from-white/90 to-white/25 bg-clip-text font-poppins text-[1.4rem] font-extrabold leading-tight text-transparent drop-shadow-2xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
            Claude × Technical Hub
          </p>
          <p className="max-w-[17rem] text-[0.6rem] font-medium leading-relaxed tracking-wide text-white/50 xs:max-w-xs xs:text-[0.65rem] sm:max-w-md sm:text-xs">
            The official Claude Partner Network — training, products, and integration.
          </p>
        </div>
      </div>
    </section>
  )
}
