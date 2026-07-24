import { useEffect, useMemo, useRef, useState } from 'react'
import { bookingForms } from '../data/bookingForms'
import { getWebinars, addWebinar, deleteWebinar, slugify, sessionDateLabel } from '../data/webinarStore'
import { listBookings, clearBookings, getAdminToken, clearAdminToken, savePopup, saveRegistration } from '../data/api'
import { regConfig, DEFAULT_CAPACITY } from '../data/registration'
import { Calendar, Cube, Close, Check, Pencil, Bell, Users } from './Icons'
import { HeroHighlight } from './HeroHighlight'
import AdminLogin from './AdminLogin'
// PARKED (see commit e42ec41): Analytics dashboard — import Analytics from './Analytics'
import DataCleanup from './DataCleanup'
import logo from '../assets/darklogo.png'

const TABS = [
  { key: 'webinar', label: 'Webinar Bookings', icon: Calendar },
  { key: 'aiLab', label: 'AI Lab Requests', icon: Cube },
]

// Data is already sorted newest-first by the server, so index 0 is the latest.
// Each booking type stores its "name" and "college" under different field keys,
// since each form has its own fields — map that out here.
function formatRegTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function latestSummary(type, list) {
  const latest = list?.[0]
  if (!latest) return null

  if (type === 'webinar') {
    return {
      time: formatRegTime(latest.submittedAt),
      name: [latest.firstName, latest.lastName].filter(Boolean).join(' ') || 'Unknown',
      college: latest['Organization-College Name'] || '—',
    }
  }
  if (type === 'aiLab') {
    return {
      time: formatRegTime(latest.submittedAt),
      name: latest.contactPerson || 'Unknown',
      college: latest.organization || '—',
    }
  }
  return null
}

// Context columns (beyond the raw form fields) to surface per booking type.
const EXTRA_COLS = {
  webinar: [
    { key: 'webinar', label: 'Webinar' },
    { key: 'sessionDate', label: 'Session' },
    { key: 'state', label: 'State' },
    { key: 'city', label: 'City' },
    { key: 'course', label: 'Course' },
    { key: 'year', label: 'Year' },
  ],
  aiLab: [],
}

// Dropdown "slicers" per booking type — categorical fields worth filtering by.
const SLICERS = {
  webinar: [
    { key: 'webinar', label: 'Webinar' },
    { key: 'sessionDate', label: 'Session' },
    { key: 'state', label: 'State' },
    { key: 'city', label: 'City' },
    { key: 'course', label: 'Course' },
    { key: 'year', label: 'Year' },
  ],
  aiLab: [
    { key: 'orgType', label: 'Org type' },
    { key: 'organization', label: 'Organization' },
  ],
}

function toCsv(cfg, rows, extra = []) {
  const cols = [...extra.map((e) => e.key), ...cfg.fields.map((f) => f.name), 'submittedAt']
  const headers = [...extra.map((e) => e.label), ...cfg.fields.map((f) => f.label), 'Submitted At']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.map(esc).join(',')]
  rows.forEach((r) => lines.push(cols.map((c) => esc(r[c])).join(',')))
  return lines.join('\r\n')
}

// ---- Dashboard insights: which fields to surface as KPI "unique" tiles and as
// ranked breakdown bars, per booking type. Everything computes on the FILTERED set.
const INSIGHTS = {
  webinar: {
    kpis: [
      { label: 'Colleges', key: 'Organization-College Name' },
      { label: 'States', key: 'state' },
      { label: 'Cities', key: 'city' },
      { label: 'Courses', key: 'course' },
    ],
    breakdowns: [
      { label: 'By webinar', key: 'webinar' },
      { label: 'By state', key: 'state' },
      { label: 'By course', key: 'course' },
      { label: 'By year of study', key: 'year' },
      { label: 'Top colleges', key: 'Organization-College Name' },
      { label: 'Top cities', key: 'city' },
    ],
  },
  aiLab: {
    kpis: [
      { label: 'Organizations', key: 'organization' },
      { label: 'Org types', key: 'orgType' },
    ],
    breakdowns: [
      { label: 'By org type', key: 'orgType' },
      { label: 'Top organizations', key: 'organization' },
    ],
  },
}

// A single KPI stat tile.
function StatTile({ label, value, sub, accent }) {
  const ring =
    accent === 'brand' ? 'ring-brand-500/25 bg-brand-500/[0.07]' : 'ring-white/10 bg-white/[0.03]'
  const val = accent === 'brand' ? 'text-brand-300' : 'text-white'
  return (
    <div className={`rounded-2xl p-4 ring-1 ${ring}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-white/45">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${val}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
    </div>
  )
}

// A clickable setting tile used in the Webinar Settings tab.
function ActionTile({ icon: Icon, title, desc, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
        danger
          ? 'border-red-500/20 bg-red-500/[0.04] hover:border-red-500/40 hover:bg-red-500/[0.08]'
          : 'border-white/10 bg-white/[0.03] hover:border-brand-400/40 hover:bg-white/[0.06]'
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${
          danger ? 'bg-red-500/15 text-red-300 ring-red-500/25' : 'bg-brand-500/10 text-brand-300 ring-brand-500/20'
        }`}
      >
        <Icon width={18} height={18} />
      </span>
      <span>
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="mt-0.5 block text-xs text-white/45">{desc}</span>
      </span>
    </button>
  )
}

