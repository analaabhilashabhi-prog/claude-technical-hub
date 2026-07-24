// Thin fetch client for the backend API. In dev, Vite proxies /api → the Express
// server (see vite.config.js). Override with VITE_API_URL for a hosted backend.
const BASE = import.meta.env.VITE_API_URL || '/api'

// Admin session token — kept in MEMORY ONLY (not localStorage/sessionStorage).
// The session ends the moment the page unloads, so closing the tab, refreshing,
// or navigating away all require a fresh login. This is intentional for admin.
let adminToken = null
export const getAdminToken = () => adminToken
export const setAdminToken = (t) => {
  adminToken = t
}
export const clearAdminToken = () => {
  adminToken = null
}

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
    // Surface the server's error body (message + field info) so callers can
    // show friendly, specific messages (e.g. "email already registered").
    let body = null
    try {
      body = await res.json()
    } catch {
      /* no JSON body */
    }
    const err = new Error(body?.error || `${opts.method || 'GET'} ${path} → ${res.status}`)
    err.status = res.status
    err.body = body
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

// Popup notifications
// Public: active popups the live site should show.
export const listPopups = () => json('/popups')
// Admin: save/activate/turn off a webinar's popup config.
export const savePopup = (id, popup) =>
  json(`/webinars/${encodeURIComponent(id)}/popup`, {
    method: 'PUT',
    body: JSON.stringify(popup),
  })

// Registration windows / seat caps
// Admin: turn registration on/off, set the seat cap, the "close N hours before"
// cutoff, and optional scheduled open/close times.
export const saveRegistration = (id, cfg) =>
  json(`/webinars/${encodeURIComponent(id)}/registration`, {
    method: 'PUT',
    body: JSON.stringify(cfg),
  })
// Public: fresh registration status + live seat count for one webinar.
export const getRegistration = (id) => json(`/webinars/${encodeURIComponent(id)}/registration`)

// Bookings (type = 'webinar' | 'aiLab')
export const listBookings = (type) => json(`/bookings/${type}`)
export const createBooking = (type, record) =>
  json(`/bookings/${type}`, { method: 'POST', body: JSON.stringify(record) })
export const clearBookings = (type) => json(`/bookings/${type}`, { method: 'DELETE' })

// Colleges (canonical master) — typeahead suggestions for the register form.
const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
  return s ? `?${s}` : ''
}
export const listColleges = (params = {}) => json(`/colleges${qs(params)}`)

// Has this email/mobile already registered for the webinar? (pre-submit warning)
export const checkRegistration = (params = {}) => json(`/bookings/webinar/check${qs(params)}`)

// Email OTP verification (PARKED on the form for now, kept for re-enabling)
export const sendOtp = (email) => json('/otp/send', { method: 'POST', body: JSON.stringify({ email }) })
export const verifyOtp = (email, otp) => json('/otp/verify', { method: 'POST', body: JSON.stringify({ email, otp }) })

// Admin data cleanup — organization name merge (reversible)
export const listOrgNames = () => json('/admin/org-names')
export const mergeOrgs = (names, target) =>
  json('/admin/merge-orgs', { method: 'POST', body: JSON.stringify({ names, target }) })
export const listMergeLogs = () => json('/admin/merge-logs')
export const undoMerge = (logId) =>
  json('/admin/merge-orgs/undo', { method: 'POST', body: JSON.stringify({ logId }) })