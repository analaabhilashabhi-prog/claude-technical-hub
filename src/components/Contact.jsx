import { lazy, Suspense } from 'react'
import Reveal from './Reveal'
import { Pin, Phone, Mail, ThumbsUp, LinkedIn, Instagram, YouTube, Facebook } from './Icons'

const GlobeView = lazy(() => import('./GlobeView'))

/* ------------------------------------------------------------------
   EDIT YOUR CONTACT DETAILS + LINKS HERE
   (give me the real links/values and I'll drop them in)
------------------------------------------------------------------- */
const INFO = [
  {
    icon: Pin,
    label: 'Address',
    lines: ['Hyderabad', '4th Floor, Innovation Towers, HITEC City, Hyderabad, India 500081'],
  },
  {
    icon: Phone,
    label: 'Phone',
    lines: ['+91 98765 43210'],
    href: 'tel:+919876543210',
  },
  {
    icon: Mail,
    label: 'Mail',
    lines: ['contact@technicalhub.io'],
    href: 'mailto:contact@technicalhub.io',
  },
]

const SOCIALS = [
  { icon: LinkedIn, label: 'LinkedIn', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: YouTube, label: 'YouTube', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
]

// Field of small angled tick-marks (bottom-right decoration).
function DashField() {
  const cols = 8
  const rows = 3
  const cells = Array.from({ length: cols * rows })
  return (
    <div
      className="grid gap-x-8 gap-y-6"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {cells.map((_, i) => {
        const angle = Math.round(Math.sin(i * 1.3) * 40) // deterministic varied tilt
        return (
          <span
            key={i}
            className="h-4 w-[3px] rounded-full bg-white/25"
            style={{ transform: `rotate(${angle}deg)` }}
          />
        )
      })}
    </div>
  )
}

export default function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden bg-black py-24 sm:py-32">
      {/* brand-green radial glow, top-left + coral accent bottom-right */}
      <div
        className="pointer-events-none absolute -left-40 -top-32 h-[42rem] w-[42rem] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(0,135,55,0.30), transparent 62%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-[-10%] h-[34rem] w-[34rem] rounded-full blur-[130px]"
        style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.14), transparent 65%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-10">
          {/* ---------------- LEFT ---------------- */}
          <div className="relative">
            <div className="relative mx-auto w-full max-w-[32rem] lg:mx-0 lg:-mt-16 lg:w-[145%] lg:max-w-none lg:-ml-[52%]">
              <Suspense
                fallback={<div className="aspect-square w-full animate-pulse rounded-full bg-brand-500/5" />}
              >
                <GlobeView />
              </Suspense>
            </div>

            <Reveal delay={120}>
              <h3 className="mt-2 font-poppins text-5xl font-extrabold leading-[0.92] tracking-tight text-white sm:text-6xl">
                Start a
                <br />
                conversation.
              </h3>
            </Reveal>
          </div>

          {/* ---------------- RIGHT ---------------- */}
          <div className="relative flex flex-col justify-start gap-9 lg:pl-6 lg:pt-4">
            {/* iridescent blob — brand green → white → coral */}
            <div
              className="pointer-events-none absolute right-0 top-1/3 h-64 w-40 rotate-12 rounded-[45%] opacity-80 blur-2xl"
              style={{
                background:
                  'radial-gradient(circle at 50% 20%, #1f9c5c 0%, #f8fafc 28%, #dd8563 56%, #008737 84%, transparent 100%)',
              }}
            />

            {INFO.map((item, i) => {
              const Icon = item.icon
              const Row = (
                <div className="flex items-start gap-5">
                  <Icon width={30} height={30} className="mt-1 shrink-0 text-white" />
                  <div>
                    <p className="font-poppins text-2xl font-bold text-white">{item.label}</p>
                    {item.lines.map((l, k) => (
                      <p key={k} className="mt-1 text-sm leading-relaxed text-white/55">
                        {l}
                      </p>
                    ))}
                  </div>
                </div>
              )
              return (
                <Reveal key={item.label} delay={i * 120}>
                  {item.href ? (
                    <a href={item.href} className="block transition-opacity hover:opacity-80">
                      {Row}
                    </a>
                  ) : (
                    Row
                  )}
                </Reveal>
              )
            })}

            {/* Follow us */}
            <Reveal delay={360}>
              <div className="flex items-start gap-5">
                <ThumbsUp width={30} height={30} className="mt-1 shrink-0 text-white" />
                <div>
                  <p className="font-poppins text-2xl font-bold text-white">Follow Us</p>
                  <div className="mt-3 flex items-center gap-3">
                    {SOCIALS.map((s) => {
                      const SIcon = s.icon
                      return (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={s.label}
                          className="grid h-10 w-10 place-items-center rounded-full bg-white text-black transition-transform hover:-translate-y-0.5 hover:bg-white/90"
                        >
                          <SIcon width={18} height={18} />
                        </a>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* dash field */}
            <Reveal delay={440}>
              <div className="mt-6 hidden sm:block">
                <DashField />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
