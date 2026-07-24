// Client-side calendar helpers — turn a webinar record into an "Add to calendar"
// action (Google/Outlook links + a downloadable .ics), so the registration
// success screen can drop the event straight into the user's calendar.
// Mirrors server/calendar.js; times are IST (Asia/Kolkata, UTC+5:30).
const TZ_OFFSET_MIN = 330

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

function parseDate(w) {
  if (w.dateISO && /^\d{4}-\d{2}-\d{2}$/.test(w.dateISO)) {
    const [y, m, d] = w.dateISO.split('-').map(Number)
    return { y, m: m - 1, d }
  }
  const s = w.date || ''
  const m = s.match(/([A-Za-z]{3})[a-z]*\s+(\d{1,2}),?\s+(\d{4})/)
  if (m) {
    const mon = MONTHS[m[1].toLowerCase()]
    if (mon !== undefined) return { y: Number(m[3]), m: mon, d: Number(m[2]) }
  }
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() }
  return null
}

function parseStart(w) {
  const t = (w.time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (t) {
    let h = Number(t[1]) % 12
    if (t[3].toUpperCase() === 'PM') h += 12
    return { h, min: Number(t[2]) }
  }
  return { h: 9, min: 0 }
}

// End day for a multi-day session (endDateISO / sessionEndDateISO), or null.
function parseEndDate(w) {
  const iso = w.endDateISO || w.sessionEndDateISO
  if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number)
    return { y, m: m - 1, d }
  }
  return null
}

function parseDuration(w) {
  const src = (w.time || '').toLowerCase()
  if (/full\s*day/.test(src)) return 480
  const hr = src.match(/(\d+(?:\.\d+)?)\s*h(?:r|rs|our|ours)?/)
  if (hr) return Math.round(parseFloat(hr[1]) * 60)
  const mn = src.match(/(\d+)\s*m(?:in|ins|inute|inutes)?/)
  if (mn) return Number(mn[1])
  return 60
}

const pad = (n) => String(n).padStart(2, '0')
function toUtcStamp(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

// { start, end, title, description, location, joinUrl } for a webinar record.
export function buildEvent(w) {
  const date = parseDate(w)
  if (!date) return null
  const { h, min } = parseStart(w)
  const durationMin = parseDuration(w)

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

  const link = w.link || ''
  const isUrl = /^https?:\/\//i.test(link)
  const location = isUrl ? link : 'Online'

  const descParts = []
  if (isUrl) descParts.push(`Join link: ${link}`)
  else descParts.push('The joining link will be shared before the session.')
  if (w.presenter) descParts.push(`Presenter: ${w.presenter}${w.role ? ` (${w.role})` : ''}`)
  if (w.time) descParts.push(`Time: ${w.time}`)
  if (w.description) descParts.push('', w.description)
  descParts.push('', 'Technical Hub · Claude Partner Network')

  return { start, end, title: w.title || 'Webinar', description: descParts.join('\n'), location, joinUrl: isUrl ? link : '' }
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

function escapeICS(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function toICS(event) {
  const uid = `${toUtcStamp(event.start)}-${Math.abs(hashStr(event.title))}@technicalhub`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Technical Hub//Webinars//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(event.start)}`,
    `DTSTART:${toUtcStamp(event.start)}`,
    `DTEND:${toUtcStamp(event.end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

// Trigger a browser download of the event as an .ics file (Apple/Outlook desktop).
export function downloadICS(event, filename = 'webinar.ics') {
  const blob = new Blob([toICS(event)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
