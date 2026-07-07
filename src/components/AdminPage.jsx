import { useEffect, useMemo, useRef, useState } from 'react'
import { bookingForms } from '../data/bookingForms'
import { getWebinars, addWebinar, deleteWebinar, slugify } from '../data/webinarStore'
import { listBookings, clearBookings } from '../data/api'
import { Calendar, Cube, Close, Check } from './Icons'
import { HeroHighlight } from './HeroHighlight'
import logo from '../assets/darklogo.png'

const TABS = [
  { key: 'webinar', label: 'Webinar Bookings', icon: Calendar },
  { key: 'aiLab', label: 'AI Lab Requests', icon: Cube },
]

function toCsv(cfg, rows) {
  const cols = [...cfg.fields.map((f) => f.name), 'submittedAt']
  const headers = [...cfg.fields.map((f) => f.label), 'Submitted At']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.map(esc).join(',')]
  rows.forEach((r) => lines.push(cols.map((c) => esc(r[c])).join(',')))
  return lines.join('\r\n')
}

export default function AdminPage() {
  const [section, setSection] = useState('bookings') // bookings | library
  const [active, setActive] = useState('webinar')
  const [data, setData] = useState({ webinar: [], aiLab: [] })

  const refresh = async () => {
    try {
      const [webinar, aiLab] = await Promise.all([listBookings('webinar'), listBookings('aiLab')])
      setData({ webinar, aiLab })
    } catch (err) {
      console.error('[admin] failed to load bookings →', err)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const cfg = bookingForms[active]
  const rows = data[active]

  const exportCsv = () => {
    const blob = new Blob([toCsv(cfg, rows)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cfg.id}-bookings.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAll = async () => {
    if (!window.confirm(`Delete all ${rows.length} ${cfg.title} record(s)? This cannot be undone.`)) return
    try {
      await clearBookings(cfg.id)
    } catch (err) {
      console.error('[admin] clear failed →', err)
    }
    refresh()
  }

  return (
    <div className="min-h-screen bg-black text-white/90">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-6 py-3 sm:px-10 lg:px-16 xl:px-24">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Technical Hub" className="h-9 w-auto" />
            <span className="rounded-full bg-claude-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-claude-400 ring-1 ring-claude-500/20">
              Admin
            </span>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white"
          >
            <Close width={16} height={16} /> Back to site
          </a>
        </div>
      </header>

      <main className="w-full px-6 py-8 sm:px-10 lg:px-16 xl:px-24">
        {/* section switch */}
        <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {[
            ['bookings', 'Bookings'],
            ['library', 'Webinar Library'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSection(k)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                section === k ? 'bg-white text-black' : 'text-white/70 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {section === 'library' ? (
          <LibraryManager />
        ) : (
          <>
        <h1 className="text-2xl font-bold text-white">Bookings Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">
          Submissions are stored in MongoDB and shared across everyone who opens this dashboard.
        </p>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TABS.map((t) => {
            const Icon = t.icon
            const count = data[t.key].length
            const isActive = active === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
                  isActive
                    ? 'border-claude-500/40 bg-white/[0.05] shadow-lg shadow-claude-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-claude-500/10 text-claude-400 ring-1 ring-claude-500/20">
                  <Icon width={24} height={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-sm text-white/50">{t.label}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">
            {cfg.title} <span className="text-white/40">({rows.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
            >
              Refresh
            </button>
            <button
              onClick={exportCsv}
              disabled={!rows.length}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-3.5 py-2 text-sm font-semibold text-white hover:shadow-lg hover:shadow-brand-500/25 disabled:opacity-40"
            >
              Export CSV
            </button>
            <button
              onClick={clearAll}
              disabled={!rows.length}
              className="rounded-lg border border-claude-500/40 px-3.5 py-2 text-sm font-medium text-claude-400 hover:bg-claude-500/10 disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-white/40">
              No {cfg.title.toLowerCase()} yet. Submit one from the site to see it here.
            </div>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3 font-semibold">#</th>
                  {cfg.fields.map((f) => (
                    <th key={f.name} className="px-4 py-3 font-semibold">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-white/40">{i + 1}</td>
                    {cfg.fields.map((f) => (
                      <td key={f.name} className="px-4 py-3 text-white/80">
                        {r[f.name] || <span className="text-white/25">—</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap text-white/50">
                      {new Date(r.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
          </>
        )}
      </main>
    </div>
  )
}

/* ---------------- Webinar Library manager ---------------- */
const KINDS = ['Webinar', 'Workshop']
const emptySession = {
  kind: 'Webinar',
  title: '',
  presenter: '',
  role: '',
  date: '',
  dateISO: '',
  time: '',
  summary: '',
  description: '',
  poster: '',
}

const pad = (n) => String(n).padStart(2, '0')
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
function sessionDateKey(w) {
  if (w.dateISO) return w.dateISO
  const d = new Date(w.date)
  return isNaN(d.getTime()) ? null : toKey(d.getFullYear(), d.getMonth(), d.getDate())
}
function formatDisplay(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
function MiniCalendar({ sessions, value, onSelect }) {
  const today = new Date()
  const [ym, setYm] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }))
  const counts = useMemo(() => {
    const map = {}
    sessions.forEach((w) => {
      const k = sessionDateKey(w)
      if (k) map[k] = (map[k] || 0) + 1
    })
    return map
  }, [sessions])

  const first = new Date(ym.y, ym.m, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate())
  const prev = () => setYm((s) => (s.m === 0 ? { y: s.y - 1, m: 11 } : { y: s.y, m: s.m - 1 }))
  const next = () => setYm((s) => (s.m === 11 ? { y: s.y + 1, m: 0 } : { y: s.y, m: s.m + 1 }))

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <button onClick={prev} className="grid h-8 w-8 place-items-center rounded-lg text-lg text-white/60 hover:bg-white/10">
          ‹
        </button>
        <p className="text-sm font-semibold text-white">{monthLabel}</p>
        <button onClick={next} className="grid h-8 w-8 place-items-center rounded-lg text-lg text-white/60 hover:bg-white/10">
          ›
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.62rem] font-semibold uppercase text-white/30">
        {WEEK.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const key = toKey(ym.y, ym.m, d)
          const has = counts[key]
          const selected = value === key
          const isToday = key === todayKey
          return (
            <button
              key={i}
              onClick={() => onSelect(key)}
              title={has ? `${has} session(s)` : undefined}
              className={`relative grid aspect-square place-items-center rounded-lg text-sm transition ${
                selected
                  ? 'bg-brand-500 font-bold text-white'
                  : has
                    ? 'bg-claude-500/15 text-white ring-1 ring-claude-500/40 hover:bg-claude-500/25'
                    : 'text-white/70 hover:bg-white/10'
              } ${isToday && !selected ? 'ring-1 ring-white/30' : ''}`}
            >
              {d}
              {has && !selected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-claude-400" />
              )}
            </button>
          )
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-white/40">
        <span className="h-2 w-2 rounded-full bg-claude-400" /> Sessions scheduled
      </p>
    </div>
  )
}

function LibraryManager() {
  const [list, setList] = useState([])
  const [form, setForm] = useState(emptySession)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    let alive = true
    getWebinars().then((l) => alive && setList(l))
    return () => {
      alive = false
    }
  }, [])

  const set = (name, val) => setForm((f) => ({ ...f, [name]: val }))
  const setDate = (iso) => setForm((f) => ({ ...f, dateISO: iso, date: formatDisplay(iso) }))

  const onPoster = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('poster', reader.result)
    reader.readAsDataURL(file)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.presenter.trim() || !form.date.trim() || !form.description.trim()) {
      setError('Title, presenter, date and description are required.')
      return
    }
    setError('')
    const session = {
      ...form,
      id: `${slugify(form.title)}-${Date.now().toString(36)}`,
    }
    setSaving(true)
    try {
      const next = await addWebinar(session)
      setList(next)
      setForm(emptySession)
      if (fileRef.current) fileRef.current.value = ''
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('[admin] publish failed →', err)
      setError('Could not publish — is the API server running?')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Remove this session from the library?')) return
    try {
      setList(await deleteWebinar(id))
    } catch (err) {
      console.error('[admin] delete failed →', err)
    }
  }

  const input =
    'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-400/60'

  return (
    <HeroHighlight containerClassName="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-8" radius={200}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Add form */}
        <div>
          <h1 className="text-2xl font-bold text-white">Add a session</h1>
          <p className="mt-1 text-sm text-white/50">Publish a webinar or workshop — it appears instantly in the register flow.</p>

          <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* poster */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-white/80">Poster image</label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  {form.poster ? (
                    <img src={form.poster} alt="poster" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-white/30">No image</div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPoster} className="text-sm text-white/60 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20" />
                  {form.poster && (
                    <button type="button" onClick={() => set('poster', '')} className="w-fit text-xs text-white/40 hover:text-white/70">
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/80">Type</label>
              <select value={form.kind} onChange={(e) => set('kind', e.target.value)} className={`${input} appearance-none`}>
                {KINDS.map((k) => (
                  <option key={k} value={k} className="text-black">
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/80">Date</label>
              <input
                type="date"
                value={form.dateISO}
                onChange={(e) => setDate(e.target.value)}
                className={`${input} [color-scheme:dark]`}
              />
            </div>
            <Text label="Title" full value={form.title} onChange={(v) => set('title', v)} placeholder="Claude Foundations for Educators" cls={input} />
            <Text label="Presenter" value={form.presenter} onChange={(v) => set('presenter', v)} placeholder="Bobby Pamarthi" cls={input} />
            <Text label="Presenter role" value={form.role} onChange={(v) => set('role', v)} placeholder="Head of AI Training" cls={input} />
            <Text label="Time / duration" full value={form.time} onChange={(v) => set('time', v)} placeholder="5:00 PM IST · 90 min" cls={input} />
            <Text label="Short summary" full value={form.summary} onChange={(v) => set('summary', v)} placeholder="One line shown on the card" cls={input} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-white/80">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Full description shown in the detail view…"
                className={`${input} resize-none`}
              />
            </div>

            {error && <p className="text-sm text-claude-400 sm:col-span-2">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60 sm:col-span-2"
            >
              {saving ? (
                'Publishing…'
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" /> Published!
                </>
              ) : (
                'Publish session'
              )}
            </button>
          </form>
        </div>

        {/* Calendar + existing list */}
        <div>
          <MiniCalendar sessions={list} value={form.dateISO} onSelect={setDate} />

          <h2 className="mt-6 text-lg font-semibold text-white">
            Library <span className="text-white/40">({list.length})</span>
          </h2>
          <div className="mt-4 grid max-h-[70vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {list.map((w) => (
              <div key={w.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-neutral-800 to-black">
                  {w.poster ? (
                    <img src={w.poster} alt={w.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="absolute -bottom-3 right-1 text-6xl font-black text-white/10">{w.title.charAt(0)}</span>
                  )}
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-black/40 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white backdrop-blur">
                    {w.kind}
                  </span>
                  <button
                    onClick={() => remove(w.id)}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white/80 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/70"
                    title="Remove"
                  >
                    <Close width={14} height={14} />
                  </button>
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-bold text-white">{w.title}</p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {w.presenter} · {w.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </HeroHighlight>
  )
}

function Text({ label, value, onChange, placeholder, cls, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-sm font-semibold text-white/80">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
    </div>
  )
}
