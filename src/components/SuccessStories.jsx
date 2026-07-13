import { useEffect, useRef, useState } from 'react'
import Reveal from './Reveal'
import ScrollFloat from './ScrollFloat'
import {
  Academic,
  Building,
  Cube,
  Arrow,
  Award,
  Users,
  Code,
  TrendingUp,
  Scan,
  Book,
  Smartphone,
  Spark,
} from './Icons'
import claudeLogo from '../assets/claude-logo.svg'
import techHubLogo from '../assets/darklogo.png'
import logoAditya from '../assets/logo-aditya.png'
import logoNcet from '../assets/logo-ncet.png'
import logoTorii from '../assets/logo-toriiminds.png'

/* Count-up "odometer" — numbers roll up from 0 each time they scroll into view
   (replays on every entry, matching the site's Reveal behaviour). */
function CountUp({ to, prefix = '', suffix = '', duration = 1500, className = '' }) {
  const ref = useRef(null)
  const [val, setVal] = useState(0)
  const rafId = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        cancelAnimationFrame(rafId.current)
        if (!e.isIntersecting) {
          setVal(0) // reset so the roll replays on the next entry
          return
        }
        const t0 = performance.now()
        const tick = (now) => {
          const p = Math.min((now - t0) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3) // ease-out cubic
          setVal(Math.round(to * eased))
          if (p < 1) rafId.current = requestAnimationFrame(tick)
        }
        rafId.current = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => {
      cancelAnimationFrame(rafId.current)
      io.disconnect()
    }
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val}
      {suffix}
    </span>
  )
}

/* Live proof-points shown in the ticker strip under the heading —
   each with a line icon matching its statement. */
const TICKER = [
  { Icon: Academic, to: 900, suffix: '+', label: 'students certified' },
  { Icon: Cube, to: 24, suffix: '/7', label: 'Claude Max AI Lab' },
  { Icon: Users, to: 10, label: 'certified architects at Torii' },
  { Icon: TrendingUp, to: 3, suffix: '×', label: 'faster MVP prototyping' },
  { Icon: Building, to: 100, suffix: '%', label: 'campus systems integrated' },
  { Icon: Code, to: 7, label: 'apps vibe-coded & live' },
]

/* One entry per partnership. Accent classes are literal so Tailwind picks them up. */
const STORIES = [
  {
    id: 'aditya',
    name: 'Aditya University',
    kind: 'University',
    KindIcon: Academic,
    logo: logoAditya,
    tagline:
      'Enterprise upskilling at scale — hours of labour turned into seconds of insight across an entire institution.',
    stats: [
      { to: 900, suffix: '+', label: 'students certified' },
      { to: 160, label: 'projects shipped' },
      { to: 550, prefix: '$', label: 'Claude vouchers' },
    ],
    points: [
      { Icon: Award, text: '4 Anthropic courses completed, hardcopy certificates awarded' },
      { Icon: Users, text: 'Project Space hackathon — Season 8, with national industry mentors' },
      { Icon: Code, text: 'An enterprise platform vibe-coded on Claude, with AI GitHub code audits' },
      { Icon: TrendingUp, text: 'Faculty Development Programs with measured performance gains' },
    ],
    link: 'https://claude.adityauniversity.in/',
    site: 'claude.adityauniversity.in',
    hoverBorder: 'hover:border-brand-300/50',
    glow: 'bg-brand-500/20',
    statColor: 'text-brand-300',
    tick: 'text-brand-300',
  },
  {
    id: 'ncet',
    name: 'NCET',
    kind: 'Campus-wide',
    KindIcon: Building,
    logo: logoNcet,
    tagline:
      'Claude woven into every corner of campus — classrooms, labs, design, marketing and management.',
    stats: [
      { to: 100, suffix: '%', label: 'systems integrated' },
      { to: 24, suffix: '/7', label: 'Claude Max lab' },
      { to: 6, label: 'live campus apps' },
    ],
    points: [
      { Icon: Users, text: '4 Claude-Certified Architects embedded on campus' },
      { Icon: Cube, text: 'A permanent Claude stall + always-on Claude Max AI Lab' },
      { Icon: Code, text: 'Six college applications vibe-coded from prompt to production' },
      { Icon: Scan, text: 'AR-enabled AI-Ready Engineer roadmap — scan a wall, learn the skill' },
    ],
    link: 'https://claude.ncet.co.in/',
    site: 'claude.ncet.co.in',
    hoverBorder: 'hover:border-claude-400/60',
    glow: 'bg-claude-500/20',
    statColor: 'text-claude-300',
    tick: 'text-claude-400',
  },
  {
    id: 'torii',
    name: 'Torii Minds',
    kind: 'Corporate',
    KindIcon: Cube,
    logo: logoTorii,
    tagline:
      'A whole workforce made AI-native — now shipping its own Claude-powered products and training at industry standard.',
    stats: [
      { to: 3, suffix: '×', label: 'faster MVPs' },
      { to: 40, prefix: '−', suffix: '%', label: 'debugging cycles' },
      { to: 10, label: 'certified architects' },
    ],
    points: [
      { Icon: Users, text: '100% AI-skilled team on a fully AI-assisted dev pipeline' },
      { Icon: Book, text: 'Five-module curriculum — foundations to training delivery practice' },
      { Icon: Smartphone, text: 'Myna: an AI-powered LSRW platform, live on Play Store & App Store' },
      { Icon: Spark, text: 'AI Tech Coach Skill Sprint launched onward at NCET' },
    ],
    link: 'https://toriiminds.com/success-story/',
    site: 'toriiminds.com/success-story',
    hoverBorder: 'hover:border-brand-300/50',
    glow: 'bg-brand-400/15',
    statColor: 'text-brand-300',
    tick: 'text-brand-300',
  },
]

