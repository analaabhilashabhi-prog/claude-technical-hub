// Sends the webinar registration confirmation email (branded header with the
// Claude + Technical Hub logos, session details, an "Add to calendar" action,
// and a .ics attachment). Activates only when SMTP_* env vars are set —
// otherwise it logs a notice and no-ops, so the app keeps working without email.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'
import { buildEvent, toICS, googleUrl, outlookUrl } from './calendar.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pub = (...p) => path.resolve(__dirname, '..', 'public', ...p)
// Every image is attached inline (via cid:) so it renders in real inboxes —
// email clients strip <svg> AND data: URIs, so logos + line icons are all PNGs.
// Keys are the cids referenced by emailHtml's defaults.
const ASSET_FILES = {
  claudemark: pub('claude-mark.png'), // Claude starburst
  thmark: path.resolve(__dirname, '..', 'src', 'assets', 'darklogo.png'), // full TH logo
}

const {
  SMTP_HOST = 'smtp.office365.com',
  SMTP_PORT = '587',
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM_NAME = 'Technical Hub',
  SMTP_BCC,
} = process.env

// ---- Microsoft Graph (app-only) sending — the method the organization uses.
// When TENANT_ID / CLIENT_ID / CLIENT_SECRET / ORG_EMAIL are all set, mail is sent
// through Microsoft Graph from the ORG_EMAIL mailbox (real delivery). Otherwise the
// nodemailer path is used (real SMTP if configured, else an Ethereal test inbox).
// Accept the org's env names (TENANT_ID/CLIENT_ID/CLIENT_SECRET/ORG_EMAIL) OR the
// GRAPH_*-prefixed equivalents — whichever the .env provides.
const TENANT_ID = process.env.TENANT_ID || process.env.GRAPH_TENANT_ID
const CLIENT_ID = process.env.CLIENT_ID || process.env.GRAPH_CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET || process.env.GRAPH_CLIENT_SECRET
const ORG_EMAIL = process.env.ORG_EMAIL || process.env.GRAPH_SENDER
const GRAPH_FROM_NAME = process.env.GRAPH_FROM_NAME || SMTP_FROM_NAME
const GRAPH_BCC = process.env.GRAPH_BCC || SMTP_BCC
export const graphReady = () => Boolean(TENANT_ID && CLIENT_ID && CLIENT_SECRET && ORG_EMAIL)

let graphToken = null
let graphTokenExp = 0

// Client-credentials access token, cached until ~1 min before it expires.
async function getGraphToken() {
  if (graphToken && graphTokenExp > Date.now() + 60000) return graphToken
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  })
  const r = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok || !data.access_token) {
    throw new Error(`token ${r.status}: ${data.error_description || data.error || 'no access_token'}`)
  }
  graphToken = data.access_token
  graphTokenExp = Date.now() + (data.expires_in || 3600) * 1000
  return graphToken
}

// Send one HTML email (with attachments) via Graph, as the ORG_EMAIL mailbox.
async function sendViaGraph({ to, subject, html, attachments = [] }) {
  const token = await getGraphToken()
  const message = {
    subject,
    body: { contentType: 'HTML', content: html },
    from: { emailAddress: { address: ORG_EMAIL, name: GRAPH_FROM_NAME } },
    toRecipients: [{ emailAddress: { address: to } }],
    attachments,
  }
  if (GRAPH_BCC) message.bccRecipients = [{ emailAddress: { address: GRAPH_BCC } }]
  const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(ORG_EMAIL)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, saveToSentItems: true }),
  })
  if (!r.ok) throw new Error(`sendMail ${r.status}: ${await r.text()}`)
}

// Graph attachments: the inline brand logos (referenced by cid in the HTML) + the
// .ics calendar invite. contentBytes must be base64.
function graphAttachments(ics) {
  const out = []
  for (const [cid, file] of Object.entries(ASSET_FILES)) {
    if (fs.existsSync(file)) {
      out.push({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: path.basename(file),
        contentType: 'image/png',
        isInline: true,
        contentId: cid,
        contentBytes: fs.readFileSync(file).toString('base64'),
      })
    }
  }
  out.push({
    '@odata.type': '#microsoft.graph.fileAttachment',
    name: 'invite.ics',
    contentType: 'text/calendar; method=PUBLISH',
    contentBytes: Buffer.from(ics, 'utf8').toString('base64'),
  })
  return out
}

