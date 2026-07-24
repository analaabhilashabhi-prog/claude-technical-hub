// Webinar/workshop library, backed by the MongoDB API. The admin (#admin) writes
// here and the register flow (#webinars) reads from the same store. Reads fall
// back to the built-in list if the API can't be reached, so the UI is never empty.
import { webinars as defaults } from './mockData'
import { listWebinars, createWebinar, removeWebinar } from './api'

export async function getWebinars() {
  try {
    return await listWebinars()
  } catch (err) {
    console.warn('[webinarStore] API unavailable, using built-in sessions:', err.message)
    return defaults
  }
}

// Returns the updated list from the server.
export async function addWebinar(w) {
  return createWebinar(w)
}

// Returns the updated list from the server.
export async function deleteWebinar(id) {
  return removeWebinar(id)
}

export const slugify = (s) =>
  (s || 'session')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

// Display label for a session's date — a single day ("Aug 12, 2026") or a range
// for multi-day sessions ("Jul 20 to Jul 24, 2026", "Aug 30 to Sep 2, 2026", or
// across years). Start is dateISO; end is endDateISO (blank/equal ⇒ single day).
export function sessionDateLabel(w) {
  if (!w) return ''
  const iso = (s) => (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null)
  const start = iso(w.dateISO)
  const end = iso(w.endDateISO)
  if (!start) return w.date || ''
  const fmt = (s, opts) => new Date(`${s}T00:00:00`).toLocaleDateString('en-US', opts)
  if (!end || end === start) return fmt(start, { month: 'short', day: 'numeric', year: 'numeric' })
  const [sy] = start.split('-')
  const [ey] = end.split('-')
  // Same year → repeat the month on both sides ("Jul 20 to Jul 24, 2026").
  if (sy === ey)
    return `${fmt(start, { month: 'short', day: 'numeric' })} to ${fmt(end, { month: 'short', day: 'numeric', year: 'numeric' })}`
  return `${fmt(start, { month: 'short', day: 'numeric', year: 'numeric' })} to ${fmt(end, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

// Inclusive number of days a session spans: 1 for single-day, e.g. Jul 20→Jul 24 = 5.
export function sessionDaysCount(w) {
  const iso = (s) => (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null)
  const start = iso(w?.dateISO)
  const end = iso(w?.endDateISO)
  if (!start) return 0
  if (!end || end === start) return 1
  const ms = new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)
  return Math.max(1, Math.round(ms / 86400000) + 1)
}
