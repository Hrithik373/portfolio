import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { type FormEvent, useRef, useState } from 'react'

import { apiUrl } from '../../../../config/apiBase'
import { Field } from '../Field/Field'
import type { SectionProps } from '../SectionTypes'
import { dayGlassSection, nightGlassSection } from '../sectionGlass'

type ToastType = 'success' | 'error' | 'info'

type ToastState = { type: ToastType; message: string } | null

function formToastSurface(type: ToastType, isNight: boolean) {
  if (isNight) {
    if (type === 'success') {
      return 'border-pink-300/60 bg-pink-500/10 text-parchment/90 shadow-[0_0_18px_rgba(255,182,193,0.45)]'
    }
    if (type === 'info') {
      return 'border-pink-300/50 bg-black/40 text-parchment/85 shadow-[0_0_18px_rgba(255,182,193,0.45)]'
    }
    return 'border-rose-300/60 bg-rose-500/10 text-rose-100 shadow-[0_0_18px_rgba(255,182,193,0.45)]'
  }
  if (type === 'success') {
    return 'border-emerald-300/50 bg-emerald-50/95 text-emerald-900 shadow-[0_4px_16px_rgba(16,185,129,0.15)]'
  }
  if (type === 'info') {
    return 'border-rose-200/60 bg-rose-50/95 text-rose-900 shadow-[0_4px_16px_rgba(244,114,182,0.12)]'
  }
  return 'border-rose-300/55 bg-rose-50/95 text-rose-900 shadow-[0_4px_16px_rgba(244,63,94,0.12)]'
}

