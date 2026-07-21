import { useMemo, useState } from 'react'
import { emailRe, mobileRe } from '../data/bookingForms'

// ============================================================================
// Registration Analytics (Phase 1 — read-only insights)
//
// Everything here is computed client-side from the webinar registrations the
// admin already loads. All date/time bucketing is done in IST, since that's the
// business timezone. Duplicate status uses the "keep-first" rule: the earliest
// registration for a (webinar + same email OR mobile) is the real one; later
// matching ones are flagged as duplicates.
// ============================================================================

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
const pad = (n) => String(n).padStart(2, '0')
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Break an ISO timestamp into IST calendar parts.
function istParts(iso) {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  const d = new Date(t + IST_OFFSET_MS)
  return {
    ms: t,
    y: d.getUTCFullYear(),
    mo: d.getUTCMonth(),
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    dow: d.getUTCDay(),
    dateKey: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
  }
}

// Today's IST date key, and the key N days ago.
function istTodayKey(offsetDays = 0) {
  const d = new Date(Date.now() + IST_OFFSET_MS + offsetDays * 86400000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

function prettyDate(key) {
  if (!key) return ''
  const [y, m, d] = key.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}

function domainOf(email) {
  const at = email.lastIndexOf('@')
  return at < 0 ? '' : email.slice(at + 1).toLowerCase()
}
function isEduDomain(d) {
  return /\.edu(\.|$)/.test(d) || /\.ac\./.test(d) || d.endsWith('.ac')
}
function domainBucket(email) {
  const d = domainOf(email)
  if (!d) return 'Other'
  if (d === 'gmail.com' || d === 'googlemail.com') return 'Gmail'
  if (d.includes('yahoo') || d === 'ymail.com' || d === 'rocketmail.com') return 'Yahoo'
  if (d.includes('outlook') || d.includes('hotmail') || d.startsWith('live.')) return 'Outlook'
  if (isEduDomain(d)) return 'Educational'
  return 'Other'
}

// ---------------------------------------------------------------------------
// UI primitives — all dependency-free (inline SVG / CSS), matching the site.
// ---------------------------------------------------------------------------

function Section({ title, subtitle, children, right }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-white/45">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function Kpi({ label, value, sub, accent }) {
  const ring = {
    brand: 'ring-brand-500/25 bg-brand-500/[0.07]',
    claude: 'ring-claude-500/25 bg-claude-500/[0.07]',
    amber: 'ring-amber-500/25 bg-amber-500/[0.07]',
    plain: 'ring-white/10 bg-white/[0.03]',
  }[accent || 'plain']
  const valColor = { brand: 'text-brand-300', claude: 'text-claude-300', amber: 'text-amber-300', plain: 'text-white' }[
    accent || 'plain'
  ]
  return (
    <div className={`rounded-2xl p-4 ring-1 ${ring}`}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-white/45">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valColor}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
    </div>
  )
}

// Horizontal ranked bars — best for rankings / categorical comparisons.
function BarList({ data, color = 'brand', max, empty = 'No data' }) {
  if (!data.length) return <Empty label={empty} />
  const top = max ?? Math.max(...data.map((d) => d.value), 1)
  const bar = color === 'claude' ? 'bg-claude-500/70' : 'bg-brand-500/70'
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-40 shrink-0 truncate text-xs text-white/70" title={d.label}>
            {d.label}
          </div>
          <div className="relative h-5 flex-1 overflow-hidden rounded bg-white/[0.04]">
            <div className={`h-full rounded ${bar}`} style={{ width: `${(d.value / top) * 100}%` }} />
          </div>
          <div className="w-10 shrink-0 text-right text-xs font-semibold text-white/80">{d.value}</div>
        </div>
      ))}
    </div>
  )
}

