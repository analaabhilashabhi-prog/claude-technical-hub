// Build a calendar event (ICS file + Google/Outlook links) from a webinar's
// date + time, so confirmation emails can carry an "Add to calendar" action.
//
// Times are interpreted in IST (Asia/Kolkata, UTC+5:30) unless a different
// offset is passed. Change TZ_OFFSET_MIN if your sessions run in another zone.
const TZ_OFFSET_MIN = 330 // IST = +5:30

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

// Y/M/D from dateISO ("2026-08-12") or a display date ("Aug 12, 2026").
function parseDate(w) {
  if (w.sessionDateISO && /^\d{4}-\d{2}-\d{2}$/.test(w.sessionDateISO)) {
    const [y, m, d] = w.sessionDateISO.split('-').map(Number)
    return { y, m: m - 1, d }
  }
  const s = w.sessionDate || w.date || ''
  const m = s.match(/([A-Za-z]{3})[a-z]*\s+(\d{1,2}),?\s+(\d{4})/)
  if (m) {
    const mon = MONTHS[m[1].toLowerCase()]
    if (mon !== undefined) return { y: Number(m[3]), m: mon, d: Number(m[2]) }
  }
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() }
  return null
}

// End day for a multi-day session (sessionEndDateISO / endDateISO), or null.
function parseEndDate(w) {
  const iso = w.sessionEndDateISO || w.endDateISO
  if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number)
    return { y, m: m - 1, d }
  }
  return null
}

// 24h hour + minute from parts or a time string ("5:00 PM · 90 min").
function parseStart(w) {
  let h = 9
  let min = 0
  if (w.startH && w.ampm) {
    h = Number(w.startH) % 12
    if (String(w.ampm).toUpperCase() === 'PM') h += 12
    min = Number(w.startM || 0)
    return { h, min }
  }
  const t = (w.sessionTime || w.time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (t) {
    h = Number(t[1]) % 12
    if (t[3].toUpperCase() === 'PM') h += 12
    min = Number(t[2])
  }
  return { h, min }
}

// Duration in minutes from "90 min", "2 hrs", "Full day", or the time string.
function parseDuration(w) {
  const src = `${w.duration || ''} ${w.sessionTime || w.time || ''}`.toLowerCase()
  if (/full\s*day/.test(src)) return 480
  const hr = src.match(/(\d+(?:\.\d+)?)\s*h(?:r|rs|our|ours)?/)
  if (hr) return Math.round(parseFloat(hr[1]) * 60)
  const mn = src.match(/(\d+)\s*m(?:in|ins|inute|inutes)?/)
  if (mn) return Number(mn[1])
  return 60
}

// UTC formatting: 20260812T113000Z
const pad = (n) => String(n).padStart(2, '0')
function toUtcStamp(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

// Build { start, end, title, description, location } for a webinar record.
export function buildEvent(w) {
  const date = parseDate(w)
  if (!date) return null
  const { h, min } = parseStart(w)
  const durationMin = parseDuration(w)

  // Local IST wall-clock → UTC instant.
  const startMs = Date.UTC(date.y, date.m, date.d, h, min) - TZ_OFFSET_MIN * 60000
  const start = new Date(startMs)
  // Multi-day session: end on the last day at the same start time + duration.
  const endDate = parseEndDate(w)
  let endMs = startMs + durationMin * 60000
  if (endDate) {
    const endStartMs = Date.UTC(endDate.y, endDate.m, endDate.d, h, min) - TZ_OFFSET_MIN * 60000
    if (endStartMs > startMs) endMs = endStartMs + durationMin * 60000
  }
  const end = new Date(endMs)

  const title = w.webinar || w.title || 'Webinar'
  const location = w.location || 'Online'
  const isUrl = /^https?:\/\//i.test(location)

  const descParts = []
  if (isUrl) descParts.push(`Join: ${location}`)
  if (w.presenter) descParts.push(`Presenter: ${w.presenter}`)
  if (w.sessionTime || w.time) descParts.push(`Time: ${w.sessionTime || w.time} IST`)
  if (w.description) descParts.push('', w.description)
  const description = descParts.join('\n')

  return { start, end, title, description, location, joinUrl: isUrl ? location : '' }
}

function escapeICS(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function toICS(event, uid) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Technical Hub//Webinars//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(event.start)}`,
    `DTEND:${toUtcStamp(event.end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

export function googleUrl(event) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toUtcStamp(event.start)}/${toUtcStamp(event.end)}`,
    details: event.description,
    location: event.location,
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export function outlookUrl(event) {
  const p = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
    body: event.description,
    location: event.location,
  })
  return `https://outlook.office.com/calendar/0/deeplink/compose?${p.toString()}`
}