function FormToastRail({
  toast,
  idleText,
  isNight,
}: {
  toast: ToastState
  idleText: string
  isNight: boolean
}) {
  return (
    <div className="flex min-h-[44px] max-w-[min(100%,220px)] flex-1 items-center justify-end sm:max-w-[220px]">
      <AnimatePresence mode="wait">
        {toast ? (
          <motion.div
            key={toast.message}
            className={`rounded-xl border px-3 py-2 text-[0.68rem] leading-relaxed ${formToastSurface(toast.type, isNight)}`}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </motion.div>
        ) : (
          <motion.p
            key="idle"
            className={`text-right text-[0.68rem] leading-relaxed ${
              isNight ? 'text-parchment/70' : 'text-[color:var(--dawn-muted)]'
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {idleText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/** No opacity:0 on the wrapper — the block sits below the main form, so strict in-view thresholds left it invisible. */
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function contactCardShimmer(reduced: boolean) {
  if (reduced) return null
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.55]"
      style={{
        background:
          'linear-gradient(115deg, transparent 28%, rgba(245,198,214,0.28) 45%, transparent 58%, rgba(245,198,214,0.14) 72%, transparent 92%)',
        backgroundSize: '240% 100%',
      }}
      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
      aria-hidden
    />
  )
}

type Props = Pick<SectionProps, 'theme'> & {
  inputClass: string
  isValidEmail: (value: string) => boolean
}

export function ContactProgramCards({ theme, inputClass, isValidEmail }: Props) {
  const isNight = theme === 'night'
  const reduced = useReducedMotion() ?? false
  const [adminSending, setAdminSending] = useState(false)
  const [assistantSending, setAssistantSending] = useState(false)
  const [adminToast, setAdminToast] = useState<ToastState>(null)
  const [assistantToast, setAssistantToast] = useState<ToastState>(null)
  const adminToastTimerRef = useRef(0)
  const assistantToastTimerRef = useRef(0)

  const showCardToast = (card: 'admin' | 'assistant', type: ToastType, message: string) => {
    if (card === 'admin') {
      setAdminToast({ type, message })
      window.clearTimeout(adminToastTimerRef.current)
      adminToastTimerRef.current = window.setTimeout(() => setAdminToast(null), 5000)
    } else {
      setAssistantToast({ type, message })
      window.clearTimeout(assistantToastTimerRef.current)
      assistantToastTimerRef.current = window.setTimeout(() => setAssistantToast(null), 5000)
    }
  }

  const cardShell = `relative overflow-hidden p-5 text-sm transition-transform duration-300 hover:-translate-y-1 ${
    isNight ? `${nightGlassSection} text-parchment/95` : `${dayGlassSection} text-[color:var(--dawn-text)]`
  }`

  const glowTop = isNight
    ? 'bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.28),_transparent_60%)] opacity-70'
    : 'bg-[radial-gradient(circle_at_50%_0%,_rgba(244,114,182,0.14),_transparent_55%)] opacity-90'

  const titleClass = `text-[0.62rem] font-semibold uppercase tracking-[0.22em] ${
    isNight ? 'text-parchment/80' : 'text-[color:var(--dawn-muted)]'
  }`

  const bodyClass = `mt-2 text-[0.8rem] leading-relaxed ${
    isNight ? 'text-parchment/88' : 'text-[color:var(--dawn-text)]/95'
  }`

  const btnClass = `group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.62rem] font-medium tracking-[0.18em] uppercase transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${
    isNight
      ? 'border-white/[0.18] bg-black/40 text-parchment/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/25 hover:bg-black/55 focus-visible:ring-white/25'
      : 'border-rose-300/55 bg-gradient-to-r from-rose-50/95 via-pink-50/95 to-rose-50/90 text-[color:var(--dawn-text)] shadow-[0_4px_20px_rgba(244,114,182,0.22)] hover:from-rose-100/95 hover:via-pink-50/95 hover:to-rose-100/90 focus-visible:ring-rose-400/50'
  }`

  const parseResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || ''
    return contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => '')
  }

  const handleSpecialSubmit = async (
    formType: 'admin_application' | 'assistant_waitlist',
    event: FormEvent<HTMLFormElement>,
    setSending: (v: boolean) => void
  ) => {
    event.preventDefault()
    const form = event.currentTarget
    const card = formType === 'admin_application' ? 'admin' : 'assistant'
    if (formType === 'admin_application' ? adminSending : assistantSending) return

    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    let message = String(formData.get('message') ?? '').trim()
    const subject =
      formType === 'admin_application' ? 'Admin access request' : 'Assistant beta waitlist'

    if (formType === 'assistant_waitlist' && !message) {
      message = 'Please add me to the assistant beta waitlist.'
    }

    if (!name || !email || !message) {
      showCardToast(card, 'error', 'Please fill in every field before submitting.')
      return
    }
    if (!isValidEmail(email)) {
      showCardToast(card, 'error', 'Invalid email address.')
      return
    }

    try {
      setSending(true)
      const response = await fetch(apiUrl('/api/send-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, formType }),
      })
      const data = await parseResponse(response)

      if (!response.ok) {
        if (response.status === 404) {
          showCardToast(card, 'error', 'Email service is not running.')
          return
        }
        const retryAfterMs =
          typeof data === 'object' && data && 'retryAfterMs' in data ? Number(data.retryAfterMs) : null
        if (response.status === 429 && retryAfterMs && Number.isFinite(retryAfterMs)) {
          const hours = Math.floor(retryAfterMs / 3600000)
          const minutes = Math.ceil((retryAfterMs % 3600000) / 60000)
          showCardToast(card, 'info', `Please try again in ${hours}h ${minutes}m.`)
          return
        }
        const messageText =
          typeof data === 'object' && data && 'message' in data ? String(data.message) : ''
        showCardToast(card, 'error', messageText || 'Something went wrong. Try again shortly.')
        return
      }

      if (typeof data === 'object' && data && 'alreadyAdmin' in data && data.alreadyAdmin) {
        showCardToast(
          card,
          'info',
          String(data.message ?? 'This email is already on the admin allowlist.')
        )
        form.reset()
        return
      }

      form.reset()
      if (typeof data === 'object' && data && 'instanceId' in data && 'petal' in data) {
        const petal = data.petal as { name?: string; color?: string }
        const color = petal?.color ? ` (${petal.color})` : ''
        showCardToast(
          card,
          'success',
          `Received · instance ${String(data.instanceId)} · ${petal?.name ?? 'Petal'}${color}`
        )
      } else {
        showCardToast(card, 'success', 'Submitted successfully.')
      }
    } catch {
      showCardToast(card, 'error', 'Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      className="mt-10 grid min-w-0 gap-6 lg:mt-14 lg:grid-cols-[repeat(3,minmax(0,1fr))]"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 'some', margin: '0px 0px 180px 0px' }}
    >
      <motion.p
        variants={item}
        className={`col-span-full -mb-1 text-center text-[0.72rem] font-medium uppercase tracking-[0.28em] ${
          isNight ? 'text-parchment/65' : 'text-[color:var(--dawn-muted)]'
        }`}
      >
        Programs &amp; system
      </motion.p>
        {/* Admin application */}
        <motion.div
          variants={item}
          className={`min-w-0 ${cardShell}`}
          whileHover={reduced ? undefined : { y: -3, rotate: -0.25 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
          {contactCardShimmer(reduced)}
          <div
            className={`pointer-events-none absolute -inset-6 rounded-3xl blur-2xl ${glowTop}`}
            aria-hidden
          />
          {!isNight && (
            <div
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/70 to-transparent"
              aria-hidden
            />
          )}
          <div className="relative z-10">
            <h3 className={titleClass}>Admin access</h3>
            <p className={bodyClass}>
              Apply for allowlisted access. After manual approval, your email is added to{' '}
              <code
                className={`rounded px-1 py-0.5 text-[0.7rem] not-italic ${
                  isNight ? 'bg-black/25 text-pink-100/90' : 'bg-rose-100/70 text-rose-900/90'
                }`}
              >
                ADMIN_BYPASS_EMAILS
              </code>{' '}
              so general contact messages skip the 12-hour cooldown. This form uses a separate 72-hour
              cooldown and does not consume your contact quota.
            </p>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => handleSpecialSubmit('admin_application', e, setAdminSending)}
            >
              <div className="grid min-w-0 gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
                <Field label="Name" id="admin-app-name" theme={theme}>
                  <input id="admin-app-name" name="name" className={inputClass} required autoComplete="name" />
                </Field>
                <Field label="Email" id="admin-app-email" theme={theme}>
                  <input
                    id="admin-app-email"
                    name="email"
                    type="email"
                    className={inputClass}
                    required
                    autoComplete="email"
                  />
                </Field>
              </div>
              <Field label="Context (role, use case)" id="admin-app-message" theme={theme}>
                <textarea
                  id="admin-app-message"
                  name="message"
                  rows={3}
                  className={`${inputClass} resize-none`}
                  required
                  placeholder="Briefly describe why you need uncapped contact access…"
                />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button type="submit" disabled={adminSending} className={btnClass}>
                  <motion.span
                    className={`h-2 w-2 rounded-full ${isNight ? 'bg-sakura-pink/90' : 'bg-gradient-to-br from-rose-400 to-pink-400'}`}
                    whileTap={{ scale: 1.2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                  />
                  {adminSending ? 'Sending…' : 'Submit application'}
                </button>
                <FormToastRail
                  toast={adminToast}
                  idleText="72h between applications. Does not use contact quota."
                  isNight={isNight}
                />
              </div>
            </form>
          </div>
        </motion.div>

        {/* Explainer */}
        <motion.div
          variants={item}
          className={`min-w-0 ${cardShell}`}
          whileHover={reduced ? undefined : { y: -3, rotate: 0.2 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
          {contactCardShimmer(reduced)}
          <div
            className={`pointer-events-none absolute -inset-6 rounded-3xl blur-2xl ${glowTop}`}
            aria-hidden
          />
          {!isNight && (
            <div
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/70 to-transparent"
              aria-hidden
            />
          )}
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <h3 className={titleClass}>Petal blooms &amp; auto-reply</h3>
              <motion.div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                  isNight ? 'border-pink-300/40 bg-pink-500/15' : 'border-rose-200/60 bg-white/90'
                }`}
                animate={
                  reduced
                    ? {}
                    : {
                        y: [0, -6, 0],
                        rotate: [-2, 2, -2],
                      }
                }
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              >
                <span
                  className={`text-lg ${isNight ? 'text-pink-200/90' : 'text-rose-400'}`}
                  role="img"
                >
                  ✿
                </span>
              </motion.div>
            </div>
            <ol className={`mt-4 space-y-3 ${bodyClass} list-none`}>
              {[
                'Each submission creates a unique petal instance (ID + variant) on the server.',
                'Your note is delivered to the owner inbox through the portfolio SMTP identity — the same bot address that sends acknowledgements.',
                'You receive an automatic reply from Cherry Blossom Petal Bot with a short quote block and reference lines so threads stay traceable.',
                'The 12-hour limit applies only to general contact; admin and assistant forms on this page use separate cooldowns.',
              ].map((text, i) => (
                <motion.li
                  key={i}
                  className="flex gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 'some' }}
                  transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-semibold ${
                      isNight ? 'border-pink-300/45 bg-black/30' : 'border-rose-200/70 bg-rose-50/80'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span>{text}</span>
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>

        {/* Assistant waitlist */}
        <motion.div
          variants={item}
          className={`min-w-0 ${cardShell}`}
          whileHover={reduced ? undefined : { y: -3, rotate: -0.25 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
          {contactCardShimmer(reduced)}
          <div
            className={`pointer-events-none absolute -inset-6 rounded-3xl blur-2xl ${glowTop}`}
            aria-hidden
          />
          {!isNight && (
            <div
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/70 to-transparent"
              aria-hidden
            />
          )}
          <div className="relative z-10">
            <h3 className={titleClass}>Assistant beta</h3>
            <p className={bodyClass}>
              A dedicated auto-replying assistant will ship on this portfolio later. If you would like to
              test it when it goes live, join the waitlist — one signup per email per week.
            </p>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => handleSpecialSubmit('assistant_waitlist', e, setAssistantSending)}
            >
              <div className="grid min-w-0 gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
                <Field label="Name" id="assistant-name" theme={theme}>
                  <input id="assistant-name" name="name" className={inputClass} required autoComplete="name" />
                </Field>
                <Field label="Email" id="assistant-email" theme={theme}>
                  <input
                    id="assistant-email"
                    name="email"
                    type="email"
                    className={inputClass}
                    required
                    autoComplete="email"
                  />
                </Field>
              </div>
              <Field label="Notes (optional)" id="assistant-message" theme={theme}>
                <textarea
                  id="assistant-message"
                  name="message"
                  rows={2}
                  className={`${inputClass} resize-none`}
                  placeholder="Stack, timezone, or what you’d like to try…"
                />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button type="submit" disabled={assistantSending} className={btnClass}>
                  <motion.span
                    className={`h-2 w-2 rounded-full ${isNight ? 'bg-sakura-pink/90' : 'bg-gradient-to-br from-rose-400 to-pink-400'}`}
                    whileTap={{ scale: 1.2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                  />
                  {assistantSending ? 'Joining…' : 'Join waitlist'}
                </button>
                <FormToastRail
                  toast={assistantToast}
                  idleText="One signup per email per week."
                  isNight={isNight}
                />
              </div>
            </form>
          </div>
        </motion.div>
    </motion.div>
  )
}
