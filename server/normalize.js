// Normalization helpers — the single source of truth for turning messy,
// free-typed input into stable keys. Used by the registration endpoint so
// duplicate detection and canonical colleges are reliable no matter how a
// value was typed. Mirror any change here in the frontend's light-touch
// normalization (src/data/normalize.js) so the UX preview matches the server.

// Collapse whitespace, strip zero-width/control chars, trim.
export function cleanText(v) {
  return String(v ?? '')
    .replace(/[​-‍﻿]/g, '') // zero-width chars
    .replace(/\s+/g, ' ')
    .trim()
}

// Canonical email for dedup: lowercase, strip +suffix, and (for Gmail) drop the
// dots that Gmail ignores — so john.smith+webinar@gmail.com == johnsmith@gmail.com.
export function canonicalEmail(raw) {
  const e = String(raw ?? '').trim().toLowerCase()
  const at = e.indexOf('@')
  if (at < 0) return e
  let local = e.slice(0, at)
  let domain = e.slice(at + 1)
  local = local.split('+')[0]
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '')
    domain = 'gmail.com'
  }
  return local && domain ? `${local}@${domain}` : e
}

// Indian mobile → bare 10 digits. Strips spaces/dashes/+, a leading 91 country
// code, or a leading 0, then keeps the last 10 digits.
export function normalizeMobile(raw) {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2)
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d.slice(-10)
}

// Canonical key for a college (name + city + state), punctuation/case-insensitive,
// so "Y.C.C.E", "ycce" and "YCCE " collapse to the same key within a location.
export function collegeKey(name, city, state) {
  const norm = (s) =>
    cleanText(s)
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  return `${norm(name)}|${norm(city)}|${norm(state)}`
}

// Validation (server-authoritative — never trust the client).
export const isValidEmail = (e) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(e ?? '').trim())
export const isValidMobile = (m) => /^[6-9]\d{9}$/.test(normalizeMobile(m))
export const isValidName = (n) => /^[A-Za-z][A-Za-z\s.'-]*$/.test(cleanText(n))
