/**
 * Sends two contact requests in a row as the super admin — both should return 200
 * if the backend is up and SMTP is configured.
 *
 * Start the API first: npm run dev:server
 * Run: npx tsx backend/scripts/smoke-send-email-bypass.ts
 */
import 'dotenv/config'

const base = process.env.SMOKE_API_URL || 'http://localhost:8787'
const email = 'hrithikgh@gmail.com'

async function main() {
  for (let i = 1; i <= 2; i++) {
    const res = await fetch(`${base}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Super admin smoke test',
        email,
        subject: `Bypass smoke ${i} ${Date.now()}`,
        message: `Second request should not 429. Attempt ${i}.`,
        formType: 'contact',
      }),
    })
    const raw = await res.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = raw
    }
    console.log(`Request ${i}: HTTP ${res.status}`, parsed)
    if (res.status === 429) {
      console.error('FAIL: super admin should not hit cooldown')
      process.exit(1)
    }
    if (!res.ok && res.status !== 429) {
      console.error('NOTE: non-429 failure — check SMTP_USER / SMTP_PASS / server logs.')
    }
  }
  console.log('OK: no 429 on back-to-back super-admin contact sends.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
