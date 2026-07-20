import { useState } from 'react'
import { adminLogin, setAdminToken } from '../data/api'
import logo from '../assets/darklogo.png'

export default function AdminLogin({ onSuccess, notice }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Enter both a username and password.')
      return
    }
    setLoading(true)
    try {
      const { token } = await adminLogin(username.trim(), password)
      setAdminToken(token)
      onSuccess()
    } catch (err) {
      setError(err.status === 401 ? 'Incorrect username or password.' : 'Could not log in right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white/90">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img src={logo} alt="Technical Hub" className="h-9 w-auto" />
          <span className="rounded-full bg-claude-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-claude-400 ring-1 ring-claude-500/20">
            Admin sign in
          </span>
        </div>

        {notice && (
          <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-300 ring-1 ring-amber-500/20">
            {notice}
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/60">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-claude-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/60">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-claude-400"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <a href="#" className="mt-6 block text-center text-xs text-white/40 hover:text-white/60">
          ← Back to site
        </a>
      </div>
    </div>
  )
}