const STEPS = [
  { n: '01', t: 'Awareness', d: 'Campus-wide workshops spark an AI culture.', Icon: Spark },
  { n: '02', t: 'Infrastructure', d: 'Labs reborn on Claude — up to Claude Max, 24/7.', Icon: Building },
  { n: '03', t: 'Curriculum', d: 'Prompt & context engineering, credited.', Icon: Book },
  { n: '04', t: 'Hands-on Build', d: 'Hackathons & project weeks that ship.', Icon: Code },
  { n: '05', t: 'Expertise', d: 'Certified architects, on the ground.', Icon: Users },
  { n: '06', t: 'Certification', d: 'Official Anthropic certificates, earned and in hand.', Icon: Award },
]

const CHECKS = [
  { text: 'Measured outcomes on every engagement', Icon: TrendingUp },
  { text: 'Official Anthropic courses & certification', Icon: Academic },
  { text: 'Claude Code & Claude Cowork, taught hands-on', Icon: Code },
]

export default function SuccessStories() {
  return (
    <section id="success-stories" className="relative overflow-hidden bg-black py-12 sm:py-16">
      {/* ambient glows, same recipe as the neighbouring sections */}
      <div className="pointer-events-none absolute -left-40 -top-24 h-[36rem] w-[36rem] rounded-full bg-brand-500/[0.14] blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[38rem] w-[38rem] rounded-full bg-claude-500/10 blur-[150px]" />

      <div className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        {/* Claude × Technical Hub lockup — brands the section header */}
        <Reveal>
          <div className="flex items-center gap-3.5">
            <img src={claudeLogo} alt="Claude" className="h-6 w-auto sm:h-7" />
            <span className="h-5 w-px bg-white/20" />
            <img src={techHubLogo} alt="Technical Hub" className="h-7 w-auto sm:h-8" />
            <span className="h-px w-28 bg-gradient-to-r from-claude-400/70 to-transparent sm:w-40" />
          </div>
        </Reveal>

        {/* heading — ScrollFloat scrubs the first line; the gradient line uses Reveal
            (per-char transforms break bg-clip-text gradients, so it stays whole) */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <ScrollFloat
              containerClassName="font-poppins text-4xl font-extrabold leading-[1.02] tracking-tight text-brand-300 xs:text-5xl sm:text-6xl lg:text-7xl"
              stagger={0.03}
            >
              Stories That
            </ScrollFloat>
            <Reveal delay={100}>
              <h2 className="bg-gradient-to-r from-claude-300 via-claude-400 to-claude-500 bg-clip-text font-poppins text-4xl font-extrabold leading-[1.08] tracking-tight text-transparent xs:text-5xl sm:text-6xl lg:text-7xl">
                Run on Claude
              </h2>
            </Reveal>
          </div>
        </div>

        {/* proof ticker — aligned grid of icon stats (single strip on desktop) */}
        <Reveal delay={160}>
          <div className="no-scrollbar mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-white/10 py-5 sm:mt-9 sm:grid-cols-3 lg:flex lg:flex-nowrap lg:items-center lg:justify-between lg:gap-x-4 lg:overflow-x-auto">
            {TICKER.map((t) => {
              const TickerIcon = t.Icon
              return (
                <div
                  key={t.label}
                  className="group flex items-center gap-2.5 text-[0.8rem] leading-tight text-white/60 transition-colors duration-300 hover:text-white/85 sm:text-sm lg:whitespace-nowrap"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-claude-500/10 text-claude-400 transition-transform duration-300 group-hover:scale-110">
                    <TickerIcon width={17} height={17} />
                  </span>
                  <span>
                    <CountUp
                      to={t.to}
                      prefix={t.prefix}
                      suffix={t.suffix}
                      className="font-poppins text-base font-bold text-white"
                    />{' '}
                    {t.label}
                  </span>
                </div>
              )
            })}
          </div>
        </Reveal>

        {/* story cards */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {STORIES.map((s, i) => {
            const KindIcon = s.KindIcon
            return (
              <Reveal key={s.id} delay={i * 120} className="h-full">
                <article
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/40 ${s.hoverBorder}`}
                >
                  {/* logo chip + engagement type */}
                  <div className="relative flex items-center justify-between">
                    <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] transition-transform duration-300 group-hover:scale-105">
                      <img src={s.logo} alt={s.name} className="max-h-20 max-w-20 object-contain" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[0.55rem] font-bold uppercase tracking-[0.18em] text-white/55 transition-colors duration-300 group-hover:border-white/25 group-hover:text-white/75">
                      <KindIcon width={12} height={12} />
                      {s.kind}
                    </span>
                  </div>

                  <h3 className="relative mt-5 font-poppins text-[1.35rem] font-bold leading-snug text-white">
                    {s.name}
                  </h3>
                  <p className="relative mt-1.5 text-sm leading-relaxed text-white/55">{s.tagline}</p>

                  {/* rolling mini-stats */}
                  <div className="relative mt-5 grid grid-cols-3 gap-2">
                    {s.stats.map((st) => (
                      <div
                        key={st.label}
                        className="rounded-xl bg-white/[0.05] px-1.5 py-2.5 text-center transition-colors duration-300 hover:bg-white/[0.09]"
                      >
                        <CountUp
                          to={st.to}
                          prefix={st.prefix}
                          suffix={st.suffix}
                          className={`font-poppins text-lg font-extrabold ${s.statColor}`}
                        />
                        <div className="mt-0.5 text-[0.58rem] leading-tight text-white/50">{st.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* highlights — each line gets an icon matching its statement */}
                  <ul className="relative mt-5 flex-1 space-y-2.5">
                    {s.points.map((pt) => {
                      const PointIcon = pt.Icon
                      return (
                        <li
                          key={pt.text}
                          className="group/li flex items-start gap-3 text-[0.95rem] leading-relaxed text-white/70 transition-colors duration-300 hover:text-white/90"
                        >
                          <PointIcon
                            width={16}
                            height={16}
                            className={`mt-[0.25em] shrink-0 transition-transform duration-300 group-hover/li:scale-125 ${s.tick}`}
                          />
                          {pt.text}
                        </li>
                      )
                    })}
                  </ul>

                  {/* CTA */}
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noreferrer"
                    className="group/cta relative mt-6 inline-flex items-center gap-2.5 self-start rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:border-claude-400 hover:text-claude-200"
                  >
                    Read the full story
                    <Arrow
                      width={15}
                      height={15}
                      className="transition-transform duration-300 group-hover/cta:translate-x-1"
                    />
                  </a>
                  <div className="relative mt-3.5 text-[0.62rem] tracking-wide text-white/35">{s.site}</div>
                </article>
              </Reveal>
            )
          })}
        </div>

        {/* the reproducible playbook — Claude-paper cream card */}
        <Reveal delay={120}>
          <div className="relative mt-12 overflow-hidden rounded-2xl bg-cream px-5 py-8 text-[#211c19] sm:rounded-3xl sm:px-8 sm:py-10 lg:px-12 lg:py-12">
            {/* Claude starburst as the corner burst — shrinks on mobile so it never crowds the text */}
            <img
              src={claudeLogo}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 select-none opacity-70 sm:-right-14 sm:-top-14 sm:h-40 sm:w-40 sm:opacity-90 lg:-right-10 lg:-top-10 lg:h-44 lg:w-44"
            />

            <span className="inline-block rounded-full border border-[#211c19]/25 px-3.5 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#211c19]/65 sm:px-4 sm:text-[0.62rem] sm:tracking-[0.22em]">
              The Playbook
            </span>
            <h3 className="mt-4 max-w-[14ch] font-poppins text-3xl font-extrabold leading-tight sm:max-w-[18ch] sm:text-4xl lg:max-w-none lg:text-5xl">
              One blueprint. <span className="text-claude-500">Any institution.</span>
            </h3>
            <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-[#211c19]/70 sm:text-base lg:text-lg">
              Every success story above follows the same six-phase engagement model — documented,
              measured, and ready to reproduce at your campus or company.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {STEPS.map((step, i) => {
                const StepIcon = step.Icon
                return (
                  <Reveal key={step.n} delay={i * 70} className="h-full">
                    <div className="group/step h-full rounded-xl bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#211c19]/10 sm:p-4">
                      <div className="flex items-center justify-between gap-1">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-claude-500/10 text-claude-500 transition-transform duration-300 group-hover/step:scale-110 sm:h-9 sm:w-9">
                          <StepIcon width={17} height={17} />
                        </span>
                        <span className="font-poppins text-xs font-extrabold text-claude-500/70 sm:text-sm">{step.n}</span>
                      </div>
                      <div className="mt-2.5 text-[0.9rem] font-semibold leading-tight sm:text-[0.95rem]">{step.t}</div>
                      <div className="mt-1 text-[0.75rem] leading-snug text-[#211c19]/60 sm:text-[0.78rem]">{step.d}</div>
                    </div>
                  </Reveal>
                )
              })}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
              {CHECKS.map((c) => {
                const CheckIcon = c.Icon
                return (
                  <span key={c.text} className="inline-flex items-center gap-2.5 text-[0.9rem] font-medium text-[#211c19]/85 sm:text-[0.95rem]">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500/10 text-brand-600">
                      <CheckIcon width={15} height={15} />
                    </span>
                    {c.text}
                  </span>
                )
              })}
            </div>
          </div>
        </Reveal>

        {/* closing CTA strip */}
        <Reveal delay={160}>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-8 transition-colors duration-300 hover:border-claude-500/40 sm:gap-8 sm:px-8 sm:py-10 lg:px-12">
            <div className="bg-gradient-to-b from-white/90 to-white/25 bg-clip-text font-poppins text-3xl font-extrabold leading-tight text-transparent drop-shadow-2xl sm:text-4xl lg:text-5xl">
              Your story could
              <br className="hidden lg:block" /> be <span className="text-brand-300">next.</span>
            </div>
            <p className="max-w-2xl text-[0.95rem] leading-relaxed text-white/65 sm:text-base lg:text-lg">
              Interested? Write to us at{' '}
              <span className="font-semibold text-claude-300">babji@technicalhub.io</span> and mention{' '}
              <span className="font-semibold text-claude-300">Success Story</span> in your subject —
              we&apos;ll map the six-phase blueprint to your institution with the{' '}
              <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                <img src={claudeLogo} alt="" className="h-5 w-auto self-center" />
                <span className="font-serif font-bold text-brand-300">Claude</span>
              </span>{' '}
              Partner Network.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
