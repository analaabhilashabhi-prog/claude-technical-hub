import { useState } from 'react'
import { services } from '../data/mockData'
import { Check, Mail } from './Icons'
import ScreenCarousel from './ScreenCarousel'
import ScrollFloat from './ScrollFloat'
import frame from '../assets/desktop-frame.png'
import claudeMark from '../assets/claude-logo.svg'
import aiReadyLogo from '../assets/ai-ready-engineer.png'

const INK = '#211c19'
const SUB = '#6f665f'
const ACCENT = '#d97757'
const ACCENT_SOFT = 'rgba(217,119,87,0.12)'

// Services that show a brand logo on the monitor instead of a text title.
const SERVICE_LOGOS = { 'ai-ready-engineer': aiReadyLogo }

const accentFor = (i) =>
  i % 2 === 0
    ? { text: 'text-brand-300', pill: 'bg-brand-400' }
    : { text: 'text-claude-400', pill: 'bg-claude-400' }

const splitTitle = (t) => {
  const w = t.split(' ')
  if (w.length === 1) return [t, '']
  return [w[0], w.slice(1).join(' ')]
}

// One on-screen slide (authored at 1000x566, scaled by the carousel).
function ScreenContent({ service }) {
  const [t1, t2] = splitTitle(service.title)
  const logo = SERVICE_LOGOS[service.id]
  return (
    <>
      {/* soft decorative circle on the right */}
      <div
        className="absolute rounded-full"
        style={{ right: -140, top: -70, width: 660, height: 660, background: 'rgba(255,255,255,0.6)' }}
      />

      <div style={{ position: 'absolute', left: 60, top: 54, width: 560 }}>
        {logo ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: INK,
              borderRadius: 24,
              padding: '30px 40px',
              boxShadow: '0 22px 50px rgba(0,0,0,0.22)',
            }}
          >
            <img src={logo} alt={service.title} style={{ width: 420, height: 'auto', display: 'block' }} />
          </div>
        ) : (
          <>
            <span
              style={{
                display: 'inline-block',
                border: '1.5px solid rgba(0,0,0,0.16)',
                borderRadius: 9999,
                padding: '7px 18px',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: SUB,
              }}
            >
              Now Offering
            </span>

            <div style={{ marginTop: 20, fontWeight: 800, lineHeight: 1.0, letterSpacing: -1 }}>
              <span style={{ display: 'block', fontSize: 62, color: INK }}>{t1}</span>
              {t2 && <span style={{ display: 'block', fontSize: 62, color: ACCENT }}>{t2}</span>}
            </div>
          </>
        )}

        <ul style={{ marginTop: 30 }}>
          {service.points.map((p) => (
            <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 13 }}>
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9999,
                  background: ACCENT_SOFT,
                  color: ACCENT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Check width={18} height={18} />
              </span>
              <span style={{ fontSize: 17, fontWeight: 600, color: INK }}>{p}</span>
            </li>
          ))}
        </ul>

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            width: 540,
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 14,
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.55)',
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: INK,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Mail width={20} height={20} />
          </span>
          <div style={{ fontSize: 13.5, color: SUB, lineHeight: 1.5 }}>
            Interested? Write to us at{' '}
            <span style={{ fontWeight: 700, color: ACCENT }}>support@technicalhub.io</span> and mention{' '}
            <span style={{ fontWeight: 700, color: INK }}>{service.title}</span> in your subject.
          </div>
        </div>
      </div>
    </>
  )
}

export default function Services() {
  const [active, setActive] = useState(0)
  const s = services[active]
  const a = accentFor(active)

  return (
    <section id="services" className="relative w-full overflow-hidden bg-black pb-12 pt-0 sm:pb-16">
      {/* soft glows */}
      <div className="pointer-events-none absolute left-0 top-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-[150px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-claude-500/10 blur-[150px]" />

      <div className="relative z-10 flex flex-col items-center gap-12 px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-10">
        {/* Left: monitor with the draggable on-screen info + figure (shown first on mobile too) */}
        <div className="order-1 w-full lg:w-[58%] lg:shrink-0">
          <div className="relative w-full max-w-[980px]">
            <img
              src={frame}
              alt="Our Services"
              className="pointer-events-none block h-auto w-full select-none"
            />
            {/* screen area */}
            <div
              className="absolute"
              style={{ top: '3%', left: '2.7%', right: '2.6%', bottom: '27%' }}
            >
              {/* draggable, scaled info slides */}
              <ScreenCarousel
                items={services}
                onIndexChange={setActive}
                background="#f2efe9"
                className="rounded-[1.2vw]"
                renderItem={(sv) => <ScreenContent service={sv} />}
              />

              {/* Claude symbol — centered inside the cream circle on the right */}
              <img
                src={claudeMark}
                alt="Claude"
                className="animate-floaty pointer-events-none absolute select-none drop-shadow-[0_18px_40px_rgba(217,119,87,0.35)]"
                style={{ right: '7%', top: '26%', width: '26%' }}
              />
            </div>
          </div>
        </div>

        {/* Right: heading + full info, synced to the active service */}
        <div className="order-2 w-full lg:w-[40%] lg:self-start lg:pt-6">
          <ScrollFloat
            containerClassName="mb-4 mt-4 text-2xl font-extrabold leading-[0.95] tracking-tight text-claude-400 xs:text-3xl sm:mb-8 sm:text-7xl lg:mt-20 lg:text-8xl"
            stagger={0.04}
          >
            Our Services
          </ScrollFloat>

          <div key={active} className="animate-fadeUp">
            <h3 className="font-serif text-2xl font-bold uppercase leading-[1.05] tracking-tight text-brand-300 xs:text-3xl sm:text-5xl">
              {s.title}
            </h3>

            <ul className="mt-5 space-y-3 sm:mt-7 sm:space-y-4">
              {s.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-white/80 sm:gap-3.5 sm:text-xl">
                  <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${a.pill} sm:mt-2.5 sm:h-2 sm:w-2`} />
                  {p}
                </li>
              ))}
            </ul>

            <p className="mt-7 max-w-lg text-sm italic leading-relaxed text-white/55 sm:mt-8 sm:text-lg">
              Interested? Write to us at{' '}
              <a href="#contact" className={`not-italic font-semibold ${a.text} hover:underline`}>
                support@technicalhub.io
              </a>{' '}
              and mention <span className="not-italic font-semibold text-white/70">{s.title}</span> in your subject.
            </p>
          </div>

          {/* progress indicators (drag the screen to change) */}
          <div className="mt-10 flex items-center gap-3">
            {services.map((sv, i) => (
              <span
                key={sv.id}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === active ? `w-8 ${accentFor(i).pill}` : 'w-4 bg-white/15'
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-medium text-white/40">
              {String(active + 1).padStart(2, '0')} / {String(services.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
