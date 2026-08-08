/**
 * In dev, leave `VITE_VIK_API_BASE_URL` unset so requests stay same-origin
 * and Vite proxies `/vik-api` → Kong (port 8000, which routes `/api/agent/*`
 * to svc-agent — see vite.config.ts and vik/gateway/kong.yml).
 *
 * Vik's backend has no public deployment yet (see vik/ARCHITECTURE.md §9 —
 * Tier 1 hosting doesn't exist), so there is intentionally no production
 * default here. On the deployed site, `vikApiUrl()` still resolves to a
 * same-origin path, and the fetch will simply fail — VikChatPanel handles
 * that as a first-class "offline" state, not an error to hide.
 */
export function vikApiUrl(path: string): string {
  const raw = import.meta.env.VITE_VIK_API_BASE_URL
  const base = typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
  const p = path.startsWith('/') ? path : `/${path}`

  if (!base) {
    // Same-origin dev proxy: /vik-api/* -> rewritten to /api/* on Kong (:8000).
    return `/vik-api${p}`
  }
  // A real deployed Vik origin, once one exists: hit its Kong gateway's
  // /api/* route directly, no /vik-api prefix (there's no dev proxy to
  // rewrite it in production).
  return `${base}/api${p}`
}
