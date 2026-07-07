// Thin fetch client for the backend API. In dev, Vite proxies /api → the Express
// server (see vite.config.js). Override with VITE_API_URL for a hosted backend.
const BASE = import.meta.env.VITE_API_URL || '/api'

async function json(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}`)
  return res.status === 204 ? null : res.json()
}

// Webinar library
export const listWebinars = () => json('/webinars')
export const createWebinar = (w) => json('/webinars', { method: 'POST', body: JSON.stringify(w) })
export const removeWebinar = (id) =>
  json(`/webinars/${encodeURIComponent(id)}`, { method: 'DELETE' })

// Bookings (type = 'webinar' | 'aiLab')
export const listBookings = (type) => json(`/bookings/${type}`)
export const createBooking = (type, record) =>
  json(`/bookings/${type}`, { method: 'POST', body: JSON.stringify(record) })
export const clearBookings = (type) => json(`/bookings/${type}`, { method: 'DELETE' })