let transportPromise = null
let mailFrom = null
let ethereal = false

// Resolve a transport once. Real SMTP if SMTP_USER/PASS are set; otherwise fall
// back to a free Ethereal test inbox so email works in dev with zero setup —
// nothing is delivered to real inboxes, but each send returns a preview URL.
async function getTransport() {
  if (transportPromise) return transportPromise
  transportPromise = (async () => {
    if (SMTP_USER && SMTP_PASS) {
      mailFrom = `"${SMTP_FROM_NAME}" <${SMTP_USER}>`
      return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465, // 587 = STARTTLS
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    }
    ethereal = true
    const acc = await nodemailer.createTestAccount()
    mailFrom = `"${SMTP_FROM_NAME}" <${acc.user}>`
    console.log('[mailer] No SMTP creds set — using an Ethereal TEST inbox. Emails are NOT delivered to real addresses; open the preview URLs logged on each send.')
    return nodemailer.createTransport({
      host: acc.smtp.host,
      port: acc.smtp.port,
      secure: acc.smtp.secure,
      auth: { user: acc.user, pass: acc.pass },
    })
  })()
  return transportPromise
}

export const isEthereal = () => ethereal
export function mailerReady() {
  return true // always — real SMTP if configured, else an Ethereal test inbox
}

// Minimal branded OTP email.
function otpHtml(code) {
  return `<!doctype html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:460px;margin:0 auto;padding:32px 24px;">
      <div style="background:#141414;border:1px solid #262626;border-radius:18px;overflow:hidden;">
        <div style="height:4px;background:linear-gradient(90deg,#008737,#7cc243,#f5b301,#d97757);"></div>
        <div style="padding:28px 30px 32px;color:#e5e5e5;">
          <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#fff;">Technical Hub</div>
          <p style="font-size:20px;margin:20px 0 8px;color:#fff;font-weight:800;">Verify your email</p>
          <p style="margin:0 0 22px;color:#b0b0b0;font-size:14px;line-height:1.6;">
            Enter this code to confirm your email and complete your webinar registration:
          </p>
          <div style="background:#0f0f0f;border:1px solid #272727;border-radius:12px;text-align:center;padding:18px 0;">
            <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#7cc243;">${esc(code)}</span>
          </div>
          <p style="margin:20px 0 0;color:#7a7a7a;font-size:12.5px;line-height:1.6;">
            This code expires in 10 minutes. If you didn't request it, you can ignore this email.
          </p>
        </div>
      </div>
    </div>
  </body></html>`
}

