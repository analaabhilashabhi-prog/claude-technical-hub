import 'dotenv/config'
import dns from 'node:dns'
// Some networks (college/office WiFi, certain routers) refuse the DNS SRV lookup
// that mongodb+srv:// needs. Force a public resolver so Atlas always resolves.
dns.setServers(['8.8.8.8', '1.1.1.1'])
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { Webinar, Booking, MergeLog } from './models.js'
// Welcome/confirmation email (sent AFTER a successful registration) — ACTIVE.
// OTP verification (sendOtpEmail, the /api/otp/* routes, and the submit gate)
// stays PARKED for now; restore from git commit e42ec41 when re-enabling it.
import { sendWebinarConfirmation } from './mailer.js'
import { login, requireAuth } from './auth.js'
import { canonicalEmail, normalizeMobile, cleanText, isValidEmail, isValidMobile } from './normalize.js'
// Controlled option lists (shared with the frontend) — used to server-validate the
// State / City / Course / Year fields so a crafted request can't slip bad data in.
import { INDIAN_STATES, COURSES, YEAR_LEVELS } from '../src/data/formOptions.js'
import { STATE_CITIES } from '../src/data/indiaCities.js'

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/* ---------------- Registration windows / seat caps ----------------
 * Each webinar (a "slot") can only take so many registrations, because the org
 * mailbox that sends the confirmation email is capped at ~600 sends/day — so the
 * default seat cap per slot is 600. When the cap is reached registration
 * auto-closes; the admin can turn it back on (and raise the cap for the next
 * batch) once the day's mail quota resets. Admins can also turn a slot's
 * registration on/off at any time, and optionally schedule an open/close time.
 * All times are IST (Asia/Kolkata, UTC+5:30), matching server/calendar.js. */
const IST_OFFSET_MIN = 330
const DEFAULT_CAPACITY = 600

// A datetime-local string ("2026-08-12T16:00", no zone) read as IST → epoch ms.
function istLocalToMs(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  const [, y, mo, d, h, mi] = m.map(Number)
  return Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MIN * 60000
}

