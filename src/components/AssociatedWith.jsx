import MagicBento from './MagicBento'
import claudeLogo from '../assets/claude-logo.svg'

export default function AssociatedWith() {
  return (
    <section id="partners" className="relative w-full overflow-hidden bg-black py-12 sm:py-16">
      <div className="pointer-events-none absolute left-1/4 bottom-0 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Left ~16% — distinctive heading */}
          <div className="lg:w-[16%]">
            <div className="flex h-full flex-col justify-center gap-5 lg:-translate-y-28">
              {/* logo + gradient accent rule */}
              <div className="flex items-center gap-3">
                <img src={claudeLogo} alt="Claude" className="h-7 w-auto" />
                <span className="h-px flex-1 bg-gradient-to-r from-claude-400/70 to-transparent" />
              </div>

              {/* two-tone stacked wordmark */}
              <h3 className="leading-[0.9]">
                <span className="block text-3xl font-light tracking-tight text-white/85">Our</span>
                <span className="block bg-gradient-to-r from-claude-300 via-claude-400 to-brand-400 bg-clip-text text-4xl font-bold italic tracking-tight text-transparent">
                  Network
                </span>
              </h3>

              <p className="max-w-[15rem] text-sm leading-relaxed text-white/45">
                Institutions and technology partners we build with.
              </p>

              {/* partner count stat */}
              <div className="mt-1 flex items-center gap-3">
                <span className="text-4xl font-black tabular-nums text-white">04</span>
                <span className="text-[0.65rem] font-bold uppercase leading-tight tracking-[0.2em] text-white/40">
                  Partner
                  <br />
                  Institutions
                </span>
              </div>
            </div>
          </div>

          {/* Right ~84% — MagicBento (glow only) */}
          <div className="lg:w-[84%]">
            <MagicBento
              spotlightRadius={340}
              enableStars={false}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
            />
          </div>
        </div>
      </div>
    </section>
  )
}
