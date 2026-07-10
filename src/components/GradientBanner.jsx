import Reveal from './Reveal'

// Pure text strip on plain black (the animated gradient band and the
// dot-grid variants live in git history if ever needed).
export default function GradientBanner() {
  return (
    <section className="relative z-10 bg-black pb-10 pt-1 sm:pb-12 sm:pt-2">
        <Reveal>
          <div className="flex flex-col items-center justify-center gap-1.5 px-5 py-6 text-center xs:gap-2 sm:py-8">
            <p className="bg-gradient-to-b from-white/90 to-white/25 bg-clip-text font-poppins text-xl font-extrabold leading-tight text-transparent drop-shadow-2xl xs:text-2xl sm:text-3xl md:text-[2rem] lg:text-4xl">
              Claude × Technical Hub
            </p>
            <p className="max-w-[17rem] text-[0.6rem] font-medium leading-relaxed tracking-wide text-white/50 xs:max-w-xs xs:text-[0.65rem] sm:max-w-lg sm:text-xs">
              The official Claude Partner Network — training, products, and integration.
            </p>
          </div>
        </Reveal>
    </section>
  )
}
