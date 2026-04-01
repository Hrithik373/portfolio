import { collectFingerprint } from './fingerprint'
import { apiUrl } from '../config/apiBase'
import { getConsent } from './cookie-consent'

let tracked = false

export async function trackVisitor(page: 'desktop' | 'mobile') {
  // Only track when the user has explicitly accepted — never on denial or pending
  if (getConsent() !== 'accepted') return
  if (tracked) return
  tracked = true

  try {
    const fp = await collectFingerprint()
    await fetch(apiUrl('/api/visitor'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _fp: fp,
        page,
        referrer: document.referrer || 'direct',
        url: window.location.href,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {}) // silent fail — never block the page
  } catch {
    // silent fail
  }
}
