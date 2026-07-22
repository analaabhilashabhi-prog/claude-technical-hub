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
export function emailHtml({ booking, event, gcalUrl, outUrl, assets = {} }) {
  // Brand palette — Technical Hub greens/yellow + Claude orange.
  const C = { thGreen: '#008737', thLime: '#7cc243', thYellow: '#f5b301', claude: '#d97757' }
  // Image srcs: data URIs in previews, cid: refs (matching ASSET_FILES keys) in real sends.
  const A = {
    claude: assets.claude || 'cid:claudemark',
    th: assets.th || 'cid:thmark',
    cal: assets.icCal || 'cid:iccal',
    clock: assets.icClock || 'cid:icclock',
    mic: assets.icMic || 'cid:icmic',
    link: assets.icLink || 'cid:iclink',
    check: assets.icCheck || 'cid:iccheck',
    calw: assets.icCalw || 'cid:iccalw',
  }
  const icon = (src, size = 17) =>
    `<img src="${src}" width="${size}" height="${size}" alt="" style="display:block;width:${size}px;height:${size}px;" />`

  const dPart = event.start.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
  const tPart = event.start.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit',
  })
  const whenText = `${dPart} &middot; ${tPart} IST`
  const durationText = fmtDuration(Math.round((event.end - event.start) / 60000))
  const host = booking.presenter
    ? esc(booking.presenter) + (booking.role ? ` &middot; ${esc(booking.role)}` : '')
    : ''
  const linkVal = event.joinUrl
    ? `<a href="${esc(event.joinUrl)}" style="color:${C.thLime};text-decoration:none;">${esc(event.joinUrl)}</a>`
    : `<span style="color:#8f8f8f;">Emailed before the session</span>`

  // One clean label/value row in the details card — no icons, generous spacing.
  const detailRow = (label, value, last) =>
    `<tr>
      <td style="padding:14px 0;${last ? '' : 'border-bottom:1px solid #202022;'}color:#86868c;font-size:13px;vertical-align:top;white-space:nowrap;">${label}</td>
      <td style="padding:14px 0 14px 22px;${last ? '' : 'border-bottom:1px solid #202022;'}color:#f0f0f2;font-size:14px;font-weight:600;text-align:right;vertical-align:top;">${value}</td>
    </tr>`

  const rows = [
    detailRow('When', whenText, false),
    durationText ? detailRow('Duration', durationText, false) : '',
    host ? detailRow('Host', host, false) : '',
    detailRow('Join link', linkVal, true),
  ].join('')

  // A single, quiet line about the session — kept short on purpose.
  const aboutBlock = booking.description
    ? `<p style="margin:26px 2px 0;line-height:1.75;color:#8f8f96;font-size:13.5px;">${esc(shortDesc(booking.description, 150))}</p>`
    : ''

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0a0a0b;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#e6e6e6;">
  <div style="max-width:560px;margin:0 auto;padding:44px 26px;">

    ${brandHeader({ claudeSrc: A.claude, thSrc: A.th })}

    <div style="margin-top:36px;">
      <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${C.thLime};font-weight:700;">You're registered</div>
      <h1 style="margin:13px 0 0;font-size:27px;line-height:1.22;font-weight:800;color:#ffffff;">Hey ${esc(booking.firstName) || 'there'}, you're in.</h1>
      <p style="margin:15px 0 0;font-size:15px;line-height:1.7;color:#a6a6ac;">
        Your seat is confirmed. Here's everything you need — we'll see you there.
      </p>
    </div>

    <div style="margin-top:32px;background:#141416;border:1px solid #232326;border-radius:16px;padding:26px 28px;">
      <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#86868c;font-weight:700;">Your webinar</div>
      <div style="margin-top:9px;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">${esc(event.title)}</div>
      <table width="100%" role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:16px;">
        ${rows}
      </table>
    </div>

    ${aboutBlock}

    <div style="margin-top:30px;">
      <a href="${gcalUrl}" target="_blank"
         style="display:inline-block;background:${C.thGreen};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;border-radius:999px;">
        Add to Google Calendar
      </a>
      <p style="margin:15px 0 0;font-size:12.5px;color:#77777d;line-height:1.7;">
        Prefer another app? <a href="${outUrl}" target="_blank" style="color:#9a9a9f;text-decoration:underline;">Add to Outlook</a> &middot; or open the attached <strong style="color:#9a9a9f;">invite.ics</strong>.
      </p>
    </div>

    <div style="margin-top:38px;border-top:1px solid #1c1c1e;padding-top:18px;">
      <p style="margin:0;font-size:12px;color:#6a6a70;line-height:1.6;">
        See you there — the Technical Hub team &middot; Claude Partner Network
      </p>
    </div>
  </div>
</body></html>`
}

// booking = the saved record (email, firstName, webinar, sessionDate, sessionDateISO, sessionTime, presenter, role, description, ...)
export async function sendWebinarConfirmation(booking) {
  const tx = await getTransport()
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

  // Inline the brand logos + line icons as cid: attachments (only ones present).
  // emailHtml references these same cids by default, so no assets map is needed.
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
    subject: `You're registered: ${event.title}`,
    html: emailHtml({ booking, event, gcalUrl, outUrl }),
    attachments,
    icalEvent: { filename: 'invite.ics', method: 'PUBLISH', content: ics },
  })
  const preview = ethereal ? nodemailer.getTestMessageUrl(info) : null
  console.log(`[mailer] welcome email → ${to}${preview ? `   preview: ${preview}` : ''}`)
}
