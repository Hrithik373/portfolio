/**
 * In dev, leave `VITE_API_BASE_URL` unset so requests stay same-origin and Vite proxies `/api` → backend (port 8787).
 * For static hosting, set `VITE_API_BASE_URL` to your API origin (no trailing slash), e.g. `https://api.example.com`.
 */
export function apiUrl(path: string): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  const base = typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/** Avoid dumping HTML 404 pages into the transcript UI. */
export function friendlyApiErrorMessage(status: number, raw: string): string {
  const t = raw.trim()
  if (t.includes('<!DOCTYPE') || /Cannot (POST|GET|PUT|DELETE)/i.test(t)) {
    return 'No API on this URL. Run npm run dev (starts site + backend), or npm run dev:client with npm run dev:server in another terminal. For vite preview, run dev:server too.'
  }
  if (t.length > 0 && t.length < 400 && !t.startsWith('<')) return t
  return `Request failed (HTTP ${status}).`
}