// A webinar doc's session start (IST wall-clock → epoch ms), from dateISO/date +
// startH/startM/ampm (falling back to the "time" display string).
function sessionStartMs(w) {
  let y, mo, d
  if (w.dateISO && /^\d{4}-\d{2}-\d{2}$/.test(w.dateISO)) {
    const p = w.dateISO.split('-').map(Number)
    y = p[0]; mo = p[1] - 1; d = p[2]
  } else {
    const dt = new Date(w.date)
    if (isNaN(dt.getTime())) return null
    y = dt.getFullYear(); mo = dt.getMonth(); d = dt.getDate()
  }
  let h = 9, min = 0
  if (w.startH && w.ampm) {
    h = Number(w.startH) % 12
    if (String(w.ampm).toUpperCase() === 'PM') h += 12
    min = Number(w.startM || 0)
  } else {
    const t = String(w.time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (t) {
      h = Number(t[1]) % 12
      if (t[3].toUpperCase() === 'PM') h += 12
      min = Number(t[2])
    }
  }
  return Date.UTC(y, mo, d, h, min) - IST_OFFSET_MIN * 60000
}

// Normalize whatever the admin saved into a full registration config.
function regConfig(w) {
  const reg = w.registration || {}
  const capacity = Number(reg.capacity) > 0 ? Math.floor(Number(reg.capacity)) : DEFAULT_CAPACITY
  return {
    enabled: reg.enabled !== false, // default ON for older sessions with no config
    capacity,
    opensAt: typeof reg.opensAt === 'string' ? reg.opensAt : '',
    closesAt: typeof reg.closesAt === 'string' ? reg.closesAt : '',
  }
}

// Whether registration is open for a webinar right now, and why not if it isn't.
// `count` is how many have already registered for this slot. Registration closes
// when: the admin turns it off, the seat cap is reached (auto-close — this is the
// daily mail-send limit), it's before a scheduled open, or past a scheduled close.
function regStatus(w, count, now = Date.now()) {
  const cfg = regConfig(w)
  const c = Number(count) || 0
  const remaining = Math.max(0, cfg.capacity - c)
  const opensAtMs = istLocalToMs(cfg.opensAt)
  const closesAtMs = istLocalToMs(cfg.closesAt)
  // Only a scheduled close feeds the countdown now (no 24h cutoff).
  const closeAtMs = closesAtMs

  let state = 'open'
  let message = ''
  if (!cfg.enabled) {
    state = 'disabled'
    message = 'Registration for this session is currently closed.'
  } else if (opensAtMs != null && now < opensAtMs) {
    state = 'scheduled'
    message = 'Registration for this session hasn’t opened yet.'
  } else if (c >= cfg.capacity) {
    state = 'full'
    message = 'This session is fully booked.'
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
    opensAt: cfg.opensAt,
    closesAt: cfg.closesAt,
    closeAtMs, // epoch ms when a SCHEDULED close hits (for a countdown), or null
  }
}

// One aggregation → { webinarId: count } for all webinar registrations.
async function regCounts() {
  const rows = await Booking.aggregate([
    { $match: { type: 'webinar' } },
    { $group: { _id: '$webinarId', count: { $sum: 1 } } },
  ])
  const map = {}
  for (const r of rows) if (r._id) map[r._id] = r.count
  return map
}

// TESTING TOGGLE (off by default — safe for real use). Set
// ALLOW_DUPLICATE_TESTING=true in .env to let the same email/mobile register for a
// webinar repeatedly — handy for testing the welcome email without a fresh address
// each time. It skips the app-level duplicate check AND omits the emailNorm/mobileNorm
// keys so the DB's partial unique indexes don't block the repeat insert either.
const ALLOW_DUPLICATE_TESTING = process.env.ALLOW_DUPLICATE_TESTING === 'true'

// ---- Email OTP verification (in-memory; fine for a single server, resets on
// restart). Keyed by canonical email. Registration requires a recently-verified
// OTP for the submitted email.
const otpStore = new Map()
const OTP_TTL_MS = 10 * 60 * 1000 // code valid for 10 min
const OTP_RESEND_MS = 30 * 1000 // min gap between sends
const OTP_VERIFY_WINDOW_MS = 20 * 60 * 1000 // how long a verification stays valid
const OTP_MAX_ATTEMPTS = 6
const makeOtp = () => String(Math.floor(100000 + Math.random() * 900000))
// occasional cleanup so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of otpStore) if (v.expiresAt < now && v.verifiedUntil < now) otpStore.delete(k)
}, 10 * 60 * 1000).unref?.()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

const app = express()
app.use(cors())
app.use(express.json({ limit: '12mb' })) // posters are base64 data URLs

const PORT = process.env.PORT || 4000
const URI = process.env.MONGODB_URI
if (!URI) {
  console.error('\n[server] Missing MONGODB_URI. Create a .env file (see .env.example).\n')
  process.exit(1)
}

// Strip Mongo internals; return the plain client shape. Each webinar is enriched
// with its current seat count (regCount) and a computed registration status so
// the public register page can show "X of 600 registered" and gate the button.
async function webinarList() {
  const [docs, counts] = await Promise.all([
    Webinar.find().sort({ createdAt: -1 }).lean(),
    regCounts(),
  ])
  return docs.map(({ _id, __v, createdAt, updatedAt, ...w }) => {
    const count = counts[w.id] || 0
    return {
      ...w,
      registration: regConfig(w),
      regCount: count,
      regStatus: regStatus(w, count),
    }
  })
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))

/* ---------------- Admin auth ---------------- */
app.post('/api/admin/login', login)

/* ---------------- Webinar library ---------------- */
// Public: the #webinars registration page needs to read the library too.
app.get('/api/webinars', async (_req, res, next) => {
  try {
    res.json(await webinarList())
  } catch (e) {
    next(e)
  }
})

// Admin-only: creating/editing sessions.
app.post('/api/webinars', requireAuth, async (req, res, next) => {
  try {
    const w = req.body || {}
    if (!w.id) w.id = `session-${Date.now().toString(36)}`
    await Webinar.updateOne({ id: w.id }, { $set: w }, { upsert: true })
    res.status(201).json(await webinarList())
  } catch (e) {
    next(e)
  }
})

// Admin-only: deleting sessions.
app.delete('/api/webinars/:id', requireAuth, async (req, res, next) => {
  try {
    await Webinar.deleteOne({ id: req.params.id })
    res.json(await webinarList())
  } catch (e) {
    next(e)
  }
})