// Horizontal ranked bars (single hue = magnitude). Recessive track, rounded ends.
function BarList({ data, empty = 'No data' }) {
  if (!data.length) return <p className="py-6 text-center text-sm text-white/30">{empty}</p>
  const top = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3" title={`${d.label}: ${d.value}`}>
          <div className="w-32 shrink-0 truncate text-xs text-white/70">{d.label}</div>
          <div className="relative h-4 flex-1 overflow-hidden rounded bg-white/[0.05]">
            <div className="h-full rounded bg-brand-500/70" style={{ width: `${(d.value / top) * 100}%` }} />
          </div>
          <div className="w-8 shrink-0 text-right text-xs font-semibold text-white/80">{d.value}</div>
        </div>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(Boolean(getAdminToken()))
  const [loginNotice, setLoginNotice] = useState('')
  const [section, setSection] = useState('bookings') // bookings | library
  const [active, setActive] = useState('webinar')
  const [data, setData] = useState({ webinar: [], aiLab: [] })
  const [filters, setFilters] = useState({}) // { fieldKey: value }
  const [search, setSearch] = useState('')

  const logout = () => {
    clearAdminToken()
    setAuthed(false)
  }

  const refresh = async () => {
    try {
      const [webinar, aiLab] = await Promise.all([listBookings('webinar'), listBookings('aiLab')])
      setData({ webinar, aiLab })
    } catch (err) {
      console.error('[admin] failed to load bookings →', err)
      if (err.status === 401) {
        setLoginNotice('Session expired, please log in again.')
        setAuthed(false)
      }
    }
  }

  useEffect(() => {
    if (authed) refresh()
  }, [authed])

  // Reset slicers/search when switching between booking types. MUST stay above the
  // `if (!authed)` early return — a hook after a conditional return changes the
  // hook count between renders and crashes React (the "black screen" bug).
  useEffect(() => {
    setFilters({})
    setSearch('')
  }, [active])

  if (!authed) {
    return (
      <AdminLogin
        notice={loginNotice}
        onSuccess={() => {
          setLoginNotice('')
          setAuthed(true)
        }}
      />
    )
  }

  const cfg = bookingForms[active]
  const rows = data[active]
  const extra = EXTRA_COLS[active] || []
  const slicers = SLICERS[active] || []

  // Distinct values (with counts) for a slicer field, from the full row set.
  const distinct = (key) => {
    const counts = {}
    rows.forEach((r) => {
      const v = String(r[key] ?? '').trim()
      if (v) counts[v] = (counts[v] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]))
  }

  const hasFilters = Boolean(search.trim()) || Object.values(filters).some(Boolean)
  const q = search.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    for (const s of slicers) {
      if (filters[s.key] && String(r[s.key] ?? '') !== filters[s.key]) return false
    }
    if (q) {
      const hay = Object.values(r).map((v) => String(v ?? '')).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const clearFilters = () => {
    setFilters({})
    setSearch('')
  }

  // ---- Insights, computed on the filtered rows ----
  const ins = INSIGHTS[active] || { kpis: [], breakdowns: [] }
  const uniqCount = (key) =>
    new Set(filtered.map((r) => String(r[key] ?? '').trim()).filter(Boolean)).size
  const rankBy = (key, n = 8) => {
    const m = {}
    filtered.forEach((r) => {
      const v = String(r[key] ?? '').trim()
      if (v) m[v] = (m[v] || 0) + 1
    })
    return Object.entries(m)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, n)
  }

  const exportCsv = () => {
    const blob = new Blob([toCsv(cfg, filtered, extra)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cfg.id}-bookings${hasFilters ? '-filtered' : ''}.csv`
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
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white"
            >
              Log out
            </button>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white"
            >
              <Close width={16} height={16} /> Back to site
            </a>
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-8 sm:px-10 lg:px-16 xl:px-24">
        {/* section switch */}
        <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {[
            ['bookings', 'Bookings'],
            ['library', 'Webinar Library'],
            ['settings', 'Webinar Settings'],
            ['cleanup', 'Data Cleanup'],
            // PARKED (see commit e42ec41): ['analytics', 'Analytics'],
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
          <LibraryManager mode="library" />
        ) : section === 'settings' ? (
          <LibraryManager mode="settings" />
        ) : section === 'cleanup' ? (
          <DataCleanup />
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
            const latest = latestSummary(t.key, data[t.key])
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`flex items-center justify-between gap-4 rounded-2xl border p-5 text-left transition-all ${
                  isActive
                    ? 'border-claude-500/40 bg-white/[0.05] shadow-lg shadow-claude-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-claude-500/10 text-claude-400 ring-1 ring-claude-500/20">
                    <Icon width={24} height={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-sm text-white/50">{t.label}</p>
                  </div>
                </div>

                {latest && (
                  <div className="hidden shrink-0 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2 text-right sm:block">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
                      Last registered
                    </p>
                    <p className="text-xs font-semibold text-white/85">{latest.time}</p>
                    <p className="max-w-[160px] truncate text-xs text-white/60">{latest.name}</p>
                    <p className="max-w-[160px] truncate text-xs text-white/40">{latest.college}</p>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">
            {cfg.title}{' '}
            <span className="text-white/40">
              ({filtered.length}
              {filtered.length !== rows.length ? ` of ${rows.length}` : ''})
            </span>
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
              disabled={!filtered.length}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-3.5 py-2 text-sm font-semibold text-white hover:shadow-lg hover:shadow-brand-500/25 disabled:opacity-40"
            >
              Export CSV{hasFilters ? ` (${filtered.length})` : ''}
            </button>
          </div>
        </div>

        {/* Slicers — search + per-field dropdowns */}
        {rows.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, anything…"
              className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-400/60 sm:w-72"
            />
            {slicers.map((s) => {
              const opts = distinct(s.key)
              if (!opts.length) return null
              return (
                <select
                  key={s.key}
                  value={filters[s.key] || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, [s.key]: e.target.value }))}
                  className={`appearance-none rounded-lg border px-3.5 py-2 text-sm outline-none transition focus:border-brand-400/60 ${
                    filters[s.key]
                      ? 'border-brand-400/50 bg-brand-500/10 text-white'
                      : 'border-white/15 bg-white/[0.04] text-white/80'
                  }`}
                >
                  <option value="" className="text-black">
                    All {s.label.toLowerCase()}
                  </option>
                  {opts.map(([v, c]) => (
                    <option key={v} value={v} className="text-black">
                      {v} ({c})
                    </option>
                  ))}
                </select>
              )
            })}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="rounded-lg border border-white/15 px-3.5 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Key insights — reflect the current filters */}
        {rows.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatTile
                label="Registrations"
                value={filtered.length}
                sub={hasFilters ? `of ${rows.length} total` : 'total'}
                accent="brand"
              />
              {ins.kpis.map((k) => (
                <StatTile key={k.label} label={k.label} value={uniqCount(k.key)} />
              ))}
            </div>

            {filtered.length > 0 && ins.breakdowns.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {ins.breakdowns.map((b) => {
                  const d = rankBy(b.key)
                  if (!d.length) return null
                  return (
                    <div key={b.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">{b.label}</p>
                      <BarList data={d} />
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Table */}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-white/40">
              No {cfg.title.toLowerCase()} yet. Submit one from the site to see it here.
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-white/40">
              No records match your filters.{' '}
              <button onClick={clearFilters} className="font-semibold text-brand-300 hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3 font-semibold">#</th>
                  {extra.map((e) => (
                    <th key={e.key} className="px-4 py-3 font-semibold">
                      {e.label}
                    </th>
                  ))}
                  {cfg.fields.map((f) => (
                    <th key={f.name} className="px-4 py-3 font-semibold">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-white/40">{i + 1}</td>
                    {extra.map((e) => (
                      <td key={e.key} className="px-4 py-3 font-medium text-white/90">
                        {r[e.key] || <span className="text-white/25">—</span>}
                      </td>
                    ))}
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
const KINDS = ['Webinar', 'Workshop',"Training"]
const FILTERS = [
  ['all', 'All'],
  ['prev', 'Previous'],
  ['this', 'This month'],
  ['next', 'Next month'],
]
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = ['00', '15', '30', '45']
const emptySession = {
  kind: 'Webinar',
  title: '',
  presenter: '',
  role: '',
  date: '',
  dateISO: '',
  multiDay: false,
  endDate: '',
  endDateISO: '',
  startH: '5',
  startM: '00',
  ampm: 'PM',
  duration: '90 min',
  time: '5:00 PM · 90 min',
  link: '',
  summary: '',
  description: '',
  poster: '',
}

// Build the display string from the time parts, e.g. "5:00 PM · 90 min".
const composeTime = (f) => {
  const dur = (f.duration || '').trim()
  return `${f.startH || '12'}:${f.startM || '00'} ${f.ampm || 'PM'}${dur ? ` · ${dur}` : ''}`
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
// display date ("Aug 12, 2026") → ISO ("2026-08-12"), for editing older sessions.
function toISOFromDisplay(dateStr) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return toKey(d.getFullYear(), d.getMonth(), d.getDate())
}
// time string ("5:00 PM · 90 min") → { startH, startM, ampm, duration } for editing.
function parseTimeStr(t) {
  const out = {}
  const m = (t || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (m) {
    out.startH = String(Number(m[1]))
    out.startM = m[2]
    out.ampm = m[3].toUpperCase()
  }
  const d = (t || '').match(/·\s*(.+)$/)
  if (d) out.duration = d[1].trim()
  return out
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

function LibraryManager({ mode = 'library' }) {
  const [list, setList] = useState([])
  const [form, setForm] = useState(emptySession)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [popupFor, setPopupFor] = useState(null) // webinar whose popup is being configured
  const [regFor, setRegFor] = useState(null) // webinar whose registration is being configured
  const [selectedId, setSelectedId] = useState('') // Webinar Settings tab: chosen webinar
  const fileRef = useRef(null)
  const selected = list.find((w) => w.id === selectedId) || null

  // Reflect a saved popup config back into the local list without a full reload.
  const onPopupSaved = (id, popup) =>
    setList((l) => l.map((w) => (w.id === id ? { ...w, popup } : w)))

  // Reflect a saved registration config back into the local list.
  const onRegSaved = (id, registration) =>
    setList((l) => l.map((w) => (w.id === id ? { ...w, registration } : w)))

  useEffect(() => {
    let alive = true
    getWebinars().then((l) => alive && setList(l))
    return () => {
      alive = false
    }
  }, [])

  const set = (name, val) => setForm((f) => ({ ...f, [name]: val }))
  const setDate = (iso) =>
    setForm((f) => {
      const next = { ...f, dateISO: iso, date: formatDisplay(iso) }
      // Keep the end date valid: never before the start.
      if (next.endDateISO && next.endDateISO < iso) {
        next.endDateISO = iso
        next.endDate = formatDisplay(iso)
      }
      return next
    })
  const setEndDate = (iso) => setForm((f) => ({ ...f, endDateISO: iso, endDate: formatDisplay(iso) }))
  // Single-day ⇄ multi-day. Turning multi-day on seeds the end date from the start.
  const setMultiDay = (on) =>
    setForm((f) => ({
      ...f,
      multiDay: on,
      endDateISO: on ? f.endDateISO || f.dateISO : '',
      endDate: on ? f.endDate || f.date : '',
    }))
  // Update a time part and recompute the display string.
  const setTimePart = (part, val) =>
    setForm((f) => {
      const next = { ...f, [part]: val }
      next.time = composeTime(next)
      return next
    })

  const onPoster = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('poster', reader.result)
    reader.readAsDataURL(file)
  }

  const openCreate = (dateISO = '') => {
    setEditingId(null)
    setError('')
    setForm(dateISO ? { ...emptySession, dateISO, date: formatDisplay(dateISO) } : emptySession)
    if (fileRef.current) fileRef.current.value = ''
    setShowForm(true)
  }

  const openEdit = (w) => {
    setEditingId(w.id)
    setError('')
    const dateISO = w.dateISO || toISOFromDisplay(w.date)
    const endDateISO = w.endDateISO || ''
    const multiDay = Boolean(endDateISO && endDateISO !== dateISO)
    setForm({
      ...emptySession,
      ...w,
      dateISO,
      date: w.date || formatDisplay(dateISO),
      multiDay,
      endDateISO: multiDay ? endDateISO : '',
      endDate: multiDay ? w.endDate || formatDisplay(endDateISO) : '',
      ...parseTimeStr(w.time),
    })
    if (fileRef.current) fileRef.current.value = ''
    setShowForm(true)
  }

  const closeForm = () => setShowForm(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.presenter.trim() || !form.date.trim() || !form.description.trim()) {
      setError('Title, presenter, date and description are required.')
      return
    }
    if (form.multiDay) {
      if (!form.endDateISO) {
        setError('Pick an end date, or switch back to a single-day session.')
        return
      }
      if (form.endDateISO < form.dateISO) {
        setError('The end date can’t be before the start date.')
        return
      }
    }
    setError('')
    // Normalize: a single-day session stores no end date.
    const multiDay = Boolean(form.multiDay && form.endDateISO && form.endDateISO !== form.dateISO)
    const session = {
      ...form,
      multiDay,
      endDateISO: multiDay ? form.endDateISO : '',
      endDate: multiDay ? form.endDate : '',
      id: editingId || `${slugify(form.title)}-${Date.now().toString(36)}`,
    }
    setSaving(true)
    try {
      const next = await addWebinar(session)
      setList(next)
      setShowForm(false)
      setSaved(editingId ? 'updated' : 'created')
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('[admin] save failed →', err)
      setError('Could not save — is the API server running?')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Remove this session from the library?')) return
    try {
      setList(await deleteWebinar(id))
      setSelectedId((s) => (s === id ? '' : s))
    } catch (err) {
      console.error('[admin] delete failed →', err)
    }
  }

  const input =
    'w-full rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-400/60'

  // Bucket each session into prev / this / next month relative to today.
  const now = new Date()
  const cy = now.getFullYear()
  const cm = now.getMonth()
  const nm = cm === 11 ? 0 : cm + 1
  const nmy = cm === 11 ? cy + 1 : cy
  const bucketOf = (w) => {
    const k = sessionDateKey(w)
    if (!k) return 'other'
    const [y, mo] = k.split('-').map(Number)
    const m = mo - 1
    if (y < cy || (y === cy && m < cm)) return 'prev'
    if (y === cy && m === cm) return 'this'
    if (y === nmy && m === nm) return 'next'
    return 'other'
  }
  const counts = { all: list.length, prev: 0, this: 0, next: 0 }
  list.forEach((w) => {
    const b = bucketOf(w)
    if (counts[b] !== undefined) counts[b] += 1
  })
  const filtered = filter === 'all' ? list : list.filter((w) => bucketOf(w) === filter)

  return (
    <>
      {mode === 'settings' ? (
        <HeroHighlight containerClassName="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-8" radius={200}>
          {/* ---- Webinar Settings: pick a webinar, then open a setting ---- */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Webinar Settings</h1>
              <p className="mt-1 text-sm text-white/50">Pick a webinar, then open the setting you want to change.</p>
            </div>
            <button
              onClick={() => openCreate()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              <span className="text-lg leading-none">+</span> Create a session
            </button>
          </div>

          {saved && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-4 py-2 text-sm font-semibold text-brand-300 ring-1 ring-brand-500/30">
              <Check className="h-4 w-4" /> Session {saved === 'updated' ? 'updated' : 'created'}!
            </div>
          )}

          <div className="mt-6 max-w-lg">
            <label className="mb-1.5 block text-sm font-semibold text-white/80">Select a webinar</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={`${input} appearance-none`}
            >
              <option value="" className="text-black">— Choose a webinar —</option>
              {list.map((w) => (
                <option key={w.id} value={w.id} className="text-black">
                  {w.title} · {sessionDateLabel(w)}
                </option>
              ))}
            </select>
          </div>

          {!selected ? (
            <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center text-sm text-white/40">
              Select a webinar above to manage its settings.
            </p>
          ) : (
            <div className="mt-6">
              {/* current-state summary */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-3 py-1 font-semibold ring-1 ${
                    regConfig(selected).enabled
                      ? 'bg-brand-500/10 text-brand-300 ring-brand-500/25'
                      : 'bg-red-500/10 text-red-300 ring-red-500/25'
                  }`}
                >
                  Registration: {regConfig(selected).enabled ? 'Open' : 'Closed'}
                </span>
                <span className="rounded-full bg-white/[0.05] px-3 py-1 text-white/70 ring-1 ring-white/10">
                  Seat cap {regConfig(selected).capacity}
                </span>
                <span
                  className={`rounded-full px-3 py-1 ring-1 ${
                    selected.popup?.active
                      ? 'bg-claude-500/10 text-claude-300 ring-claude-500/25'
                      : 'bg-white/[0.05] text-white/60 ring-white/10'
                  }`}
                >
                  Popup: {selected.popup?.active ? 'On' : 'Off'}
                </span>
                {!selected.link && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-300 ring-1 ring-amber-500/25">
                    No join link
                  </span>
                )}
              </div>

              {/* settings for the selected webinar */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ActionTile icon={Users} title="Registration" desc="Open/close, seat cap, schedule" onClick={() => setRegFor(selected)} />
                <ActionTile icon={Bell} title="Popup notification" desc="Live join-link popup on the site" onClick={() => setPopupFor(selected)} />
                <ActionTile icon={Pencil} title="Edit details" desc="Title, dates, time, poster, description" onClick={() => openEdit(selected)} />
                <ActionTile icon={Close} title="Delete session" desc="Remove this webinar permanently" danger onClick={() => remove(selected.id)} />
              </div>
            </div>
          )}
        </HeroHighlight>
      ) : (
      <HeroHighlight containerClassName="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-8" radius={200}>
        {/* header + create button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Webinar Library <span className="text-white/40">({list.length})</span>
            </h1>
            <p className="mt-1 text-sm text-white/50">Your published webinars. Manage each one in <span className="text-white/70">Webinar Settings</span>.</p>
            {list.filter((w) => !w.link).length > 0 && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/30">
                ⚠ {list.filter((w) => !w.link).length} session{list.filter((w) => !w.link).length > 1 ? 's' : ''} missing a join link
              </span>
            )}
          </div>
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            <span className="text-lg leading-none">+</span> Create a session
          </button>
        </div>

        {saved && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-4 py-2 text-sm font-semibold text-brand-300 ring-1 ring-brand-500/30">
            <Check className="h-4 w-4" /> Session {saved === 'updated' ? 'updated' : 'created'}!
          </div>
        )}

        {/* filters */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {FILTERS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === k
                  ? 'bg-white text-black'
                  : 'border border-white/10 bg-white/[0.03] text-white/70 hover:text-white'
              }`}
            >
              {label} <span className={filter === k ? 'text-black/50' : 'text-white/30'}>({counts[k]})</span>
            </button>
          ))}
        </div>

        {/* sessions */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-white">
            Sessions <span className="text-white/40">({filtered.length})</span>
          </h2>
          {filtered.length === 0 && (
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] py-10 text-center text-sm text-white/40">
              No sessions in this range.
            </p>
          )}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((w) => (
                <div
                  key={w.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-md transition hover:border-white/25"
                >
                  <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-neutral-800 to-black">
                    {w.poster ? (
                      <img src={w.poster} alt={w.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="absolute -bottom-3 right-1 text-6xl font-black text-white/10">{w.title.charAt(0)}</span>
                    )}
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-black/40 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white backdrop-blur">
                      {w.kind}
                    </span>
                    {!w.link && (
                      <span className="absolute bottom-2 left-2.5 rounded-full bg-amber-500/25 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-amber-200 ring-1 ring-amber-400/40 backdrop-blur">
                        No link
                      </span>
                    )}
                    {w.popup?.active && (
                      <span className="absolute bottom-2 right-2.5 inline-flex items-center gap-1 rounded-full bg-claude-500/25 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-claude-200 ring-1 ring-claude-400/40 backdrop-blur">
                        <Bell width={9} height={9} /> Popup on
                      </span>
                    )}
                    {regConfig(w).enabled === false && (
                      <span className="absolute bottom-2 left-2.5 inline-flex items-center gap-1 rounded-full bg-red-500/25 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-red-200 ring-1 ring-red-400/40 backdrop-blur">
                        Reg off
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-bold text-white">{w.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-white/50">
                      {w.presenter} · {sessionDateLabel(w)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </HeroHighlight>
      )}

      {/* create / edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative my-8 w-full max-w-2xl rounded-3xl border border-white/10 bg-neutral-950 p-6 sm:p-8">
            <button
              onClick={closeForm}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <Close width={18} height={18} />
            </button>
            <h2 className="text-2xl font-bold text-white">{editingId ? 'Edit session' : 'Create a session'}</h2>
            <p className="mt-1 text-sm text-white/50">
              {editingId
                ? 'Update the details and save your changes.'
                : 'Publish a webinar or workshop — it appears instantly in the register flow.'}
            </p>

            <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* poster */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-white/80">Poster image</label>
              <div className="flex items-center gap-4">
                <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
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
            {/* Single-day vs multi-day toggle */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-white/80">Duration in days</label>
              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                <button
                  type="button"
                  onClick={() => setMultiDay(false)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                    !form.multiDay ? 'bg-brand-500 text-white shadow' : 'text-white/55 hover:text-white'
                  }`}
                >
                  Single day
                </button>
                <button
                  type="button"
                  onClick={() => setMultiDay(true)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                    form.multiDay ? 'bg-brand-500 text-white shadow' : 'text-white/55 hover:text-white'
                  }`}
                >
                  Multiple days
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/80">
                {form.multiDay ? 'From date' : 'Date'}
              </label>
              <input
                type="date"
                value={form.dateISO}
                onChange={(e) => setDate(e.target.value)}
                className={`${input} [color-scheme:dark]`}
              />
            </div>
            {form.multiDay && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white/80">To date</label>
                <input
                  type="date"
                  value={form.endDateISO}
                  min={form.dateISO || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${input} [color-scheme:dark]`}
                />
              </div>
            )}
            <Text label="Title" full value={form.title} onChange={(v) => set('title', v)} placeholder="Claude Foundations for Educators" cls={input} />
            <Text label="Presenter" value={form.presenter} onChange={(v) => set('presenter', v)} placeholder="Bobby Pamarthi" cls={input} />
            <Text label="Presenter role" value={form.role} onChange={(v) => set('role', v)} placeholder="Head of AI Training" cls={input} />

            {/* Start time — hour : minute + AM/PM */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/80">Start time</label>
              <div className="flex gap-2">
                <select
                  value={form.startH}
                  onChange={(e) => setTimePart('startH', e.target.value)}
                  className={`${input} appearance-none`}
                  aria-label="Hour"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h} className="text-black">
                      {h}
                    </option>
                  ))}
                </select>
                <select
                  value={form.startM}
                  onChange={(e) => setTimePart('startM', e.target.value)}
                  className={`${input} appearance-none`}
                  aria-label="Minute"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m} className="text-black">
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={form.ampm}
                  onChange={(e) => setTimePart('ampm', e.target.value)}
                  className={`${input} appearance-none`}
                  aria-label="AM or PM"
                >
                  <option value="AM" className="text-black">
                    AM
                  </option>
                  <option value="PM" className="text-black">
                    PM
                  </option>
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/80">Duration</label>
              <input
                value={form.duration}
                onChange={(e) => setTimePart('duration', e.target.value)}
                placeholder="90 min"
                className={input}
              />
            </div>

            <p className="-mt-1 text-xs text-white/40 sm:col-span-2">
              Shown on the card as:{' '}
              <span className="font-semibold text-white/70">
                {sessionDateLabel(form) || '—'} · {form.time}
              </span>
            </p>
            <Text label="Webinar link" full value={form.link} onChange={(v) => set('link', v)} placeholder="https://zoom.us/j/…  ·  Teams / Google Meet link" cls={input} />
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
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {popupFor && (
        <PopupConfigModal
          webinar={popupFor}
          onClose={() => setPopupFor(null)}
          onSaved={onPopupSaved}
        />
      )}

      {regFor && (
        <RegistrationConfigModal
          webinar={regFor}
          onClose={() => setRegFor(null)}
          onSaved={onRegSaved}
        />
      )}
    </>
  )
}

/* ---------------- Popup notification config ---------------- */
// 12h ("5:00 PM") parts → 24h "HH:MM" for a native time input.
function to24h(startH, startM, ampm) {
  if (!startH || !ampm) return ''
  let h = Number(startH) % 12
  if (ampm.toUpperCase() === 'PM') h += 12
  return `${pad(h)}:${startM || '00'}`
}

// Best-guess popup defaults pulled from the webinar's own date/time/link.
function popupDefaults(w) {
  const p = parseTimeStr(w.time)
  const durMatch = (p.duration || '').match(/(\d+)/)
  const fromDate = w.dateISO || toISOFromDisplay(w.date) || ''
  return {
    active: true,
    title: w.title || '',
    singleDay: true,
    fromDate,
    toDate: fromDate,
    popupStartTime: '16:00',
    webinarStartTime: to24h(p.startH, p.startM, p.ampm) || '18:00',
    durationMinutes: durMatch ? Number(durMatch[1]) : 60,
    joinLink: w.link || '',
  }
}

function PopupConfigModal({ webinar, onClose, onSaved }) {
  const existing = webinar.popup
  const [cfg, setCfg] = useState(() => ({ ...popupDefaults(webinar), ...(existing || {}) }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const wasActive = Boolean(existing?.active)

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }))

  const input =
    'w-full rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-400/60'

  const persist = async (active) => {
    if (active) {
      if (!cfg.title.trim()) return setError('Title is required.')
      if (!cfg.fromDate) return setError('Pick a start date.')
      if (!cfg.singleDay && cfg.toDate && cfg.toDate < cfg.fromDate)
        return setError('The “To” date can’t be before the “From” date.')
      if (!cfg.popupStartTime || !cfg.webinarStartTime)
        return setError('Set both the popup start time and the webinar start time.')
      if (!cfg.joinLink.trim()) return setError('Add the join link the button should open.')
    }
    setError('')
    const payload = {
      ...cfg,
      active,
      toDate: cfg.singleDay ? cfg.fromDate : cfg.toDate || cfg.fromDate,
      durationMinutes: Number(cfg.durationMinutes) || 60,
    }
    setSaving(true)
    try {
      await savePopup(webinar.id, payload)
      onSaved(webinar.id, payload)
      onClose()
    } catch (err) {
      console.error('[admin] popup save failed →', err)
      setError('Could not save — is the API server running?')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative my-8 w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950 p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <Close width={18} height={18} />
        </button>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Bell width={20} height={20} className="text-claude-400" /> Popup notification
        </h2>
        <p className="mt-1 text-sm text-white/50">
          For <span className="font-semibold text-white/80">{webinar.title}</span>. All times are IST.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-white/80">Title</label>
            <input value={cfg.title} onChange={(e) => set('title', e.target.value)} className={input} />
          </div>

          {/* Single-day toggle */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => set('singleDay', !cfg.singleDay)}
              className="flex items-center gap-3"
            >
              <span
                className={`relative h-6 w-11 rounded-full transition ${
                  cfg.singleDay ? 'bg-brand-500' : 'bg-white/15'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    cfg.singleDay ? 'left-[1.375rem]' : 'left-0.5'
                  }`}
                />
              </span>
              <span className="text-sm font-medium text-white/80">Run for a single day only</span>
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white/80">
              {cfg.singleDay ? 'Date' : 'From'}
            </label>
            <input
              type="date"
              value={cfg.fromDate}
              onChange={(e) => set('fromDate', e.target.value)}
              className={`${input} [color-scheme:dark]`}
            />
          </div>
          {!cfg.singleDay && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/80">To</label>
              <input
                type="date"
                value={cfg.toDate}
                min={cfg.fromDate}
                onChange={(e) => set('toDate', e.target.value)}
                className={`${input} [color-scheme:dark]`}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white/80">Popup starts appearing</label>
            <input
              type="time"
              value={cfg.popupStartTime}
              onChange={(e) => set('popupStartTime', e.target.value)}
              className={`${input} [color-scheme:dark]`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white/80">Webinar start time</label>
            <input
              type="time"
              value={cfg.webinarStartTime}
              onChange={(e) => set('webinarStartTime', e.target.value)}
              className={`${input} [color-scheme:dark]`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white/80">Duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={cfg.durationMinutes}
              onChange={(e) => set('durationMinutes', e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white/80">Join link</label>
            <input
              value={cfg.joinLink}
              onChange={(e) => set('joinLink', e.target.value)}
              placeholder="https://teams.microsoft.com/…"
              className={input}
            />
          </div>

          {!cfg.singleDay && (
            <p className="-mt-1 text-xs text-white/40 sm:col-span-2">
              The popup repeats every day in this range using the same times.
            </p>
          )}
          {error && <p className="text-sm text-claude-400 sm:col-span-2">{error}</p>}

          <div className="mt-1 flex flex-wrap gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => persist(true)}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-claude-400 to-claude-600 px-6 py-3 text-sm font-bold text-black transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saving ? 'Saving…' : wasActive ? 'Save changes' : 'Activate popup'}
            </button>
            {wasActive && (
              <button
                type="button"
                onClick={() => persist(false)}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5 disabled:opacity-60"
              >
                Turn off
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Registration settings (seat cap + on/off + schedule) ---------------- */
// A pill toggle matching the popup modal's style.
function Toggle({ on, onClick, label }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3">
      <span className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-brand-500' : 'bg-white/15'}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[1.375rem]' : 'left-0.5'}`}
        />
      </span>
      <span className="text-sm font-medium text-white/80">{label}</span>
    </button>
  )
}

function RegistrationConfigModal({ webinar, onClose, onSaved }) {
  const cfg0 = regConfig(webinar)
  const [enabled, setEnabled] = useState(cfg0.enabled)
  const [capacity, setCapacity] = useState(String(cfg0.capacity))
  const [scheduled, setScheduled] = useState(Boolean(cfg0.opensAt || cfg0.closesAt))
  const [opensAt, setOpensAt] = useState(cfg0.opensAt || '')
  const [closesAt, setClosesAt] = useState(cfg0.closesAt || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const count = webinar.regCount || 0
  const isFull = count >= (Number(capacity) || 0)

  const input =
    'w-full rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-brand-400/60'

  const save = async () => {
    const cap = Number(capacity)
    if (!(cap > 0)) return setError('Seat cap must be at least 1.')
    if (scheduled && opensAt && closesAt && closesAt <= opensAt)
      return setError('The scheduled close time must be after the open time.')
    setError('')
    const payload = {
      enabled,
      capacity: Math.floor(cap),
      opensAt: scheduled ? opensAt : '',
      closesAt: scheduled ? closesAt : '',
    }
    setSaving(true)
    try {
      await saveRegistration(webinar.id, payload)
      onSaved(webinar.id, payload)
      onClose()
    } catch (err) {
      console.error('[admin] registration save failed →', err)
      setError('Could not save — is the API server running?')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative my-8 w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950 p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <Close width={18} height={18} />
        </button>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Users width={20} height={20} className="text-brand-400" /> Registration
        </h2>
        <p className="mt-1 text-sm text-white/50">
          For <span className="font-semibold text-white/80">{webinar.title}</span>. All times are IST.
        </p>

        {/* live count */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-sm text-white/70">
            <span className="text-lg font-bold text-white">{count}</span> of{' '}
            <span className="font-semibold text-white/80">{capacity || DEFAULT_CAPACITY}</span> seats taken
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* master on/off — explicit two-button control so a stray click can't
              silently flip the state (which a single slider toggle invited). */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-white/80">Registration</label>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setEnabled(true)}
                className={`rounded-full px-6 py-2 text-sm font-bold transition ${
                  enabled ? 'bg-brand-500 text-white shadow' : 'text-white/55 hover:text-white'
                }`}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => setEnabled(false)}
                className={`rounded-full px-6 py-2 text-sm font-bold transition ${
                  !enabled ? 'bg-red-500 text-white shadow' : 'text-white/55 hover:text-white'
                }`}
              >
                Closed
              </button>
            </div>
            <p className="mt-2 text-xs text-white/40">
              {enabled
                ? 'Open — students can register (until the seat cap is reached or any schedule below closes it).'
                : 'Closed — the session shows “Registration closed” on the site, regardless of seats or schedule.'}
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-white/80">Seat cap</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className={input}
              />
              <button
                type="button"
                onClick={() => setCapacity((c) => String((Number(c) || 0) + DEFAULT_CAPACITY))}
                className="shrink-0 rounded-xl border border-white/15 px-3 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/5"
                title={`Add ${DEFAULT_CAPACITY} more seats`}
              >
                +{DEFAULT_CAPACITY}
              </button>
            </div>
            <p className="mt-1 text-xs text-white/40">
              Registration <span className="text-white/60">auto-closes when the cap is reached</span> (one confirmation
              email per seat — matches the {DEFAULT_CAPACITY}/day mail limit).
              {isFull && (
                <>
                  {' '}
                  <span className="text-amber-300">This slot is full ({count}/{capacity}).</span> To take another batch,
                  tap <span className="text-white/60">+{DEFAULT_CAPACITY}</span> and save.
                </>
              )}
            </p>
          </div>

          {/* scheduled open/close */}
          <div className="sm:col-span-2 border-t border-white/10 pt-4">
            <Toggle
              on={scheduled}
              onClick={() => setScheduled((v) => !v)}
              label="Schedule when registration opens / closes"
            />
            {scheduled && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-white/80">Opens at</label>
                  <input
                    type="datetime-local"
                    value={opensAt}
                    onChange={(e) => setOpensAt(e.target.value)}
                    className={`${input} [color-scheme:dark]`}
                  />
                  <p className="mt-1 text-xs text-white/40">Leave blank to open immediately.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-white/80">Closes at</label>
                  <input
                    type="datetime-local"
                    value={closesAt}
                    min={opensAt || undefined}
                    onChange={(e) => setClosesAt(e.target.value)}
                    className={`${input} [color-scheme:dark]`}
                  />
                  <p className="mt-1 text-xs text-white/40">The 24h-before cutoff still applies, whichever is sooner.</p>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-claude-400 sm:col-span-2">{error}</p>}

          <div className="mt-1 sm:col-span-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
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