// Sends a 6-digit verification code. Returns { preview } (an Ethereal URL in
// test mode, null with real SMTP).
export async function sendOtpEmail(to, code) {
  const tx = await getTransport()
  const info = await tx.sendMail({
    from: mailFrom,
    to,
    subject: `Your Technical Hub verification code: ${code}`,
    html: otpHtml(code),
  })
  const preview = ethereal ? nodemailer.getTestMessageUrl(info) : null
  if (preview) console.log(`[mailer] OTP for ${to} → ${code}   preview: ${preview}`)
  return { preview }
}

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// The Claude + Technical Hub brand lockup that tops the email. `assets` maps
// logical names → image src (cid: refs for real sends, data: URIs for previews).
function brandHeader({ claudeSrc, thSrc }) {
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td align="left" valign="middle" style="padding:0;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>
              <td valign="middle" style="padding-right:11px;line-height:0;">
                <img src="${claudeSrc}" width="36" height="36" alt="Claude" style="display:block;width:36px;height:36px;" />
              </td>
              <td valign="middle">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:700;color:#ffffff;line-height:1;">Claude</div>
                <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#8f8f8f;margin-top:4px;">Partner&nbsp;Network</div>
              </td>
            </tr></table>
          </td>
          <td align="right" valign="middle" style="padding:0;">
            <span style="display:inline-block;background:#ffffff;border-radius:10px;padding:9px 14px;line-height:0;">
              <img src="${thSrc}" alt="Technical Hub" height="26" style="display:block;height:26px;width:auto;" />
            </span>
          </td>
        </tr>
      </table>`
}

// Trims a long description to its first sentence(s), ~190 chars — the email
// stays snappy while the full write-up lives on the site.
function shortDesc(text, maxLen = 190) {
  const t = String(text || '').trim()
  if (t.length <= maxLen) return t
  const sentences = t.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [t]
  let out = ''
  for (const s of sentences) {
    if (out && (out + s).trim().length > maxLen) break
    out += s
  }
  out = out.trim() || sentences[0].trim()
  if (out.length > maxLen + 40) out = out.slice(0, maxLen).replace(/\s+\S*$/, '') + '…'
  return out
}

// Formats a minute count as "45 minutes" / "2 hours" / "1 hr 30 min".
function fmtDuration(min) {
  if (!min || min < 1) return ''
  if (min < 60) return `${min} minutes`
  const h = Math.floor(min / 60)
  const m = min % 60
  if (m === 0) return `${h} hour${h > 1 ? 's' : ''}`
  return `${h} hr ${m} min`
}

// Exported so a preview script can render the exact same markup.
export function emailHtml({ booking, event, gcalUrl, outUrl, ref = '', assets = {} }) {
  // Brand palette — Technical Hub greens + a warm gold + Claude coral.
  const C = { green: '#008737', lime: '#7cc243', gold: '#e8b23a', claude: '#d97757' }
  // Image srcs: data URIs in previews, cid: refs (matching ASSET_FILES keys) in real sends.
  const A = {
    claude: assets.claude || 'cid:claudemark',
    th: assets.th || 'cid:thmark',
  }

  const dShort = event.start.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
  const tPart = event.start.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit',
  })
  const durationText = fmtDuration(Math.round((event.end - event.start) / 60000)) || '—'
  const kindUpper = (booking.kind ? String(booking.kind) : 'Session').toUpperCase()
  const fullName = [booking.firstName, booking.lastName].filter(Boolean).map(esc).join(' ') || 'Guest'
  const college = booking.college ? esc(booking.college) : ''
  const host = booking.presenter ? esc(booking.presenter) : ''
  const hostRole = booking.role ? esc(booking.role) : ''
  const joinUrl = event.joinUrl ? esc(event.joinUrl) : ''

  // A labelled cell in the ticket's fact grid. opts: { right, bottom } control dividers.
  const factCell = (label, value, opts = {}) =>
    `<td width="50%" valign="top" style="padding:15px 20px;${opts.right ? '' : 'border-right:1px solid #202024;'}${opts.bottom ? 'border-bottom:1px solid #202024;' : ''}">
      <div style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#7c7c85;font-weight:700;">${label}</div>
      <div style="margin-top:6px;font-size:15px;font-weight:700;color:#f1f1f4;line-height:1.35;">${value}</div>
    </td>`

  // Join info as one compact line under the ticket.
  const joinLine = joinUrl
    ? `<p style="margin:16px 2px 0;font-size:13px;color:#8f8f96;line-height:1.6;">Join link&nbsp;&nbsp;<a href="${joinUrl}" style="color:${C.lime};text-decoration:none;word-break:break-all;">${joinUrl}</a></p>`
    : `<p style="margin:16px 2px 0;font-size:13px;color:#8f8f96;line-height:1.6;">Your joining link will appear as a pop-up on <a href="https://claude.technicalhub.io" style="color:${C.lime};text-decoration:none;">claude.technicalhub.io</a> shortly before the session — keep an eye out.</p>`

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#08080a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#e6e6e6;">
  <div style="max-width:560px;margin:0 auto;padding:42px 26px;">

    ${brandHeader({ claudeSrc: A.claude, thSrc: A.th })}

    <div style="margin-top:34px;">
      <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${C.lime};font-weight:700;">Registration confirmed</div>
      <h1 style="margin:12px 0 0;font-size:26px;line-height:1.2;font-weight:800;color:#ffffff;">You're in, ${esc(booking.firstName) || 'there'}.</h1>
      <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#a6a6ac;">Your seat is reserved — here's your pass.</p>
    </div>

    <!-- The pass -->
    <div style="margin-top:26px;border:1px solid #26262c;border-radius:20px;overflow:hidden;background:#121214;">
      <div style="height:3px;background:linear-gradient(90deg,#008737,#7cc243,#e8b23a,#d97757);"></div>
      <div style="padding:20px 22px 15px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${C.lime};font-weight:800;">${kindUpper} PASS</td>
          <td align="right" style="font-size:10px;letter-spacing:.1em;color:#71717a;font-family:Menlo,Consolas,monospace;">${ref ? 'REF ' + esc(ref) : ''}</td>
        </tr></table>
        <div style="margin-top:11px;font-size:20px;font-weight:800;color:#ffffff;line-height:1.3;">${esc(event.title)}</div>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #202024;">
        <tr>
          ${factCell('Date', dShort, { bottom: true })}
          ${factCell('Time', `${tPart} IST`, { right: true, bottom: true })}
        </tr>
        <tr>
          ${factCell('Duration', durationText)}
          ${factCell(host ? 'Host' : 'Format', host || 'Online · Live', { right: true })}
        </tr>
      </table>
      <div style="border-top:1px dashed #34343a;background:#0e0e10;padding:15px 22px;">
        <div style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#7c7c85;font-weight:700;">Registered as</div>
        <div style="margin-top:4px;font-size:14px;color:#e6e6ea;font-weight:600;">${fullName}${college ? ` &nbsp;&middot;&nbsp; <span style="color:#9a9aa2;font-weight:500;">${college}</span>` : ''}</div>
      </div>
    </div>

    ${joinLine}

    <!-- Calendar CTA -->
    <div style="margin-top:26px;">
      <a href="${gcalUrl}" target="_blank"
         style="display:inline-block;background:${C.green};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:999px;">
        Add to Google Calendar
      </a>
      <p style="margin:13px 0 0;font-size:12.5px;color:#77777d;line-height:1.7;">
        Prefer another app? <a href="${outUrl}" target="_blank" style="color:#9a9a9f;text-decoration:underline;">Add to Outlook</a> &middot; or the attached <strong style="color:#9a9a9f;">invite.ics</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top:32px;border-top:1px solid #1c1c1f;padding-top:18px;">
      <p style="margin:0;font-size:12px;color:#6a6a70;line-height:1.7;">
        Questions? Just reply to this email. &nbsp;See you there — the Technical Hub team &middot; Claude Partner Network
      </p>
    </div>
  </div>
</body></html>`
}

