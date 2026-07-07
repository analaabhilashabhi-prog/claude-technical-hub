import { useState } from 'react'
import { apps } from '../data/mockData'
import { Arrow } from './Icons'
import claudeLogo from '../assets/claude-logo.svg'

// Faux product screenshot — gradient panel with app chrome + name.
function ProjectVisual({ app, className = '' }) {
  return (
    <div className={`relative overflow-hidden ${app.bg} ${className}`}>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute left-5 top-5 flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-white/50" />
        <span className="h-3 w-3 rounded-full bg-white/40" />
        <span className="h-3 w-3 rounded-full bg-white/30" />
      </div>
      <div className="absolute inset-x-8 top-16 space-y-3">
        <div className="h-3 w-2/3 rounded-full bg-white/30" />
        <div className="h-3 w-1/2 rounded-full bg-white/20" />
        <div className="mt-6 h-20 rounded-xl bg-white/15" />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
        <h4 className="text-xl font-extrabold text-white">{app.name}</h4>
      </div>
    </div>
  )
}

// The big project detail card (mirrors the reference "quote" card).
function ProjectCard({ app, className = '' }) {
  return (
    <div className={`flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-8 lg:p-10 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.22em] text-claude-400">
        Built on Claude
      </span>
      <h3 className="mt-5 text-4xl font-semibold leading-[1.02] text-white lg:text-5xl">
        {app.name}
      </h3>
      <p className="mt-5 flex-1 text-lg leading-relaxed text-white/70">{app.description}</p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/70">
          Claude · {app.category}
        </span>
        <a
          href={app.link}
          className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:-translate-y-0.5"
        >
          Explore
          <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </div>
  )
}

export default function ClaudePowered() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState('next')
  const n = apps.length
  const current = apps[index]
  const next = apps[(index + 1) % n]

  const goNext = () => {
    setDirection('next')
    setIndex((i) => (i + 1) % n)
  }
  const goPrev = () => {
    setDirection('prev')
    setIndex((i) => (i - 1 + n) % n)
  }

  // main card emerges from behind the buttons (next) or intro column (prev);
  // supporting visuals slide the same direction so it all moves as one
  const mainAnim = direction === 'next' ? 'animate-projMainRight' : 'animate-projMainLeft'
  const subAnim = direction === 'next' ? 'animate-projSubRight' : 'animate-projSubLeft'

  return (
    <section id="apps" className="relative overflow-hidden bg-black py-20 sm:py-28">
      <div className="pointer-events-none absolute right-1/4 top-10 h-72 w-72 rounded-full bg-claude-500/10 blur-3xl" />

      <div className="flex flex-col gap-5 px-6 sm:px-10 lg:flex-row lg:flex-nowrap lg:items-stretch lg:min-h-[480px] lg:pr-0 lg:pl-16 xl:pl-24">
        {/* Col 1 — intro + current project visual (sits above the sliding card) */}
        <div className="relative z-20 flex flex-col gap-5 lg:w-[210px] lg:shrink-0">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <img src={claudeLogo} alt="Claude" className="mb-4 h-7 w-auto" />
            <h3 className="text-2xl font-semibold leading-tight text-white">Claude Powered</h3>
            <p className="mt-2 text-sm font-medium text-claude-400">Our projects on Claude</p>
          </div>
          <ProjectVisual
            key={`v1-${index}`}
            app={current}
            className={`min-h-[220px] flex-1 rounded-3xl ${subAnim}`}
          />
        </div>

        {/* Col 2 — current project details (slides out from behind the side columns) */}
        <div className="relative z-0 lg:w-[30vw] lg:shrink-0">
          <ProjectCard key={`c1-${index}`} app={current} className={mainAnim} />
        </div>

        {/* Col 3 — L-shape nav: Next (top) + Previous / next visual (bottom).
             Sits above the sliding card so it emerges from behind these buttons. */}
        <div className="relative z-20 lg:w-[380px] lg:shrink-0">
          <div className="flex h-full flex-col gap-5">
            <button
              onClick={goNext}
              className="group flex items-center justify-end gap-5 rounded-3xl bg-claude-500 p-6 text-[#2a1810] transition-colors hover:bg-claude-400 lg:min-h-[190px]"
            >
              <span className="text-right text-lg font-semibold leading-tight">
                Next
                <br />
                Project
              </span>
              <Arrow className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </button>

            <div className="flex flex-1 gap-5">
              <button
                onClick={goPrev}
                className="group flex flex-1 flex-col justify-between rounded-3xl bg-claude-500 p-6 text-[#2a1810] transition-colors hover:bg-claude-400"
              >
                <Arrow className="h-5 w-5 -scale-x-100 transition-transform group-hover:-translate-x-1" />
                <span className="mt-8 text-lg font-semibold leading-tight">
                  Previous
                  <br />
                  Project
                </span>
              </button>

              <ProjectVisual
                key={`v2-${index}`}
                app={next}
                className={`min-h-[190px] w-[46%] shrink-0 rounded-3xl ${subAnim}`}
              />
            </div>
          </div>
        </div>

        {/* Col 4 — next project, same size as the main card, peeking off the right edge */}
        <div className="relative z-20 hidden lg:block lg:w-[30vw] lg:shrink-0">
          <ProjectCard key={`c2-${index}`} app={next} className={subAnim} />
        </div>
      </div>
    </section>
  )
}
