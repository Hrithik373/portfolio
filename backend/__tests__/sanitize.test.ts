import { describe, it, expect, vi } from 'vitest'
import { sanitizeContactInput, sanitizeNewsletterInput, rejectHoneypot } from '../sanitize'
import type { Request, Response, NextFunction } from 'express'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRes() {
  const res = {} as Response
  ;(res as unknown as Record<string, unknown>).status = vi.fn().mockReturnValue(res)
  ;(res as unknown as Record<string, unknown>).json = vi.fn().mockReturnValue(res)
  return res
}

const VALID_CONTACT = {
  name: 'Alice Smith',
  email: 'alice@example.com',
  subject: 'Hello there',
  message: 'This is a test message with enough characters.',
}

const VALID_NEWSLETTER = {
  name: 'Bob',
  email: 'bob@example.com',
  note: 'Subscribe me please',
}

// ── sanitizeContactInput ──────────────────────────────────────────────────────

describe('sanitizeContactInput', () => {
  it('returns ok:true for valid input', () => {
    const result = sanitizeContactInput(VALID_CONTACT)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.name).toBe('Alice Smith')
      expect(result.data.email).toBe('alice@example.com')
    }
  })

  it('normalises email to lowercase', () => {
    const result = sanitizeContactInput({ ...VALID_CONTACT, email: 'Alice@EXAMPLE.COM' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.email).toBe('alice@example.com')
  })

  it('strips HTML tags', () => {
    const result = sanitizeContactInput({
      ...VALID_CONTACT,
      name: '<b>Alice</b>',
      message: '<script>alert("xss")</script>Legit message here.',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.name).toBe('Alice')
      expect(result.data.message).not.toContain('<script>')
      expect(result.data.message).not.toContain('</script>')
    }
  })

  it('strips javascript: protocol', () => {
    const result = sanitizeContactInput({ ...VALID_CONTACT, subject: 'javascript:alert(1)' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.subject).not.toContain('javascript:')
  })

  it('strips inline event handlers', () => {
    const result = sanitizeContactInput({ ...VALID_CONTACT, name: 'onclick=bad Alice' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.name).not.toMatch(/onclick\s*=/i)
  })

  // Name validation
  it('rejects missing name', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, name: '' }))
      .toMatchObject({ ok: false, error: 'Name is required.' })
  })

  it('rejects name over 100 chars', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, name: 'a'.repeat(101) }))
      .toMatchObject({ ok: false, error: 'Name too long (max 100 chars).' })
  })

  it('accepts name exactly 100 chars', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, name: 'a'.repeat(100) }))
      .toMatchObject({ ok: true })
  })

  // Email validation
  it('rejects missing email', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, email: '' }))
      .toMatchObject({ ok: false, error: 'Email is required.' })
  })

  it('rejects invalid email format', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, email: 'not-an-email' }))
      .toMatchObject({ ok: false, error: 'Invalid email address.' })
  })

  it('rejects email with double dots', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, email: 'test..user@example.com' }))
      .toMatchObject({ ok: false, error: 'Invalid email address.' })
  })

  it('rejects email longer than 254 chars', () => {
    const email = 'a'.repeat(245) + '@example.com'
    expect(sanitizeContactInput({ ...VALID_CONTACT, email }))
      .toMatchObject({ ok: false, error: 'Invalid email address.' })
  })

  it.each(['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'yopmail.com'])(
    'rejects disposable domain %s',
    (domain) => {
      expect(sanitizeContactInput({ ...VALID_CONTACT, email: `test@${domain}` }))
        .toMatchObject({ ok: false, error: 'Invalid email address.' })
    },
  )

  // Subject validation
  it('rejects missing subject', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, subject: '' }))
      .toMatchObject({ ok: false, error: 'Subject is required.' })
  })

  it('rejects subject over 200 chars', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, subject: 'x'.repeat(201) }))
      .toMatchObject({ ok: false, error: 'Subject too long (max 200 chars).' })
  })

  // Message validation
  it('rejects missing message', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, message: '' }))
      .toMatchObject({ ok: false, error: 'Message is required.' })
  })

  it('rejects message under 10 chars', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, message: 'short' }))
      .toMatchObject({ ok: false, error: 'Message too short.' })
  })

  it('accepts message exactly 10 chars', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, message: 'a'.repeat(10) }))
      .toMatchObject({ ok: true })
  })

  it('rejects message over 3000 chars', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, message: 'a'.repeat(3001) }))
      .toMatchObject({ ok: false, error: 'Message too long (max 3000 chars).' })
  })

  // Spam detection
  it('rejects message containing a URL', () => {
    expect(sanitizeContactInput({ ...VALID_CONTACT, message: 'Check out https://spam.com for more.' }))
      .toMatchObject({ ok: false, error: 'Message flagged as spam.' })
  })

  it.each(['casino', 'viagra', 'crypto', 'lottery', 'nft'])(
    'rejects message containing spam keyword "%s"',
    (word) => {
      expect(sanitizeContactInput({ ...VALID_CONTACT, message: `Win big ${word} now today!` }))
        .toMatchObject({ ok: false, error: 'Message flagged as spam.' })
    },
  )

  it.each(['buy now', 'click here', 'limited time', 'act now', 'free money'])(
    'rejects message containing spam phrase "%s"',
    (phrase) => {
      expect(sanitizeContactInput({ ...VALID_CONTACT, message: `${phrase} this is a test message` }))
        .toMatchObject({ ok: false, error: 'Message flagged as spam.' })
    },
  )
})

