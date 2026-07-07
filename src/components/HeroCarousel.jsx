import { Suspense, lazy } from 'react'
import { contactDetails } from '../data/mockData'
import heroText from '../assets/hero-text.png'

// Lazy-load the 3D ID card so the heavy three.js bundle doesn't block first paint.
const Lanyard = lazy(() => import('./Lanyard'))

export default function HeroCarousel() {
  return (
    <section id="home" className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Left content — the ready-made hero text artwork (WORK WITH / OFFICIAL / Claude Partner Network) */}
      <div className="pointer-events-none relative z-10 flex min-h-screen w-full flex-col justify-center px-6 pb-28 pt-24 sm:px-10 lg:px-16 xl:px-24">
        <img
          src={heroText}
          alt="Work with Official Claude Partner Network"
          className="w-full max-w-[560px] object-contain opacity-0 animate-fadeUp sm:max-w-[680px] lg:-ml-16 lg:w-[64%] lg:max-w-[920px] xl:-ml-24 xl:max-w-[1040px]"
        />
      </div>

      {/* Contact row pinned to the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-7 sm:px-10 lg:px-16 xl:px-24">
        <div className="pointer-events-auto flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-white/55">
          {contactDetails.map((c) =>
            c.href ? (
              <a
                key={c.id}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="transition-colors hover:text-claude-400"
              >
                {c.value}
              </a>
            ) : (
              <span key={c.id}>{c.value}</span>
            )
          )}
        </div>
      </div>

      {/* Interactive Claude ID card on the right — full-hero canvas so it drags freely */}
      <div className="pointer-events-none absolute inset-0 z-[6] hidden lg:block">
        <Suspense fallback={null}>
          <div className="pointer-events-auto h-full w-full">
            <Lanyard
              position={[0, 0, 18]}
              gravity={[0, -40, 0]}
              fov={20}
              anchorX={2.6}
              frontImage="/lanyard/card-front.svg"
              backImage="/lanyard/card-back.svg"
              imageFit="cover"
              lanyardImage="/lanyard/band.svg"
              lanyardWidth={1.1}
            />
          </div>
        </Suspense>
      </div>
    </section>
  )
}
