import ngi from '../assets/logo-ngi.png'
import ycce from '../assets/logo-ycce.png'
import geeta from '../assets/logo-geeta.png'
import torii from '../assets/logo-toriiminds.png'

// Institution / partner logos.
const logos = [
  { src: ngi, alt: 'Nagarjuna College (NGI)' },
  { src: ycce, alt: 'YCCE' },
  { src: geeta, alt: 'Geeta University' },
  { src: torii, alt: 'Toriiminds' },
]

// Single static row — big logos, spread evenly across the screen.
export default function PartnerMarquee() {
  return (
    <section className="relative z-10 -mt-[16vh] overflow-hidden bg-black pb-10 pt-0 sm:-mt-[12vh] sm:pb-0 md:-mt-[24vh] lg:-mt-[18vh]">
      <div className="flex w-full flex-nowrap items-center justify-evenly gap-3 px-4 sm:gap-8 sm:px-10 lg:px-16 xl:px-24">
        {logos.map((item) => (
          <img
            key={item.alt}
            src={item.src}
            alt={item.alt}
            draggable={false}
            className="max-h-12 w-auto max-w-[22%] shrink-0 select-none object-contain xs:max-h-16 sm:max-h-28 sm:max-w-none lg:max-h-36"
          />
        ))}
      </div>
    </section>
  )
}
