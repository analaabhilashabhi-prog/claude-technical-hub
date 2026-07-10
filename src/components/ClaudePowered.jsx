import { useState } from 'react'
import { apps } from '../data/mockData'
import Reveal from './Reveal'
import { Arrow } from './Icons'
import claudeLogo from '../assets/claude-logo.svg'
import mynaLanding from '../assets/projects/myna-landing.jpg'
import projectSpaceLanding from '../assets/projects/project-space-landing.jpg'

// Real landing-page screenshots per project.
const PROJECT_IMAGES = {
  myna: mynaLanding,
  'project-space': projectSpaceLanding,
}

export default function ClaudePowered() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState('next')
  const n = apps.length
  const current = apps[index]

  const goTo = (dir) => {
    setDirection(dir)
    setIndex((i) => (dir === 'next' ? (i + 1) % n : (i - 1 + n) % n))
  }

  const imgAnim = direction === 'next' ? 'animate-projMainRight' : 'animate-projMainLeft'

  return (
    <section id="apps" className="relative overflow-hidden bg-black py-12 sm:py-16">
      <div className="pointer-events-none absolute right-1/4 top-10 h-72 w-72 rounded-full bg-claude-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-5%] h-96 w-96 rounded-full bg-brand-500/[0.09] blur-[150px]" />

      <div className="relative mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        {/* heading */}
        <Reveal>
          <div className="flex items-center gap-2.5">
            <img src={claudeLogo} alt="Claude" className="h-6 w-auto" />
            <span className="text-sm font-bold uppercase tracking-widest text-claude-400">Claude Powered</span>
          </div>
          <h2 className="text-brandgrad mt-4 font-syne text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            Our projects on Claude
          </h2>
        </Reveal>

        {/* feature — full landing screenshot + details */}
        <Reveal delay={140}>
        <div className="mt-12 grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:items-center">
          {/* big picture — the whole landing page */}
          <div
            key={`img-${index}`}
            className={`relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50 ${imgAnim}`}
          >
            {/* browser chrome */}
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-neutral-900/80 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            </div>
            <a href={current.link} target="_blank" rel="noreferrer" className="block">
              <img src={PROJECT_IMAGES[current.id]} alt={current.name} className="block h-auto w-full" />
            </a>
          </div>

          {/* details */}
          <div key={`txt-${index}`} className="animate-fadeUp">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-claude-400">
              Built on Claude · {current.category}
            </span>
            <h3 className="mt-3 text-4xl font-semibold leading-[1.02] text-white lg:text-5xl">
              {current.name}
            </h3>
            <p className="mt-5 text-lg leading-relaxed text-white/70">{current.description}</p>

            <div className="mt-8 flex items-center gap-4">
              <a
                href={current.link}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:-translate-y-0.5"
              >
                Explore
                <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>

              {/* prev / next */}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => goTo('prev')}
                  aria-label="Previous project"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:bg-white/10"
                >
                  <Arrow className="h-4 w-4 -scale-x-100" />
                </button>
                <button
                  onClick={() => goTo('next')}
                  aria-label="Next project"
                  className="grid h-11 w-11 place-items-center rounded-full bg-claude-500 text-[#2a1810] transition hover:bg-claude-400"
                >
                  <Arrow className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* dots */}
            <div className="mt-8 flex items-center gap-2">
              {apps.map((a, i) => (
                <span
                  key={a.id}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === index ? 'w-8 bg-claude-400' : 'w-4 bg-white/15'
                  }`}
                />
              ))}
              <span className="ml-2 text-xs font-medium text-white/40">
                {String(index + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  )
}