/* ---------------- Popup notifications ---------------- */
// Admin-only: activate / update / turn off a webinar's popup. Stored on the
// webinar doc under `popup` so it lives with the session it belongs to. Saved
// on its own (not via the full webinar upsert) so we never resend the poster.
app.put('/api/webinars/:id/popup', requireAuth, async (req, res, next) => {
  try {
    const popup = req.body || {}
    const result = await Webinar.updateOne({ id: req.params.id }, { $set: { popup } })
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Webinar not found' })
    res.json({ ok: true, popup })
  } catch (e) {
    next(e)
  }
})

// Public: the live site reads active popups here. Lean payload — no posters or
// descriptions, just what the popup card needs to render.
app.get('/api/popups', async (_req, res, next) => {
  try {
    const docs = await Webinar.find({ 'popup.active': true }, { id: 1, title: 1, popup: 1 }).lean()
    res.json(
      docs.map((d) => ({
        id: d.id,
        webinarTitle: d.title,
        ...d.popup,
      }))
    )
  } catch (e) {
    next(e)
  }
})

/* ---------------- Registration windows / seat caps ---------------- */
// Admin-only: turn a webinar's registration on/off, set its seat cap, and
// optional scheduled open/close times. Stored on the webinar doc under
// `registration` (like `popup`), saved on its own so the poster is never resent.
app.put('/api/webinars/:id/registration', requireAuth, async (req, res, next) => {
  try {
    const b = req.body || {}
    const registration = {
      enabled: b.enabled !== false,
      capacity: Number(b.capacity) > 0 ? Math.floor(Number(b.capacity)) : DEFAULT_CAPACITY,
      opensAt: typeof b.opensAt === 'string' ? b.opensAt : '',
      closesAt: typeof b.closesAt === 'string' ? b.closesAt : '',
    }
    const result = await Webinar.updateOne({ id: req.params.id }, { $set: { registration } })
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Webinar not found' })
    res.json({ ok: true, registration })
  } catch (e) {
    next(e)
  }
})

// Public: a fresh registration status + live seat count for one webinar, so the
// register modal can re-check right before showing the form (avoids a stale cap).
app.get('/api/webinars/:id/registration', async (req, res, next) => {
  try {
    const w = await Webinar.findOne({ id: req.params.id }).lean()
    if (!w) return res.status(404).json({ error: 'Webinar not found' })
    const count = await Booking.countDocuments({ type: 'webinar', webinarId: req.params.id })
    res.json(regStatus(w, count))
  } catch (e) {
    next(e)
  }
})

/* ---------------- Email OTP (PARKED) ---------------- */
// PARKED — re-enable together with the email features. Full code preserved in
// git commit e42ec41. Kept here as a comment for easy reference.
/*
// Public: send a verification code to the given email.
app.post('/api/otp/send', async (req, res, next) => {
  try {
    const emailRaw = String(req.body?.email ?? '').trim()
    if (!isValidEmail(emailRaw)) return res.status(400).json({ error: 'Enter a valid email first.' })
    const key = canonicalEmail(emailRaw)
    const now = Date.now()
    const existing = otpStore.get(key)
    if (existing && now - existing.lastSentAt < OTP_RESEND_MS) {
      const wait = Math.ceil((OTP_RESEND_MS - (now - existing.lastSentAt)) / 1000)
      return res.status(429).json({ error: `Please wait ${wait}s before requesting another code.` })
    }
    const code = makeOtp()
    otpStore.set(key, { code, expiresAt: now + OTP_TTL_MS, attempts: 0, verifiedUntil: 0, lastSentAt: now })
    let preview = null
    try {
      const r = await sendOtpEmail(emailRaw, code)
      preview = r?.preview || null
    } catch (err) {
      console.error('[otp] send failed →', err.message)
      return res.status(502).json({ error: 'Could not send the code right now. Please try again.' })
    }
    res.json({ ok: true, preview })
  } catch (e) {
    next(e)
  }
})

// Public: verify the code. On success the email is marked verified for a window.
app.post('/api/otp/verify', (req, res) => {
  const emailRaw = String(req.body?.email ?? '').trim()
  const otp = String(req.body?.otp ?? '').trim()
  const key = canonicalEmail(emailRaw)
  const rec = otpStore.get(key)
  const now = Date.now()
  if (!rec || rec.expiresAt < now) return res.status(400).json({ error: 'Code expired — request a new one.' })
  if (rec.attempts >= OTP_MAX_ATTEMPTS) return res.status(429).json({ error: 'Too many attempts — request a new code.' })
  rec.attempts += 1
  if (otp !== rec.code) return res.status(400).json({ error: 'Incorrect code. Please try again.' })
  rec.verifiedUntil = now + OTP_VERIFY_WINDOW_MS
  res.json({ ok: true })
})
*/

