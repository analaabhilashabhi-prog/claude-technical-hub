// Client-side mirror of the server's registration-window logic (server/index.js).
// Lets the register page compute "X of 600 registered" and gate the button
// without a round-trip, and recompute live as scheduled open/close times pass.
// Times are IST (Asia/Kolkata, UTC+5:30), matching server/calendar.js.
import { buildEvent } from './calendar'

export const DEFAULT_CAPACITY = 600
export const DEFAULT_CLOSE_HOURS_BEFORE = 24
const IST_OFFSET_MIN = 330

// datetime-local string ("2026-08-12T16:00", no zone) read as IST → epoch ms.
export function istLocalToMs(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  const [, y, mo, d, h, mi] = m.map(Number)
  return Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MIN * 60000
}

// Normalize a webinar's saved registration config (with sensible defaults).
export function regConfig(w) {
  const reg = (w && w.registration) || {}
  const capacity = Number(reg.capacity) > 0 ? Math.floor(Number(reg.capacity)) : DEFAULT_CAPACITY
  const closeHoursBefore =
    reg.closeHoursBefore != null && Number(reg.closeHoursBefore) >= 0
      ? Number(reg.closeHoursBefore)
      : DEFAULT_CLOSE_HOURS_BEFORE
  return {
    enabled: reg.enabled !== false,
    capacity,
    closeHoursBefore,
    opensAt: typeof reg.opensAt === 'string' ? reg.opensAt : '',
    closesAt: typeof reg.closesAt === 'string' ? reg.closesAt : '',
  }
}

// Is registration open for this webinar right now, and why not if not?
// `count` defaults to the seat count the API attached to the webinar (regCount).
export function regStatus(w, count = (w && w.regCount) || 0, now = Date.now()) {
  const cfg = regConfig(w)
  const c = Number(count) || 0
  const remaining = Math.max(0, cfg.capacity - c)
  const opensAtMs = istLocalToMs(cfg.opensAt)
  const closesAtMs = istLocalToMs(cfg.closesAt)
  // Multi-day: measure the cutoff from the LAST day so registration stays open
  // through the run. Single-day: same as the start.
  const isMultiDay =
    typeof w?.endDateISO === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w.endDateISO) && w.endDateISO !== w.dateISO
  const cutoffBase = isMultiDay
    ? buildEvent({ ...w, dateISO: w.endDateISO })?.start?.getTime?.() ?? null
    : buildEvent(w)?.start?.getTime?.() ?? null
  const cutoffMs = cutoffBase != null ? cutoffBase - cfg.closeHoursBefore * 3600000 : null
  // The moment registration actually closes = the earliest of the 24h-before
  // cutoff and any scheduled close time.
  const closeCandidates = [cutoffMs, closesAtMs].filter((v) => v != null)
  const closeAtMs = closeCandidates.length ? Math.min(...closeCandidates) : null

  let state = 'open'
  let message = ''
  if (!cfg.enabled) {
    state = 'disabled'
    message = 'Registration for this session is currently closed.'
  } else if (opensAtMs != null && now < opensAtMs) {
    state = 'scheduled'
    message = 'Registration hasn’t opened yet.'
  } else if (c >= cfg.capacity) {
    state = 'full'
    message = 'This session is fully booked.'
  } else if (cutoffMs != null && now > cutoffMs) {
    state = 'cutoff'
    message = `Registration closes ${cfg.closeHoursBefore} hours before the session starts.`
  } else if (closesAtMs != null && now > closesAtMs) {
    state = 'closed'
    message = 'Registration has closed for this session.'
  }

  return {
    open: state === 'open',
    state,
    message,
    count: c,
    capacity: cfg.capacity,
    remaining,
    enabled: cfg.enabled,
    closeHoursBefore: cfg.closeHoursBefore,
    opensAt: cfg.opensAt,
    closesAt: cfg.closesAt,
    closeAtMs, // epoch ms when registration closes (for a countdown), or null
  }
}

// Milliseconds → "2d 5h" / "5h 23m" / "42m 10s" / "closing now", for a countdown.
export function fmtCountdown(ms) {
  if (ms == null) return ''
  if (ms <= 0) return 'closing now'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

// Short label for the register button / status pill given a status object.
export function regStatusLabel(s) {
  switch (s.state) {
    case 'full':
      return 'Fully booked'
    case 'disabled':
      return 'Registration closed'
    case 'scheduled':
      return 'Registration not yet open'
    case 'cutoff':
    case 'closed':
      return 'Registration closed'
    default:
      return 'Open'
  }
}

// "Opens Aug 12, 4:00 PM" from a datetime-local string, for the scheduled state.
export function fmtIstLocal(s) {
  const ms = istLocalToMs(s)
  if (ms == null) return ''
  return new Date(ms).toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
