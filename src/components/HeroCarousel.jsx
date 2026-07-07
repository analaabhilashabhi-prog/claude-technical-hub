import { Suspense, lazy } from 'react'
import claudeMark from '../assets/claude-logo.svg'
import InView from './InView'

// Lazy-load the 3D ID card so the heavy three.js bundle doesn't block first paint.
const Lanyard = lazy(() => import('./Lanyard'))

export default function HeroCarousel() {
  return (
    <section id="home" className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Left content — WORK WITH OFFICIAL + vertical Claude Partner Network lockup */}
      <div className="pointer-events-none relative z-10 flex min-h-screen w-full items-center px-6 pb-28 pt-24 sm:px-10 lg:px-16 xl:px-24">
        <div className="relative animate-fadeUp opacity-0">
          {/* WORK / WITH / OFFICIAL */}
          <div className="inline-block font-poppins font-black uppercase leading-[0.84] tracking-tight text-neutral-300">
            <div className="text-7xl sm:text-9xl lg:text-[10rem] xl:text-[12.5rem]">Work</div>
            <div className="text-7xl sm:text-9xl lg:text-[10rem] xl:text-[12.5rem]">With</div>
            <div className="ml-3 mt-3 text-4xl font-extrabold sm:text-6xl lg:ml-8 lg:text-7xl xl:text-8xl">Official</div>
          </div>

          {/* Claude Partner Network — vertical lockup tucked under the "K" of WORK */}
          <div className="absolute -right-10 top-[34%] hidden h-[280px] w-[110px] sm:block lg:-right-16 lg:h-[380px] lg:w-[145px]">
            <div className="absolute left-1/2 top-1/2 flex origin-center -translate-x-1/2 -translate-y-1/2 -rotate-90 flex-col items-start whitespace-nowrap">
              <div className="flex items-center gap-2.5">
                <img src={claudeMark} alt="Claude" className="h-10 w-auto lg:h-12" />
                <span className="font-serif text-4xl font-semibold leading-none text-brand-500 lg:text-5xl">
                  Claude
                </span>
              </div>
              <span className="mt-2 font-serif text-xl leading-none tracking-[0.02em] text-brand-600 lg:text-2xl">
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
