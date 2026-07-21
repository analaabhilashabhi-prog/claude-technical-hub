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
import { Webinar, Booking } from './models.js'
import { sendWebinarConfirmation } from './mailer.js'
import { login, requireAuth } from './auth.js'
import { canonicalEmail, normalizeMobile, cleanText, isValidEmail, isValidMobile } from './normalize.js'

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

// Strip Mongo internals; return the plain client shape.
async function webinarList() {
  const docs = await Webinar.find().sort({ createdAt: -1 }).lean()
  return docs.map(({ _id, __v, createdAt, updatedAt, ...w }) => w)
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

// Public: has a webinar's email/mobile already registered? Lets the form warn
// before submit. Must be declared before the admin GET /bookings/:type route.
app.get('/api/bookings/webinar/check', async (req, res, next) => {
  try {
    const { webinarId, email, mobile } = req.query
    if (!webinarId) return res.json({ emailTaken: false, mobileTaken: false })
    const emailNorm = canonicalEmail(email || '')
    const mobileNorm = normalizeMobile(mobile || '')
    const [e, m] = await Promise.all([
      emailNorm ? Booking.exists({ type: 'webinar', webinarId, emailNorm }) : null,
      mobileNorm ? Booking.exists({ type: 'webinar', webinarId, mobileNorm }) : null,
    ])
    res.json({ emailTaken: Boolean(e), mobileTaken: Boolean(m) })
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
  const collegeName = cleanText(data.college ?? data['Organization-College Name'])
  const course = cleanText(data.course)
  const webinarId = cleanText(data.webinarId)

  // server-authoritative validation (never trust the client)
  const fields = {}
  if (!firstName) fields.firstName = 'First name is required'
  if (!emailRaw || !isValidEmail(emailRaw)) fields.email = 'A valid email is required'
  if (!isValidMobile(data.mobile)) fields.mobile = 'A valid 10-digit mobile (starting 6–9) is required'
  if (!collegeName) fields.college = 'College is required'
  if (!webinarId) fields.webinar = 'Missing webinar reference — please reopen and try again'
  if (Object.keys(fields).length) {
    return res.status(400).json({ error: 'Please check the highlighted fields.', fields })
  }

  // duplicate guard: same email OR mobile already registered for THIS webinar
  const clash = await Booking.findOne({ type: 'webinar', webinarId, $or: [{ emailNorm }, { mobileNorm }] }).lean()
  if (clash) {
    const which = clash.emailNorm === emailNorm ? 'email' : 'mobile'
    return res.status(409).json({ error: `This ${which} is already registered for this webinar.`, field: which })
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
    college: collegeName,
    'Organization-College Name': collegeName, // keep legacy field in sync for the table/analytics
    webinarId,
  }

  try {
    await Booking.create({ type: 'webinar', data: record, submittedAt, webinarId, emailNorm, mobileNorm })
  } catch (e) {
    // unique-index backstop for race conditions
    if (e && e.code === 11000) {
      return res.status(409).json({ error: 'This email or mobile is already registered for this webinar.' })
    }
    throw e
  }

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