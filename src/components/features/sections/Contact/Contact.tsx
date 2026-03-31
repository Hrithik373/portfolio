import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useScrollReveal } from '../../../../hooks/useScrollAnimation'
import { gsap, ScrollTrigger } from '../../../../lib/gsap-setup'

import { apiUrl } from '../../../../config/apiBase'
import { getClientAdminBypassEmails } from '../../../../config/adminBypass'
import { ContactProgramCards } from './ContactProgramCards'
import { Field } from '../Field/Field'
import { SectionShell } from '../SectionShell/SectionShell'
import type { SectionProps } from '../SectionTypes'
import { dayGlassSection, nightGlassSection } from '../sectionGlass'
import { collectFingerprint } from '../../../../lib/fingerprint'

function contactCardShimmerLayer(reduced: boolean) {
  if (reduced) return null
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.5]"
      style={{
        background:
          'linear-gradient(112deg, transparent 30%, rgba(245,198,214,0.3) 46%, transparent 60%, rgba(245,198,214,0.12) 74%, transparent 90%)',
        backgroundSize: '220% 100%',
      }}
      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={{ duration: 8.5, repeat: Infinity, ease: 'linear' }}
      aria-hidden
    />
  )
}

export function Contact({ theme }: SectionProps) {
  const isNight = theme === 'night'
  const reduced = useReducedMotion() ?? false

  // GSAP scroll hooks
  const gridRef = useScrollReveal<HTMLDivElement>({
    from: { opacity: 0 },
    to: { opacity: 1 },
    start: 'top 85%',
  })
  const formRef = useScrollReveal<HTMLFormElement>({
    from: { opacity: 0, x: -28 },
    to: { opacity: 1, x: 0 },
    start: 'top 85%',
  })
  const rightColRef = useScrollReveal<HTMLDivElement>({
    from: { opacity: 0, x: 28 },
    to: { opacity: 1, x: 0 },
    start: 'top 85%',
  })
  const formFieldsRef = useScrollReveal<HTMLDivElement>({
    from: { opacity: 0, y: 16 },
    to: { opacity: 1, y: 0 },
    start: 'top 88%',
    children: '.form-field-item',
    stagger: 0.085,
  })
  const taglineRef = useScrollReveal<HTMLParagraphElement>({
    from: { opacity: 0, y: 16 },
    to: { opacity: 1, y: 0 },
    start: 'top 88%',
  })
  const contactLinksRef = useScrollReveal<HTMLDivElement>({
    from: { opacity: 0, y: 14 },
    to: { opacity: 1, y: 0 },
    start: 'top 88%',
    children: '.contact-link',
    stagger: 0.06,
  })

  // Vertical ink lines via GSAP
  const lineLeftRef = useRef<HTMLDivElement>(null)
  const lineRightRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const targets = [lineLeftRef.current, lineRightRef.current].filter(Boolean)
    if (!targets.length) return
    const sts = targets.map((el) => {
      gsap.set(el, { scaleY: 0, transformOrigin: 'top center' })
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => gsap.to(el, { scaleY: 1, duration: 0.85, ease: 'power3.out' }),
      })
    })
    return () => sts.forEach((st) => st.kill())
  }, [])
  const [isSending, setIsSending] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [lastInstance, setLastInstance] = useState<{ instanceId: string; petalName?: string; petalColor?: string } | null>(
    null
  )
  const [revealUntil, setRevealUntil] = useState<number | null>(null)
  const [revealAttempts, setRevealAttempts] = useState(0)
  const toastTimerRef = useRef<number | null>(null)
  const inputClass = isNight
    ? 'w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-parchment/95 outline-none ring-0 transition placeholder:text-parchment/55 focus:border-white/22 focus:bg-black/40 focus:ring-1 focus:ring-white/10'
    : 'w-full rounded-lg border border-[rgba(236,72,153,0.22)] bg-[color:var(--dawn-input)] px-3 py-2 text-sm text-[color:var(--dawn-text)] outline-none ring-0 transition placeholder:text-[color:var(--dawn-muted)] focus:border-rose-400/55 focus:bg-white focus:ring-2 focus:ring-rose-300/35'

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message })
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => {
    if (!revealUntil) return
    const remaining = revealUntil - Date.now()
    if (remaining <= 0) {
      setRevealUntil(null)
      return
    }
    const timer = window.setTimeout(() => setRevealUntil(null), remaining)
    return () => window.clearTimeout(timer)
  }, [revealUntil])

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const adminBypassList = getClientAdminBypassEmails()

  return (
    <SectionShell
      id="contact"
      label="Contact"
      eyebrow="Reach out"
      theme={theme}
      mainAlign="start"
      backgroundVideo="https://motionbgs.com/dl/hd/2915"
    >
      <div
        ref={gridRef}
        className="grid min-w-0 gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
      >
        <motion.form
          ref={formRef}
          className={`relative overflow-hidden p-5 text-sm ${
            isNight ? `${nightGlassSection} text-parchment/95` : `${dayGlassSection} text-[color:var(--dawn-text)]`
          }`}
          whileHover={reduced ? undefined : { y: -3, rotate: -0.2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          onSubmit={async (event) => {
            event.preventDefault()
            if (isSending) return

            const form = event.currentTarget
            const formData = new FormData(form)
            const name = String(formData.get('name') ?? '').trim()
            const email = String(formData.get('email') ?? '').trim()
            const subject = String(formData.get('subject') ?? '').trim()
            const message = String(formData.get('message') ?? '').trim()
            const cooldownMs = 12 * 60 * 60 * 1000

            if (!email || !message || !name || !subject) {
              showToast('error', 'Please complete every field so the message can be sent.')
              return
            }

            if (!isValidEmail(email)) {
              showToast('error', 'Invalid email address. Please use a valid email.')
              return
            }

            const senderKey = email.toLowerCase()
            const adminBypass = adminBypassList.includes(senderKey)
            const storageKey = `contact-last-sent:${senderKey}`
            if (!adminBypass) {
              const lastSentRaw = window.localStorage.getItem(storageKey)
              const lastSent = lastSentRaw ? Number(lastSentRaw) : 0
              if (lastSent && Number.isFinite(lastSent)) {
                const remainingMs = cooldownMs - (Date.now() - lastSent)
                if (remainingMs > 0) {
                  const hours = Math.floor(remainingMs / 3600000)
                  const minutes = Math.ceil((remainingMs % 3600000) / 60000)
                  showToast(
                    'info',
                    `Please wait for the bot's reply, or try again in ${hours}h ${minutes}m.`
                  )
                  return
                }
              }
            }

            try {
              setIsSending(true)
              const website = String(formData.get('website') ?? '').trim()
              const response = await fetch(apiUrl('/api/send-email'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message, website, _fp: await collectFingerprint() }),
              })

              const contentType = response.headers.get('content-type') || ''
              const data = contentType.includes('application/json')
                ? await response.json().catch(() => null)
                : await response.text().catch(() => '')
              if (!response.ok) {
                if (response.status === 404) {
                  showToast('error', 'Email service is not running. Start the backend or deploy it.')
                  return
                }
                const retryAfterMs =
                  typeof data === 'object' && data && 'retryAfterMs' in data ? Number(data.retryAfterMs) : null
                if (response.status === 429 && retryAfterMs) {
                  const remainingMs = retryAfterMs
                  const hours = Math.floor(remainingMs / 3600000)
                  const minutes = Math.ceil((remainingMs % 3600000) / 60000)
                  showToast(
                    'info',
                    `Please wait for the bot's reply, or try again in ${hours}h ${minutes}m.`
                  )
                  return
                }
                const messageText =
                  typeof data === 'string'
                    ? data
                    : typeof data === 'object' && data && 'message' in data
                      ? String(data.message)
                      : ''
                const safeMessage =
                  messageText && !messageText.includes('<html') && !messageText.includes('<!DOCTYPE')
                    ? messageText
                    : ''
                showToast('error', safeMessage || 'Something went wrong. Please try again shortly.')
                return
              }

              if (!adminBypass) {
                window.localStorage.setItem(storageKey, String(Date.now()))
              }
              form.reset()
              if (data && typeof data === 'object' && 'instanceId' in data && 'petal' in data) {
                const petal = data.petal as { name?: string; color?: string }
                const color = petal?.color ? ` (${petal.color})` : ''
                setLastInstance({
                  instanceId: String(data.instanceId),
                  petalName: petal?.name,
                  petalColor: petal?.color,
                })
                setRevealUntil(Date.now() + 5000)
                setRevealAttempts(0)
                showToast(
                  'success',
                  `Message sent. Instance ${String(data.instanceId)} · ${petal?.name ?? 'Cherry Petal'}${color}`
                )
              } else {
                showToast('success', 'Message sent — petals are on their way.')
              }
            } catch {
              showToast('error', 'Network error. Please try again shortly.')
            } finally {
              setIsSending(false)
            }
          }}
        >
          <div className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
            <label htmlFor="contact-honeypot-website">Website</label>
            <input type="text" id="contact-honeypot-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          {contactCardShimmerLayer(reduced)}
          <motion.span
            className={`pointer-events-none absolute -right-1 -top-1 select-none font-jp-hand text-[4rem] leading-none sm:text-[4.5rem] ${
              isNight ? 'text-white/[0.035]' : 'text-rose-500/[0.06]'
            }`}
            aria-hidden
            animate={
              reduced
                ? {}
                : {
                    opacity: [0.03, 0.07, 0.04],
                    rotate: [0, -2, 0],
                  }
            }
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            問
          </motion.span>
          <div
            ref={lineLeftRef}
            className={`pointer-events-none absolute left-4 top-5 h-14 w-px origin-top sm:left-5 sm:top-6 ${
              isNight ? 'bg-gradient-to-b from-sakura-pink/45 to-transparent' : 'bg-gradient-to-b from-rose-400/45 to-transparent'
            }`}
            aria-hidden
          />
          <div
            className={`pointer-events-none absolute -inset-6 rounded-3xl blur-2xl ${
              isNight
                ? 'bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.28),_transparent_60%)] opacity-70'
                : 'bg-[radial-gradient(circle_at_50%_0%,_rgba(244,114,182,0.14),_transparent_55%)] opacity-90'
            }`}
            aria-hidden="true"
          />
          <div
            className={`pointer-events-none absolute -inset-8 rounded-3xl blur-3xl ${
              isNight
                ? 'bg-[radial-gradient(circle_at_30%_20%,_rgba(255,210,220,0.24),_transparent_65%)] opacity-70'
                : 'bg-[radial-gradient(circle_at_20%_30%,_rgba(251,207,232,0.2),_transparent_60%)] opacity-80'
            }`}
            aria-hidden="true"
          />
          {!isNight && (
            <div
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/70 to-transparent"
              aria-hidden="true"
            />
          )}
          <div ref={formFieldsRef} className="relative z-10 space-y-4">
          <div className="form-field-item grid min-w-0 gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
            <Field label="Name" id="name" theme={theme}>
              <input id="name" name="name" className={inputClass} required />
            </Field>
            <Field label="Email" id="email" theme={theme}>
              <input id="email" name="email" type="email" className={inputClass} required />
            </Field>
          </div>
          <div className="form-field-item">
            <Field label="Subject" id="subject" theme={theme}>
              <input id="subject" name="subject" className={inputClass} required />
            </Field>
          </div>
          <div className="form-field-item">
            <Field label="Message" id="message" theme={theme}>
              <textarea
                id="message"
                name="message"
                rows={4}
                className={`${inputClass} resize-none`}
                required
              />
            </Field>
          </div>
          <div className="form-field-item flex items-center justify-between gap-3">
            <button
              type="submit"
              disabled={isSending}
              className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium tracking-[0.22em] uppercase transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${
                isNight
                  ? 'border-pink-400/60 bg-pink-400/20 text-parchment/95 shadow-[0_0_18px_rgba(255,182,193,0.6)] hover:bg-pink-400/30 focus-visible:ring-pink-300/80 drop-shadow-[0_0_6px_rgba(255,220,230,0.35)]'
                  : 'border-rose-300/55 bg-gradient-to-r from-rose-50/95 via-pink-50/95 to-rose-50/90 text-[color:var(--dawn-text)] shadow-[0_4px_20px_rgba(244,114,182,0.22)] hover:from-rose-100/95 hover:via-pink-50/95 hover:to-rose-100/90 focus-visible:ring-rose-400/50'
              }`}
            >
              <span
                className={`relative flex h-6 w-6 items-center justify-center rounded-full border ${
                  isNight ? 'border-parchment/30 bg-black/80' : 'border-rose-300/45 bg-white shadow-sm'
                }`}
              >
                <motion.span
                  className={`h-3 w-3 rounded-full ${isNight ? 'bg-sakura-pink/80' : 'bg-gradient-to-br from-rose-400 to-pink-400'}`}
                  whileTap={{ scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 18 }}
                />
              </span>
              <span>{isSending ? 'Sending' : 'Send'}</span>
            </button>
            <AnimatePresence mode="wait">
              {toast ? (
                <motion.div
                  key={toast.message}
                  className={`max-w-[220px] rounded-xl border px-3 py-2 text-[0.68rem] leading-relaxed ${
                    isNight
                      ? `shadow-[0_0_18px_rgba(255,182,193,0.45)] ${
                          toast.type === 'success'
                            ? 'border-pink-300/60 bg-pink-500/10 text-parchment/90'
                            : toast.type === 'info'
                              ? 'border-pink-300/50 bg-black/40 text-parchment/85'
                              : 'border-rose-300/60 bg-rose-500/10 text-rose-100'
                        }`
                      : toast.type === 'success'
                        ? 'border-emerald-300/50 bg-emerald-50/95 text-emerald-900 shadow-[0_4px_16px_rgba(16,185,129,0.15)]'
                        : toast.type === 'info'
                          ? 'border-rose-200/60 bg-rose-50/95 text-rose-900 shadow-[0_4px_16px_rgba(244,114,182,0.12)]'
                          : 'border-rose-300/55 bg-rose-50/95 text-rose-900 shadow-[0_4px_16px_rgba(244,63,94,0.12)]'
                  }`}
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
                  className={`max-w-[200px] text-[0.68rem] ${
                    isNight ? 'text-parchment/70' : 'text-[color:var(--dawn-muted)]'
                  }`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  Replies land in your inbox. You can send again after 12 hours.
                </motion.p>
              )}
            </AnimatePresence>
            {lastInstance && revealUntil && revealUntil > Date.now() && revealAttempts < 5 ? (
              <button
                type="button"
                onClick={() => {
                  setRevealAttempts((prev) => prev + 1)
                  const color = lastInstance.petalColor ? ` (${lastInstance.petalColor})` : ''
                  showToast(
                    'success',
                    `Instance ${lastInstance.instanceId} · ${lastInstance.petalName ?? 'Cherry Petal'}${color}`
                  )
                }}
                className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[0.62rem] uppercase tracking-[0.2em] transition-all active:scale-[0.98] ${
                  isNight
                    ? 'border-pink-300/50 bg-pink-500/10 text-parchment/80 hover:bg-pink-500/20'
                    : 'border-rose-300/45 bg-white/90 text-[color:var(--dawn-text)] hover:bg-rose-50/95'
                }`}
              >
                Show ID
              </button>
            ) : null}
          </div>
          </div>
        </motion.form>
        <motion.div
          ref={rightColRef}
          className={`relative min-w-0 overflow-hidden px-6 py-6 ${
            isNight ? `${nightGlassSection} text-parchment/95` : `${dayGlassSection} text-[color:var(--dawn-text)]`
          }`}
          whileHover={reduced ? undefined : { y: -3, rotate: 0.2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          {contactCardShimmerLayer(reduced)}
          <motion.span
            className={`pointer-events-none absolute -right-0.5 top-2 select-none font-jp-hand text-[3.5rem] leading-none opacity-[0.045] sm:text-[4rem] ${
              isNight ? 'text-sakura-pink' : 'text-rose-500'
            }`}
            aria-hidden
            animate={reduced ? {} : { opacity: [0.04, 0.09, 0.05], y: [0, -4, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          >
            繋
          </motion.span>
          <div
            ref={lineRightRef}
            className={`pointer-events-none absolute right-5 top-6 hidden h-12 w-px origin-top sm:block ${
              isNight ? 'bg-gradient-to-b from-sakura-pink/35 to-transparent' : 'bg-gradient-to-b from-rose-400/35 to-transparent'
            }`}
            aria-hidden
          />
          <div
            className={`pointer-events-none absolute -inset-6 blur-3xl ${
              isNight
                ? 'opacity-80 bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.28),_transparent_65%)]'
                : 'opacity-90 bg-[radial-gradient(circle_at_80%_0%,_rgba(251,207,232,0.35),_transparent_55%)]'
            }`}
            aria-hidden="true"
          />
          <div
            className={`pointer-events-none absolute -inset-8 blur-3xl ${
              isNight
                ? 'opacity-70 bg-[radial-gradient(circle_at_20%_15%,_rgba(255,210,220,0.24),_transparent_65%)]'
                : 'opacity-75 bg-[radial-gradient(circle_at_10%_40%,_rgba(244,114,182,0.1),_transparent_58%)]'
            }`}
            aria-hidden="true"
          />
          {!isNight && (
            <div
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/65 to-transparent"
              aria-hidden="true"
            />
          )}
          <div className="relative z-10 space-y-5">
            <p
              ref={taglineRef}
              className={`font-jp-hand text-[0.95rem] leading-relaxed ${
                isNight
                  ? 'text-parchment/95 drop-shadow-[0_0_6px_rgba(255,220,230,0.35)]'
                  : 'text-[color:var(--dawn-text)] [text-shadow:0_0_24px_rgba(245,198,214,0.35)]'
              }`}
            >
              Seeking AI/ML roles building calm, reliable systems that blend strong backend foundations with
              responsible AI delivery.
            </p>
            <div ref={contactLinksRef} className="grid min-w-0 gap-3 text-xs sm:grid-cols-[repeat(2,minmax(0,1fr))]">
              <motion.a
                className={`contact-link group inline-flex items-center gap-3 rounded-3xl border px-4 py-3 transition-all duration-300 active:scale-[0.98] ${
                  isNight
                    ? 'border-white/[0.14] bg-black/35 text-parchment/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/20 hover:bg-black/45'
                    : 'border-[rgba(236,72,153,0.22)] bg-[color:var(--dawn-input)] text-[color:var(--dawn-text)] hover:border-rose-300/45 hover:bg-white hover:shadow-[0_4px_20px_rgba(244,114,182,0.12)]'
                }`}
                href="mailto:hrithikgh29@gmail.com"
                whileHover={reduced ? undefined : { y: -2 }}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    isNight ? 'border-white/20 bg-black/40' : 'border-rose-200/55 bg-white/90 text-rose-500'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 7.5h16M4 7.5l8 6 8-6M4 7.5v9h16v-9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="flex flex-col text-left">
                  <span
                    className={`text-[0.6rem] uppercase tracking-[0.18em] ${isNight ? 'opacity-70' : 'text-[color:var(--dawn-muted)]'}`}
                  >
                    Email
                  </span>
                  <span className="text-[0.72rem] font-medium">hrithikgh29@gmail.com</span>
                </span>
              </motion.a>
              <motion.a
                className={`contact-link group inline-flex items-center gap-3 rounded-3xl border px-4 py-3 transition-all duration-300 active:scale-[0.98] ${
                  isNight
                    ? 'border-white/[0.14] bg-black/35 text-parchment/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/20 hover:bg-black/45'
                    : 'border-[rgba(236,72,153,0.22)] bg-[color:var(--dawn-input)] text-[color:var(--dawn-text)] hover:border-rose-300/45 hover:bg-white hover:shadow-[0_4px_20px_rgba(244,114,182,0.12)]'
                }`}
                href="tel:+918420736098"
                whileHover={reduced ? undefined : { y: -2 }}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    isNight ? 'border-white/20 bg-black/40' : 'border-rose-200/55 bg-white/90 text-rose-500'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M6.5 4.5l3 1-1.2 2.6a12 12 0 005.1 5.1l2.6-1.2 1 3-2.2 1a3 3 0 01-3.1-.7A17.8 17.8 0 014.2 9.8a3 3 0 01-.7-3.1l1-2.2z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="flex flex-col text-left">
                  <span
                    className={`text-[0.6rem] uppercase tracking-[0.18em] ${isNight ? 'opacity-70' : 'text-[color:var(--dawn-muted)]'}`}
                  >
                    Phone
                  </span>
                  <span className="text-[0.72rem] font-medium">+91-8420736098</span>
                </span>
              </motion.a>
              <motion.a
                className={`contact-link group inline-flex items-center gap-3 rounded-3xl border px-4 py-3 transition-all duration-300 active:scale-[0.98] ${
                  isNight
                    ? 'border-white/[0.14] bg-black/35 text-parchment/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/20 hover:bg-black/45'
                    : 'border-[rgba(236,72,153,0.22)] bg-[color:var(--dawn-input)] text-[color:var(--dawn-text)] hover:border-rose-300/45 hover:bg-white hover:shadow-[0_4px_20px_rgba(244,114,182,0.12)]'
                }`}
                href="https://www.linkedin.com/in/hrithikgh29"
                rel="noreferrer"
                target="_blank"
                whileHover={reduced ? undefined : { y: -2 }}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    isNight ? 'border-white/20 bg-black/40' : 'border-rose-200/55 bg-white/90 text-rose-500'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M4.98 3.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM3.5 9h3v11h-3V9zm6.5 0h2.9v1.5h.1c.4-.8 1.5-1.7 3.1-1.7 3.3 0 3.9 2.1 3.9 4.9V20h-3v-5.1c0-1.2 0-2.8-1.7-2.8-1.7 0-2 1.3-2 2.7V20h-3V9z" />
                  </svg>
                </span>
                <span className="flex flex-col text-left">
                  <span
                    className={`text-[0.6rem] uppercase tracking-[0.18em] ${isNight ? 'opacity-70' : 'text-[color:var(--dawn-muted)]'}`}
                  >
                    LinkedIn
                  </span>
                  <span className="text-[0.72rem] font-medium">hrithikgh29</span>
                </span>
              </motion.a>
              <motion.a
                className={`contact-link group inline-flex items-center gap-3 rounded-3xl border px-4 py-3 transition-all duration-300 active:scale-[0.98] ${
                  isNight
                    ? 'border-white/[0.14] bg-black/35 text-parchment/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/20 hover:bg-black/45'
                    : 'border-[rgba(236,72,153,0.22)] bg-[color:var(--dawn-input)] text-[color:var(--dawn-text)] hover:border-rose-300/45 hover:bg-white hover:shadow-[0_4px_20px_rgba(244,114,182,0.12)]'
                }`}
                href="https://github.com/Hrithik373"
                rel="noreferrer"
                target="_blank"
                whileHover={reduced ? undefined : { y: -2 }}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    isNight ? 'border-white/20 bg-black/40' : 'border-rose-200/55 bg-white/90 text-[color:var(--dawn-text)]'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-3 .6-3.6-1.3-3.6-1.3-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.7 1.1 2.2 1.6.2-.7.4-1.1.7-1.4-2.4-.3-4.8-1.2-4.8-5.4 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 3 1.1a10.3 10.3 0 015.5 0c2.1-1.4 3-1.1 3-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.8 1.1 3 0 4.2-2.4 5.1-4.8 5.4.4.3.8 1 .8 2v2.9c0 .3.2.6.7.5A10 10 0 0012 2z" />
                  </svg>
                </span>
                <span className="flex flex-col text-left">
                  <span
                    className={`text-[0.6rem] uppercase tracking-[0.18em] ${isNight ? 'opacity-70' : 'text-[color:var(--dawn-muted)]'}`}
                  >
                    GitHub
                  </span>
                  <span className="text-[0.72rem] font-medium">Hrithik373</span>
                </span>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
      <ContactProgramCards theme={theme} inputClass={inputClass} isValidEmail={isValidEmail} />
    </SectionShell>
  )
}
