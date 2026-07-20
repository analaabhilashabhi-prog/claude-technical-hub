import mongoose from 'mongoose'

// The webinar/workshop library the admin manages. `id` is the client-side slug
// (e.g. "claude-foundations-lq3x1"). strict:false lets us keep any extra fields
// the frontend sends without schema churn.
const webinarSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    kind: String,
    title: String,
    date: String,
    dateISO: String,
    time: String,
    presenter: String,
    role: String,
    summary: String,
    description: String,
    poster: String, // base64 data URL (can be large)
  },
  { timestamps: true, strict: false }
)

// Every form submission (webinar registration or AI-lab request). We store the
// raw form payload under `data` so the admin table can render whatever fields
// the form config defines, without a rigid schema.
const bookingSchema = new mongoose.Schema({
  type: { type: String, index: true }, // 'webinar' | 'aiLab'
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  submittedAt: { type: Date, default: Date.now },
})

export const Webinar = mongoose.model('Webinar', webinarSchema)
export const Booking = mongoose.model('Booking', bookingSchema)

// The admin account for the dashboard login. Password is never stored in
// plain text — only a bcrypt hash. Created/updated via server/seed-admin.js.
const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
)

export const Admin = mongoose.model('Admin', adminSchema)