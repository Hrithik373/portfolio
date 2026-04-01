export type ConsentState = 'accepted' | 'denied' | null

const KEY = 'hg_cookie_consent'
const KEY_AT = 'hg_cookie_consent_at'

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
