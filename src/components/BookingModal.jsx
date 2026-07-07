import { useEffect, useState } from 'react'
import { useBooking } from '../context/BookingContext'
import { bookingForms, emptyFormFor, validateForm } from '../data/bookingForms'
import { createBooking } from '../data/api'
import { Close, Check } from './Icons'
import { HeroHighlight } from './HeroHighlight'
import { MultiStepLoader } from './MultiStepLoader'

// Multi-step loader copy per flow.
const LOADER_STEPS = {
  webinar: [
    { text: 'Validating your details' },
    { text: 'Reserving your slot' },
    { text: 'Saving your request' },
    { text: 'Sending your confirmation' },
    { text: "You're all set!" },
  ],
  aiLab: [
    { text: 'Reviewing your organization details' },
    { text: 'Matching your lab requirements' },
    { text: 'Notifying our solutions team' },
    { text: 'Preparing your proposal' },
    { text: 'Request received!' },
  ],
}
const STEP_MS = 650

export default function BookingModal() {
  const { type, closeBooking } = useBooking()
  const cfg = type ? bookingForms[type] : null

  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Reset whenever the booking type changes + lock body scroll while open.
  useEffect(() => {
    if (cfg) {
      setForm(emptyFormFor(cfg))
      setErrors({})
      setTouched({})
      setDone(false)
      setSaveError('')
      setSubmitting(false)
      setLoading(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [cfg])

  // Close on Escape.
  useEffect(() => {
    if (!cfg) return
    const onKey = (e) => e.key === 'Escape' && closeBooking()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cfg, closeBooking])

  if (!cfg) return null

  const update = (e) => {
    const { name, value } = e.target
    const next = { ...form, [name]: value }
    setForm(next)
    if (touched[name]) setErrors(validateForm(cfg, next))
  }

  const onBlur = (e) => {
    const { name } = e.target
    setTouched((t) => ({ ...t, [name]: true }))
    setErrors(validateForm(cfg, form))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const errs = validateForm(cfg, form)
    setErrors(errs)
    setTouched(cfg.fields.reduce((a, f) => ({ ...a, [f.name]: true }), {}))
    if (Object.keys(errs).length > 0) return

    const record = { ...form }
    cfg.fields.forEach((f) => {
      if (typeof record[f.name] === 'string') record[f.name] = record[f.name].trim()
    })
    record.type = cfg.id
    record.submittedAt = new Date().toISOString()

    const steps = LOADER_STEPS[cfg.id] || LOADER_STEPS.webinar
    setSubmitting(true)
    setLoading(true)
    setSaveError('')
    // Let the multi-step loader play through while the request completes.
    const minRun = new Promise((r) => setTimeout(r, STEP_MS * steps.length))
    try {
      await Promise.all([createBooking(cfg.id, record), minRun])
      setLoading(false)
      setDone(true)
    } catch (err) {
      console.error(`[Booking:${cfg.id}] save failed →`, err)
      setLoading(false)
      setSaveError('Could not submit right now. Please try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  const HeaderIcon = cfg.icon

  return (
    <>
    <MultiStepLoader
      loadingStates={LOADER_STEPS[cfg.id] || LOADER_STEPS.webinar}
      loading={loading}
      duration={STEP_MS}
      loop={false}
    />
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-[fadeUp_0.25s_ease-out]"
        onClick={closeBooking}
      />

      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl animate-fadeUp">
       <HeroHighlight containerClassName="min-h-full" radius={200}>
        <button
          type="button"
          onClick={closeBooking}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Close width={20} height={20} />
        </button>

        {done ? (
          <div className="px-6 py-14 sm:px-10 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20">
              <Check width={32} height={32} />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-white">{cfg.successTitle}</h3>
            <p className="mt-2 text-sm text-white/60">{cfg.successText(form)}</p>
            <button
              type="button"
              onClick={closeBooking}
              className="mt-8 inline-flex items-center rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-0.5"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 pt-7 pb-5 sm:px-10 sm:pt-9">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-claude-500/10 text-claude-400 ring-1 ring-claude-500/20">
                  <HeaderIcon width={24} height={24} />
                </div>
                <div>
                  <h3 id="booking-title" className="text-xl sm:text-2xl font-bold text-white">
                    {cfg.title}
                  </h3>
                  <p className="text-sm text-white/50">{cfg.subtitle}</p>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} noValidate className="px-6 pb-8 sm:px-10 sm:pb-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cfg.fields.map((field) => (
                  <Field
                    key={field.name}
                    field={field}
                    value={form[field.name] ?? ''}
                    error={touched[field.name] && errors[field.name]}
                    onChange={update}
                    onBlur={onBlur}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-brand-400/40 active:scale-[0.99] disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : cfg.submitLabel}
              </button>
              {saveError && <p className="mt-3 text-center text-xs text-claude-400">{saveError}</p>}
              <p className="mt-3 text-center text-xs text-white/40">
                We'll never share your details. You'll get a confirmation by email.
              </p>
            </form>
          </>
        )}
       </HeroHighlight>
      </div>
    </div>
    </>
  )
}

function Field({ field, value, error, onChange, onBlur }) {
  const Icon = field.icon
  const isTextarea = field.type === 'textarea'
  const isSelect = field.type === 'select'

  const inputClass = `w-full rounded-xl border bg-white/[0.04] backdrop-blur-md pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:bg-white/[0.07] focus:ring-2 ${
    error
      ? 'border-claude-500/60 focus:border-claude-500 focus:ring-claude-500/30'
      : 'border-white/10 focus:border-brand-400/70 focus:ring-brand-500/25'
  }`

  return (
    <div className={field.full ? 'sm:col-span-2' : ''}>
      <label htmlFor={field.name} className="mb-1.5 block text-sm font-semibold text-white/90">
        {field.label}{' '}
        {field.required ? (
          <span className="text-claude-400">*</span>
        ) : (
          <span className="text-white/40 font-normal">(optional)</span>
        )}
      </label>
      <div className="relative">
        <span
          className={`pointer-events-none absolute left-3.5 text-white/40 ${
            isTextarea ? 'top-3.5' : 'top-1/2 -translate-y-1/2'
          }`}
        >
          {Icon && <Icon width={18} height={18} />}
        </span>

        {isTextarea ? (
          <textarea
            id={field.name}
            name={field.name}
            rows={3}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={field.placeholder}
            aria-invalid={!!error}
            className={`${inputClass} resize-none`}
          />
        ) : isSelect ? (
          <select
            id={field.name}
            name={field.name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={!!error}
            className={`${inputClass} appearance-none ${value ? '' : 'text-white/40'}`}
          >
            <option value="" disabled className="text-black">
              Select…
            </option>
            {field.options.map((opt) => (
              <option key={opt} value={opt} className="text-black">
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={field.placeholder}
            aria-invalid={!!error}
            className={inputClass}
          />
        )}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-claude-400">{error}</p>}
    </div>
  )
}