/* ---------------- College suggestions ---------------- */
// Public: typeahead suggestions drawn from the college names already in the
// registration data. New colleges entered by registrants land in this same data,
// so they automatically become suggestions for the next person. Grouped
// case-insensitively and ranked by how often each name appears.
app.get('/api/colleges', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim()
    const pipeline = [
      { $match: { type: 'webinar' } },
      {
        $project: {
          name: { $ifNull: ['$data.college', { $getField: { field: 'Organization-College Name', input: '$data' } }] },
        },
      },
      { $match: { name: { $type: 'string', $ne: '' } } },
    ]
    if (q) pipeline.push({ $match: { name: { $regex: escapeRegex(q), $options: 'i' } } })
    pipeline.push(
      { $group: { _id: { $toLower: '$name' }, name: { $first: '$name' }, count: { $sum: 1 } } },
      { $sort: { count: -1, name: 1 } },
      { $limit: 20 }
    )
    const rows = await Booking.aggregate(pipeline)
    res.json(rows.map((r) => ({ id: r._id, name: r.name, count: r.count })))
  } catch (e) {
    next(e)
  }
})

/* ---------------- Data cleanup: organization name merge ---------------- */
const ORG_FIELD = 'Organization-College Name'
const orgMatch = (names) => ({
  type: 'webinar',
  $or: [{ [`data.${ORG_FIELD}`]: { $in: names } }, { 'data.college': { $in: names } }],
})

