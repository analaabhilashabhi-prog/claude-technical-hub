import { Calendar, Cube } from './Icons'
import { useBooking } from '../context/BookingContext'

// Non-sticky header: sits at the top of the page and scrolls away with content.
// Nav links intentionally omitted for now — just the logo + the two CTAs.
export default function Navbar() {
  const { openBooking } = useBooking()

  return (
    <header className="absolute top-0 inset-x-0 z-50">
      <nav className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex h-20 sm:h-24 items-center justify-end">
          {/* CTAs — right */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#webinars'
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white/85 transition-all hover:border-brand-400/60 hover:text-white hover:bg-white/5"
            >
              <Calendar width={16} height={16} />
              <span className="hidden sm:inline">Register for Webinar</span>
              <span className="sm:hidden">Webinar</span>
            </button>
            <button
              type="button"
              onClick={() => openBooking('aiLab')}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-brand-400/40 hover:-translate-y-0.5"
            >
              <Cube width={16} height={16} />
              <span className="hidden sm:inline">Set Up an AI Lab</span>
              <span className="sm:hidden">AI Lab</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
