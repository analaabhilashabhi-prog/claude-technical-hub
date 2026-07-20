import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Admin } from './models.js'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error(
    '\n[server] Missing JWT_SECRET in .env — admin login will not work until it is set. ' +
      'See .env.example.\n'
  )
}

// POST /api/admin/login — looks the username up in MongoDB, checks the
// password against the stored bcrypt hash, and if valid returns a signed
// token the frontend must send on every admin request.
export async function login(req, res) {
  try {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Admin login is not configured on the server' })
    }

    const admin = await Admin.findOne({ username })
    if (!admin) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const validPassword = bcrypt.compareSync(password, admin.passwordHash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const token = jwt.sign({ sub: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' })
    res.json({ token, expiresIn: '12h' })
  } catch (err) {
    console.error('[server] login error:', err.message)
    res.status(500).json({ error: 'Login failed, please try again' })
  }
}

// Middleware — protects any route it's attached to. Requires a valid
// "Authorization: Bearer <token>" header signed with our JWT_SECRET.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    req.admin = jwt.verify(token, JWT_SECRET)
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Session expired, please log in again' })
  }
}