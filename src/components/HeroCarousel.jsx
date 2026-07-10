import { Suspense, lazy } from 'react'
import claudeMark from '../assets/claude-logo.svg'
import InView from './InView'

// Lazy-load the 3D ID card so the heavy three.js bundle doesn't block first paint.
const Lanyard = lazy(() => import('./Lanyard'))

export default function HeroCarousel() {
  return (
    <section id="home" className="relative w-full overflow-hidden bg-black lg:min-h-[78vh]">
      {/* Left content — WORK WITH OFFICIAL + vertical Claude Partner Network lockup.
          Natural height on phones/tablets; ~3/4-screen on laptop so the gradient
          banner below peeks in right after the hero. */}
      <div className="pointer-events-none relative z-10 flex w-full items-center px-6 pb-14 pt-24 sm:px-10 sm:pb-16 sm:pt-32 lg:min-h-[78vh] lg:pb-20 lg:px-16 lg:pt-28 xl:px-24">
        <div className="relative animate-fadeUp opacity-0">
          {/* WORK / WITH / OFFICIAL */}
          <div className="inline-block font-poppins font-extrabold uppercase leading-[0.82] tracking-tight">
            <div className="bg-gradient-to-b from-white/90 to-white/25 bg-clip-text text-[clamp(3.25rem,23vw,7.5rem)] text-transparent drop-shadow-2xl sm:text-9xl md:text-[10.5rem] lg:text-[10rem] xl:text-[12.5rem]">Work</div>
            <div className="bg-gradient-to-b from-white/90 to-white/25 bg-clip-text text-[clamp(3.25rem,23vw,7.5rem)] text-transparent drop-shadow-2xl sm:text-9xl md:text-[10.5rem] lg:text-[10rem] xl:text-[12.5rem]">With</div>
            <div className="ml-1 mt-3 bg-gradient-to-b from-white/90 to-white/25 bg-clip-text text-[clamp(1.75rem,13vw,3.5rem)] text-transparent drop-shadow-2xl sm:ml-3 sm:text-6xl md:text-8xl lg:ml-8 lg:text-7xl xl:text-8xl">Official</div>
          </div>

          {/* Claude Partner Network — vertical lockup beside the headline on every view */}
          <div className="absolute -right-5 top-[31%] h-[170px] w-[58px] sm:-right-10 sm:top-[34%] sm:h-[300px] sm:w-[125px] md:-right-12 md:h-[400px] md:w-[165px] lg:-right-16 lg:h-[380px] lg:w-[145px]">
            <div className="absolute left-1/2 top-1/2 flex origin-center -translate-x-1/2 -translate-y-1/2 -rotate-90 flex-col items-start whitespace-nowrap">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <img src={claudeMark} alt="Claude" className="h-6 w-auto sm:h-11 md:h-14 lg:h-12" />
                <span className="font-serif text-2xl font-semibold leading-none text-brand-500 sm:text-5xl md:text-6xl lg:text-5xl">
                  Claude
                </span>
              </div>
              <span className="mt-1 font-serif text-sm leading-none tracking-[0.02em] text-brand-600 sm:mt-2 sm:text-2xl md:text-3xl lg:text-2xl">
                Partner Network
              </span>
            </div>
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
              anchorX={2.6}
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
