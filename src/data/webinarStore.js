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
