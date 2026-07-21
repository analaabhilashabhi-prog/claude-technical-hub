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

// Public: this is the registration form submit — no login required to register.
app.post('/api/bookings/:type', async (req, res, next) => {
  try {
    const data = req.body || {}
    const submittedAt = data.submittedAt
      ? new Date(data.submittedAt)
      : new Date()

    // Save to MongoDB
    await Booking.create({
      type: req.params.type,
      data,
      submittedAt,
    })

    // Return success
    res.status(201).json({ ok: true })

    // Email disabled
    // if (req.params.type === 'webinar') {
    //   sendWebinarConfirmation(data).catch((err) =>
    //     console.error('[mailer] send failed →', err.message)
    //   )
    // }
  } catch (e) {
    next(e)
  }
})
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