// booking = the saved record (email, firstName, webinar, sessionDate, sessionDateISO, sessionTime, presenter, role, description, ...)
export async function sendWebinarConfirmation(booking) {
  const to = booking.email
  if (!to) return

  const event = buildEvent(booking)
  if (!event) {
    console.warn('[mailer] could not build calendar event for booking')
    return
  }
  const uid = `${crypto.randomUUID()}@technicalhub`
  const ics = toICS(event, uid)
  const gcalUrl = googleUrl(event)
  const outUrl = outlookUrl(event)
  // Short, stable confirmation reference for the pass (same per email+session).
  const ref = crypto
    .createHash('sha1')
    .update(`${to}|${booking.webinarId || ''}|${booking.sessionDateISO || booking.sessionDate || ''}`)
    .digest('hex')
    .slice(0, 6)
    .toUpperCase()

  const subject = `You're in: ${event.title}`
  const html = emailHtml({ booking, event, gcalUrl, outUrl, ref })

  // Preferred: Microsoft Graph (the organization's method) — real delivery.
  if (graphReady()) {
    await sendViaGraph({ to, subject, html, attachments: graphAttachments(ics) })
    console.log(`[mailer] welcome email (Graph) → ${to}`)
    return
  }

  // Fallback: nodemailer — real SMTP if configured, else an Ethereal test inbox.
  // Inline the brand logos as cid: attachments; emailHtml references these cids.
  const tx = await getTransport()
  const attachments = []
  for (const [cid, file] of Object.entries(ASSET_FILES)) {
    if (fs.existsSync(file)) {
      attachments.push({ filename: path.basename(file), path: file, cid })
    }
  }
  const info = await tx.sendMail({
    from: mailFrom,
    to,
    bcc: SMTP_BCC || undefined,
    subject,
    html,
    attachments,
    icalEvent: { filename: 'invite.ics', method: 'PUBLISH', content: ics },
  })
  const preview = ethereal ? nodemailer.getTestMessageUrl(info) : null
  console.log(`[mailer] welcome email → ${to}${preview ? `   preview: ${preview}` : ''}`)
}
