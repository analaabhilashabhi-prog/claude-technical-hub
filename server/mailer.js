// Sends the webinar registration confirmation email (with an "Add to calendar"
// button + .ics attachment). Activates only when SMTP_* env vars are set —
// otherwise it logs a notice and no-ops, so the app keeps working without email.
import crypto from 'node:crypto'
import nodemailer from 'nodemailer'
import { buildEvent, toICS, googleUrl } from './calendar.js'

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

function emailHtml({ firstName, event, gcalUrl }) {
  const dateStr = event.start.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  return `<!doctype html>
<html><body style="margin:0;background:#0a0a0a;font-family:Segoe UI,Arial,sans-serif;color:#e5e5e5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:20px;font-weight:800;color:#fff;">Technical&nbsp;<span style="color:#008737;">Hub</span></div>
    <div style="margin-top:24px;background:#141414;border:1px solid #262626;border-radius:16px;padding:28px;">
      <p style="font-size:16px;margin:0 0 8px;color:#fff;">Hi ${esc(firstName) || 'there'},</p>
      <p style="margin:0 0 20px;line-height:1.6;color:#b5b5b5;">
        You're registered! Here are the details for your session:
      </p>
      <div style="border-left:3px solid #008737;padding:4px 0 4px 16px;margin-bottom:24px;">
        <div style="font-size:18px;font-weight:700;color:#fff;">${esc(event.title)}</div>
        <div style="margin-top:6px;color:#d97757;font-weight:600;">${esc(dateStr)} IST</div>
        <div style="margin-top:4px;color:#9a9a9a;">${
          event.joinUrl
            ? `🔗 <a href="${esc(event.joinUrl)}" style="color:#52b788;">Join link</a>`
            : esc(event.location)
        }</div>
      </div>
      <a href="${gcalUrl}" target="_blank"
         style="display:inline-block;background:linear-gradient(90deg,#008737,#1f9c5c);color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:999px;">
        📅 Add to my calendar
      </a>
      <p style="margin:18px 0 0;font-size:13px;color:#7a7a7a;line-height:1.6;">
        Prefer another app? The attached <strong>invite.ics</strong> file adds this event to Outlook, Apple Calendar, or any calendar app in one tap.
      </p>
    </div>
    <p style="margin:20px 4px 0;font-size:12px;color:#6a6a6a;">
      See you there — Technical Hub Team
    </p>
  </div>
</body></html>`
}

// booking = the saved record (email, firstName, webinar, sessionDate, sessionDateISO, sessionTime, presenter, ...)
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

  const from = `"${SMTP_FROM_NAME}" <${SMTP_USER}>`
  await tx.sendMail({
    from,
    to,
    bcc: SMTP_BCC || undefined,
    subject: `You're registered: ${event.title}`,
    html: emailHtml({ firstName: booking.firstName, event, gcalUrl }),
    icalEvent: { filename: 'invite.ics', method: 'PUBLISH', content: ics },
  })
  console.log(`[mailer] confirmation sent → ${to}`)
}
