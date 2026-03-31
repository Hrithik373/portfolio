/**
 * Verifies super-admin and env bypass lists (no SMTP).
 * Run: npx tsx backend/scripts/verify-admin-bypass.ts
 */
import 'dotenv/config'

import { getAdminBypassEmails, isAdminBypassEmail } from '../config/adminBypass'

const superEmail = 'hrithikgh@gmail.com'

console.log('Resolved bypass list:', getAdminBypassEmails())
console.log(`isAdminBypassEmail("${superEmail}")`, '=>', isAdminBypassEmail(superEmail))
console.log('isAdminBypassEmail("nobody@example.com") =>', isAdminBypassEmail('nobody@example.com'))

if (!isAdminBypassEmail(superEmail)) {
  console.error('FAIL: super admin should bypass')
  process.exit(1)
}
console.log('OK: super admin bypass configured.')
