import { useEffect, useState } from 'react'
import { Close, Calendar } from './Icons'
import { listPopups } from '../data/api'

// The live-site popup(s). Admins activate these per webinar from #admin → Webinar
// Library. Each active popup has a date range and a set of IST wall-clock times;
// this component fetches them, works out which are showing right now, and renders
// them as a stack of cards in the bottom-right corner. All times are IST,
// regardless of where a visitor is browsing from.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

// Converts a wall-clock IST date+time into the correct absolute UTC instant,
// so this works the same for every visitor no matter their own timezone.
function istToUtcMs(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00Z`).getTime() - IST_OFFSET_MS
}

const pad = (n) => String(n).padStart(2, '0')

// The IST calendar date (YYYY-MM-DD) `offsetDays` away from `now`.
function istDayKey(now, offsetDays = 0) {
  const d = new Date(now + IST_OFFSET_MS + offsetDays * 86400000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

function formatTime12h(timeStr) {
  const [h, m] = (timeStr || '').split(':').map(Number)
  if (Number.isNaN(h)) return ''
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

// Given a popup config and the current time, return its live card state, or null
// if it isn't showing right now. The popup repeats every day in [fromDate, toDate]
// using the same times, so we test today's and yesterday's IST day windows (the
// latter covers a window that started late and runs past midnight).
function popupState(cfg, now) {
  const from = cfg.fromDate
  const to = cfg.singleDay ? cfg.fromDate : cfg.toDate || cfg.fromDate
  if (!from || !cfg.popupStartTime || !cfg.webinarStartTime) return null

  for (const offset of [0, -1]) {
    const day = istDayKey(now, offset)
    if (day < from || day > to) continue

    const popupStartMs = istToUtcMs(day, cfg.popupStartTime)
    const webinarStartMs = istToUtcMs(day, cfg.webinarStartTime)
    const webinarEndMs = webinarStartMs + (Number(cfg.durationMinutes) || 60) * 60000

    if (now >= popupStartMs && now <= webinarEndMs) {
      const isLive = now >= webinarStartMs
      return {
        isLive,
        webinarStartTime: cfg.webinarStartTime,
        durationMinutes: Number(cfg.durationMinutes) || 60,
        countdownText: isLive ? 'Live now' : formatCountdown(webinarStartMs - now),
        title: cfg.title || cfg.webinarTitle || 'Upcoming webinar',
        joinLink: cfg.joinLink || cfg.link || '#',
      }
    }
  }
  return null
}

export default function WebinarPopup() {
  const [popups, setPopups] = useState([])
  const [now, setNow] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState(() => new Set())
  const [mounted, setMounted] = useState(false)

  // Load active popups, then refresh every few minutes so an admin toggle shows
  // up without a page reload.
  useEffect(() => {
    let alive = true
    const load = () =>
      listPopups()
        .then((list) => alive && setPopups(Array.isArray(list) ? list : []))
        .catch((err) => console.warn('[WebinarPopup] could not load popups:', err.message))
    load()
    const t = setInterval(load, 3 * 60 * 1000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  // Tick the clock so countdowns update and windows open/close on time.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const visible = popups
    .map((cfg) => ({ cfg, state: popupState(cfg, now) }))
    .filter(({ cfg, state }) => state && !dismissed.has(cfg.id))

  // Tiny delay so the slide-in animation plays instead of popping in instantly.
  useEffect(() => {
    if (visible.length) {
      const t = setTimeout(() => setMounted(true), 120)
      return () => clearTimeout(t)
    }
    setMounted(false)
  }, [visible.length])

  if (!visible.length) return null

  const dismiss = (id) => setDismissed((prev) => new Set(prev).add(id))

  return (
    <>
      <div
        onClick={() => visible.forEach(({ cfg }) => dismiss(cfg.id))}
        aria-hidden="true"
        className={`fixed inset-0 z-[90] bg-black/75 transition-opacity duration-300 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className="fixed bottom-5 right-5 z-[100] flex w-[400px] max-w-[calc(100vw-2.5rem)] flex-col gap-3">
        {visible.map(({ cfg, state }) => (
          <div
            key={cfg.id}
            role="dialog"
            aria-label="Upcoming webinar"
            className={`w-full rounded-2xl border border-white/10 bg-[#131313] p-6 shadow-2xl shadow-black/60 transition-all duration-350 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <div className="mb-4 flex items-start justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-claude-400">
                <span
                  className={`h-2 w-2 rounded-full ${
                    state.isLive ? 'bg-red-500 animate-pulse' : 'bg-claude-400'
                  }`}
                />
                {state.isLive ? 'Live now' : 'Live webinar'}
              </span>
              <button
                onClick={() => dismiss(cfg.id)}
                aria-label="Dismiss"
                className="text-white/40 transition hover:text-white/70"
              >
                <Close width={18} height={18} />
              </button>
            </div>

            <p className="mb-1.5 text-lg font-semibold leading-snug text-white">{state.title}</p>
            <p className="mb-4 flex items-center gap-1.5 text-sm text-white/50">
              <Calendar width={14} height={14} />
              {formatTime12h(state.webinarStartTime)} IST &middot; {state.durationMinutes} min
            </p>

            <p className="mb-4 text-sm text-white/75">{state.countdownText}</p>

            <a
              href={state.joinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-full bg-gradient-to-r from-claude-400 to-claude-600 py-3 text-center text-sm font-semibold text-black transition hover:opacity-90"
            >
              Join webinar
            </a>
          </div>
        ))}
      </div>
    </>
  )
}
