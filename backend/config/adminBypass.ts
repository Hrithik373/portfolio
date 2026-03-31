/**
 * Super-admin addresses always bypass all send cooldowns on the server,
 * in addition to comma-separated ADMIN_BYPASS_EMAILS in env.
 */
export const SUPER_ADMIN_EMAILS = ['hrithikgh@gmail.com'] as const

export function getAdminBypassEmails(): string[] {
  const fromEnv = (process.env.ADMIN_BYPASS_EMAILS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set([...SUPER_ADMIN_EMAILS, ...fromEnv])]
}

export function isAdminBypassEmail(email: string): boolean {
  return getAdminBypassEmails().includes(email.trim().toLowerCase())
}
