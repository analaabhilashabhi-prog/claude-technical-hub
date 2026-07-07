import { useState } from 'react'
import { contactDetails } from '../data/mockData'
import { iconMap } from './Icons'
import Reveal from './Reveal'
import ScrollFloat from './ScrollFloat'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    // mock submit — no backend
    setSent(true)
    setForm({ name: '', email: '', message: '' })
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <section id="contact" className="relative overflow-hidden bg-black py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-claude-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-block rounded-full bg-white/5 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-white ring-1 ring-white/15 backdrop-blur">
              Say Hello
            </span>
          </Reveal>
          <ScrollFloat
            containerClassName="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-center"
            stagger={0.03}
          >
            Get In Touch
          </ScrollFloat>
          <Reveal delay={160}>
            <p className="mt-4 text-base leading-relaxed text-white/55">
              Have a program, product, or partnership in mind? We'd love to hear from you.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 via-claude-500 to-claude-400" />
          </Reveal>
        </div>

        <div className="mt-14">
          {/* Contact info — 2 per row */}
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
            {contactDetails.map((c, i) => {
              const Icon = iconMap[c.icon]
              const coral = i % 2 === 1
              const inner = (
                <div
                  className={`flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.05] ${
                    coral ? 'hover:border-claude-500/40' : 'hover:border-brand-500/40'
                  }`}
                >
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ${
                      coral ? 'bg-claude-500/10 text-claude-400 ring-claude-500/20' : 'bg-brand-500/10 text-brand-300 ring-brand-500/20'
                    }`}
                  >
                    {Icon && <Icon width={22} height={22} />}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        coral ? 'text-claude-400' : 'text-brand-300'
                      }`}
                    >
                      {c.label}
                    </p>
                    <p className="mt-0.5 break-words font-medium text-white">{c.value}</p>
                  </div>
                </div>
              )
              return (
                <Reveal key={c.id} delay={i * 100}>
                  {c.href ? (
                    <a
                      href={c.href}
                      target={c.icon === 'linkedin' ? '_blank' : undefined}
                      rel="noreferrer"
                      className="block"
                    >
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </Reveal>
              )
            })}
          </div>

          {/* Right: form */}
          {/* <div className="rounded-3xl border border-brand-100 bg-white p-7 sm:p-9 shadow-sm">
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-brand-800">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={update}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-brand-100 bg-brand-50/30 px-4 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-300/40"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-brand-800">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update}
                  placeholder="jane@company.com"
                  className="w-full rounded-xl border border-brand-100 bg-brand-50/30 px-4 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-300/40"
                />
              </div>
              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-brand-800">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  value={form.message}
                  onChange={update}
                  placeholder="Tell us about your project…"
                  className="w-full resize-none rounded-xl border border-brand-100 bg-brand-50/30 px-4 py-3 text-sm text-brand-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-300/40"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-lg active:scale-[0.99]"
              >
                {sent ? 'Message Sent ✓' : 'Submit'}
              </button>
              {sent && (
                <p className="text-center text-sm font-medium text-brand-600">
                  Thanks! We'll be in touch shortly.
                </p>
              )}
            </form>
          </div> */}
        </div>
      </div>
    </section>
  )
}
