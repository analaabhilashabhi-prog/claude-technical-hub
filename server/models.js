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
// the form config defines, without a rigid schema. The normalized keys
// (emailNorm/mobileNorm/webinarId) are lifted to the top level so we can index
// them and enforce "no duplicate registration per webinar" at the DB layer.
const bookingSchema = new mongoose.Schema({
  type: { type: String, index: true }, // 'webinar' | 'aiLab'
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  submittedAt: { type: Date, default: Date.now },
  // canonical dedup keys (only set for webinar registrations)
  webinarId: { type: String },
  emailNorm: { type: String },
  mobileNorm: { type: String },
})

// Hard backstop against duplicate registrations, even under race conditions:
// the same webinar can't take the same normalized email or mobile twice. Partial
// filters keep these scoped to webinar rows that actually have the keys, so old
// records (and aiLab rows) are never affected.
bookingSchema.index(
  { webinarId: 1, emailNorm: 1 },
  { unique: true, partialFilterExpression: { type: 'webinar', webinarId: { $type: 'string' }, emailNorm: { $type: 'string' } } }
)
bookingSchema.index(
  { webinarId: 1, mobileNorm: 1 },
  { unique: true, partialFilterExpression: { type: 'webinar', webinarId: { $type: 'string' }, mobileNorm: { $type: 'string' } } }
)

// Audit trail for admin organization-name merges, so any merge is reversible.
// `changes` stores each affected booking's original name → one-click undo.
const mergeLogSchema = new mongoose.Schema(
  {
    field: { type: String, default: 'Organization-College Name' },
    to: String, // the final canonical name
    from: [String], // the variant names that were merged in
    count: Number, // records affected
    changes: [{ id: String, from: String }], // per-record original, for undo
    undone: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Webinar = mongoose.model('Webinar', webinarSchema)
export const Booking = mongoose.model('Booking', bookingSchema)
export const MergeLog = mongoose.model('MergeLog', mergeLogSchema)

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