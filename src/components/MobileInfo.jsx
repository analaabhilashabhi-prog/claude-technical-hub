import { useBooking } from '../context/BookingContext'
import { contactDetails } from '../data/mockData'
import logo from '../assets/darklogo.png'
import partnerLogo from '../assets/claude-partner-logo.png'

// Compact info screen shown on small/phone screens instead of the full landing.
export default function MobileInfo() {
  const { openBooking } = useBooking()
  const email = contactDetails.find((c) => c.id === 'email')
  const phone = contactDetails.find((c) => c.id === 'mobile')

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black px-6 py-10">
      {/* soft brand glows */}
      <div className="pointer-events-none absolute left-1/2 top-[-10%] h-72 w-72 -translate-x-1/2 rounded-full bg-claude-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/2 bottom-[-10%] h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <img src={logo} alt="Technical Hub" className="h-10 w-auto" />

        <p className="mt-8 text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/40">
          Work with an
        </p>
        <img
          src={partnerLogo}
          alt="Official Claude Partner"
          className="mt-4 w-[72%] max-w-[260px] object-contain"
        />

        <p className="mt-7 max-w-xs text-sm leading-relaxed text-white/60">
          Claude-powered training, certification, AI labs, and products for
          institutions and enterprises.
        </p>

        {/* booking actions */}
        <div className="mt-9 flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={() => {
              window.location.hash = '#webinars'
            }}
            className="w-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition active:scale-95"
          >
            Register for Webinar
          </button>
          <button
            onClick={() => openBooking('aiLab')}
            className="w-full rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition active:scale-95"
          >
            Set Up an AI Lab
          </button>
        </div>

        {/* contact */}
        <div className="mt-10 flex flex-col items-center gap-2 text-sm">
          {email && (
            <a href={email.href} className="text-white/60 transition-colors hover:text-claude-400">
              {email.value}
            </a>
          )}
          {phone && (
            <a href={phone.href} className="text-white/60 transition-colors hover:text-claude-400">
              {phone.value}
            </a>
          )}
        </div>
      </div>

      <p className="relative z-10 pt-8 text-center text-xs text-white/30">
        Open on a larger screen for the full experience.
      </p>
    </div>
  )
}
