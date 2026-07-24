import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { getWebinars, sessionDateLabel, sessionDaysCount } from '../data/webinarStore'
import { createBooking, listColleges, checkRegistration, getRegistration } from '../data/api'
import { regStatus, regStatusLabel, fmtIstLocal, fmtCountdown } from '../data/registration'
// PARKED (see commit e42ec41): OTP helpers — import { sendOtp, verifyOtp } from '../data/api'
import { bookingForms, emptyFormFor, validateForm } from '../data/bookingForms'
import { INDIAN_STATES, COURSES, YEAR_LEVELS } from '../data/formOptions'
import { STATE_CITIES } from '../data/indiaCities'
import { buildEvent, googleUrl, downloadICS } from '../data/calendar'
import { Arrow, Check, Close, Calendar, Users } from './Icons'
import { useOutsideClick } from '../hooks/useOutsideClick'
import { HeroHighlight } from './HeroHighlight'
import { MultiStepLoader } from './MultiStepLoader'
import logo from '../assets/darklogo.png'

const cfg = bookingForms.webinar

const REGISTER_STEPS = [
  { text: 'Validating your details' },
  { text: 'Reserving your spot' },
  { text: 'Saving your registration' },
  { text: 'Sending your confirmation' },
  { text: "You're all set!" },
]
const STEP_MS = 650

const FILTERS = [
  ['all', 'All sessions'],
  ['prev', 'Previous'],
  ['this', 'This month'],
  ['next', 'Next month'],
]

// {year, monthIndex} for a session from dateISO or its display date.
function sessionYM(w) {
  if (w.dateISO && /^\d{4}-\d{2}-\d{2}$/.test(w.dateISO)) {
    const [y, m] = w.dateISO.split('-').map(Number)
    return { y, m: m - 1 }
  }
  const d = new Date(w.date)
  return isNaN(d.getTime()) ? null : { y: d.getFullYear(), m: d.getMonth() }
}