// Admin: every distinct organization name in webinar registrations + its count.
// Grouped by exact spelling so the admin can see and pick the variants to merge.
app.get('/api/admin/org-names', requireAuth, async (_req, res, next) => {
  try {
    const rows = await Booking.aggregate([
      { $match: { type: 'webinar' } },
      { $project: { name: { $ifNull: ['$data.college', { $getField: { field: ORG_FIELD, input: '$data' } }] } } },
      { $match: { name: { $type: 'string', $ne: '' } } },
      { $group: { _id: '$name', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    res.json(rows.map((r) => ({ name: r._id, count: r.count })))
  } catch (e) {
    next(e)
  }
})

// Admin: merge selected variant names into one final name. Reversible — every
// affected record's original name is stored in a MergeLog for one-click undo.
app.post('/api/admin/merge-orgs', requireAuth, async (req, res, next) => {
  try {
    const names = Array.isArray(req.body?.names) ? [...new Set(req.body.names.filter(Boolean))] : []
    const target = cleanText(req.body?.target)
    if (!names.length || !target) {
      return res.status(400).json({ error: 'Select at least one name and enter the final name.' })
    }
    const q = orgMatch(names)
    const docs = await Booking.find(q).lean()
    const changes = docs
      .map((d) => ({ id: String(d._id), from: d.data?.[ORG_FIELD] ?? d.data?.college ?? '' }))
      .filter((c) => c.from && c.from !== target)
    if (!changes.length) return res.json({ ok: true, count: 0, message: 'Nothing to change — already that name.' })

    await Booking.updateMany(q, { $set: { [`data.${ORG_FIELD}`]: target, 'data.college': target } })
    const log = await MergeLog.create({ field: ORG_FIELD, to: target, from: names, count: changes.length, changes })
    res.json({ ok: true, count: changes.length, logId: String(log._id) })
  } catch (e) {
    next(e)
  }
})

// Admin: recent merges, for the undo list.
app.get('/api/admin/merge-logs', requireAuth, async (_req, res, next) => {
  try {
    const logs = await MergeLog.find().sort({ createdAt: -1 }).limit(30).lean()
    res.json(
      logs.map((l) => ({ id: String(l._id), to: l.to, from: l.from, count: l.count, undone: l.undone, createdAt: l.createdAt }))
    )
  } catch (e) {
    next(e)
  }
})

// Admin: undo a merge — restore each affected record's original name.
app.post('/api/admin/merge-orgs/undo', requireAuth, async (req, res, next) => {
  try {
    const log = await MergeLog.findById(req.body?.logId)
    if (!log || log.undone) return res.status(400).json({ error: 'Merge not found or already undone.' })
    const ops = log.changes.map((c) => ({
      updateOne: { filter: { _id: c.id }, update: { $set: { [`data.${ORG_FIELD}`]: c.from, 'data.college': c.from } } },
    }))
    if (ops.length) await Booking.bulkWrite(ops)
    log.undone = true
    await log.save()
    res.json({ ok: true, restored: ops.length })
  } catch (e) {
    next(e)
  }
})

/* ---------------- Bookings ---------------- */
// Admin-only: this is the registration data itself — the whole point of the login.
app.get('/api/bookings/:type', requireAuth, async (req, res, next) => {
  try {
    const docs = await Booking.find({ type: req.params.type }).sort({ submittedAt: -1 }).lean()
    res.json(docs.map((b) => ({ ...b.data, submittedAt: b.submittedAt })))
  } catch (e) {
    next(e)
  }
})

// Public: is this exact email+mobile combo already registered for the webinar?
// Lets the form warn before submit (matches the "block only if both match" rule).
// Must be declared before the admin GET /bookings/:type route.
app.get('/api/bookings/webinar/check', async (req, res, next) => {
  try {
    const { webinarId, email, mobile } = req.query
    const emailNorm = canonicalEmail(email || '')
    const mobileNorm = normalizeMobile(mobile || '')
    if (!webinarId || !emailNorm || !mobileNorm) return res.json({ taken: false })
    const hit = await Booking.exists({ type: 'webinar', webinarId, emailNorm, mobileNorm })
    res.json({ taken: Boolean(hit) })
  } catch (e) {
    next(e)
  }
})

// Public: this is the registration form submit — no login required to register.
app.post('/api/bookings/:type', async (req, res, next) => {
  try {
    const data = { ...(req.body || {}) }
    const submittedAt = data.submittedAt ? new Date(data.submittedAt) : new Date()

    if (req.params.type === 'webinar') return await registerWebinar(data, submittedAt, res)

    await Booking.create({ type: req.params.type, data, submittedAt })
    res.status(201).json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// Hardened webinar registration: normalize → validate → block duplicates →
// resolve/create canonical college → store with dedup keys.
async function registerWebinar(data, submittedAt, res) {
  const firstName = cleanText(data.firstName)
  const lastName = cleanText(data.lastName)
  const emailRaw = String(data.email ?? '').trim()
  const emailNorm = canonicalEmail(emailRaw)
  const mobileNorm = normalizeMobile(data.mobile)
  const state = cleanText(data.state)
  const city = cleanText(data.city)
  const cityManual = Boolean(data.cityManual) // student typed a city not in our list
  const collegeName = cleanText(data.college ?? data['Organization-College Name'])
  const courseChoice = cleanText(data.courseChoice || data.course) // the dropdown pick
  const courseOther = cleanText(data.courseOther)
  // Final course value: the free-text when "Other" was picked, else the pick itself.
  const course = courseChoice === 'Other' ? courseOther : cleanText(data.course) || courseChoice
  const year = cleanText(data.year)
  const webinarId = cleanText(data.webinarId)

  // server-authoritative validation (never trust the client)
  const fields = {}
  if (!firstName) fields.firstName = 'First name is required'
  if (!emailRaw || !isValidEmail(emailRaw)) fields.email = 'A valid email is required'
  if (!isValidMobile(data.mobile)) fields.mobile = 'A valid 10-digit mobile (starting 6–9) is required'
  // State + City. City must belong to the chosen State — UNLESS the student
  // flagged it as manual entry (their city isn't in our list), in which case any
  // non-empty city is accepted.
  if (!state || !INDIAN_STATES.includes(state)) fields.state = 'Select a valid state'
  else if (cityManual) {
    if (!city) fields.city = 'Enter your city'
  } else if (!city || !(STATE_CITIES[state] || []).includes(city)) {
    fields.city = 'Select a city in that state'
  }
  if (!collegeName) fields.college = 'College is required'
  // Course (must be a known option; "Other" requires the free-text course)
  if (!courseChoice || !COURSES.includes(courseChoice)) fields.course = 'Select a valid course'
  else if (courseChoice === 'Other' && !course) fields.course = 'Enter your course'
  // Year of study
  if (!year || !YEAR_LEVELS.includes(year)) fields.year = 'Select your year of study'
  if (!webinarId) fields.webinar = 'Missing webinar reference — please reopen and try again'
  if (Object.keys(fields).length) {
    return res.status(400).json({ error: 'Please check the highlighted fields.', fields })
  }

  // PARKED — email OTP verification (re-enable with the email features; commit e42ec41):
  // const otpRec = otpStore.get(emailNorm)
  // if (!otpRec || otpRec.verifiedUntil < Date.now()) {
  //   return res.status(403).json({ error: 'Please verify your email with the code we sent.', field: 'email' })
  // }

  // Registration window / seat cap: the slot must exist, be turned on, be inside
  // its open window (not before a scheduled open, not past a scheduled close) and
  // still have seats (auto-closes at the cap). Note: the seat check isn't atomic,
  // so two submits racing for the last seat could both pass — acceptable here (at
  // worst one extra confirmation email over the daily cap).
  const webinar = await Webinar.findOne({ id: webinarId }).lean()
  if (!webinar) {
    return res.status(404).json({ error: 'This session is no longer available.', field: 'webinar' })
  }
  const seatCount = await Booking.countDocuments({ type: 'webinar', webinarId })
  const status = regStatus(webinar, seatCount)
  if (!status.open) {
    return res.status(status.state === 'full' ? 409 : 403).json({
      error: status.message || 'Registration is closed for this session.',
      regClosed: true,
      state: status.state,
    })
  }

  // duplicate guard: block only when the SAME email AND mobile are both already
  // registered for THIS webinar (the exact combo).
  if (!ALLOW_DUPLICATE_TESTING) {
    const clash = await Booking.findOne({ type: 'webinar', webinarId, emailNorm, mobileNorm }).lean()
    if (clash) {
      return res.status(409).json({
        error: 'This email + mobile is already registered for this webinar.',
        field: 'combo',
      })
    }
  }

  const record = {
    ...data,
    firstName,
    lastName,
    email: emailRaw.toLowerCase(),
    mobile: normalizeMobile(data.mobile),
    state,
    city,
    course,
    year,
    college: collegeName,
    'Organization-College Name': collegeName, // keep legacy field in sync for the table/analytics
    webinarId,
  }

  try {
    await Booking.create({
      type: 'webinar',
      data: record,
      submittedAt,
      webinarId,
      // Omit the normalized dedup keys while duplicate-testing, so the partial
      // unique indexes don't reject repeat test registrations.
      emailNorm: ALLOW_DUPLICATE_TESTING ? undefined : emailNorm,
      mobileNorm: ALLOW_DUPLICATE_TESTING ? undefined : mobileNorm,
    })
  } catch (e) {
    // unique-index backstop for race conditions
    if (e && e.code === 11000) {
      return res.status(409).json({ error: 'This email or mobile is already registered for this webinar.' })
    }
    throw e
  }

  // Branded welcome/confirmation email — fire-and-forget so a mail hiccup never
  // fails a registration (the student is already saved). Sends via Microsoft
  // Graph (real delivery). The separate OTP verification email stays PARKED.
  sendWebinarConfirmation(record).catch((err) => console.error('[mailer] welcome failed →', err.message))
  // PARKED — one-time OTP consume (re-enable with OTP verification; commit e42ec41):
  // otpStore.delete(emailNorm)
  res.status(201).json({ ok: true })
}
// Admin-only: wiping booking records.
app.delete('/api/bookings/:type', requireAuth, async (req, res, next) => {
  try {
    await Booking.deleteMany({ type: req.params.type })
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// In production, serve the built React site from the same server so the site and
// the /api routes share one origin (no proxy needed). Runs only if `dist` exists
// (i.e. after `npm run build`); in dev, Vite serves the frontend instead.
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
  console.log('[server] Serving built site from /dist')
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[server] error:', err.message)
  res.status(500).json({ error: err.message })
})

mongoose
  .connect(URI)
  .then(async () => {
    console.log('[server] MongoDB connected')
    // No auto-seed — the webinar library starts empty and is filled with real
    // sessions from the admin page (#admin).
    app.listen(PORT, () => console.log(`[server] API running on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('[server] MongoDB connection failed:', err.message)
    process.exit(1)
  })