/**
 * Must stay in sync with backend `SUPER_ADMIN_EMAILS` so the contact form
 * client cooldown matches server bypass without relying only on env.
 */
export const SUPER_ADMIN_BYPASS_EMAILS = ['hrithikgh@gmail.com'] as const

export function getClientAdminBypassEmails(): string[] {
  const fromEnv = (import.meta.env.VITE_ADMIN_BYPASS_EMAILS || '')
    .split(',')
    .map((v: string) => v.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set([...SUPER_ADMIN_BYPASS_EMAILS.map((e) => e.toLowerCase()), ...fromEnv])]
}
