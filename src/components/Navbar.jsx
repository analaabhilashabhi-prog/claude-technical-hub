import { Calendar } from './Icons'

// Non-sticky header: sits at the top of the page and scrolls away with content.
// Just the Webinar CTA for now (logo lives beside the Claude lockup in the hero).
export default function Navbar() {
  return (
    <header className="absolute top-0 inset-x-0 z-50">
      <nav className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex h-20 sm:h-24 items-center justify-end">
          {/* Webinar CTA — opens the #webinars page.
              (AI Lab button is still disabled; re-add here with openBooking('aiLab') when ready.) */}
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
        </div>
      </nav>
    </header>
  )
}
