import { useEffect, useState } from 'react'
import { Close, Calendar } from './Icons'

// ============================================================================
// EDIT THESE — dummy values for now. Swap in the real link, date, and times
// whenever you have them. All times below are Indian Standard Time (IST),
// regardless of where a visitor is browsing from.
// ============================================================================
const WEBINAR_TITLE = 'GitHub Copilot: How large language models actually work'
const WEBINAR_LINK = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_NmJiN2JlNDEtMWNlOC00OWI0LWJmYzQtNzA4NDdjYjA3MjZj%40thread.v2/0?context=%7b%22Tid%22%3a%2298d06a4b-5d05-4914-ad0b-328736255c0b%22%2c%22Oid%22%3a%22ff63171c-7fe8-44fb-a734-101db6cbf54e%22%7d' // real Teams link (from the old Navbar badge)
const WEBINAR_DATE = '2026-07-20' // YYYY-MM-DD — the day of the webinar (IST)
const WEBINAR_START_TIME = '20:30' // HH:MM, 24-hour clock, IST — when the session starts
const WEBINAR_DURATION_MINUTES = 60 // how long the session runs
const POPUP_START_TIME = '16:00' // HH:MM, 24-hour clock, IST — when the popup starts appearing
// ============================================================================

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

// Converts a wall-clock IST date+time into the correct absolute UTC instant,
// so this works the same for every visitor no matter their own timezone.
function istToUtcMs(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00Z`).getTime() - IST_OFFSET_MS
}

function formatTime12h(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function formatCountdown(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`
  return `Starts in ${minutes}m`
}

export default function WebinarPopup() {
  const [now, setNow] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  const popupStartMs = istToUtcMs(WEBINAR_DATE, POPUP_START_TIME)
  const webinarStartMs = istToUtcMs(WEBINAR_DATE, WEBINAR_START_TIME)
  const webinarEndMs = webinarStartMs + WEBINAR_DURATION_MINUTES * 60000

  const shouldShow = !dismissed && now >= popupStartMs && now <= webinarEndMs

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  // Tiny delay so the slide-in animation actually plays instead of popping in instantly.
  useEffect(() => {
    if (shouldShow) {
      const t = setTimeout(() => setMounted(true), 120)
      return () => clearTimeout(t)
    }
    setMounted(false)
  }, [shouldShow])

  const close = () => {
    setMounted(false)
    setDismissed(true)
  }

  if (!shouldShow) return null

  const isLive = now >= webinarStartMs
  const countdownText = isLive ? 'Live now' : formatCountdown(webinarStartMs - now)

  return (
    <>
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-[90] bg-black/75 transition-opacity duration-300 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-label="Upcoming webinar"
        className={`fixed bottom-5 right-5 z-[100] w-[400px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-white/10 bg-[#131313] p-6 shadow-2xl shadow-black/60 transition-all duration-350 ease-out ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-claude-400">
            <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-claude-400'}`} />
            {isLive ? 'Live now' : 'Live webinar'}
          </span>
          <button
            onClick={close}
            aria-label="Dismiss"
            className="text-white/40 transition hover:text-white/70"
          >
            <Close width={18} height={18} />
          </button>
        </div>

        <p className="mb-1.5 text-lg font-semibold leading-snug text-white">{WEBINAR_TITLE}</p>
        <p className="mb-4 flex items-center gap-1.5 text-sm text-white/50">
          <Calendar width={14} height={14} />
          {formatTime12h(WEBINAR_START_TIME)} IST &middot; {WEBINAR_DURATION_MINUTES} min
        </p>

        <p className="mb-4 text-sm text-white/75">{countdownText}</p>

        <a
          href={WEBINAR_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-full bg-gradient-to-r from-claude-400 to-claude-600 py-3 text-center text-sm font-semibold text-black transition hover:opacity-90"
        >
          Join webinar
        </a>
      </div>
    </>
  )
}