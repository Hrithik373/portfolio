export type ConsentState = 'accepted' | 'denied' | null

// Bump this version string to force all existing users to re-consent
// (old key is automatically cleared on load)
const VERSION = 'v2'
const KEY = `hg_cookie_consent_${VERSION}`
const KEY_AT = `hg_cookie_consent_at_${VERSION}`

// Clear any stale keys from previous versions on first load
const STALE_KEYS = ['hg_cookie_consent', 'hg_cookie_consent_at', 'hg_cookie_consent_v1', 'hg_cookie_consent_at_v1']
try { STALE_KEYS.forEach((k) => localStorage.removeItem(k)) } catch {}

export function getConsent(): ConsentState {
  try {
    return (localStorage.getItem(KEY) as ConsentState) ?? null
  } catch {
    return null
  }
}

export function setConsent(state: 'accepted' | 'denied'): void {
  try {
    localStorage.setItem(KEY, state)
    localStorage.setItem(KEY_AT, new Date().toISOString())
  } catch {}
}

export function clearConsent(): void {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(KEY_AT)
  } catch {}
}
