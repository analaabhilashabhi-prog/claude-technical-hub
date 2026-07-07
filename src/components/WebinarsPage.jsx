import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { getWebinars } from '../data/webinarStore'
import { createBooking } from '../data/api'
import { bookingForms, emptyFormFor, validateForm } from '../data/bookingForms'
import { Arrow, Check, Close, Calendar } from './Icons'
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

// Poster: real image if provided, else a grey gradient with the session initial.
function PosterBg({ w, small }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-neutral-800 via-neutral-900 to-black">
      {w.poster ? (
        <>
          <img src={w.poster} alt={w.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
      <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-wider text-white backdrop-blur">
        {w.kind}
      </span>
    </div>
  )
}

/* ---------- Registration form (inside the expanded card) ---------- */
function RegisterForm({ w, onDone }) {
  const [form, setForm] = useState(() => emptyFormFor(cfg))
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState('')

  const set = (name, val) => setForm((f) => ({ ...f, [name]: val }))

  const submit = async (e) => {
    e.preventDefault()
    const errs = validateForm(cfg, form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const record = {
      ...form,
      webinar: w.title,
      kind: w.kind,
      sessionDate: w.date,
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
      console.error('[register] save failed →', err)
      setLoading(false)
      setSaveError('Could not register right now. Please try again in a moment.')
    }
  }

  if (done) {
    return (
      <div className="px-6 pb-8 pt-2 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-white">You're registered!</h3>
        <p className="mt-2 text-sm text-white/60">
          Thanks, {form.firstName}. Your spot for {w.title} is saved — we'll email {form.email} to confirm.
        </p>
        <button
          onClick={onDone}
          className="mt-5 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/5"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <>
    <MultiStepLoader loadingStates={REGISTER_STEPS} loading={loading} duration={STEP_MS} loop={false} />
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-3.5 px-6 pb-8 pt-2 sm:grid-cols-2">
      <p className="text-sm text-white/55 sm:col-span-2">All fields are required.</p>
      {cfg.fields.map((f) => (
        <div key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
          <label htmlFor={f.name} className="mb-1 block text-xs font-semibold text-white/70">
            {f.label}
          </label>
          <input
            id={f.name}
            type={f.type}
            autoComplete={f.autoComplete}
            placeholder={f.placeholder}
            value={form[f.name]}
            onChange={(e) => set(f.name, e.target.value)}
            className={`w-full rounded-xl border bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-400/60 ${
              errors[f.name] ? 'border-red-500/60' : 'border-white/10'
            }`}
          />
          {errors[f.name] && <p className="mt-1 text-xs text-red-400">{errors[f.name]}</p>}
        </div>
      ))}
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

/* ---------- Page ---------- */
export default function WebinarsPage() {
  const [active, setActive] = useState(null) // selected webinar or null
  const [stage, setStage] = useState('detail') // detail | register
  const [sessions, setSessions] = useState([])
  const [hovered, setHovered] = useState(null) // card being hovered (spotlight)
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
        <div className={`transition-all duration-300 ${hovered ? 'opacity-30 blur-[2px]' : ''}`}>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-white/70 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-claude-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-claude-500" />
            </span>
            Live &amp; Upcoming
          </span>
          <span className="text-sm text-white/40">
            {sessions.length} sessions · Free to join · Online
          </span>
        </div>

        <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Webinars &amp; workshops from the{' '}
          <span className="bg-gradient-to-r from-claude-300 via-claude-400 to-claude-500 bg-clip-text text-transparent">
            Claude Architects
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-white/55">
          Live sessions on Claude — from classroom foundations to full-day build workshops. Tap a card to see the
          details and grab your spot.
        </p>
        <div className="mt-8 h-px w-full bg-gradient-to-r from-white/15 via-white/5 to-transparent" />
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sessions.map((w) => (
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
              <motion.div layoutId={`image-${w.id}`} className="aspect-[5/4] w-full">
                <PosterBg w={w} />
              </motion.div>
              <div className="flex flex-1 flex-col p-5">
                <motion.h3 layoutId={`title-${w.id}`} className="text-lg font-bold leading-snug text-white">
                  {w.title}
                </motion.h3>
                <motion.p layoutId={`desc-${w.id}`} className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-white/50">
                  {w.description}
                </motion.p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                  <span className="text-white/70">{w.presenter}</span>
                  <span className="flex items-center gap-1.5 text-white/45 transition-colors group-hover:text-claude-400">
                    {w.date}
                    <Arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </ul>

        {/* bottom CTA band */}
        <div
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
              href="mailto:contact@technicalhub.io"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:-translate-y-0.5"
            >
              Request a private session
              <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
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
              className="relative flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950"
            >
              {/* close */}
              <button
                onClick={close}
                className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
              >
                <Close className="h-4 w-4" />
              </button>

              {/* poster (shrinks in register stage) */}
              <motion.div
                layoutId={`image-${active.id}`}
                animate={{ height: stage === 'register' ? 150 : 260 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full shrink-0"
              >
                <PosterBg w={active} small={stage === 'register'} />
              </motion.div>

              <div className="flex min-h-0 flex-col overflow-y-auto">
                {/* header */}
                <div className="flex items-start justify-between gap-4 p-6 pb-3">
                  <div className="min-w-0">
                    <motion.h3 layoutId={`title-${active.id}`} className="text-xl font-bold text-white">
                      {active.title}
                    </motion.h3>
                    <motion.p layoutId={`desc-${active.id}`} className="mt-1 text-sm text-white/55">
                      {active.presenter} · {active.date}
                    </motion.p>
                  </div>
                  {stage === 'detail' && (
                    <button
                      onClick={() => setStage('register')}
                      className="shrink-0 whitespace-nowrap rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                    >
                      Register
                    </button>
                  )}
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
                      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-4 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-white/40">Presenter</p>
                          <p className="mt-0.5 font-semibold text-white">{active.presenter}</p>
                          <p className="text-white/50">{active.role}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-white/40">When</p>
                          <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-white">
                            <Calendar className="h-4 w-4 text-claude-400" />
                            {active.date}
                          </p>
                          <p className="text-white/50">{active.time}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setStage('register')}
                        className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                      >
                        Register for this {active.kind}
                        <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
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
