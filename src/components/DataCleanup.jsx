import { useEffect, useMemo, useState } from 'react'
import { listOrgNames, mergeOrgs, listMergeLogs, undoMerge } from '../data/api'

// Admin tool: merge messy, free-typed organization names in the existing
// registration data into one canonical name. Fully human-decided (you pick the
// variants), and reversible (every merge is logged with each record's original
// name, so it can be undone).
export default function DataCleanup() {
  const [names, setNames] = useState([]) // [{ name, count }]
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    setLoading(true)
    setErr('')
    try {
      const [n, l] = await Promise.all([listOrgNames(), listMergeLogs()])
      setNames(n)
      setLogs(l)
    } catch (e) {
      setErr(e.status === 401 ? 'Session expired — please log in again.' : 'Could not load. Is the API server running?')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? names.filter((n) => n.name.toLowerCase().includes(s)) : names
  }, [names, q])

  const toggle = (name) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })

  const selectedList = [...selected]
  const affected = names.filter((n) => selected.has(n.name)).reduce((s, n) => s + n.count, 0)

  const doMerge = async () => {
    const t = target.trim()
    if (selectedList.length < 1 || !t) {
      setErr('Tick the variant names on the left and enter the final name.')
      return
    }
    if (!window.confirm(`Merge ${selectedList.length} name(s) — ${affected} registration(s) — into "${t}"?`)) return
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const r = await mergeOrgs(selectedList, t)
      setMsg(r.count ? `✓ Merged ${r.count} registration(s) into "${t}".` : r.message || 'Nothing to change.')
      setSelected(new Set())
      setTarget('')
      await load()
    } catch (e) {
      setErr(e.message || 'Merge failed.')
    } finally {
      setBusy(false)
    }
  }

  const doUndo = async (id) => {
    if (!window.confirm('Undo this merge? The original names will be restored.')) return
    setBusy(true)
    setErr('')
    try {
      await undoMerge(id)
      setMsg('Merge undone — original names restored.')
      await load()
    } catch (e) {
      setErr(e.message || 'Undo failed.')
    } finally {
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-brand-400/60'

  return (
    <>
      <h1 className="text-2xl font-bold text-white">Data Cleanup — Organization names</h1>
      <p className="mt-1 max-w-2xl text-sm text-white/50">
        Merge the same college/organization typed different ways (e.g. <span className="text-white/70">aditya univercity</span>,{' '}
        <span className="text-white/70">adityauniversity</span>) into one clean name. Tick the variants, type the final name, and merge.
        Every merge is reversible, and cleaned names immediately become the suggestions in the registration form.
      </p>

      {(msg || err) && (
        <div
          className={`mt-4 rounded-lg px-4 py-2.5 text-sm ${
            err ? 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20' : 'bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20'
          }`}
        >
          {err || msg}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: pick the variants */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">
              Organization names <span className="text-white/40">({names.length})</span>
            </h2>
            <button onClick={load} disabled={busy || loading} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-40">
              Refresh
            </button>
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names…" className={`${input} mb-3`} />

          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-white/10">
            {loading ? (
              <p className="p-8 text-center text-sm text-white/40">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="p-8 text-center text-sm text-white/40">{names.length ? 'No names match your search.' : 'No organization data yet.'}</p>
            ) : (
              filtered.map((n) => (
                <label
                  key={n.name}
                  className="flex cursor-pointer items-center gap-3 border-b border-white/5 px-3 py-2.5 last:border-0 hover:bg-white/[0.03]"
                >
                  <input type="checkbox" checked={selected.has(n.name)} onChange={() => toggle(n.name)} className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-sm text-white/85">{n.name}</span>
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">{n.count}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setTarget(n.name)
                    }}
                    title="Use as the final name"
                    className="shrink-0 rounded-md px-2 py-1 text-[0.65rem] font-semibold text-brand-300 hover:bg-brand-500/10"
                  >
                    Use as final
                  </button>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Right: merge action + history */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h2 className="text-sm font-semibold text-white">Merge selected → one name</h2>

            <div className="mt-3 min-h-[52px] rounded-xl border border-white/10 bg-white/[0.02] p-2">
              {selectedList.length === 0 ? (
                <p className="px-1 py-2 text-xs text-white/35">No names selected. Tick names on the left.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedList.map((name) => (
                    <span key={name} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">
                      {name}
                      <button onClick={() => toggle(name)} className="text-white/40 hover:text-white">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <label className="mt-4 block text-xs font-semibold text-white/70">Final name</label>
            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. Aditya University" className={`${input} mt-1.5`} />

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs text-white/45">
                {selectedList.length} name(s) · {affected} registration(s)
              </span>
              <button
                onClick={doMerge}
                disabled={busy || selectedList.length === 0 || !target.trim()}
                className="rounded-full bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40"
              >
                {busy ? 'Merging…' : 'Merge'}
              </button>
            </div>
          </div>

          {/* History / undo */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h2 className="text-sm font-semibold text-white">Recent merges</h2>
            {logs.length === 0 ? (
              <p className="mt-3 text-xs text-white/40">No merges yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white/85">
                        → <span className="font-semibold">{l.to}</span> <span className="text-white/40">({l.count})</span>
                      </p>
                      <p className="truncate text-xs text-white/40">{l.from.join(' · ')}</p>
                    </div>
                    {l.undone ? (
                      <span className="shrink-0 text-xs text-white/35">undone</span>
                    ) : (
                      <button onClick={() => doUndo(l.id)} disabled={busy} className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-40">
                        Undo
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
