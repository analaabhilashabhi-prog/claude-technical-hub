// One-off local script — creates (or updates the password of) the admin
// account directly in your MongoDB database. Run it yourself, locally:
//   node server/seed-admin.js "yourUsername" "yourPassword"
import 'dotenv/config'
import dns from 'node:dns'
// Some networks (college/office WiFi, certain routers) refuse the DNS SRV lookup
// that mongodb+srv:// needs. Force a public resolver so Atlas always resolves.
dns.setServers(['8.8.8.8', '1.1.1.1'])
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { Admin } from './models.js'

const [username, password] = process.argv.slice(2)

if (!username || !password) {
  console.error('Usage: node server/seed-admin.js "yourUsername" "yourPassword"')
  process.exit(1)
}

const URI = process.env.MONGODB_URI
if (!URI) {
  console.error('[seed-admin] Missing MONGODB_URI in your .env file.')
  process.exit(1)
}

const passwordHash = bcrypt.hashSync(password, 10)

mongoose
  .connect(URI)
  .then(async () => {
    await Admin.updateOne({ username }, { $set: { username, passwordHash } }, { upsert: true })
    console.log(`\n[seed-admin] Admin user "${username}" saved to MongoDB. You can log in with it now.\n`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('[seed-admin] Failed:', err.message)
    process.exit(1)
  })