import type { ParsedInboundEmail } from '../../../shared/types'

const pickString = (v: unknown, fallback = '') =>
  typeof v === 'string' ? v : fallback

/** Normalize webhook / provider payloads into a single inbound shape. */
export const parseEmail = (rawEmail: unknown): ParsedInboundEmail => {
  const root =
    rawEmail && typeof rawEmail === 'object'
      ? (rawEmail as Record<string, unknown>)
      : {}
  const data =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : {}

  const from = pickString(root.from, pickString(data.from))
  const subject =
    pickString(root.subject, pickString(data.subject)) || '(no subject)'
  const body = pickString(
    root.text,
    pickString(root.body, pickString(data.text, pickString(data.body))),
  )

  let sender = from.trim()
  let senderName = 'there'
  const angle = /^(.+?)\s*<([^>]+@[^>]+)>\s*$/.exec(from)
  if (angle) {
    senderName = angle[1].replace(/^["']|["']$/g, '').trim() || senderName
    sender = angle[2].trim()
  } else if (sender.includes('@')) {
    const local = sender.split('@')[0] ?? ''
    senderName = local.replace(/[._]/g, ' ').trim() || senderName
  }

  return {
    body: body.trim(),
    senderName,
    sender,
    subject: subject.trim(),
  }
}
