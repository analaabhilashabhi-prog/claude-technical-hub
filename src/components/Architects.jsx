import { architects } from '../data/mockData'
import Reveal from './Reveal'
import ScrollFloat from './ScrollFloat'
import claudeLogo from '../assets/claude-logo.svg'
import techHubLogo from '../assets/darklogo.png'
import claudeBadge from '../assets/claude-badge.png'
import person from '../assets/team-sample.png'
import certificate from '../assets/claude-certification.png'
import harshavardhini from '../assets/trainers/harshavardhini.png'
import prashat from '../assets/trainers/prashat.png'
import bobby from '../assets/trainers/bobby.png'
import peter from '../assets/trainers/peter.png'
import sudhir from '../assets/trainers/sudhir.png'
import akhilesh from '../assets/trainers/akhilesh.png'
import bhargav from '../assets/trainers/bhargav.png'
import manikanta from '../assets/trainers/manikanta.png'
import naveen from '../assets/trainers/naveen.png'
import azar from '../assets/trainers/azar.png'

// architect id → portrait
const PHOTOS = {
  1: harshavardhini,
  2: prashat,
  3: bobby,
  4: peter,
  5: sudhir,
  6: akhilesh,
  7: bhargav,
  8: manikanta,
  9: naveen,
  10: azar,
}

export default function Architects() {
  return (
    <section id="architects" className="relative flex w-full flex-col justify-center overflow-hidden bg-black py-12 sm:py-16">
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-[150px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/3 h-96 w-96 rounded-full bg-claude-500/10 blur-[150px]" />

      <div className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-white/10 pb-10">
          <Reveal>
            <div>
              <div className="flex items-center gap-2.5">
                <img src={claudeLogo} alt="Claude" className="h-6 w-auto" />
                <span className="text-sm font-bold uppercase tracking-widest text-white/70">
                  Technical Hub
                </span>
              </div>
              <ScrollFloat
                containerClassName="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-300 sm:text-5xl"
                stagger={0.03}
              >
                Meet the Claude Architects
              </ScrollFloat>
              <p className="mt-4 max-w-xl text-white/55">
                Ten certified experts who design, build, and teach with Claude — the team behind every engagement.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} className="w-full lg:w-auto">
            <div className="text-left">
              <p className="text-xs text-white/50">Powered by</p>
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
                <img src={claudeLogo} alt="Claude" className="h-4 w-auto" />
                <span className="text-sm font-bold text-white">Claude</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 70% team grid / 30% certificate */}
        <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Team cards — left 70% */}
          <div className="lg:w-[70%]">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
              {architects.map((m, i) => (
                <Reveal key={m.id} delay={i * 70}>
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all duration-300 hover:z-10 hover:border-white/25 hover:shadow-xl hover:shadow-black/40">
                    {/* name + role */}
                    <div className="flex min-h-[96px] flex-col justify-center px-3 py-5 text-center">
                      <h3 className="text-sm font-bold leading-tight text-white sm:text-base">{m.name}</h3>
                      <p className="mt-1 text-xs leading-tight text-white/50">{m.role}</p>
                    </div>
                    {/* portrait */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-white/[0.06] to-transparent">
                      <img
                        src={PHOTOS[m.id] || person}
                        alt={m.name}
                        loading="lazy"
                        className="h-full w-full object-cover object-top grayscale transition-all duration-500 ease-out group-hover:scale-[1.06] group-hover:grayscale-0"
                      />
                    </div>
                  </div>
                </Reveal>
              ))}

              {/* Claude Certified Architect badge — pushed to the rightmost column */}
              <Reveal
                delay={architects.length * 70}
                className="hidden sm:block sm:col-start-2 lg:col-start-3 lg:col-span-2"
              >
                <div className="flex h-full items-center justify-center">
                  <img
                    src={claudeBadge}
                    alt="Claude Certified Architect"
                    className="w-full max-w-[240px] cursor-pointer select-none object-contain transition-transform duration-500 ease-out hover:scale-110 hover:drop-shadow-[0_12px_30px_rgba(217,119,87,0.35)]"
                  />
                </div>
              </Reveal>
            </div>
          </div>

          {/* Certificate — right 30% */}
          <div className="lg:w-[30%]">
            <Reveal delay={160}>
              <div className="lg:sticky lg:top-24 flex h-full flex-col rounded-2xl border border-claude-500/25 bg-gradient-to-br from-claude-500/10 to-transparent p-5">
                <div className="flex items-center gap-2">
                  <img src={claudeLogo} alt="Claude" className="h-4 w-auto" />
                  <span className="text-xs font-bold uppercase tracking-widest text-claude-300">
                    Certified
                  </span>
                </div>
                <img
                  src={certificate}
                  alt="Claude Certified Architect"
                  className="mt-4 w-full rounded-xl border border-white/10 object-contain shadow-2xl shadow-black/40"
                />
                <p className="mt-4 text-sm leading-relaxed text-white/55">
                  Every architect on our bench holds the{' '}
                  <span className="font-semibold text-white/80">Claude Certified Architect</span>{' '}
                  credential from Anthropic.
                </p>

                {/* Technical Hub logo — pinned to the bottom of the card */}
                <div className="mt-auto flex justify-center pt-6">
                  <img
                    src={techHubLogo}
                    alt="Technical Hub"
                    className="h-10 w-auto select-none object-contain opacity-90"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