// Poster: real image if provided, else a grey gradient with the session initial.
function PosterBg({ w, small }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        small ? 'bg-neutral-950' : 'bg-gradient-to-br from-neutral-800 via-neutral-900 to-black'
      }`}
    >
      {w.poster ? (
        <>
          <img
            src={w.poster}
            alt={w.title}
            className={`h-full w-full ${small ? 'object-contain' : 'object-cover'}`}
          />
          {!small && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />}
        </>
      ) : (
        <>
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <span
            className={`pointer-events-none absolute -bottom-6 -right-3 font-black leading-none text-white/10 ${
              small ? 'text-[6rem]' : 'text-[10rem]'
            }`}
          >
            {w.title.charAt(0)}
          </span>
        </>
      )}
      {!small && (
        <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-wider text-white backdrop-blur">
          {w.kind}
        </span>
      )}
    </div>
  )
}

/* ---------- Registration status ---------- */
// NOTE: seat counts ("X of 600 registered", spots left) are intentionally NOT
// shown to students on the public page — those live in the admin panel only.
// The cap is still enforced server-side; the public UI just shows open/closed.

// Live "closes in 2d 5h" countdown that ticks itself (re-renders only itself,
// not the page). `compact` renders inline text; otherwise a pill.
function CloseCountdown({ closeAtMs, compact = false, className = '' }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (closeAtMs == null) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [closeAtMs])
  if (closeAtMs == null) return null
  const left = closeAtMs - now
  const text = fmtCountdown(left)
  const urgent = left <= 6 * 3600000 // last 6 hours
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${urgent ? 'text-amber-300' : 'text-white/45'} ${className}`}>
        ⏳ Closes in {text}
      </span>
    )
  }
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        urgent ? 'bg-amber-500/15 text-amber-300 ring-amber-400/30' : 'bg-white/5 text-white/70 ring-white/10'
      } ${className}`}
    >
      ⏳ Registration closes in {text}
    </div>
  )
}

// Compact colored pill for a card corner — only shown when there's something
// worth flagging (closed, full, or opening later). No seat numbers (admin-only).
function statusBadge(status) {
  if (!status) return null
  if (status.state === 'full') return { label: 'Fully booked', cls: 'bg-red-500/25 text-red-200 ring-red-400/40' }
  if (status.state === 'disabled' || status.state === 'closed' || status.state === 'cutoff')
    return { label: 'Registration closed', cls: 'bg-neutral-500/25 text-neutral-200 ring-white/30' }
  if (status.state === 'scheduled') return { label: 'Opens soon', cls: 'bg-sky-500/25 text-sky-200 ring-sky-400/40' }
  return null
}

/* ---------- Registration form (inside the expanded card) ---------- */
function RegisterForm({ w, onDone }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', state: '', city: '', cityManual: false, college: '', collegeId: '',
    course: '', courseOther: '', year: '', mobile: '', email: '',
  })
  const [errors, setErrors] = useState({})
  const [sug, setSug] = useState([]) // college suggestions
  const [sugOpen, setSugOpen] = useState(false)
  const [dup, setDup] = useState({}) // { combo } — soft pre-submit warning (email+mobile)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  // Registration status — seeded from what the list already knows, then refreshed
  // with a live count the moment the form opens (so a stale cap can't overbook).
  const [regState, setRegState] = useState(() => regStatus(w))

  const set = (name, val) => setForm((f) => ({ ...f, [name]: val }))
  // PARKED (see commit e42ec41): email OTP verification — send code / verify / gate submit.

  useEffect(() => {
    let alive = true
    getRegistration(w.id)
      .then((s) => alive && setRegState(s))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [w.id])

  // Debounced college suggestions from names already in the database (skipped
  // once a suggestion is picked).
  useEffect(() => {
    if (form.collegeId || form.college.trim().length < 1) {
      setSug([])
      return
    }
    let alive = true
    const t = setTimeout(() => {
      listColleges({ q: form.college.trim() })
        .then((list) => alive && setSug(list))
        .catch(() => {})
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [form.college, form.collegeId])

  const pickCollege = (c) => {
    setForm((f) => ({ ...f, college: c.name, collegeId: c.id }))
    setSugOpen(false)
    setSug([])
  }

  // Warn early if this exact email+mobile combo already registered for this
  // webinar (the duplicate rule blocks only when BOTH match).
  const checkDup = async () => {
    if (!w.id) return
    try {
      const r = await checkRegistration({ webinarId: w.id, email: form.email, mobile: form.mobile })
      setDup({ combo: Boolean(r.taken) })
    } catch {
      /* ignore — this is only a hint; the server enforces on submit */
    }
  }

  const validate = (f) => {
    const e = {}
    if (!f.firstName.trim()) e.firstName = 'Required'
    else if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(f.firstName.trim())) e.firstName = 'Letters only'
    if (f.lastName.trim() && !/^[A-Za-z\s.'-]+$/.test(f.lastName.trim())) e.lastName = 'Letters only'
    if (!f.state.trim()) e.state = 'Select your state'
    if (!f.city.trim()) e.city = f.cityManual ? 'Enter your city' : 'Select your city'
    if (!f.college.trim()) e.college = 'Select your college'
    if (!f.course.trim()) e.course = 'Select your course'
    else if (f.course === 'Other' && !f.courseOther.trim()) e.courseOther = 'Enter your course'
    if (!f.year.trim()) e.year = 'Select your year'
    if (!/^[6-9]\d{9}$/.test(f.mobile.replace(/\D/g, '').slice(-10))) e.mobile = 'Valid 10-digit mobile (6–9)'
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(f.email.trim())) e.email = 'Valid email required'
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const record = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      state: form.state.trim(),
      city: form.city.trim(),
      cityManual: form.cityManual,
      course: form.course === 'Other' ? form.courseOther.trim() : form.course,
      courseChoice: form.course, // the dropdown pick ('Other' etc.) for server validation
      year: form.year.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.replace(/\D/g, '').slice(-10),
      college: form.college.trim(),
      webinar: w.title,
      webinarId: w.id,
      kind: w.kind,
      sessionDate: sessionDateLabel(w) || w.date,
      sessionDateISO: w.dateISO || '',
      sessionEndDateISO: w.endDateISO || '',
      sessionTime: w.time || '',
      startH: w.startH,
      startM: w.startM,
      ampm: w.ampm,
      duration: w.duration,
      presenter: w.presenter || '',
      role: w.role || '',
      description: w.description || '',
      location: w.link || 'Online',
      submittedAt: new Date().toISOString(),
    }
    setLoading(true)
    setSaveError('')
    // Run the multi-step loader for its full length while the request completes.
    const minRun = new Promise((r) => setTimeout(r, STEP_MS * REGISTER_STEPS.length))
    try {
      await Promise.all([createBooking('webinar', record), minRun])
      setLoading(false)
      setDone(true)
    } catch (err) {
      setLoading(false)
      if (err.body?.regClosed) {
        // Slot filled up or its window closed while the form was open.
        setSaveError(err.message)
        setRegState((s) => ({ ...s, open: false, state: err.body.state || 'closed', message: err.message }))
      } else if (err.status === 409) {
        setSaveError(err.message)
        setDup((d) => ({ ...d, combo: true }))
      } else if (err.status === 400 && err.body?.fields) {
        setErrors(err.body.fields)
        setSaveError('Please fix the highlighted fields.')
      } else {
        console.error('[register] save failed →', err)
        setSaveError('Could not register right now. Please try again in a moment.')
      }
    }
  }

  const inputCls = (bad) =>
    `w-full rounded-xl border bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-400/60 ${
      bad ? 'border-red-500/60' : 'border-white/10'
    }`

  if (done) {
    const event = buildEvent(w)
    return (
      <div className="px-6 pb-8 pt-2 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-white">You're registered!</h3>
        <p className="mt-2 text-sm text-white/60">
          Thanks, {form.firstName}. Your spot for <span className="text-white/80">{w.title}</span> is saved — a
          confirmation is on its way to {form.email}.
        </p>

        {/* session summary */}
        <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Calendar className="h-4 w-4 shrink-0 text-claude-400" />
            {sessionDateLabel(w)} · {(w.time || '').replace(/\s*IST/i, '')}
          </div>
          {w.link ? (
            <a
              href={w.link}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block truncate text-sm text-claude-300 hover:underline"
            >
              🔗 {w.link}
            </a>
          ) : (
            <p className="mt-2 text-xs text-white/45">The joining link will be emailed before the session.</p>
          )}
        </div>

        {/* add to calendar */}
        {event && (
          <div className="mt-4 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
            <a
              href={googleUrl(event)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              <Calendar className="h-4 w-4" />
              Add to Google Calendar
            </a>
            <button
              type="button"
              onClick={() => downloadICS(event, `${w.id || 'webinar'}.ics`)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/5"
            >
              Apple / Outlook (.ics)
            </button>
          </div>
        )}

        <button onClick={onDone} className="mt-5 text-sm font-semibold text-white/50 transition hover:text-white/80">
          Done
        </button>
      </div>
    )
  }

  // Registration is not open (turned off, full, past the 24h cutoff, or not open
  // yet) — show why instead of the form.
  if (!regState.open) {
    const isFull = regState.state === 'full'
    const isScheduled = regState.state === 'scheduled'
    return (
      <div className="px-6 pb-8 pt-2 text-center">
        <div
          className={`mx-auto grid h-12 w-12 place-items-center rounded-full ring-1 ${
            isFull ? 'bg-red-500/15 text-red-300 ring-red-500/30' : 'bg-white/5 text-white/60 ring-white/15'
          }`}
        >
          {isFull ? <Users className="h-6 w-6" /> : <Close className="h-6 w-6" />}
        </div>
        <h3 className="mt-4 text-xl font-bold text-white">
          {isFull ? 'This session is fully booked' : isScheduled ? 'Registration opens soon' : 'Registration is closed'}
        </h3>
        <p className="mt-2 text-sm text-white/60">
          {regState.message}
          {isScheduled && regState.opensAt ? ` Opens ${fmtIstLocal(regState.opensAt)} IST.` : ''}
        </p>
        <button onClick={onDone} className="mt-6 text-sm font-semibold text-white/50 transition hover:text-white/80">
          Done
        </button>
      </div>
    )
  }

  return (
    <>
      <MultiStepLoader loadingStates={REGISTER_STEPS} loading={loading} duration={STEP_MS} loop={false} />
      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-3.5 px-6 pb-8 pt-2 sm:grid-cols-2">
        {/* "lock your slot" urgency + close countdown (no seat numbers) */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:col-span-2">
          <p className="text-xs font-semibold text-brand-300">Register now to lock your slot.</p>
          {regState.closeAtMs != null && <CloseCountdown closeAtMs={regState.closeAtMs} compact className="text-xs font-semibold" />}
        </div>
        <p className="text-xs text-white/45 sm:col-span-2">All fields required unless marked optional.</p>

        <RField label="First name" bad={errors.firstName}>
          <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Jane" className={inputCls(errors.firstName)} />
        </RField>
        <RField label="Last name (optional)" bad={errors.lastName}>
          <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Doe" className={inputCls(errors.lastName)} />
        </RField>

        <RField label="State" bad={errors.state}>
          <SearchSelect
            value={form.state}
            onChange={(v) => setForm((f) => ({ ...f, state: v, city: '', cityManual: false }))}
            options={INDIAN_STATES}
            placeholder="Select your state"
            error={errors.state}
          />
        </RField>
        <RField label="City" bad={errors.city}>
          {form.cityManual ? (
            <input
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="Type your city"
              className={inputCls(errors.city)}
            />
          ) : (
            <SearchSelect
              value={form.city}
              onChange={(v) => set('city', v)}
              options={STATE_CITIES[form.state] || []}
              placeholder={form.state ? 'Select your city' : 'Pick a state first'}
              disabled={!form.state}
              error={errors.city}
            />
          )}
          {form.state && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, cityManual: !f.cityManual, city: '' }))}
              className="mt-1 text-xs font-medium text-brand-300 transition hover:text-brand-200"
            >
              {form.cityManual ? '← Choose from the list instead' : "Can't find your city? Enter it manually"}
            </button>
          )}
        </RField>

        <div className="relative sm:col-span-2">
          <RField label="College / Organization" bad={errors.college}>
            <input
              value={form.college}
              onChange={(e) => {
                set('college', e.target.value)
                set('collegeId', '')
                setSugOpen(true)
              }}
              onFocus={() => setSugOpen(true)}
              onBlur={() => setTimeout(() => setSugOpen(false), 150)}
              placeholder="Start typing your college…"
              className={inputCls(errors.college)}
            />
          </RField>
          {sugOpen && form.college.trim() && !form.collegeId && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-neutral-900 p-1 shadow-xl">
              {sug.length ? (
                sug.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onMouseDown={() => pickCollege(c)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/80 hover:bg-white/5"
                  >
                    <span className="truncate">{c.name}</span>
                    {c.count > 1 && <span className="shrink-0 text-white/35">{c.count}×</span>}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-white/40">
                  No match — we’ll add “{form.college.trim()}” as a new college.
                </p>
              )}
            </div>
          )}
        </div>

        <RField label="Course / Program" bad={errors.course}>
          <SearchSelect
            value={form.course}
            onChange={(v) => set('course', v)}
            options={COURSES}
            placeholder="Select your course"
            error={errors.course}
          />
        </RField>
        <RField label="Year of study" bad={errors.year}>
          <SearchSelect
            value={form.year}
            onChange={(v) => set('year', v)}
            options={YEAR_LEVELS}
            placeholder="Select your year"
            error={errors.year}
          />
        </RField>
        {form.course === 'Other' && (
          <RField label="Your course (please specify)" bad={errors.courseOther} full>
            <input
              value={form.courseOther}
              onChange={(e) => set('courseOther', e.target.value)}
              placeholder="e.g. B.Voc Software Development"
              className={inputCls(errors.courseOther)}
            />
          </RField>
        )}

        <RField label="Mobile" bad={errors.mobile}>
          <input
            value={form.mobile}
            onChange={(e) => set('mobile', e.target.value)}
            onBlur={checkDup}
            placeholder="9876543210"
            inputMode="numeric"
            className={inputCls(errors.mobile)}
          />
        </RField>

        <RField label="Email" bad={errors.email} full>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={checkDup}
            placeholder="jane@college.edu"
            className={inputCls(errors.email)}
          />
          {dup.combo && !errors.email && (
            <p className="mt-1 text-xs text-amber-400">This email + mobile is already registered for this webinar.</p>
          )}
          {/* PARKED (see commit e42ec41): email OTP verify — send code / enter code / verified */}
        </RField>

        {saveError && <p className="text-sm text-red-400 sm:col-span-2">{saveError}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60 sm:col-span-2"
        >
          Confirm Registration
          <Arrow className="h-4 w-4" />
        </button>
      </form>
    </>
  )
}

function RField({ label, bad, full, children }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1 block text-xs font-semibold text-white/70">{label}</label>
      {children}
      {typeof bad === 'string' && <p className="mt-1 text-xs text-red-400">{bad}</p>}
    </div>
  )
}

// Searchable dropdown constrained to a fixed list — you can type to filter, but
// a value only commits by picking an option (so no free-text variants sneak in).
function SearchSelect({ value, onChange, options, placeholder, disabled, error }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options

  const cls = `w-full rounded-xl border bg-white/[0.04] px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400/60 ${
    error ? 'border-red-500/60' : 'border-white/10'
  } ${open || value ? 'text-white' : 'text-white/40'} disabled:opacity-50`

  return (
    <div className="relative" ref={ref}>
      <input
        value={open ? query : value}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          if (!disabled) {
            setOpen(true)
            setQuery('')
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={cls}
      />
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-neutral-900 p-1 shadow-xl">
          {filtered.length ? (
            filtered.map((o) => (
              <button
                type="button"
                key={o}
                onMouseDown={() => {
                  onChange(o)
                  setOpen(false)
                  setQuery('')
                }}
                className={`block w-full truncate rounded-lg px-3 py-2 text-left text-xs hover:bg-white/5 ${
                  o === value ? 'text-brand-300' : 'text-white/80'
                }`}
              >
                {o}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-white/40">No match</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- Page ---------- */
export default function WebinarsPage() {
  const [active, setActive] = useState(null) // selected webinar or null
  const [stage, setStage] = useState('detail') // detail | register
  const [sessions, setSessions] = useState([])
  const [hovered, setHovered] = useState(null) // card being hovered (spotlight)
  const [filter, setFilter] = useState('all')
  const ref = useRef(null)

  const close = () => setActive(null)

  useEffect(() => {
    let alive = true
    getWebinars().then((list) => alive && setSessions(list))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close()
    document.body.style.overflow = active ? 'hidden' : 'auto'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = 'auto'
    }
  }, [active])

  useOutsideClick(ref, close)

  const open = (w) => {
    setStage('detail')
    setActive(w)
  }

  // Bucket sessions into prev / this / next month relative to today.
  const now = new Date()
  const cy = now.getFullYear()
  const cm = now.getMonth()
  const nm = cm === 11 ? 0 : cm + 1
  const nmy = cm === 11 ? cy + 1 : cy
  const bucketOf = (w) => {
    const ym = sessionYM(w)
    if (!ym) return 'other'
    if (ym.y < cy || (ym.y === cy && ym.m < cm)) return 'prev'
    if (ym.y === cy && ym.m === cm) return 'this'
    if (ym.y === nmy && ym.m === nm) return 'next'
    return 'other'
  }
  const counts = { all: sessions.length, prev: 0, this: 0, next: 0 }
  sessions.forEach((w) => {
    const b = bucketOf(w)
    if (counts[b] !== undefined) counts[b] += 1
  })
  const filtered = filter === 'all' ? sessions : sessions.filter((w) => bucketOf(w) === filter)

  // Registration status for the currently-open session (detail/register modal).
  const activeStatus = active ? regStatus(active) : null

  return (
    <HeroHighlight containerClassName="min-h-screen overflow-hidden bg-black text-white">
      {/* decorative glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[8%] h-96 w-96 rounded-full bg-claude-500/10 blur-[150px]" />
        <div className="absolute right-[-8%] top-[35%] h-[28rem] w-[28rem] rounded-full bg-brand-500/10 blur-[160px]" />
      </div>

      {/* top bar */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="flex w-full items-center justify-between px-6 py-4 sm:px-10 lg:px-16 xl:px-24">
          <button
            onClick={() => (window.location.hash = '')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
          >
            <Arrow className="h-4 w-4 -scale-x-100" />
            Back to site
          </button>
          <img src={logo} alt="Technical Hub" className="h-7 w-auto sm:h-8" />
        </div>
      </div>

      {/* header + grid */}
      <div className="relative z-10 w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 xl:px-24">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          {/* left: heading */}
          <div className={`transition-all duration-300 ${hovered ? 'opacity-30 blur-[2px]' : ''}`}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-white/70 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-claude-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-claude-500" />
                </span>
                Live &amp; Upcoming
              </span>
              <span className="text-sm text-white/40">{sessions.length} sessions · Free to join · Online</span>
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight text-brand-300 sm:text-6xl lg:text-7xl">
              Webinars &amp; workshops from the{' '}
              <span className="bg-gradient-to-r from-claude-300 via-claude-400 to-claude-500 bg-clip-text text-transparent">
                Claude Architects
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/55">
              Live sessions on Claude — from classroom foundations to full-day build workshops. Tap a card to see the
              details and grab your spot.
            </p>
          </div>

          {/* right: date filters */}
          <div className={`w-full shrink-0 transition-all duration-300 lg:w-[290px] ${hovered ? 'opacity-30 blur-[2px]' : ''}`}>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">Filter by date</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {FILTERS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left backdrop-blur-md transition-all ${
                    filter === k
                      ? 'border-claude-400/50 bg-claude-500/10 shadow-lg shadow-claude-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className={`text-base font-semibold ${filter === k ? 'text-white' : 'text-white/80'}`}>
                    {label}
                  </span>
                  <span
                    className={`ml-3 rounded-full px-2.5 py-1 text-xs font-bold ${
                      filter === k ? 'bg-claude-500 text-white' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {counts[k]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 h-px w-full bg-gradient-to-r from-white/15 via-white/5 to-transparent" />

        {filtered.length === 0 && (
          <p className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] py-16 text-center text-white/40">
            No sessions in this range.
          </p>
        )}

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((w) => {
            const st = regStatus(w)
            const badge = statusBadge(st)
            const days = sessionDaysCount(w)
            return (
            <motion.div
              layoutId={`card-${w.id}`}
              key={w.id}
              onMouseEnter={() => setHovered(w.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => {
                setHovered(null)
                open(w)
              }}
              className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border backdrop-blur-md transition-all duration-300 ${
                hovered === w.id
                  ? 'z-10 -translate-y-1 scale-[1.03] border-claude-400/50 bg-neutral-900/40 shadow-[0_0_60px_-8px_rgba(217,119,87,0.55)] ring-1 ring-claude-400/40'
                  : hovered
                    ? 'scale-[0.98] border-white/10 bg-neutral-900/60 opacity-30 blur-[2px]'
                    : 'border-white/10 bg-neutral-900/60 hover:border-white/25'
              }`}
            >
              <motion.div layoutId={`image-${w.id}`} className="relative aspect-video w-full">
                <PosterBg w={w} />
                {badge && (
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide ring-1 backdrop-blur ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                )}
                {days > 1 && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wide text-white ring-1 ring-white/15 backdrop-blur">
                    {days} days
                  </span>
                )}
              </motion.div>
              <div className="flex flex-1 flex-col p-5">
                <motion.h3 layoutId={`title-${w.id}`} className="text-lg font-bold leading-snug text-white">
                  {w.title}
                </motion.h3>
                <motion.p layoutId={`desc-${w.id}`} className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-white/50">
                  {w.description}
                </motion.p>
                {/* Open sessions get a live countdown; the rest show their status. No seat counts (admin-only). */}
                {st.open ? (
                  st.closeAtMs != null && (
                    <CloseCountdown closeAtMs={st.closeAtMs} compact className="mt-4 text-[0.7rem]" />
                  )
                ) : (
                  <p className="mt-4 text-[0.7rem] font-semibold text-white/45">
                    {regStatusLabel(st)}
                    {st.state === 'scheduled' && st.opensAt ? ` · opens ${fmtIstLocal(st.opensAt)}` : ''}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                  <span className="text-white/70">{w.presenter}</span>
                  <span className="flex items-center gap-1.5 text-white/45 transition-colors group-hover:text-claude-400">
                    {sessionDateLabel(w)}
                    <Arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </motion.div>
            )
          })}
        </ul>

        {/* bottom CTA band */}
        {/* <div
          className={`relative mt-14 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-8 transition-all duration-300 sm:p-12 ${
            hovered ? 'opacity-30 blur-[2px]' : ''
          }`}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-claude-500/10 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-bold text-white sm:text-3xl">Don't see the right session?</h3>
              <p className="mt-2 max-w-lg text-white/55">
                We run private webinars and workshops for institutions and teams — tailored to your goals and schedule.
              </p>
            </div>
            <a
              href="mailto:babji@technicalhub.io"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:-translate-y-0.5"
            >
              Request a private session
              <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div> */}
      </div>

      {/* backdrop */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 h-full w-full bg-black/70 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* expanded card */}
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <motion.div
              layoutId={`card-${active.id}`}
              ref={ref}
              className="relative flex max-h-[92vh] w-full max-w-[860px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950"
            >
              {/* close */}
              <button
                onClick={close}
                className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
              >
                <Close className="h-4 w-4" />
              </button>

              {/* poster — only in the detail view; the register step is just info + form */}
              {stage === 'detail' && (
                <motion.div
                  layoutId={`image-${active.id}`}
                  className="aspect-video w-full shrink-0"
                >
                  <PosterBg w={active} />
                </motion.div>
              )}

              <div className="flex min-h-0 flex-col overflow-y-auto">
                {/* header */}
                <div className="flex items-start justify-between gap-4 p-6 pb-3">
                  <div className="min-w-0">
                    <motion.h3 layoutId={`title-${active.id}`} className="text-xl font-bold text-white">
                      {active.title}
                    </motion.h3>
                    <motion.p layoutId={`desc-${active.id}`} className="mt-1 text-sm text-white/55">
                      {active.presenter} · {sessionDateLabel(active)}
                    </motion.p>
                  </div>
                  {stage === 'detail' &&
                    (activeStatus?.open ? (
                      <button
                        onClick={() => setStage('register')}
                        className="shrink-0 whitespace-nowrap rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                      >
                        Register
                      </button>
                    ) : (
                      <span className="shrink-0 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/50">
                        {regStatusLabel(activeStatus)}
                      </span>
                    ))}
                </div>

                {/* stage content */}
                <AnimatePresence mode="wait">
                  {stage === 'detail' ? (
                    <motion.div
                      key="detail"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-6 pb-8"
                    >
                      <p className="text-sm leading-relaxed text-white/65">{active.description}</p>
                      <div className="mt-5 flex flex-wrap items-start justify-between gap-x-8 gap-y-3 border-t border-white/10 pt-4 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-white/40">Hosted by</p>
                          <p className="mt-0.5 font-semibold text-white">{active.presenter}</p>
                          <p className="text-white/50">{active.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-white/40">When</p>
                          <p className="mt-0.5 flex items-center justify-end gap-1.5 font-semibold text-white">
                            <Calendar className="h-4 w-4 text-claude-400" />
                            {sessionDateLabel(active)}
                          </p>
                          <p className="text-white/50">
                            {active.time.replace(/\s*IST/i, '')}
                            {sessionDaysCount(active) > 1 ? ` · ${sessionDaysCount(active)} days` : ''}
                          </p>
                        </div>
                      </div>
                      {/* Seat counts are admin-only — not shown here. */}
                      {activeStatus?.open ? (
                        <>
                          <button
                            onClick={() => setStage('register')}
                            className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                          >
                            Register now to lock your slot
                            <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </button>
                          <div className="mt-3 flex flex-col items-center gap-1.5">
                            {activeStatus.closeAtMs != null && <CloseCountdown closeAtMs={activeStatus.closeAtMs} />}
                            <p className="text-center text-xs text-white/40">
                              Registration closes {activeStatus.closeHoursBefore} hours before the session starts.
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="mt-4">
                          <div className="w-full cursor-not-allowed rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-center text-sm font-bold text-white/50">
                            {regStatusLabel(activeStatus)}
                          </div>
                          <p className="mt-2 text-center text-xs text-white/45">
                            {activeStatus?.message}
                            {activeStatus?.state === 'scheduled' && activeStatus.opensAt
                              ? ` Opens ${fmtIstLocal(activeStatus.opensAt)} IST.`
                              : ''}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <RegisterForm w={active} onDone={close} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </HeroHighlight>
  )
}
