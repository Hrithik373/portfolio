import { isAdminBypassEmail } from '../config/adminBypass'
import { createPetalInstance } from '../data/petalInstance'
import { getAutoReplyText } from '../services/contact/autoReplyService'
import { createTransporter } from '../services/email/smtp'
import { getQuoteLead } from '../services/contact/quoteService'
import { getProfessionalSubject } from '../services/contact/subjectService'

const lastSentByEmail = new Map<string, number>()
const lastAdminAppByEmail = new Map<string, number>()
const lastAssistantWaitlistByEmail = new Map<string, number>()
const lastNewsletterByEmail = new Map<string, number>()
const cooldownMs = 12 * 60 * 60 * 1000
const adminAppCooldownMs = 72 * 60 * 60 * 1000
const assistantWaitlistCooldownMs = 7 * 24 * 60 * 60 * 1000
const newsletterSignupCooldownMs = 7 * 24 * 60 * 60 * 1000

type FormType = 'contact' | 'admin_application' | 'assistant_waitlist' | 'newsletter_signup'

const sanitize = (value: unknown) => String(value ?? '').trim()
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const toHtmlParagraphs = (value: string) =>
  `<p>${escapeHtml(value).split('\n\n').join('</p><p>')}</p>`.replace(/\n/g, '<br />')

/** Public links — keep in sync with portfolio Contact section */
const PORTFOLIO_SOCIALS = {
  linkedin: 'https://www.linkedin.com/in/hrithikgh29',
  github: 'https://github.com/Hrithik373',
  phoneDisplay: '+91-8420736098',
  phoneTel: '+918420736098',
} as const

function buildSignatureText(primaryEmail: string) {
  return (
    '\n\nKind regards,\n\n' +
    'Hrithik Ghosh\n' +
    `LinkedIn: ${PORTFOLIO_SOCIALS.linkedin}\n` +
    `GitHub: ${PORTFOLIO_SOCIALS.github}\n` +
    `Email: ${primaryEmail}\n` +
    `Phone: ${PORTFOLIO_SOCIALS.phoneDisplay}`
  )
}

function buildSignatureHtml(primaryEmail: string) {
  const safe = escapeHtml(primaryEmail)
  return (
    '<hr style="border:0;border-top:1px solid #f0c8d8;margin:18px 0" />' +
    '<p><strong>Kind regards,</strong></p>' +
    '<p><strong>Hrithik Ghosh</strong><br />' +
    `<a href="${PORTFOLIO_SOCIALS.linkedin}">LinkedIn</a> · ` +
    `<a href="${PORTFOLIO_SOCIALS.github}">GitHub</a> · ` +
    `<a href="mailto:${safe}">${safe}</a> · ` +
    `<a href="tel:${PORTFOLIO_SOCIALS.phoneTel}">${escapeHtml(PORTFOLIO_SOCIALS.phoneDisplay)}</a></p>`
  )
}

function buildAdminApplicationAcknowledgement(name: string, primaryEmail: string) {
  return (
    `Dear ${name},\n\n` +
    'Thank you for submitting an admin access request through my portfolio contact system.\n\n' +
    'I have received your request and am currently reviewing it. I will follow up with you directly at this email address once a decision has been made.\n\n' +
    'If approved, your address will be added to the server allowlist so future general contact messages are not subject to the standard send cooldown. This application channel uses its own separate limit and does not consume your regular contact quota.\n\n' +
    `For anything urgent, you may reach me at ${primaryEmail}.\n\n` +
    'This acknowledgement was sent automatically via Cherry Blossom Petal Bot on my behalf.'
  )
}

function buildAssistantWaitlistAcknowledgement(name: string, primaryEmail: string) {
  return (
    `Dear ${name},\n\n` +
    'Thank you for joining the interest list for the upcoming auto-replying assistant on my portfolio.\n\n' +
    'I have received your submission and am currently reviewing waitlist entries. When the feature is ready for testing, I may contact you at this address with next steps.\n\n' +
    'No further action is required from you at this time.\n\n' +
    `If you need to reach me sooner, please write to ${primaryEmail}.\n\n` +
    'This acknowledgement was sent automatically via Cherry Blossom Petal Bot on my behalf.'
  )
}

