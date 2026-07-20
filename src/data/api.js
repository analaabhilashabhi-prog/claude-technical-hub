// Thin fetch client for the backend API. In dev, Vite proxies /api → the Express
// server (see vite.config.js). Override with VITE_API_URL for a hosted backend.
const BASE = import.meta.env.VITE_API_URL || '/api'

// Admin session token, kept in localStorage so a refresh doesn't log you out.
const TOKEN_KEY = 'th_admin_token'
export const getAdminToken = () => localStorage.getItem(TOKEN_KEY)
export const setAdminToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearAdminToken = () => localStorage.removeItem(TOKEN_KEY)

async function json(path, opts = {}) {
  const token = getAdminToken()
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(BASE + path, { ...opts, headers })

  if (res.status === 401) {
    clearAdminToken()
    const err = new Error('Not authenticated')
    err.status = 401
    throw err
  }
  if (!res.ok) {
    const err = new Error(`${opts.method || 'GET'} ${path} → ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.status === 204 ? null : res.json()
}

// Admin login — returns { token }.
export const adminLogin = (username, password) =>
  json('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) })

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