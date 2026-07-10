import ncet from '../assets/logo-ncet.png'
import aditya from '../assets/logo-aditya.png'
import geeta from '../assets/logo-geeta.png'
import torii from '../assets/logo-toriiminds.png'

// Institution / partner logos. `boost` renders that logo a step larger.
const logos = [
  { src: ncet, alt: 'NCET' },
  { src: aditya, alt: 'Aditya University', boost: true },
  { src: geeta, alt: 'Geeta University' },
  { src: torii, alt: 'Toriiminds' },
]

// One evenly-distributed row of four logos on every view.
// Phones/tablets: hero has natural height, so the band flows right after it.
// Laptop: hero is full-screen, so the negative margin tucks the band into its trailing space.
export default function PartnerMarquee() {
  return (
    <section className="relative z-10 hidden overflow-hidden bg-black sm:block sm:pb-20 sm:pt-8 lg:-mt-[9vh] lg:pb-28 lg:pt-16">
      <div className="relative px-6 sm:px-10 lg:px-16 xl:px-24">
        {/* Mobile: plain 2x2 logo grid, no panel.
            Tablet/laptop: single row of 4 inside the premium dark-glass card. */}
        <div className="relative mx-auto max-w-5xl sm:rounded-3xl sm:border sm:border-white/10 sm:bg-gradient-to-b sm:from-[#1b1b1e] sm:to-[#101012] sm:px-8 sm:py-5 sm:shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.07)] lg:py-6">
          <div className="grid w-full grid-cols-2 items-center gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-8">
            {logos.map((item) => (
              <div key={item.alt} className="flex h-9 w-full items-center justify-center sm:h-11 lg:h-16">
                <img
                  src={item.src}
                  alt={item.alt}
                  draggable={false}
                  className={`max-h-full w-auto select-none object-contain ${
                    item.boost
                      ? 'max-w-[min(62%,7rem)] sm:max-w-[min(80%,9rem)] lg:max-w-[min(92%,13rem)]'
                      : 'max-w-[min(55%,5.5rem)] sm:max-w-[min(72%,7rem)] lg:max-w-[min(85%,10rem)]'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
