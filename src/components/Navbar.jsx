import { Calendar } from './Icons'

// Non-sticky header: sits at the top of the page and scrolls away with content.
// Webinar CTA + GitHub Copilot class info (logo lives beside the Claude lockup in the hero).

// --- Edit these three values to update the GitHub Copilot session details ---
const COPILOT_TRAINING_NAME = 'GitHub Copilot Classes'
const COPILOT_TRAINING_TIMINGS = 'Mon–Fri, 8:30 PM – 10:00 PM IST'
const COPILOT_MEETING_LINK = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_NmJiN2JlNDEtMWNlOC00OWI0LWJmYzQtNzA4NDdjYjA3MjZj%40thread.v2/0?context=%7b%22Tid%22%3a%2298d06a4b-5d05-4914-ad0b-328736255c0b%22%2c%22Oid%22%3a%22ff63171c-7fe8-44fb-a734-101db6cbf54e%22%7d'

export default function Navbar() {
  return (
    <header className="absolute top-0 inset-x-0 z-50">
      <nav className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex h-20 sm:h-24 items-center justify-end gap-3 sm:gap-5">
          {/* GitHub Copilot class info + Join here link */}
          <div className="flex items-center gap-2 sm:gap-3 rounded-full border border-white/15 pl-3.5 sm:pl-5 pr-2 py-1.5 sm:py-2">
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-xs font-semibold text-white/85">
                {COPILOT_TRAINING_NAME}
              </span>
              <span className="text-[11px] text-white/60">
                {COPILOT_TRAINING_TIMINGS}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                window.open(COPILOT_MEETING_LINK, '_blank', 'noopener,noreferrer')
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white/85 transition-all hover:border-brand-400/60 hover:text-white hover:bg-white/5"
            >
              Join here
            </button>
          </div>

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
            <span className="hidden sm:inline">Register</span>
            <span className="sm:hidden">Webinar</span>
          </button>
        </div>
      </nav>
    </header>
  )
}
