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
  claudemark: pub('claude-mark.png'),                         // Claude starburst
  thmark: path.resolve(__dirname, '..', 'src', 'assets', 'darklogo.png'), // full TH logo
  iccal: pub('mail', 'calendar.png'),      // When   (TH lime)
  icclock: pub('mail', 'clock.png'),       // Duration (TH lime)
  icmic: pub('mail', 'mic.png'),           // Hosted by (TH lime)
  iclink: pub('mail', 'link.png'),         // Join link (TH lime)
  iccheck: pub('mail', 'check.png'),       // perks (Claude orange)
  iccalw: pub('mail', 'calendar-white.png'), // button (white)
}

const {
  SMTP_HOST = 'smtp.office365.com',
  SMTP_PORT = '587',
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM_NAME = 'Technical Hub',
  SMTP_BCC,
} = process.env

let transport = null
function getTransport() {
  if (transport) return transport
  if (!SMTP_USER || !SMTP_PASS) return null
  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // 587 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transport
}

export function mailerReady() {
  return Boolean(SMTP_USER && SMTP_PASS)
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

  // One divided row inside the details card — line icon + label, value on the right.
  const detailRow = (iconSrc, label, value, last) => {
    const edge = last ? '' : 'border-bottom:1px solid #242424;'
    return `<tr>
      <td style="padding:13px 0;${edge}vertical-align:middle;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:10px;line-height:0;vertical-align:middle;">${icon(iconSrc)}</td>
          <td style="vertical-align:middle;color:#8a8a8a;font-size:13px;white-space:nowrap;">${label}</td>
        </tr></table>
      </td>
      <td style="padding:13px 0;${edge}color:#ededed;font-size:14px;font-weight:600;text-align:right;vertical-align:middle;">${value}</td>
    </tr>`
  }

  const rows = [
    detailRow(A.cal, 'When', whenText, false),
    durationText ? detailRow(A.clock, 'Duration', durationText, false) : '',
    host ? detailRow(A.mic, 'Hosted by', host, false) : '',
    detailRow(A.link, 'Join link', linkVal, true),
  ].join('')

  const descBlock = booking.description
    ? `<div style="margin-bottom:26px;">
         <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8a8a8a;font-weight:700;margin-bottom:10px;">About this session</div>
         <p style="margin:0;line-height:1.7;color:#b0b0b0;font-size:14px;">${esc(shortDesc(booking.description))}</p>
       </div>`
    : ''

  // "Why join" — builds anticipation so registrants actually show up. Claude-orange accent.
  const perk = (text) =>
    `<tr>
       <td style="vertical-align:top;padding:7px 12px 7px 0;line-height:0;">${icon(A.check, 16)}</td>
       <td style="padding:6px 0;color:#cfcfcf;font-size:14px;line-height:1.55;">${text}</td>
     </tr>`
  const whyBlock = `
          <div style="background:#0f0f0f;border:1px solid #272727;border-radius:14px;padding:20px 22px;">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${C.claude};font-weight:700;margin-bottom:6px;">Why you'll want to be there</div>
            <p style="margin:0 0 12px;color:#a5a5a5;font-size:13px;line-height:1.6;">
              A live, hands-on session from the Technical&nbsp;Hub &times; Claude Partner Network — built to take you from curious to capable, whatever your starting point.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${perk('<strong style="color:#e6e6e6;">Learn by doing</strong> — follow along live and ask your questions in real time.')}
              ${perk('<strong style="color:#e6e6e6;">Led by Claude-certified architects</strong> who build with these tools every day.')}
              ${perk('<strong style="color:#e6e6e6;">Beginner-friendly</strong> — no prior AI experience needed to keep up.')}
            </table>
          </div>`

  // Session-info card (left column).
  const infoCard = `
          <div style="background:#0f0f0f;border:1px solid #272727;border-radius:14px;padding:6px 20px 10px;">
            <div style="padding-top:14px;">
              <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${C.thLime};font-weight:700;">Your Webinar</div>
              <div style="font-size:19px;font-weight:700;color:#ffffff;line-height:1.25;margin-top:7px;">${esc(event.title)}</div>
            </div>
            <table width="100%" role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:4px;">
              ${rows}
            </table>
          </div>`

  // Calendar CTA (left column, under the info card).
  const calBlock = `
          <div style="margin-top:20px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8a8a8a;font-weight:700;margin-bottom:12px;">Save your seat to your calendar</div>
          <a href="${gcalUrl}" target="_blank"
             style="display:inline-block;background:linear-gradient(90deg,${C.thGreen},#1f9c5c);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px;margin:0 8px 10px 0;">
            <span style="display:inline-block;vertical-align:middle;margin-right:8px;line-height:0;">${icon(A.calw, 16)}</span><span style="vertical-align:middle;">Add to Google Calendar</span>
          </a>
          <a href="${outUrl}" target="_blank"
             style="display:inline-block;background:#1f1f1f;border:1px solid #3a3a3a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px;margin:0 0 10px 0;">
            Add to Outlook
          </a>
          <p style="margin:10px 0 0;font-size:12.5px;color:#7a7a7a;line-height:1.6;">
            On Apple Calendar or another app? Open the attached <strong style="color:#9a9a9a;">invite.ics</strong> to add it in one tap.
          </p>`

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @media only screen and (max-width:620px){
    .wrap{max-width:100% !important;}
    .col{display:block !important;width:100% !important;padding:0 !important;box-sizing:border-box;}
    .col-l{margin-bottom:22px !important;}
  }
</style></head>
<body style="margin:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;color:#e5e5e5;">
  <div class="wrap" style="max-width:860px;margin:0 auto;padding:30px 24px;">

    ${brandHeader({ claudeSrc: A.claude, thSrc: A.th })}

    <div style="margin-top:16px;background:#141414;border:1px solid #262626;border-radius:18px;overflow:hidden;">
      <!-- accent bar — full brand spectrum: TH green → lime → yellow → Claude orange -->
      <div style="height:4px;background:linear-gradient(90deg,${C.thGreen},${C.thLime},${C.thYellow},${C.claude});"></div>
      <div style="padding:28px 32px 30px;">
        <span style="display:inline-block;background:#0e3b23;color:${C.thLime};font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:6px 13px;border-radius:999px;">You're registered</span>

        <p style="font-size:23px;margin:18px 0 10px;color:#ffffff;font-weight:800;line-height:1.2;">Hey ${esc(booking.firstName) || 'there'}, you're in!</p>
        <p style="margin:0 0 26px;line-height:1.6;color:#c4c4c4;font-size:14.5px;max-width:70ch;">
          Your seat is officially locked in — and honestly, we're pretty pumped to have you. Expect a fun, hands-on session where curiosity is more than welcome and no question is too small. Grab a coffee, bring your ideas, and let's build something cool together. Here's everything you need to show up ready:
        </p>

        <!-- Two-column body: details/calendar on the left, about/why on the right -->
        <table width="100%" role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td class="col col-l" width="47%" valign="top" style="vertical-align:top;padding-right:15px;">
              ${infoCard}
              ${calBlock}
            </td>
            <td class="col" width="53%" valign="top" style="vertical-align:top;padding-left:15px;">
              ${descBlock}
              ${whyBlock}
            </td>
          </tr>
        </table>
      </div>
    </div>

    <p style="margin:22px 4px 0;font-size:12px;color:#6a6a6a;line-height:1.6;">
      See you there — the Technical Hub team &middot; Claude Partner Network
    </p>
  </div>
</body></html>`
}

// booking = the saved record (email, firstName, webinar, sessionDate, sessionDateISO, sessionTime, presenter, role, description, ...)
export async function sendWebinarConfirmation(booking) {
  const tx = getTransport()
  if (!tx) {
    console.log('[mailer] SMTP not configured — skipping confirmation email')
    return
  }
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

  const from = `"${SMTP_FROM_NAME}" <${SMTP_USER}>`
  await tx.sendMail({
    from,
    to,
    bcc: SMTP_BCC || undefined,
    subject: `You're registered: ${event.title}`,
    html: emailHtml({ booking, event, gcalUrl, outUrl }),
    attachments,
    icalEvent: { filename: 'invite.ics', method: 'PUBLISH', content: ics },
  })
  console.log(`[mailer] confirmation sent → ${to}`)
}