// ── sanitizeNewsletterInput ───────────────────────────────────────────────────

describe('sanitizeNewsletterInput', () => {
  it('returns ok:true for valid input', () => {
    expect(sanitizeNewsletterInput(VALID_NEWSLETTER)).toMatchObject({ ok: true })
  })

  it('allows empty note', () => {
    expect(sanitizeNewsletterInput({ ...VALID_NEWSLETTER, note: '' })).toMatchObject({ ok: true })
  })

  it('rejects note over 500 chars', () => {
    expect(sanitizeNewsletterInput({ ...VALID_NEWSLETTER, note: 'n'.repeat(501) }))
      .toMatchObject({ ok: false, error: 'Note too long (max 500 chars).' })
  })

  it('accepts note exactly 500 chars', () => {
    expect(sanitizeNewsletterInput({ ...VALID_NEWSLETTER, note: 'n'.repeat(500) }))
      .toMatchObject({ ok: true })
  })

  it('rejects missing name', () => {
    expect(sanitizeNewsletterInput({ ...VALID_NEWSLETTER, name: '' }))
      .toMatchObject({ ok: false, error: 'Name is required.' })
  })

  it('rejects invalid email', () => {
    expect(sanitizeNewsletterInput({ ...VALID_NEWSLETTER, email: 'bad-email' }))
      .toMatchObject({ ok: false })
  })

  it('strips HTML from note', () => {
    const result = sanitizeNewsletterInput({ ...VALID_NEWSLETTER, note: '<img src=x onerror=alert(1)>Nice site' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.note).not.toContain('<img')
  })
})

// ── rejectHoneypot ────────────────────────────────────────────────────────────

describe('rejectHoneypot', () => {
  function makeReq(body: Record<string, unknown>) {
    return { body } as Request
  }

  it('calls next() when honeypot fields are absent', () => {
    const next = vi.fn() as unknown as NextFunction
    rejectHoneypot(makeReq({ name: 'Alice', email: 'a@b.com' }), makeRes(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('calls next() when website field is empty string', () => {
    const next = vi.fn() as unknown as NextFunction
    rejectHoneypot(makeReq({ website: '' }), makeRes(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('silently returns 200 when website field is filled (bot trap)', () => {
    const next = vi.fn() as unknown as NextFunction
    const res = makeRes()
    rejectHoneypot(makeReq({ website: 'https://bot.com' }), res, next)
    expect(next).not.toHaveBeenCalled()
    expect((res as unknown as Record<string, ReturnType<typeof vi.fn>>).status).toHaveBeenCalledWith(200)
  })

  it('silently returns 200 when url field is filled', () => {
    const next = vi.fn() as unknown as NextFunction
    const res = makeRes()
    rejectHoneypot(makeReq({ url: 'https://spam.com' }), res, next)
    expect(next).not.toHaveBeenCalled()
    expect((res as unknown as Record<string, ReturnType<typeof vi.fn>>).status).toHaveBeenCalledWith(200)
  })

  it('silently returns 200 when phone2 field is filled', () => {
    const next = vi.fn() as unknown as NextFunction
    const res = makeRes()
    rejectHoneypot(makeReq({ phone2: '555-1234' }), res, next)
    expect(next).not.toHaveBeenCalled()
    expect((res as unknown as Record<string, ReturnType<typeof vi.fn>>).status).toHaveBeenCalledWith(200)
  })
})