function buildNewsletterAcknowledgement(name: string, primaryEmail: string) {
  return (
    `Dear ${name},\n\n` +
    'Thank you for subscribing to updates about Vik AI, blog notes, and portfolio releases.\n\n' +
    'I have recorded your email for the newsletter list. You will hear from me when there is something worth sharing — no spam, just substance.\n\n' +
    `To unsubscribe or change preferences later, reply to this thread or write to ${primaryEmail}.\n\n` +
    'This acknowledgement was sent automatically via Cherry Blossom Petal Bot on my behalf.'
  )
}

export async function sendEmailHandler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const name = sanitize(req.body?.name)
  const email = sanitize(req.body?.email)
  const subject = sanitize(req.body?.subject)
  const message = sanitize(req.body?.message)
  const rawFormType = sanitize(req.body?.formType).toLowerCase()
  const formType: FormType =
    rawFormType === 'admin_application' ||
    rawFormType === 'assistant_waitlist' ||
    rawFormType === 'newsletter_signup'
      ? (rawFormType as FormType)
      : 'contact'

  if (!name || !email || !message || !subject) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email address.' })
  }

  const key = email.toLowerCase()

  const adminBypass = isAdminBypassEmail(key)

  if (formType === 'admin_application' && adminBypass) {
    return res.status(200).json({
      ok: true,
      alreadyAdmin: true,
      message: 'This email is already on the admin allowlist. Contact messages skip the cooldown.',
    })
  }

  if (!adminBypass) {
    if (formType === 'contact') {
      const lastSent = lastSentByEmail.get(key) ?? 0
      const remainingMs = cooldownMs - (Date.now() - lastSent)
      if (remainingMs > 0) {
        return res.status(429).json({
          message: 'Please wait before sending another message.',
          retryAfterMs: remainingMs,
        })
      }
    } else if (formType === 'admin_application') {
      const last = lastAdminAppByEmail.get(key) ?? 0
      const remainingMs = adminAppCooldownMs - (Date.now() - last)
      if (remainingMs > 0) {
        return res.status(429).json({
          message: 'You can submit another admin access request after the cooldown.',
          retryAfterMs: remainingMs,
        })
      }
    } else if (formType === 'assistant_waitlist') {
      const last = lastAssistantWaitlistByEmail.get(key) ?? 0
      const remainingMs = assistantWaitlistCooldownMs - (Date.now() - last)
      if (remainingMs > 0) {
        return res.status(429).json({
          message: 'You are already on the waitlist or recently signed up. Try again later.',
          retryAfterMs: remainingMs,
        })
      }
    } else if (formType === 'newsletter_signup') {
      const last = lastNewsletterByEmail.get(key) ?? 0
      const remainingMs = newsletterSignupCooldownMs - (Date.now() - last)
      if (remainingMs > 0) {
        return res.status(429).json({
          message: 'This email recently subscribed. Try again after the cooldown.',
          retryAfterMs: remainingMs,
        })
      }
    }
  }

  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const recipient = process.env.CONTACT_TO ?? 'hrithikgh29@gmail.com'
  const primaryEmail = recipient
  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'llama3-8b-8192'

  if (!smtpUser || !smtpPass) {
    return res.status(500).json({ message: 'Email service not configured.' })
  }

  const transporter = createTransporter(smtpUser, smtpPass)

  const { instanceId, petalVariant, quote } = createPetalInstance()

  let professionalSubject: string
  let autoReplyText: string

  if (formType === 'admin_application') {
    professionalSubject = 'Admin access request'
    autoReplyText = buildAdminApplicationAcknowledgement(name, primaryEmail)
  } else if (formType === 'assistant_waitlist') {
    professionalSubject = 'Assistant beta waitlist'
    autoReplyText = buildAssistantWaitlistAcknowledgement(name, primaryEmail)
  } else {
    professionalSubject = await getProfessionalSubject(subject, groqApiKey, groqModel)
    autoReplyText = await getAutoReplyText({
      name,
      subject,
      groqApiKey,
      groqModel,
    })
  }

  const formTag =
    formType === 'contact'
      ? 'Contact'
      : formType === 'admin_application'
        ? 'Admin application'
        : formType === 'assistant_waitlist'
          ? 'Assistant waitlist'
          : 'Newsletter'

  const ownerSubject =
    formType === 'contact'
      ? `${subject} · Cherry Blossom Petal · ${instanceId} · ${professionalSubject}`
      : `[${formTag}] ${subject} · ${instanceId} · ${professionalSubject}`

  const userSubject =
    formType === 'contact'
      ? `${subject} · Cherry Blossom Petal · We received your message · ${instanceId} · ${professionalSubject}`
      : formType === 'admin_application'
        ? `We received your admin access request · ${instanceId} · ${professionalSubject}`
        : formType === 'assistant_waitlist'
          ? `We received your assistant waitlist signup · ${instanceId} · ${professionalSubject}`
          : `We received your newsletter signup · ${instanceId} · ${professionalSubject}`

  await transporter.sendMail({
    from: `Cherry Blossom Petal Bot <${smtpUser}>`,
    to: recipient,
    replyTo: email,
    subject: ownerSubject,
    text:
      `Form: ${formTag}\n` +
      `Cherry Blossom Petal instance: ${instanceId}\n` +
      `Petal: ${petalVariant.name} (${petalVariant.color})\n` +
      `From: ${name} <${email}>\n` +
      `Subject line: ${subject}\n` +
      `Professional subject: ${professionalSubject}\n\n` +
      `${message}`,
    html:
      `<p><strong>Form:</strong> ${escapeHtml(formTag)}</p>` +
      `<p><strong>Cherry Blossom Petal instance:</strong> ${instanceId}</p>` +
      `<p><strong>Petal:</strong> ${petalVariant.name} (${petalVariant.color})</p>` +
      `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>` +
      `<p><strong>Subject line:</strong> ${escapeHtml(subject)}</p>` +
      `<p><strong>Professional subject:</strong> ${escapeHtml(professionalSubject)}</p>` +
      `<p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>`,
  })

  const signatureText = buildSignatureText(primaryEmail)
  const signatureHtml = buildSignatureHtml(primaryEmail)

  const followUpContactText =
    `\n\nIf you do not receive a reply within 24 hours, kindly email me directly at ${primaryEmail}.`

  const followUpContactHtml =
    `<p><strong><em>If you do not receive a reply within 24 hours, kindly email me directly at <a href="mailto:${escapeHtml(primaryEmail)}">${escapeHtml(primaryEmail)}</a>.</em></strong></p>`

  const followUpText = formType === 'contact' ? followUpContactText : ''
  const followUpHtml = formType === 'contact' ? followUpContactHtml : ''

  const quoteLead = getQuoteLead(key, instanceId)
  const quoteBlockText = `\n\n${quoteLead}\n${quote}`

  const quoteBlockHtml =
    `<p><strong>${escapeHtml(quoteLead)}</strong></p>` +
    `<p>${escapeHtml(quote)}</p>`

  const referenceText =
    `\n\nReference\nInstance: ${instanceId}\nPetal: ${petalVariant.name} (${petalVariant.color})`

  const referenceHtml =
    `<p><strong>Reference</strong><br />` +
    `Instance: ${instanceId}<br />` +
    `Petal: ${petalVariant.name} (${petalVariant.color})</p>`

  await transporter.sendMail({
    from: `Cherry Blossom Petal Bot <${smtpUser}>`,
    to: email,
    replyTo: primaryEmail,
    subject: userSubject,
    text:
      `${autoReplyText}` +
      `${quoteBlockText}` +
      `${followUpText}` +
      `${referenceText}` +
      `${signatureText}`,
    html:
      `${toHtmlParagraphs(autoReplyText)}` +
      `${quoteBlockHtml}` +
      `${followUpHtml}` +
      `${referenceHtml}` +
      `${signatureHtml}`,
  })

  if (!adminBypass) {
    if (formType === 'contact') {
      lastSentByEmail.set(key, Date.now())
    } else if (formType === 'admin_application') {
      lastAdminAppByEmail.set(key, Date.now())
    } else if (formType === 'assistant_waitlist') {
      lastAssistantWaitlistByEmail.set(key, Date.now())
    } else if (formType === 'newsletter_signup') {
      lastNewsletterByEmail.set(key, Date.now())
    }
  }

  return res.status(200).json({
    ok: true,
    instanceId,
    formType,
    petal: {
      name: petalVariant.name,
      color: petalVariant.color,
    },
  })
}
