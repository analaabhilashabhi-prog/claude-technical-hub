import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'motion/react'
import { Academic, TrendingUp, User } from './Icons'
import claudeLogo from '../assets/claude-logo.svg'
import techHubLogo from '../assets/darklogo.png'
import logoAditya from '../assets/logo-aditya.png'
import logoNcet from '../assets/logo-ncet.png'
import logoTorii from '../assets/logo-toriiminds.png'

/* Aceternity MacBook-scroll, adapted to this stack: plain JSX, Tailwind v3,
   no external icon package, always-dark theme. The lid opens with scroll and
   the screen (a live preview of the Success Stories page) grows to full size,
   flowing straight into the real section below. */

const cn = (...c) => c.filter(Boolean).join(' ')

/* ---------- tiny keyboard glyphs (decorative, ~6px) ---------- */
const G = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p} />
)
const SunDim = (p) => <G {...p}><circle cx="12" cy="12" r="4" /><path d="M12 4v1M12 19v1M4 12h1M19 12h1" /></G>
const Sun = (p) => <G {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></G>
const Grid = (p) => <G {...p}><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></G>
const SearchI = (p) => <G {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></G>
const Mic = (p) => <G {...p}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v1a7 7 0 0014 0v-1M12 18v4" /></G>
const Moon = (p) => <G {...p}><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" /></G>
const Prev = (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M11 12l8-6v12l-8-6zM5 6h2v12H5z" /></svg>
const Play = (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M6 5l10 7-10 7V5zM17 5h2v14h-2z" /></svg>
const Next = (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 12L5 6v12l8-6zM17 6h2v12h-2z" /></svg>
const Vol = (p) => <G {...p}><path d="M11 5L6 9H3v6h3l5 4V5z" /></G>
const Vol2 = (p) => <G {...p}><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M15 9a4 4 0 010 6" /></G>
const Vol3 = (p) => <G {...p}><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M15 9a4 4 0 010 6M18 7a7 7 0 010 10" /></G>
const World = (p) => <G {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" /></G>
const ChevUp = (p) => <G {...p}><path d="M6 15l6-6 6 6" /></G>
const Cmd = (p) => <G {...p}><path d="M9 9h6v6H9zM9 9H7a2 2 0 112-2v2zM15 9h2a2 2 0 10-2-2v2zM9 15H7a2 2 0 102 2v-2zM15 15h2a2 2 0 11-2 2v-2z" /></G>
const CaretU = (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 8l6 8H6z" /></svg>
const CaretD = (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 16L6 8h12z" /></svg>
const CaretL = (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M8 12l8-6v12z" /></svg>
const CaretR = (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M16 12l-8 6V6z" /></svg>
const OptionKey = (p) => <G {...p}><path d="M4 6h5l6 12h5M15 6h5" /></G>

/* ---------- terminal lines typed onto the MacBook screen ---------- */
const TERM_LINES = [
  {
    text: 'Campuses run on Claude.',
    accent: 'Claude.',
    accentClass: 'text-brand-300',
    Icon: Academic,
    chipClass: 'border-brand-300/25 bg-brand-500/10 text-brand-300 shadow-[0_0_18px_rgba(0,135,55,0.15)]',
  },
  {
    text: 'Teams ship 3× faster.',
    accent: '3× faster.',
    accentClass: 'bg-gradient-to-r from-claude-300 via-claude-400 to-claude-500 bg-clip-text font-bold text-transparent',
    Icon: TrendingUp,
    chipClass: 'border-claude-400/25 bg-claude-500/10 text-claude-400 shadow-[0_0_18px_rgba(217,119,87,0.15)]',
  },
  {
    text: 'The only thing missing is your_name up here.',
    accent: 'your_name',
    accentClass:
      'whitespace-nowrap rounded-md border border-dashed border-white/30 bg-white/[0.03] px-1.5 py-0.5 text-white/50',
    Icon: User,
    chipClass: 'border-dashed border-white/25 bg-white/[0.03] text-white/55',
  },
]

/* colour the accent part of a partially-typed line */
function TypedText({ line, count }) {
  const start = line.text.indexOf(line.accent)
  const end = start + line.accent.length
  const pre = line.text.slice(0, Math.min(count, start))
  const acc = count > start ? line.text.slice(start, Math.min(count, end)) : ''
  const post = count > end ? line.text.slice(end, count) : ''
  return (
    <>
      {pre}
      {acc && <span className={line.accentClass}>{acc}</span>}
      {post}
    </>
  )
}

/* ---------- what plays on the MacBook screen ----------
   Header + footer are fixed; the middle content is typed BY the scroll:
   once the lid is open, each stretch of scrolling types the next line
   (scrolling back up un-types it again). */
const TYPE_START = 0.32 // scroll progress where typing begins (lid fully open)
// the section below enters the viewport at ~55% progress, so the last
// character must land before that
const TYPE_END = 0.52

function ScreenPreview({ progress }) {
  const [cursorOn, setCursorOn] = useState(true)

  // blinking block cursor
  useEffect(() => {
    const iv = setInterval(() => setCursorOn((v) => !v), 530)
    return () => clearInterval(iv)
  }, [])

  // map scroll progress -> total characters typed, split across lines by length
  const lens = TERM_LINES.map((l) => l.text.length)
  const totalChars = lens.reduce((a, b) => a + b, 0)
  const t = Math.max(0, Math.min(1, (progress - TYPE_START) / (TYPE_END - TYPE_START)))
  const typed = Math.round(t * totalChars)

  let remaining = typed
  const counts = lens.map((len) => {
    const c = Math.max(0, Math.min(len, remaining))
    remaining -= c
    return c
  })

  const started = typed > 0
  const lineIdx = counts.findIndex((c, i) => c < lens[i]) === -1 ? TERM_LINES.length : counts.findIndex((c, i) => c < lens[i])
  const done = typed >= totalChars
  const cursor = (blink) => (
    <span
      className={`ml-1 inline-block h-4 w-2 translate-y-0.5 bg-white/70 transition-opacity duration-100 ${
        blink && !cursorOn ? 'opacity-0' : ''
      }`}
    />
  )

  return (
    <div className="absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-lg bg-[#060607] px-8 py-6">
      {/* soft ambient glows behind the glass */}
      <div
        className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,135,55,0.16), transparent 65%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.13), transparent 65%)' }}
      />

      {/* fixed header — brand lockup */}
      <div className="relative flex items-center gap-2.5">
        <img src={claudeLogo} alt="Claude" className="h-4 w-auto" />
        <span className="h-3.5 w-px bg-white/20" />
        <img src={techHubLogo} alt="Technical Hub" className="h-4 w-auto" />
        <span className="h-px flex-1 bg-gradient-to-r from-claude-400/50 to-transparent" />
      </div>

      {/* terminal body */}
      <div className="relative flex flex-1 flex-col justify-center">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-[0.5rem] font-bold uppercase tracking-[0.32em] text-white/35">
            ~/the-claude-partner-network
          </span>
          <span className="h-px w-12 bg-white/15" />
        </div>

        {/* before the lid opens: just a waiting prompt */}
        {!started ? (
          <div className="font-mono text-[1.05rem] font-semibold text-white/60">
            <span className="text-brand-300">❯</span>
            {cursor(true)}
          </div>
        ) : (
          <div className="space-y-4">
            {TERM_LINES.map((line, i) => {
              if (counts[i] <= 0) return null
              const LineIcon = line.Icon
              const isCurrent = i === lineIdx
              return (
                <div key={line.text} className="flex items-center gap-3.5">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${line.chipClass}`}
                  >
                    <LineIcon width={14} height={14} />
                  </span>
                  <p className="font-mono text-[1.05rem] font-semibold leading-snug tracking-tight text-white">
                    <TypedText line={line} count={counts[i]} />
                    {isCurrent && cursor(false)}
                  </p>
                </div>
              )
            })}
            {/* after everything is typed: resting prompt with blinking cursor */}
            {done && (
              <div className="font-mono text-[1.05rem] font-semibold text-white/60">
                <span className="text-brand-300">❯</span>
                {cursor(true)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* fixed footer — trusted-by strip */}
      <div className="relative flex items-center gap-5 border-t border-white/10 pt-4">
        <span className="shrink-0 text-[0.5rem] font-bold uppercase tracking-[0.28em] text-white/30">
          Trusted by
        </span>
        <div className="flex flex-1 items-center justify-center gap-6">
          <img src={logoNcet} alt="NCET" className="h-6 w-auto opacity-75" />
          <img src={logoAditya} alt="Aditya University" className="h-7 w-auto opacity-75" />
          <img src={logoTorii} alt="Torii Minds" className="h-4 w-auto opacity-75" />
        </div>
        <span className="shrink-0 rounded-full border border-dashed border-white/25 px-3 py-1 text-[0.5rem] font-bold uppercase tracking-[0.22em] text-white/45">
          You, next
        </span>
      </div>
    </div>
  )
}

export default function MacbookShowcase() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (window && window.innerWidth < 768) setIsMobile(true)
  }, [])

  // scroll progress feeds the terminal — each scroll step types the next characters
  const [prog, setProg] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setProg(Math.round(v * 500) / 500) // quantized so re-renders stay cheap
  })

  // screen opens, then grows past the chassis toward full-screen size
  const scaleX = useTransform(scrollYProgress, [0, 0.3], [1.2, isMobile ? 1 : 1.7])
  const scaleY = useTransform(scrollYProgress, [0, 0.3], [0.6, isMobile ? 1 : 1.7])
  const translate = useTransform(scrollYProgress, [0, 1], [0, 1500])
  const rotate = useTransform(scrollYProgress, [0.1, 0.12, 0.3], [-28, -28, 0])
  const textTransform = useTransform(scrollYProgress, [0, 0.3], [0, 100])
  const textOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  // whole laptop dissolves only after the last line is typed (typing ends at 0.52),
  // just as the next section scrolls in over it
  const fadeOut = useTransform(scrollYProgress, [0.56, 0.72], [1, 0])

  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* ambient glows — behind everything, never interactive */}
      <div className="pointer-events-none absolute left-[-8%] top-[8%] h-96 w-96 rounded-full bg-claude-500/[0.07] blur-[160px]" />
      <div className="pointer-events-none absolute right-[-6%] top-[32%] h-96 w-96 rounded-full bg-brand-500/[0.08] blur-[170px]" />
      <div
        ref={ref}
        className="flex min-h-[220vh] shrink-0 scale-[0.35] transform flex-col items-center justify-start py-0 [perspective:800px] sm:scale-50 md:scale-100 md:py-60"
      >
        <motion.h2
          style={{ translateY: textTransform, opacity: textOpacity }}
          className="mb-20 text-center font-poppins text-3xl font-extrabold text-white"
        >
          Our partnerships, <span className="text-brand-300">live in production.</span>
          <br />
          <span className="text-white/50">Watch the proof type itself.</span>
        </motion.h2>

        {/* laptop — fades out smoothly at the end of the scroll */}
        <motion.div style={{ opacity: fadeOut }} className="flex flex-col items-center">
        {/* Lid */}
        <div className="relative [perspective:800px]">
          <div
            style={{
              transform: 'perspective(800px) rotateX(-25deg) translateZ(0px)',
              transformOrigin: 'bottom',
              transformStyle: 'preserve-3d',
            }}
            className="relative h-[12rem] w-[32rem] rounded-2xl bg-[#010101] p-2"
          >
            <div
              style={{ boxShadow: '0px 2px 0px 2px #171717 inset' }}
              className="absolute inset-0 flex items-center justify-center gap-3 rounded-lg bg-[#010101]"
            >
              {/* lid mark — Claude × Technical Hub instead of the Aceternity logo */}
              <img src={claudeLogo} alt="Claude" className="h-5 w-auto opacity-90" />
              <span className="h-4 w-px bg-white/25" />
              <img src={techHubLogo} alt="Technical Hub" className="h-5 w-auto opacity-90" />
            </div>
          </div>
          <motion.div
            style={{
              scaleX,
              scaleY,
              rotateX: rotate,
              translateY: translate,
              transformStyle: 'preserve-3d',
              transformOrigin: 'top',
            }}
            className="absolute inset-0 h-96 w-[32rem] rounded-2xl bg-[#010101] p-2"
          >
            <div className="absolute inset-0 rounded-lg bg-[#272729]" />
            <ScreenPreview progress={prog} />
          </motion.div>
        </div>

        {/* Base area */}
        <div className="relative -z-10 h-[22rem] w-[32rem] overflow-hidden rounded-2xl bg-[#272729]">
          <div className="relative h-10 w-full">
            <div className="absolute inset-x-0 mx-auto h-4 w-[80%] bg-[#050505]" />
          </div>
          <div className="relative flex">
            <div className="mx-auto h-full w-[10%] overflow-hidden">
              <SpeakerGrid />
            </div>
            <div className="mx-auto h-full w-[80%]">
              <Keypad />
            </div>
            <div className="mx-auto h-full w-[10%] overflow-hidden">
              <SpeakerGrid />
            </div>
          </div>
          <Trackpad />
          <div className="absolute inset-x-0 bottom-0 mx-auto h-2 w-20 rounded-tl-3xl rounded-tr-3xl bg-gradient-to-t from-[#272729] to-[#050505]" />
          {/* badge — Claude starburst */}
          <div className="absolute bottom-4 left-4">
            <img src={claudeLogo} alt="Claude" className="h-7 w-7 -rotate-12" />
          </div>
        </div>
        </motion.div>
      </div>
    </section>
  )
}

const Trackpad = () => (
  <div className="mx-auto my-1 h-32 w-[40%] rounded-xl" style={{ boxShadow: '0px 0px 1px 1px #00000020 inset' }} />
)

const SpeakerGrid = () => (
  <div
    className="mt-2 flex h-40 gap-[2px] px-[0.5px]"
    style={{
      backgroundImage: 'radial-gradient(circle, #08080A 0.5px, transparent 0.5px)',
      backgroundSize: '3px 3px',
    }}
  />
)

const KBtn = ({ className, children, childrenClassName, backlit = true }) => (
  <div
    className={cn(
      '[transform:translateZ(0)] rounded-[4px] p-[0.5px] [will-change:transform]',
      backlit && 'bg-white/[0.2] shadow-xl shadow-white'
    )}
  >
    <div
      className={cn('flex h-6 w-6 items-center justify-center rounded-[3.5px] bg-[#0A090D]', className)}
      style={{ boxShadow: '0px -0.5px 2px 0 #0D0D0F inset, -0.5px 0px 2px 0 #0D0D0F inset' }}
    >
      <div
        className={cn(
          'flex w-full flex-col items-center justify-center text-[5px] text-neutral-200',
          childrenClassName,
          backlit && 'text-white'
        )}
      >
        {children}
      </div>
    </div>
  </div>
)

const ic = 'h-[6px] w-[6px]'

const Keypad = () => (
  <div className="mx-1 h-full [transform:translateZ(0)] rounded-md bg-[#050505] p-1 [will-change:transform]">
    {/* Row 1 — fn keys */}
    <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
      <KBtn className="w-10 items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">esc</KBtn>
      <KBtn><SunDim className={ic} /><span className="mt-1 inline-block">F1</span></KBtn>
      <KBtn><Sun className={ic} /><span className="mt-1 inline-block">F2</span></KBtn>
      <KBtn><Grid className={ic} /><span className="mt-1 inline-block">F3</span></KBtn>
      <KBtn><SearchI className={ic} /><span className="mt-1 inline-block">F4</span></KBtn>
      <KBtn><Mic className={ic} /><span className="mt-1 inline-block">F5</span></KBtn>
      <KBtn><Moon className={ic} /><span className="mt-1 inline-block">F6</span></KBtn>
      <KBtn><Prev className={ic} /><span className="mt-1 inline-block">F7</span></KBtn>
      <KBtn><Play className={ic} /><span className="mt-1 inline-block">F8</span></KBtn>
      <KBtn><Next className={ic} /><span className="mt-1 inline-block">F9</span></KBtn>
      <KBtn><Vol className={ic} /><span className="mt-1 inline-block">F10</span></KBtn>
      <KBtn><Vol2 className={ic} /><span className="mt-1 inline-block">F11</span></KBtn>
      <KBtn><Vol3 className={ic} /><span className="mt-1 inline-block">F12</span></KBtn>
      <KBtn>
        <div className="h-4 w-4 rounded-full bg-gradient-to-b from-neutral-900 from-20% via-black via-50% to-neutral-900 to-95% p-px">
          <div className="h-full w-full rounded-full bg-black" />
        </div>
      </KBtn>
    </div>

    {/* Row 2 — numbers */}
    <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
      <KBtn><span className="block">~</span><span className="mt-1 block">`</span></KBtn>
      <KBtn><span className="block">!</span><span className="block">1</span></KBtn>
      <KBtn><span className="block">@</span><span className="block">2</span></KBtn>
      <KBtn><span className="block">#</span><span className="block">3</span></KBtn>
      <KBtn><span className="block">$</span><span className="block">4</span></KBtn>
      <KBtn><span className="block">%</span><span className="block">5</span></KBtn>
      <KBtn><span className="block">^</span><span className="block">6</span></KBtn>
      <KBtn><span className="block">&</span><span className="block">7</span></KBtn>
      <KBtn><span className="block">*</span><span className="block">8</span></KBtn>
      <KBtn><span className="block">(</span><span className="block">9</span></KBtn>
      <KBtn><span className="block">)</span><span className="block">0</span></KBtn>
      <KBtn><span className="block">&mdash;</span><span className="block">_</span></KBtn>
      <KBtn><span className="block">+</span><span className="block"> = </span></KBtn>
      <KBtn className="w-10 items-end justify-end pb-[2px] pr-[4px]" childrenClassName="items-end">delete</KBtn>
    </div>

    {/* Row 3 — QWERTY */}
    <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
      <KBtn className="w-10 items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">tab</KBtn>
      {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((k) => (
        <KBtn key={k}><span className="block">{k}</span></KBtn>
      ))}
      <KBtn><span className="block">{'{'}</span><span className="block">{'['}</span></KBtn>
      <KBtn><span className="block">{'}'}</span><span className="block">{']'}</span></KBtn>
      <KBtn><span className="block">|</span><span className="block">\</span></KBtn>
    </div>

    {/* Row 4 — home row */}
    <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
      <KBtn className="w-[2.8rem] items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">caps lock</KBtn>
      {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((k) => (
        <KBtn key={k}><span className="block">{k}</span></KBtn>
      ))}
      <KBtn><span className="block">:</span><span className="block">;</span></KBtn>
      <KBtn><span className="block">&quot;</span><span className="block">&apos;</span></KBtn>
      <KBtn className="w-[2.85rem] items-end justify-end pb-[2px] pr-[4px]" childrenClassName="items-end">return</KBtn>
    </div>

    {/* Row 5 — shift row */}
    <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
      <KBtn className="w-[3.65rem] items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">shift</KBtn>
      {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((k) => (
        <KBtn key={k}><span className="block">{k}</span></KBtn>
      ))}
      <KBtn><span className="block">{'<'}</span><span className="block">,</span></KBtn>
      <KBtn><span className="block">{'>'}</span><span className="block">.</span></KBtn>
      <KBtn><span className="block">?</span><span className="block">/</span></KBtn>
      <KBtn className="w-[3.65rem] items-end justify-end pb-[2px] pr-[4px]" childrenClassName="items-end">shift</KBtn>
    </div>

    {/* Row 6 — modifiers + arrows */}
    <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
      <KBtn childrenClassName="h-full justify-between py-[4px]">
        <div className="flex w-full justify-end pr-1"><span className="block">fn</span></div>
        <div className="flex w-full justify-start pl-1"><World className={ic} /></div>
      </KBtn>
      <KBtn childrenClassName="h-full justify-between py-[4px]">
        <div className="flex w-full justify-end pr-1"><ChevUp className={ic} /></div>
        <div className="flex w-full justify-start pl-1"><span className="block">control</span></div>
      </KBtn>
      <KBtn childrenClassName="h-full justify-between py-[4px]">
        <div className="flex w-full justify-end pr-1"><OptionKey className={ic} /></div>
        <div className="flex w-full justify-start pl-1"><span className="block">option</span></div>
      </KBtn>
      <KBtn className="w-8" childrenClassName="h-full justify-between py-[4px]">
        <div className="flex w-full justify-end pr-1"><Cmd className={ic} /></div>
        <div className="flex w-full justify-start pl-1"><span className="block">command</span></div>
      </KBtn>
      <KBtn className="w-[8.2rem]" />
      <KBtn className="w-8" childrenClassName="h-full justify-between py-[4px]">
        <div className="flex w-full justify-start pl-1"><Cmd className={ic} /></div>
        <div className="flex w-full justify-start pl-1"><span className="block">command</span></div>
      </KBtn>
      <KBtn childrenClassName="h-full justify-between py-[4px]">
        <div className="flex w-full justify-start pl-1"><OptionKey className={ic} /></div>
        <div className="flex w-full justify-start pl-1"><span className="block">option</span></div>
      </KBtn>
      <div className="mt-[2px] flex h-6 w-[4.9rem] flex-col items-center justify-end rounded-[4px] p-[0.5px]">
        <KBtn className="h-3 w-6"><CaretU className={ic} /></KBtn>
        <div className="flex">
          <KBtn className="h-3 w-6"><CaretL className={ic} /></KBtn>
          <KBtn className="h-3 w-6"><CaretD className={ic} /></KBtn>
          <KBtn className="h-3 w-6"><CaretR className={ic} /></KBtn>
        </div>
      </div>
    </div>
  </div>
)
