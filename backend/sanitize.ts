/**
 * Input Sanitization & Validation — for /api/send-email and /api/newsletter
 * Place this file at: server/sanitize.ts
 *
 * Usage:
 *   import { sanitizeContactInput, sanitizeNewsletterInput, rejectHoneypot } from './sanitize'
 *
 *   app.post('/api/send-email', rejectHoneypot, async (req, res) => {
 *     const result = sanitizeContactInput(req.body)
 *     if (!result.ok) return res.status(400).json({ error: result.error })
 *     // ... send email with result.data
 *   })
 */

import type { Request, Response, NextFunction } from 'express'

/* ── HTML / script tag stripper ── */
function stripTags(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')           // Remove HTML tags
    .replace(/javascript:/gi, '')       // Remove JS protocol
    .replace(/on\w+\s*=/gi, '')        // Remove event handlers (onclick=, etc)
    .replace(/data:/gi, '')             // Remove data: URIs
    .replace(/&#/g, '')                 // Remove HTML entities
    .trim()
}

/* ── Email validator (strict) ── */
function isValidEmail(email: string): boolean {
  // Reject obvious garbage
  if (email.length > 254) return false
  if (email.includes('..')) return false

  // RFC 5322 simplified
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!re.test(email)) return false

  // Must have a TLD
  const parts = email.split('@')
  if (parts.length !== 2) return false
  if (!parts[1].includes('.')) return false
  if (parts[1].endsWith('.')) return false

  // Block common disposable email domains
  const disposable = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email', 'yopmail.com', '10minutemail.com', 'trashmail.com']
  const domain = parts[1].toLowerCase()
  if (disposable.includes(domain)) return false

  return true
}

/* ── Spam content detector ── */
function isSpamContent(text: string): boolean {
  const lower = text.toLowerCase()
  const spamPatterns = [
    /\b(viagra|cialis|crypto|nft|casino|lottery|winner|congratulations)\b/i,
    /\b(buy now|click here|limited time|act now|free money)\b/i,
    /https?:\/\/[^\s]+/g, // Any URL in contact form = suspicious
  ]
  return spamPatterns.some((p) => p.test(lower))
}

/* ── Contact form sanitizer ── */
type ContactInput = {
  name: string
  email: string
  subject: string
  message: string
}

type SanitizeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function sanitizeContactInput(body: Record<string, unknown>): SanitizeResult<ContactInput> {
  const name = stripTags(String(body.name ?? '').trim())
  const email = stripTags(String(body.email ?? '').trim()).toLowerCase()
  const subject = stripTags(String(body.subject ?? '').trim())
  const message = stripTags(String(body.message ?? '').trim())

  if (!name) return { ok: false, error: 'Name is required.' }
  if (name.length > 100) return { ok: false, error: 'Name too long (max 100 chars).' }
  if (!email) return { ok: false, error: 'Email is required.' }
  if (!isValidEmail(email)) return { ok: false, error: 'Invalid email address.' }
  if (!subject) return { ok: false, error: 'Subject is required.' }
  if (subject.length > 200) return { ok: false, error: 'Subject too long (max 200 chars).' }
  if (!message) return { ok: false, error: 'Message is required.' }
  if (message.length > 3000) return { ok: false, error: 'Message too long (max 3000 chars).' }
  if (message.length < 10) return { ok: false, error: 'Message too short.' }

  if (isSpamContent(name + ' ' + subject + ' ' + message)) {
    return { ok: false, error: 'Message flagged as spam.' }
  }

  return { ok: true, data: { name, email, subject, message } }
}

/* ── Newsletter signup sanitizer ── */
type NewsletterInput = {
  name: string
  email: string
  note: string
}

export function sanitizeNewsletterInput(body: Record<string, unknown>): SanitizeResult<NewsletterInput> {
  const name = stripTags(String(body.name ?? '').trim())
  const email = stripTags(String(body.email ?? '').trim()).toLowerCase()
  const note = stripTags(String(body.note ?? '').trim())

  if (!name) return { ok: false, error: 'Name is required.' }
  if (name.length > 100) return { ok: false, error: 'Name too long.' }
  if (!email) return { ok: false, error: 'Email is required.' }
  if (!isValidEmail(email)) return { ok: false, error: 'Invalid email.' }
  if (note.length > 500) return { ok: false, error: 'Note too long (max 500 chars).' }

  return { ok: true, data: { name, email, note } }
}

/* ── Honeypot middleware — add a hidden field called "website" to your forms.
     Bots auto-fill it, humans don't see it. Reject if it has a value. ── */
export function rejectHoneypot(req: Request, res: Response, next: NextFunction): void {
  const honeypot = req.body?.website || req.body?.url || req.body?.phone2
  if (honeypot) {
    // Return 200 so bots think they succeeded (don't reveal the trap)
    res.status(200).json({ success: true })
    return
  }
  next()
}
