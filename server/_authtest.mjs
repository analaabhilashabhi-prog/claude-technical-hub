// TEMP — verifies the Azure app creds get a Graph token, and checks whether
// Mail.Send app-consent is present. Safe to delete.
import 'dotenv/config'

const T = process.env.GRAPH_TENANT_ID
const C = process.env.GRAPH_CLIENT_ID
const S = process.env.GRAPH_CLIENT_SECRET

if (!T || !C || !S) {
  console.log('Missing GRAPH_* env vars'); process.exit(1)
}

const body = new URLSearchParams({
  client_id: C,
  client_secret: S,
  scope: 'https://graph.microsoft.com/.default',
  grant_type: 'client_credentials',
})

const res = await fetch(`https://login.microsoftonline.com/${T}/oauth2/v2.0/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
})
const json = await res.json()

if (!res.ok) {
  console.log('❌ LOGIN FAILED')
  console.log('   error:', json.error)
  console.log('   detail:', (json.error_description || '').split('\n')[0])
  process.exit(0)
}

console.log('✅ LOGIN OK — credentials are valid, token received.')

// Decode the JWT payload to read the granted app roles.
try {
  const payload = JSON.parse(Buffer.from(json.access_token.split('.')[1], 'base64').toString('utf8'))
  const roles = payload.roles || []
  console.log('   app id (appid):', payload.appid)
  console.log('   granted roles :', roles.length ? roles.join(', ') : '(none)')
  console.log(roles.includes('Mail.Send')
    ? '✅ Mail.Send consent is GRANTED — ready to send (just need GRAPH_SENDER mailbox).'
    : '❌ Mail.Send NOT in token — grant "Mail.Send" Application permission + admin consent in Azure.')
} catch (e) {
  console.log('   (could not decode token roles:', e.message, ')')
}
