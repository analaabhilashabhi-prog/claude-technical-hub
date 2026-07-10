import { Suspense, lazy } from 'react'
import claudeMark from '../assets/claude-logo.svg'
import techHubLogo from '../assets/darklogo.png'
import InView from './InView'
// Lazy-load the 3D ID card so the heavy three.js bundle doesn't block first paint.
const Lanyard = lazy(() => import('./Lanyard'))

export default function HeroCarousel() {
  return (
    <section id="home" className="relative w-full overflow-hidden bg-black lg:min-h-screen">
      {/* ambient glows — behind everything, never interactive */}
        <div className="pointer-events-none absolute -left-32 top-[18%] h-96 w-96 rounded-full bg-brand-500/[0.08] blur-[160px]" />
        <div className="pointer-events-none absolute right-[10%] top-[55%] h-80 w-80 rounded-full bg-claude-500/[0.07] blur-[150px]" />
        {/* giant starburst watermark — barely-there depth for the dark field */}
        <img
          src={claudeMark}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-[22rem] w-[22rem] select-none opacity-[0.05] sm:-right-24 sm:-top-24 sm:h-[30rem] sm:w-[30rem] lg:-right-32 lg:-top-32 lg:h-[38rem] lg:w-[38rem]"
        />
        {/* Left content — WORK WITH OFFICIAL PARTNER + Claude lockup + TH logo.
            Natural height on phones/tablets; full first screen on laptop —
            the next section only appears once you scroll. */}
        <div className="pointer-events-none relative z-10 flex w-full items-center px-6 pb-2 pt-24 sm:px-10 sm:pb-3 sm:pt-32 lg:min-h-screen lg:px-16 lg:pb-24 lg:pt-28 xl:px-24">
          <div className="animate-fadeUp opacity-0">
            {/* Two giant stacked lines — both fill the left space; OFFICIAL PARTNER carries the orange sweep */}
            <div className="inline-block font-poppins uppercase">
              <div className="whitespace-nowrap font-extralight leading-none tracking-[0.01em] text-white text-[11vw] sm:text-[4.5rem] md:text-[5.25rem] lg:text-[5rem] xl:text-[5.75rem] 2xl:text-[8rem]">Work With</div>
              <div className="mt-2 leading-[1.05] sm:mt-3">
                <div className="whitespace-nowrap bg-gradient-to-r from-claude-600 via-claude-500 to-claude-400 bg-clip-text font-black tracking-tight text-transparent [word-spacing:0.35em] text-[7.4vw] sm:text-[3.125rem] md:text-[3.75rem] lg:text-[3.625rem] xl:text-[4.25rem] 2xl:text-[6rem]">
                  Official Partner
                </div>
              </div>
            </div>

            {/* Claude Partner Network lockup | Technical Hub logo — side by side under the headline */}
            <div className="ml-1 mt-12 flex items-center gap-4 sm:ml-2 sm:mt-16 sm:gap-6 lg:mt-20 lg:gap-7">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <img src={claudeMark} alt="Claude" className="h-11 w-auto sm:h-16 lg:h-[4.5rem] 2xl:h-20" />
                <div className="flex flex-col items-start whitespace-nowrap">
                  <span className="font-serif text-[2.75rem] font-semibold leading-none text-brand-500 sm:text-[3.25rem] lg:text-[4rem] 2xl:text-[5rem]">
                    Claude
                  </span>
                  <span className="mt-1.5 font-serif text-xl leading-none tracking-[0.02em] text-brand-600 sm:mt-2 sm:text-2xl lg:text-[1.75rem] 2xl:text-[2.25rem]">
                    Partner Network
                  </span>
                </div>
              </div>
              <span className="h-12 w-px bg-white/25 sm:h-16 lg:h-[4.5rem] 2xl:h-20" />
              <img src={techHubLogo} alt="Technical Hub" className="h-12 w-auto sm:h-[4.25rem] lg:h-20 2xl:h-24" />
            </div>

            {/* proof stats — pushed well below the lockup */}
            <div className="ml-1 mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 sm:ml-2 sm:mt-14 sm:gap-x-9 lg:mt-24">
              {[
                ['900+', 'Students certified'],
                ['3×', 'Faster product shipping'],
                ['100%', 'Campus-wide Claude rollout'],
              ].map(([n, label], i) => (
                <div key={label} className="flex items-center gap-7 sm:gap-9">
                  {i > 0 && <span className="hidden h-9 w-px bg-white/15 xs:block" />}
                  <div className="flex flex-col">
                    <span className="font-poppins text-xl font-extrabold leading-none text-white sm:text-2xl 2xl:text-3xl">{n}</span>
                    <span className="mt-1.5 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-white/45 sm:text-xs">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Interactive Claude ID card on the right — full-hero canvas so it drags freely.
            Gated to the viewport so its physics loop stops when scrolled away. */}
        <InView className="pointer-events-none absolute inset-0 z-[6] hidden lg:block" rootMargin="100px">
          <Suspense fallback={null}>
            <div className="pointer-events-auto h-full w-full">
              <Lanyard
                position={[0, 0, 18]}
                gravity={[0, -40, 0]}
                fov={20}
                anchorX={3.4}
                frontImage="/lanyard/card-front.svg"
                backImage="/lanyard/card-back.svg"
                imageFit="cover"
                lanyardImage="/lanyard/band.svg"
                lanyardWidth={1.1}
              />
            </div>
          </Suspense>
      </InView>
    </section>
  )
}