// Vertical bars for time trends (scrolls horizontally if there are many).
function VBars({ data, color = 'brand', empty = 'No data' }) {
  if (!data.length) return <Empty label={empty} />
  const top = Math.max(...data.map((d) => d.value), 1)
  const bar = color === 'claude' ? 'bg-claude-500/70' : 'bg-brand-500/70'
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-full items-end gap-1.5" style={{ height: 160 }}>
        {data.map((d) => (
          <div key={d.label} className="flex min-w-[26px] flex-1 flex-col items-center justify-end gap-1" title={`${d.label}: ${d.value}`}>
            <span className="text-[0.6rem] font-semibold text-white/60">{d.value || ''}</span>
            <div className={`w-full rounded-t ${bar}`} style={{ height: `${(d.value / top) * 130}px` }} />
            <span className="whitespace-nowrap text-[0.55rem] text-white/40">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// SVG donut with a legend — best for a small number of shares.
const DONUT_COLORS = ['#008737', '#d97757', '#3b82f6', '#eab308', '#a855f7', '#64748b', '#ec4899']
function Donut({ data, empty = 'No data' }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <Empty label={empty} />
  const r = 52
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0">
        <g transform="translate(70,70) rotate(-90)">
          {data.map((d, i) => {
            const frac = d.value / total
            const dash = frac * c
            const seg = (
              <circle
                key={d.label}
                r={r}
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth="16"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += dash
            return seg
          })}
        </g>
        <text x="70" y="66" textAnchor="middle" className="fill-white text-lg font-bold">
          {total}
        </text>
        <text x="70" y="82" textAnchor="middle" className="fill-white/40 text-[0.5rem] uppercase tracking-wider">
          total
        </text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="text-white/70">{d.label}</span>
            <span className="font-semibold text-white/90">{d.value}</span>
            <span className="text-white/40">({Math.round((d.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Day-of-week × hour heatmap.
function Heatmap({ grid, empty = 'No data' }) {
  const max = Math.max(...grid.flat(), 1)
  const anything = grid.flat().some((v) => v > 0)
  if (!anything) return <Empty label={empty} />
  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th />
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} className="text-[0.5rem] font-medium text-white/35">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, dow) => (
            <tr key={dow}>
              <td className="pr-1 text-right text-[0.6rem] font-semibold text-white/45">{DOW[dow]}</td>
              {row.map((v, h) => (
                <td key={h}>
                  <div
                    title={`${DOW[dow]} ${h}:00 — ${v} registration(s)`}
                    className="h-4 w-4 rounded-[3px]"
                    style={{
                      background: v ? `rgba(0,135,55,${0.15 + 0.85 * (v / max)})` : 'rgba(255,255,255,0.04)',
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Empty({ label }) {
  return <div className="grid place-items-center py-8 text-center text-sm text-white/35">{label}</div>
}

function Callout({ label, value, tone = 'brand' }) {
  const c = tone === 'claude' ? 'text-claude-300' : 'text-brand-300'
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[0.68rem] uppercase tracking-wider text-white/40">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${c}`}>{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reusable data table — sortable, searchable, paginated, column toggle.
// ---------------------------------------------------------------------------
function DataTable({ columns, rows, pageSize = 10, searchable = true, id = 'tbl' }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(0)
  const [hidden, setHidden] = useState(() => new Set())
  const [menu, setMenu] = useState(false)

  const cols = columns.filter((c) => !hidden.has(c.key))

  const searched = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => columns.some((c) => String(r[c.key] ?? '').toLowerCase().includes(s)))
  }, [rows, q, columns])

  const sorted = useMemo(() => {
    if (!sort.key) return searched
    const col = columns.find((c) => c.key === sort.key)
    const num = col?.numeric
    const arr = [...searched].sort((a, b) => {
      const av = a[sort.key] ?? ''
      const bv = b[sort.key] ?? ''
      if (num) return Number(av) - Number(bv)
      return String(av).localeCompare(String(bv))
    })
    return sort.dir === 'desc' ? arr.reverse() : arr
  }, [searched, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const clampPage = Math.min(page, pages - 1)
  const slice = sorted.slice(clampPage * pageSize, clampPage * pageSize + pageSize)

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  const toggleCol = (key) =>
    setHidden((h) => {
      const n = new Set(h)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {searchable ? (
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(0)
            }}
            placeholder="Search this table…"
            className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-400/60 sm:w-64"
          />
        ) : (
          <span />
        )}
        <div className="relative">
          <button
            onClick={() => setMenu((m) => !m)}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
          >
            Columns ▾
          </button>
          {menu && (
            <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-white/10 bg-neutral-900 p-2 shadow-xl">
              {columns.map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white/75 hover:bg-white/5">
                  <input type="checkbox" checked={!hidden.has(c.key)} onChange={() => toggleCol(c.key)} />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-[0.7rem] uppercase tracking-wider text-white/40">
              {cols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className={`cursor-pointer select-none px-3 py-2.5 font-semibold hover:text-white/70 ${c.numeric ? 'text-right' : ''}`}
                >
                  {c.label}
                  {sort.key === c.key && <span className="ml-1">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-3 py-8 text-center text-sm text-white/35">
                  No matching rows.
                </td>
              </tr>
            ) : (
              slice.map((r, i) => (
                <tr key={`${id}-${i}`} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  {cols.map((c) => (
                    <td key={c.key} className={`px-3 py-2.5 text-white/80 ${c.numeric ? 'text-right font-semibold' : ''}`}>
                      {r[c.key] ?? <span className="text-white/20">—</span>}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="mt-3 flex items-center justify-between text-xs text-white/50">
          <span>
            {clampPage * pageSize + 1}–{Math.min((clampPage + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, clampPage - 1))}
              disabled={clampPage === 0}
              className="rounded-md border border-white/15 px-2.5 py-1 hover:bg-white/5 disabled:opacity-30"
            >
              Prev
            </button>
            <span className="px-2">
              {clampPage + 1}/{pages}
            </span>
            <button
              onClick={() => setPage(Math.min(pages - 1, clampPage + 1))}
              disabled={clampPage >= pages - 1}
              className="rounded-md border border-white/15 px-2.5 py-1 hover:bg-white/5 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Date-range presets
// ---------------------------------------------------------------------------
const RANGE_PRESETS = [
  ['all', 'All time'],
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['thisMonth', 'This month'],
  ['lastMonth', 'Last month'],
  ['custom', 'Custom'],
]

// Returns [fromKey, toKey] inclusive (YYYY-MM-DD), or null for "all".
function rangeKeys(preset, customFrom, customTo) {
  const today = istTodayKey(0)
  if (preset === 'all') return null
  if (preset === 'today') return [today, today]
  if (preset === 'yesterday') {
    const y = istTodayKey(-1)
    return [y, y]
  }
  if (preset === '7d') return [istTodayKey(-6), today]
  if (preset === '30d') return [istTodayKey(-29), today]
  if (preset === 'thisMonth') {
    const [y, m] = today.split('-')
    return [`${y}-${m}-01`, today]
  }
  if (preset === 'lastMonth') {
    const [y, m] = today.split('-').map(Number)
    const lm = m === 1 ? 12 : m - 1
    const ly = m === 1 ? y - 1 : y
    const last = new Date(Date.UTC(ly, lm, 0)).getUTCDate()
    return [`${ly}-${pad(lm)}-01`, `${ly}-${pad(lm)}-${pad(last)}`]
  }
  if (preset === 'custom') {
    if (!customFrom && !customTo) return null
    return [customFrom || '0000-00-00', customTo || '9999-99-99']
  }
  return null
}

// ============================================================================
// Main component
// ============================================================================
export default function Analytics({ rows = [] }) {
  // Normalise once. Duplicate flags are computed on the FULL dataset (keep-first),
  // so a registration's duplicate status doesn't change when filters are applied.
  const records = useMemo(() => {
    const base = rows.map((r, i) => {
      const p = istParts(r.submittedAt)
      const email = String(r.email ?? '').trim().toLowerCase()
      const mobile = String(r.mobile ?? '').trim()
      return {
        _i: i,
        name: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
        email,
        mobile,
        college: String(r['Organization-College Name'] ?? '').trim(),
        webinar: String(r.webinar ?? '').trim(),
        session: String(r.sessionDate ?? '').trim(),
        submittedAt: r.submittedAt,
        parts: p,
        dup: false,
      }
    })
    // keep-first duplicate detection, per webinar, matching on email OR mobile
    const ordered = [...base].sort((a, b) => (a.parts?.ms || 0) - (b.parts?.ms || 0))
    const seen = new Map() // webinar -> { emails:Set, mobiles:Set }
    for (const rec of ordered) {
      const key = rec.webinar || '—'
      if (!seen.has(key)) seen.set(key, { emails: new Set(), mobiles: new Set() })
      const s = seen.get(key)
      const dupEmail = rec.email && s.emails.has(rec.email)
      const dupMobile = rec.mobile && s.mobiles.has(rec.mobile)
      if (dupEmail || dupMobile) rec.dup = true
      if (rec.email) s.emails.add(rec.email)
      if (rec.mobile) s.mobiles.add(rec.mobile)
    }
    return base
  }, [rows])

  // ---- filter state ----
  const [preset, setPreset] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [webinar, setWebinar] = useState('')
  const [session, setSession] = useState('')
  const [college, setCollege] = useState('')
  const [collegeQ, setCollegeQ] = useState('')
  const [domain, setDomain] = useState('')
  const [search, setSearch] = useState('')

  const webinarOptions = useMemo(
    () => [...new Set(records.map((r) => r.webinar).filter(Boolean))].sort(),
    [records]
  )
  // Sessions are scoped to the selected webinar.
  const sessionOptions = useMemo(() => {
    const pool = webinar ? records.filter((r) => r.webinar === webinar) : records
    return [...new Set(pool.map((r) => r.session).filter(Boolean))].sort()
  }, [records, webinar])
  const collegeOptions = useMemo(
    () => [...new Set(records.map((r) => r.college).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [records]
  )

  const range = rangeKeys(preset, customFrom, customTo)

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return records.filter((r) => {
      if (range && r.parts) {
        if (r.parts.dateKey < range[0] || r.parts.dateKey > range[1]) return false
      }
      if (webinar && r.webinar !== webinar) return false
      if (session && r.session !== session) return false
      if (college && r.college !== college) return false
      if (domain && domainBucket(r.email) !== domain) return false
      if (s && ![r.name, r.email, r.mobile, r.college].some((v) => v.toLowerCase().includes(s))) return false
      return true
    })
  }, [records, range, webinar, session, college, domain, search])

  const hasFilters =
    preset !== 'all' || webinar || session || college || domain || search.trim() || customFrom || customTo
  const resetAll = () => {
    setPreset('all')
    setCustomFrom('')
    setCustomTo('')
    setWebinar('')
    setSession('')
    setCollege('')
    setCollegeQ('')
    setDomain('')
    setSearch('')
  }

  // ---- derived metrics on the filtered set ----
  const m = useMemo(() => computeMetrics(filtered), [filtered])

  const selCls =
    'appearance-none rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm text-white/80 outline-none focus:border-brand-400/60'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Registration Analytics</h1>
        <p className="mt-1 text-sm text-white/50">
          Insights across all webinar registrations. Duplicates use the keep-first rule (earliest = real).
        </p>
      </div>

      {/* ---------------- Global filters ---------------- */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_PRESETS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setPreset(k)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                preset === k ? 'bg-white text-black' : 'border border-white/10 bg-white/[0.03] text-white/70 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={`${selCls} [color-scheme:dark]`} />
              <span className="text-white/40">→</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={`${selCls} [color-scheme:dark]`} />
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={webinar}
            onChange={(e) => {
              setWebinar(e.target.value)
              setSession('')
            }}
            className={selCls}
          >
            <option value="" className="text-black">All webinars</option>
            {webinarOptions.map((w) => (
              <option key={w} value={w} className="text-black">{w}</option>
            ))}
          </select>

          <select value={session} onChange={(e) => setSession(e.target.value)} className={selCls} disabled={!sessionOptions.length}>
            <option value="" className="text-black">All sessions</option>
            {sessionOptions.map((s) => (
              <option key={s} value={s} className="text-black">{s}</option>
            ))}
          </select>

          {/* searchable college dropdown */}
          <div className="relative">
            <input
              value={college || collegeQ}
              onChange={(e) => {
                setCollege('')
                setCollegeQ(e.target.value)
              }}
              placeholder="College…"
              className="w-48 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-400/60"
            />
            {collegeQ && !college && (
              <div className="absolute z-20 mt-1 max-h-56 w-64 overflow-y-auto rounded-xl border border-white/10 bg-neutral-900 p-1 shadow-xl">
                {collegeOptions
                  .filter((c) => c.toLowerCase().includes(collegeQ.toLowerCase()))
                  .slice(0, 40)
                  .map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCollege(c)
                        setCollegeQ('')
                      }}
                      className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-xs text-white/75 hover:bg-white/5"
                    >
                      {c}
                    </button>
                  ))}
                {!collegeOptions.some((c) => c.toLowerCase().includes(collegeQ.toLowerCase())) && (
                  <p className="px-2 py-1.5 text-xs text-white/35">No match</p>
                )}
              </div>
            )}
          </div>

          <select value={domain} onChange={(e) => setDomain(e.target.value)} className={selCls}>
            <option value="" className="text-black">All email domains</option>
            {['Gmail', 'Yahoo', 'Outlook', 'Educational', 'Other'].map((d) => (
              <option key={d} value={d} className="text-black">{d}</option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, mobile, college…"
            className="min-w-[200px] flex-1 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-400/60"
          />

          {hasFilters && (
            <button onClick={resetAll} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">
              Reset all
            </button>
          )}
        </div>

        {college && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs text-brand-200 ring-1 ring-brand-500/20">
            College: {college}
            <button onClick={() => setCollege('')} className="text-brand-200/70 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* ---------------- Export ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-white/50">
          Showing <span className="font-semibold text-white/80">{filtered.length}</span> registration(s)
          {hasFilters ? ' (filtered)' : ''}.
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCsv(filtered)} disabled={!filtered.length} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/5 disabled:opacity-40">
            CSV
          </button>
          <button onClick={() => exportExcel(filtered)} disabled={!filtered.length} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/5 disabled:opacity-40">
            Excel
          </button>
          <button onClick={() => exportPdf(filtered)} disabled={!filtered.length} className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/5 disabled:opacity-40">
            PDF
          </button>
        </div>
      </div>

      {/* ---------------- KPI summary ---------------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <Kpi label="Total Registrations" value={m.total} accent="plain" />
        <Kpi label="Real / Unique" value={m.real} sub={`${pct(m.real, m.total)}% of total`} accent="brand" />
        <Kpi label="Duplicates" value={m.dups} sub={`${pct(m.dups, m.total)}% of total`} accent="claude" />
        <Kpi label="Unique Emails" value={m.uniqEmails} />
        <Kpi label="Unique Mobiles" value={m.uniqMobiles} />
        <Kpi label="Unique Colleges" value={m.uniqColleges} />
        <Kpi label="Active Webinars" value={m.activeWebinars} />
        <Kpi label="Today" value={m.today} accent={m.today ? 'amber' : 'plain'} />
        <Kpi label="This Week" value={m.week} />
      </div>

      {/* ---------------- Registration trends ---------------- */}
      <Section title="Registration trends" subtitle="When registrations come in (IST)">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Daily</p>
            <VBars data={m.daily} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Hourly (0–23)</p>
            <VBars data={m.hourly} color="claude" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Weekly</p>
            <VBars data={m.weekly} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Monthly</p>
            <VBars data={m.monthly} color="claude" />
          </div>
        </div>
      </Section>

      {/* ---------------- Webinar analytics ---------------- */}
      <Section title="Webinar analytics" subtitle="Registrations by webinar and session">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Registrations by webinar</p>
            <BarList data={m.byWebinar} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Share of total</p>
            <Donut data={m.byWebinar.slice(0, 7)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              By session {webinar ? `— ${webinar}` : '(pick a webinar to scope)'}
            </p>
            <BarList data={m.bySession} color="claude" empty="Select a webinar above" />
          </div>
          <div className="flex flex-col gap-3">
            <Callout label="Most popular webinar" value={m.mostWebinar} />
            <Callout label="Least popular webinar" value={m.leastWebinar} tone="claude" />
          </div>
        </div>
      </Section>

      {/* ---------------- College analytics ---------------- */}
      <Section title="College analytics" subtitle={`${m.uniqColleges} colleges represented`}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Top colleges</p>
            <BarList data={m.byCollege.slice(0, 10)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              Colleges with only one registration ({m.singleColleges.length})
            </p>
            <BarList data={m.singleColleges.slice(0, 10).map((c) => ({ label: c, value: 1 }))} color="claude" empty="None" />
          </div>
        </div>
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Full college breakdown</p>
          <DataTable
            id="colleges"
            columns={[
              { key: 'college', label: 'College' },
              { key: 'count', label: 'Registrations', numeric: true },
            ]}
            rows={m.collegeRows}
          />
        </div>
      </Section>

      {/* ---------------- Repeat analytics ---------------- */}
      <Section title="Student / repeat analytics" subtitle="How many different webinars each person registered for (by email)">
        <BarList data={m.repeatBuckets} />
      </Section>

      {/* ---------------- Time-pattern ---------------- */}
      <Section title="Time-pattern analytics" subtitle="Registration activity by day & hour (IST)">
        <Heatmap grid={m.heat} />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Callout label="Peak day" value={m.peakDay} />
          <Callout label="Peak hour" value={m.peakHour} tone="claude" />
        </div>
      </Section>

      {/* ---------------- Email analytics ---------------- */}
      <Section title="Email analytics" subtitle="Where registrants' email addresses come from">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">By domain</p>
            <Donut data={m.domainSplit} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Personal vs Educational</p>
            <Donut data={m.eduSplit} />
          </div>
        </div>
      </Section>

      {/* ---------------- Duplicate detection ---------------- */}
      <Section title="Duplicate detection" subtitle="Existing duplicates in the current (filtered) data — keep-first rule">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Duplicate emails ({m.dupEmails.length})</p>
            <DataTable id="de" pageSize={6} searchable={false}
              columns={[{ key: 'value', label: 'Email' }, { key: 'count', label: 'Times', numeric: true }]}
              rows={m.dupEmails} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Duplicate mobiles ({m.dupMobiles.length})</p>
            <DataTable id="dm" pageSize={6} searchable={false}
              columns={[{ key: 'value', label: 'Mobile' }, { key: 'count', label: 'Times', numeric: true }]}
              rows={m.dupMobiles} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Duplicate email + webinar ({m.dupEmailWebinar.length})</p>
            <DataTable id="dew" pageSize={6} searchable={false}
              columns={[{ key: 'value', label: 'Email · Webinar' }, { key: 'count', label: 'Times', numeric: true }]}
              rows={m.dupEmailWebinar} />
          </div>
        </div>
      </Section>

      {/* ---------------- Data quality ---------------- */}
      <Section title="Data quality" subtitle="Issues worth cleaning up">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Kpi label="Blank fields" value={m.blankFields} accent={m.blankFields ? 'amber' : 'plain'} />
          <Kpi label="Invalid emails" value={m.invalidEmails} accent={m.invalidEmails ? 'amber' : 'plain'} />
          <Kpi label="Invalid mobiles" value={m.invalidMobiles} accent={m.invalidMobiles ? 'amber' : 'plain'} />
          <Kpi label="Missing college" value={m.missingCollege} accent={m.missingCollege ? 'amber' : 'plain'} />
          <Kpi label="Missing name" value={m.missingName} accent={m.missingName ? 'amber' : 'plain'} />
        </div>
      </Section>

      {/* ---------------- Leaderboards ---------------- */}
      <Section title="Leaderboards" subtitle="All the 'top' rankings in one place">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Top 10 colleges</p>
            <BarList data={m.byCollege.slice(0, 10)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Top 10 webinars</p>
            <BarList data={m.byWebinar.slice(0, 10)} color="claude" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Most active registrants</p>
            <BarList data={m.topRegistrants} empty="No repeat registrants" />
          </div>
        </div>
      </Section>
    </div>
  )
}

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)

// ---------------------------------------------------------------------------
// Metric computation — everything derived from the filtered record set.
// ---------------------------------------------------------------------------
function computeMetrics(recs) {
  const total = recs.length
  const dups = recs.filter((r) => r.dup).length
  const real = total - dups

  const countBy = (fn) => {
    const map = new Map()
    recs.forEach((r) => {
      const k = fn(r)
      if (k) map.set(k, (map.get(k) || 0) + 1)
    })
    return map
  }
  const ranked = (map) =>
    [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)

  const uniq = (fn) => new Set(recs.map(fn).filter(Boolean)).size

  // trends
  const dailyMap = countBy((r) => r.parts?.dateKey)
  const daily = [...dailyMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => ({ label: prettyDate(k), value: v }))
  const hourly = Array.from({ length: 24 }, (_, h) => ({ label: String(h), value: recs.filter((r) => r.parts?.hour === h).length }))
  const weekMap = countBy((r) => (r.parts ? weekKey(r.parts) : null))
  const weekly = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([k, v]) => ({ label: k.slice(5), value: v }))
  const monthMap = countBy((r) => (r.parts ? `${r.parts.y}-${pad(r.parts.mo + 1)}` : null))
  const monthly = [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => {
    const [y, mo] = k.split('-').map(Number)
    return { label: `${MONTHS[mo - 1]} '${String(y).slice(2)}`, value: v }
  })

  // webinar
  const webMap = countBy((r) => r.webinar)
  const byWebinar = ranked(webMap)
  const sessMap = countBy((r) => r.session)
  const bySession = ranked(sessMap)

  // college
  const colMap = countBy((r) => r.college)
  const byCollege = ranked(colMap)
  const collegeRows = byCollege.map((c) => ({ college: c.label, count: c.value }))
  const singleColleges = byCollege.filter((c) => c.value === 1).map((c) => c.label)

  // repeat (distinct webinars per email)
  const perEmail = new Map()
  recs.forEach((r) => {
    if (!r.email) return
    if (!perEmail.has(r.email)) perEmail.set(r.email, new Set())
    if (r.webinar) perEmail.get(r.email).add(r.webinar)
  })
  const buckets = { 1: 0, 2: 0, 3: 0, '4+': 0 }
  perEmail.forEach((set) => {
    const n = set.size || 1
    if (n >= 4) buckets['4+']++
    else buckets[n]++
  })
  const repeatBuckets = [
    { label: '1 webinar', value: buckets[1] },
    { label: '2 webinars', value: buckets[2] },
    { label: '3 webinars', value: buckets[3] },
    { label: '4+ webinars', value: buckets['4+'] },
  ]
  const topRegistrants = [...perEmail.entries()]
    .map(([email, set]) => ({ label: email, value: set.size }))
    .filter((r) => r.value > 1)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  // time-pattern heatmap 7x24
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0))
  recs.forEach((r) => {
    if (r.parts) heat[r.parts.dow][r.parts.hour]++
  })
  const dayTotals = heat.map((row) => row.reduce((s, v) => s + v, 0))
  const hourTotals = Array.from({ length: 24 }, (_, h) => recs.filter((r) => r.parts?.hour === h).length)
  const peakDayIdx = dayTotals.indexOf(Math.max(...dayTotals))
  const peakHourIdx = hourTotals.indexOf(Math.max(...hourTotals))
  const peakDay = total ? `${DOW[peakDayIdx]} (${dayTotals[peakDayIdx]})` : '—'
  const peakHour = total ? `${peakHourIdx}:00 (${hourTotals[peakHourIdx]})` : '—'

  // email
  const domMap = countBy((r) => (r.email ? domainBucket(r.email) : null))
  const domainSplit = ['Gmail', 'Yahoo', 'Outlook', 'Educational', 'Other']
    .map((d) => ({ label: d, value: domMap.get(d) || 0 }))
    .filter((d) => d.value)
  const eduCount = recs.filter((r) => r.email && isEduDomain(domainOf(r.email))).length
  const withEmail = recs.filter((r) => r.email).length
  const eduSplit = [
    { label: 'Educational', value: eduCount },
    { label: 'Personal', value: withEmail - eduCount },
  ].filter((d) => d.value)

  // duplicate detail lists
  const dupList = (fn) =>
    [...countBy(fn).entries()].filter(([, c]) => c > 1).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)
  const dupEmails = dupList((r) => r.email)
  const dupMobiles = dupList((r) => r.mobile)
  const dupEmailWebinar = dupList((r) => (r.email && r.webinar ? `${r.email} · ${r.webinar}` : null))

  // data quality
  const blankFields = recs.filter((r) => !r.name || !r.email || !r.mobile || !r.college).length
  const invalidEmails = recs.filter((r) => r.email && !emailRe.test(r.email)).length
  const invalidMobiles = recs.filter((r) => r.mobile && !mobileRe.test(r.mobile)).length
  const missingCollege = recs.filter((r) => !r.college).length
  const missingName = recs.filter((r) => !r.name).length

  const todayKey = istTodayKey(0)
  const weekAgo = istTodayKey(-6)

  return {
    total,
    real,
    dups,
    uniqEmails: uniq((r) => r.email),
    uniqMobiles: uniq((r) => r.mobile),
    uniqColleges: uniq((r) => r.college),
    activeWebinars: uniq((r) => r.webinar),
    today: recs.filter((r) => r.parts?.dateKey === todayKey).length,
    week: recs.filter((r) => r.parts && r.parts.dateKey >= weekAgo && r.parts.dateKey <= todayKey).length,
    daily,
    hourly,
    weekly,
    monthly,
    byWebinar,
    bySession,
    mostWebinar: byWebinar[0] ? `${byWebinar[0].label} (${byWebinar[0].value})` : '—',
    leastWebinar: byWebinar.length ? `${byWebinar[byWebinar.length - 1].label} (${byWebinar[byWebinar.length - 1].value})` : '—',
    byCollege,
    collegeRows,
    singleColleges,
    repeatBuckets,
    topRegistrants,
    heat,
    peakDay,
    peakHour,
    domainSplit,
    eduSplit,
    dupEmails,
    dupMobiles,
    dupEmailWebinar,
    blankFields,
    invalidEmails,
    invalidMobiles,
    missingCollege,
    missingName,
  }
}

// ISO-ish week key: the Monday of that record's week (YYYY-MM-DD).
function weekKey(parts) {
  const d = new Date(Date.UTC(parts.y, parts.mo, parts.day))
  const dow = (d.getUTCDay() + 6) % 7 // Mon=0
  d.setUTCDate(d.getUTCDate() - dow)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

// ---------------------------------------------------------------------------
// Export helpers (dependency-free)
// ---------------------------------------------------------------------------
const EXPORT_COLS = [
  ['name', 'Name'],
  ['email', 'Email'],
  ['mobile', 'Mobile'],
  ['college', 'College'],
  ['webinar', 'Webinar'],
  ['session', 'Session'],
  ['submittedAt', 'Submitted At'],
  ['dup', 'Duplicate'],
]

function exportRows(recs) {
  return recs.map((r) => ({
    name: r.name,
    email: r.email,
    mobile: r.mobile,
    college: r.college,
    webinar: r.webinar,
    session: r.session,
    submittedAt: r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN') : '',
    dup: r.dup ? 'Yes' : 'No',
  }))
}

function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function exportCsv(recs) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [EXPORT_COLS.map(([, l]) => esc(l)).join(',')]
  exportRows(recs).forEach((r) => lines.push(EXPORT_COLS.map(([k]) => esc(r[k])).join(',')))
  download(new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' }), 'registrations.csv')
}

// Excel via an HTML table — opens natively in Excel as .xls.
function exportExcel(recs) {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const head = EXPORT_COLS.map(([, l]) => `<th>${esc(l)}</th>`).join('')
  const body = exportRows(recs)
    .map((r) => `<tr>${EXPORT_COLS.map(([k]) => `<td>${esc(r[k])}</td>`).join('')}</tr>`)
    .join('')
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
  download(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), 'registrations.xls')
}

// PDF via a print window — the user picks "Save as PDF".
function exportPdf(recs) {
  const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const head = EXPORT_COLS.map(([, l]) => `<th>${esc(l)}</th>`).join('')
  const body = exportRows(recs)
    .map((r) => `<tr>${EXPORT_COLS.map(([k]) => `<td>${esc(r[k])}</td>`).join('')}</tr>`)
    .join('')
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<html><head><title>Registrations</title><style>
    body{font-family:Arial,sans-serif;padding:24px;color:#111}
    h1{font-size:18px} table{border-collapse:collapse;width:100%;font-size:11px;margin-top:12px}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:left} th{background:#f3f4f6}
  </style></head><body><h1>Registrations (${recs.length})</h1>
  <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
  <script>window.onload=function(){window.print()}<\/script></body></html>`)
  win.document.close()
}
