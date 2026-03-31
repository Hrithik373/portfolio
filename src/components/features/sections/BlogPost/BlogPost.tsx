import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../../../../lib/gsap-setup'
import { useScrollReveal } from '../../../../hooks/useScrollAnimation'

import { apiUrl } from '../../../../config/apiBase'
import { FloatingCardPetals } from '../../petals/FloatingCardPetals'
import { Field } from '../Field/Field'
import { SectionShell } from '../SectionShell/SectionShell'
import type { SectionProps } from '../SectionTypes'
import { dayGlassSection, nightGlassSection } from '../sectionGlass'
import { collectFingerprint } from '../../../../lib/fingerprint'

export type BlogPostProps = SectionProps & { embedded?: boolean }

/** Ink line that grows on scroll — replaces whileInView scaleX animation */
function BlogInkLine({ className, delay = 0 }: { className: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.set(el, { scaleX: 0, transformOrigin: 'left center' })
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => gsap.to(el, { scaleX: 1, duration: 1.1, delay, ease: 'power3.inOut' }),
    })
    return () => st.kill()
  }, [delay])
  return <div ref={ref} className={className} />
}

const ease = [0.22, 1, 0.36, 1] as const
const softLoop = [0.45, 0, 0.55, 1] as const

const BLOGPOST_VIDEO = 'https://motionbgs.com/dl/hd/36'
const BLOGPOST_POSTER = 'https://motionbgs.com/i/c/1920x1080/media/36/under-the-cherry-tree.1920x1080.jpg'

/* ── Floating kanji watermarks that drift across the section ── */
const kanjiChars = ['桜', '風', '筆', '夢', '道', '光']

function FloatingKanji({ isNight }: { isNight: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {kanjiChars.map((ch, i) => (
        <motion.span
          key={ch}
          className="absolute select-none font-jp-hand"
          style={{
            left: `${8 + i * 16}%`,
            top: `${10 + (i % 3) * 30}%`,
            fontSize: `${3 + (i % 3) * 1.5}rem`,
            color: isNight ? 'rgba(245,198,214,0.04)' : 'rgba(236,72,153,0.04)',
          }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 8, -5, 6, 0],
            rotate: [-5, 3, -2, 4, -5],
            opacity: [0.03, 0.07, 0.04, 0.06, 0.03],
          }}
          transition={{
            duration: 18 + i * 3,
            delay: i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {ch}
        </motion.span>
      ))}
    </div>
  )
}

/* ── Ink brush stroke wipe CSS ── */
const brushWipeStyle = `
@keyframes ink-wipe {
  0%   { clip-path: inset(0 100% 0 0); }
  100% { clip-path: inset(0 0% 0 0); }
}
@keyframes aurora-border {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes ink-ripple {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
}
`

/* ── Aurora breathing border wrapper ── */
function AuroraBorder({ isNight, children, className = '' }: { isNight: boolean; children: React.ReactNode; className?: string }) {
  const gradient = isNight
    ? 'linear-gradient(270deg, rgba(245,198,214,0.5), rgba(139,92,246,0.4), rgba(56,189,248,0.35), rgba(245,198,214,0.5))'
    : 'linear-gradient(270deg, rgba(236,72,153,0.5), rgba(251,191,36,0.4), rgba(244,114,182,0.45), rgba(236,72,153,0.5))'
  return (
    <div className={`relative ${className}`}>
      {/* Animated gradient border */}
      <div
        className="absolute -inset-[1px] rounded-3xl opacity-60"
        style={{
          background: gradient,
          backgroundSize: '300% 300%',
          animation: 'aurora-border 6s ease infinite',
        }}
      />
      {/* Inner content */}
      <div className="relative">{children}</div>
    </div>
  )
}

/* ── 3D Magnetic Tilt Card — completely different from Experience's flat glow ── */
type BlogCardProps = {
  isNight: boolean
  reduced: boolean
  children: React.ReactNode
  className?: string
  dense?: boolean
  index?: number
  aurora?: boolean
}

function BlogCard({ isNight, reduced, children, className = '', dense, index = 0, aurora = false }: BlogCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { amount: 0.12, once: true })
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const rippleId = useRef(0)

  /* 3D tilt driven by cursor position */
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const springConfig = { stiffness: 180, damping: 22, mass: 0.8 }
  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)
  const rotateX = useTransform(springY, [0, 1], [6, -6])
  const rotateY = useTransform(springX, [0, 1], [-6, 6])

  /* Spotlight that follows cursor inside the card */
  const spotlightX = useTransform(springX, [0, 1], ['0%', '100%'])
  const spotlightY = useTransform(springY, [0, 1], ['0%', '100%'])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }, [mouseX, mouseY])

  /* Ink ripple on click */
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = rippleId.current++
    setRipples((prev) => [...prev, { id, x, y }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 800)
  }, [])

  const shell = isNight ? nightGlassSection : dayGlassSection
  const accentColor = isNight ? 'rgba(245,198,214,0.6)' : 'rgba(236,72,153,0.5)'

  const cardInner = (
    <motion.div
      ref={ref}
      className={`group relative overflow-hidden ${shell} ${className}`}
      style={reduced ? {} : { perspective: '800px', rotateX, rotateY, transformStyle: 'preserve-3d' }}
      /* Ink brush wipe reveal */
      initial={{ opacity: 0 }}
      animate={
        isInView
          ? { opacity: 1 }
          : { opacity: 0 }
      }
      transition={{ delay: index * 0.12, duration: 0.5, ease }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <style>{brushWipeStyle}</style>

      {/* Ink brush wipe overlay — paints the card in from left to right */}
      {isInView && !reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[12]"
          style={{ background: isNight ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.95)' }}
          initial={{ clipPath: 'inset(0 0% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 100%)' }}
          transition={{ delay: index * 0.12 + 0.1, duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
        />
      )}

      {/* 3D spotlight — follows cursor inside the card for a volumetric feel */}
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: useTransform(
              [spotlightX, spotlightY],
              ([x, y]) =>
                `radial-gradient(350px circle at ${x} ${y}, ${
                  isNight ? 'rgba(245,198,214,0.1)' : 'rgba(244,114,182,0.12)'
                } 0%, transparent 65%)`,
            ),
          }}
        />
      )}

      {/* Shimmer sweep */}
      {!reduced && (
        <motion.div
          className={`pointer-events-none absolute inset-0 z-[2] ${dense ? 'opacity-30' : 'opacity-40'}`}
          style={{
            background: isNight
              ? 'linear-gradient(115deg, transparent 30%, rgba(245,198,214,0.06) 45%, rgba(139,92,246,0.05) 55%, transparent 70%)'
              : 'linear-gradient(115deg, transparent 28%, rgba(244,114,182,0.1) 44%, rgba(251,191,36,0.07) 56%, transparent 72%)',
            backgroundSize: '250% 100%',
          }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
      )}

      {/* Falling sakura petals */}
      <div className="pointer-events-none absolute inset-0 z-[4]" aria-hidden>
        <FloatingCardPetals isNight={isNight} reduced={reduced} />
      </div>

      {/* Ink ripples on click */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute z-[11] h-12 w-12 rounded-full"
          style={{
            left: r.x,
            top: r.y,
            border: `2px solid ${accentColor}`,
            animation: 'ink-ripple 0.8s ease-out forwards',
          }}
        />
      ))}

      {/* Top breathing edge */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-[6] h-px"
        style={{
          background: isNight
            ? 'linear-gradient(90deg, transparent, rgba(245,198,214,0.45), rgba(139,92,246,0.3), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(244,114,182,0.5), rgba(251,191,36,0.35), transparent)',
        }}
        animate={reduced ? {} : { opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bottom glow on hover */}
      <div
        className="pointer-events-none absolute inset-x-4 bottom-0 z-[6] h-px opacity-0 transition-opacity duration-500 group-hover:opacity-80"
        style={{
          background: isNight
            ? 'linear-gradient(90deg, transparent, rgba(245,198,214,0.6), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(236,72,153,0.55), transparent)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )

  if (aurora) {
    return <AuroraBorder isNight={isNight}>{cardInner}</AuroraBorder>
  }
  return cardInner
}

/* ── Staggered word-by-word reveal for headings ── */
function InkRevealText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { amount: 0.5, once: true })
  const words = text.split(' ')
  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ delay: delay + i * 0.08, duration: 0.55, ease }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  )
}

/* ── Data ── */
const upcomingItems = [
  { title: 'Vik reasoning traces', detail: 'Transparent agent steps, citations, and guardrails in the loop.', icon: 'trace' as const, kanji: '跡' },
  { title: 'Multilingual voice pass', detail: 'Aligned STT/TTS flows with the same calm UX as my ITU work.', icon: 'voice' as const, kanji: '声' },
  { title: 'Blog drops & field notes', detail: 'Shorter posts on RAG, evaluation, and shipping AI safely.', icon: 'journal' as const, kanji: '記' },
]

function RoadmapIcon({ kind, isNight }: { kind: 'trace' | 'voice' | 'journal'; isNight: boolean }) {
  const stroke = isNight ? 'rgba(196,181,253,0.85)' : 'rgba(190,24,93,0.75)'
  const common = { fill: 'none', stroke, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'trace') return <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path {...common} d="M4 12h4l2-6 4 12 2-6h4" /></svg>
  if (kind === 'voice') return <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path {...common} d="M12 4v16M8 8v8M16 8v8M4 10v4M20 10v4" /></svg>
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path {...common} d="M7 4h10a2 2 0 012 2v12l-4-3-4 3-4-3-4 3V6a2 2 0 012-2z" />
      <path {...common} d="M8 9h8M8 12h6" opacity={0.7} />
    </svg>
  )
}

function VikOrb({ isNight, reduced }: { isNight: boolean; reduced: boolean }) {
  const nightGrad = 'radial-gradient(circle at 35% 30%, rgba(167,139,250,0.55) 0%, rgba(56,189,248,0.35) 42%, rgba(15,23,42,0.95) 72%)'
  const dayGrad = 'radial-gradient(circle at 35% 30%, rgba(244,114,182,0.5) 0%, rgba(251,191,36,0.28) 45%, rgba(255,255,255,0.92) 70%)'
  return (
    <div className="relative flex h-[5rem] w-[5rem] shrink-0 items-center justify-center sm:h-[5.5rem] sm:w-[5.5rem]">
      <motion.div className="absolute inset-[-20%] rounded-full blur-2xl"
        style={{ background: isNight ? 'rgba(129,140,248,0.35)' : 'rgba(244,114,182,0.32)' }}
        animate={reduced ? { opacity: 0.4 } : { opacity: [0.32, 0.55, 0.32], scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: reduced ? 0 : Infinity, ease: softLoop }} aria-hidden />
      <motion.div className="relative h-[4.25rem] w-[4.25rem] rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-white/15 sm:h-[4.75rem] sm:w-[4.75rem]"
        style={{ background: isNight ? nightGrad : dayGrad }}
        animate={reduced ? {} : { boxShadow: isNight
          ? ['0 0 0 0 rgba(129,140,248,0)', '0 0 36px 6px rgba(56,189,248,0.22)', '0 0 0 0 rgba(129,140,248,0)']
          : ['0 0 0 0 rgba(244,114,182,0)', '0 0 40px 8px rgba(251,191,36,0.2)', '0 0 0 0 rgba(244,114,182,0)'] }}
        transition={{ duration: 3.5, repeat: reduced ? 0 : Infinity, ease: softLoop }} />
      <motion.span className={`relative z-10 font-heading text-[0.68rem] font-semibold uppercase tracking-[0.32em] ${isNight ? 'text-white/92' : 'text-[color:var(--dawn-text)]'}`}
        animate={reduced ? {} : { opacity: [0.82, 1, 0.82] }} transition={{ duration: 3.2, repeat: reduced ? 0 : Infinity, ease: softLoop }}>Vik</motion.span>
    </div>
  )
}

/* ────────────────────────────────────────────────
 * Main BlogPost component
 * ──────────────────────────────────────────────── */
export function BlogPost({ theme, embedded = false }: BlogPostProps) {
  const isNight = theme === 'night'
  const reduced = useReducedMotion() ?? false
  const rootRef = useRef<HTMLDivElement>(null)
  const roadmapHeadRef = useScrollReveal<HTMLDivElement>({ from: { opacity: 0, y: 16 }, to: { opacity: 1, y: 0 }, start: 'top 88%' })
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef(0)

  const headingClass = isNight ? 'text-sakura-pink/80' : 'text-rose-600/90'
  const mutedClass = isNight ? 'text-parchment/58' : 'text-[color:var(--dawn-muted)]'
  const bodyClass = isNight ? 'text-parchment/80' : 'text-[color:var(--dawn-text)]/95'
  const strongClass = isNight ? 'text-parchment/95' : 'text-[color:var(--dawn-text)]'
  const labelCaps = `text-[0.58rem] font-semibold uppercase tracking-[0.28em] ${headingClass}`

  const inputClass = isNight
    ? 'w-full rounded-xl border border-white/12 bg-black/35 px-3.5 py-2.5 text-sm text-parchment/95 outline-none transition placeholder:text-parchment/50 focus:border-violet-400/35 focus:bg-black/45 focus:ring-1 focus:ring-violet-400/20'
    : 'w-full rounded-xl border border-[rgba(236,72,153,0.22)] bg-[color:var(--dawn-input)] px-3.5 py-2.5 text-sm text-[color:var(--dawn-text)] outline-none transition placeholder:text-[color:var(--dawn-muted)] focus:border-rose-400/55 focus:bg-white focus:ring-2 focus:ring-rose-300/35'

  const btnClass = `inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65 ${
    isNight ? 'border-violet-300/45 bg-gradient-to-r from-violet-500/25 via-fuchsia-500/15 to-sky-500/20 text-parchment/95 shadow-[0_0_24px_rgba(139,92,246,0.25)] hover:from-violet-500/35 hover:via-fuchsia-500/22 hover:to-sky-500/28'
      : 'border-rose-300/55 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50/90 text-[color:var(--dawn-text)] shadow-[0_8px_28px_rgba(244,114,182,0.18)] hover:from-rose-100/95 hover:via-pink-50 hover:to-amber-50'}`

  const showToast = (msg: string) => { setToast(msg); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 4800) }
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (sending) return
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') ?? '').trim()
    const email = String(fd.get('email') ?? '').trim()
    const note = String(fd.get('note') ?? '').trim()
    const website = String(fd.get('website') ?? '').trim()
    const subject = 'Vik AI — newsletter signup'
    const message = note || 'Please subscribe me to Vik AI updates, blog notes, and portfolio newsletter — I agree to receive occasional emails.'
    if (!name || !email) { showToast('Name and email are required.'); return }
    if (!isValidEmail(email)) { showToast('Please enter a valid email.'); return }
    try {
      setSending(true)
      const res = await fetch(apiUrl('/api/send-email'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, subject, message, formType: 'newsletter_signup', website, _fp: await collectFingerprint() }) })
      const data = res.ok ? await res.json().catch(() => null) : await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 429 && data && typeof data.retryAfterMs === 'number') { const h = Math.floor(data.retryAfterMs / 3600000); const m = Math.ceil((data.retryAfterMs % 3600000) / 60000); showToast(`Recently subscribed — try again in ~${h}h ${m}m.`); return }
        showToast(typeof data?.message === 'string' ? data.message : 'Something went wrong. Try again.'); return
      }
      e.currentTarget.reset()
      const petal = data?.petal as { name?: string } | undefined
      showToast(petal?.name ? `You are in — watch for ${petal.name}.` : 'Subscribed. Check your inbox for a petal note.')
    } catch { showToast('Network error. Try again.') } finally { setSending(false) }
  }

  const gap = embedded ? 'gap-4 sm:gap-5' : 'gap-5 sm:gap-6'

  const content = (
    <div ref={rootRef} className={`relative flex min-w-0 flex-col ${gap}`}>
      {/* Floating kanji watermarks across the entire section */}
      {!reduced && <FloatingKanji isNight={isNight} />}

      {/* 1 — Hero / flagship — aurora breathing border */}
      <BlogCard isNight={isNight} reduced={reduced} index={0} aurora className="p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex shrink-0 flex-col items-center gap-5 sm:flex-row sm:gap-8">
            <VikOrb isNight={isNight} reduced={reduced} />
            <div className="text-center sm:text-left">
              <p className={labelCaps}>Flagship program</p>
              <h3 className={`mt-2 font-heading text-2xl tracking-tight sm:text-3xl ${strongClass}`}>
                <InkRevealText text="Vik AI agent" delay={0.3} />
              </h3>
              <p className={`mt-3 max-w-md text-sm leading-relaxed sm:text-[0.9375rem] ${mutedClass}`}>
                A personal research-and-action agent: grounded retrieval, careful tool use, and human-readable traces —
                the editorial spine of this journal.
              </p>
            </div>
          </div>
          <div className={`hidden h-24 w-px shrink-0 lg:block ${isNight ? 'bg-gradient-to-b from-transparent via-white/15 to-transparent' : 'bg-gradient-to-b from-transparent via-rose-200/50 to-transparent'}`} aria-hidden />
          <dl className={`grid w-full max-w-xl grid-cols-3 gap-3 text-center sm:gap-4 lg:ml-auto lg:max-w-md ${isNight ? 'divide-x divide-white/[0.08]' : 'divide-x divide-rose-200/40'}`}>
            {[{ k: 'Focus', v: 'RAG · tools · safety' }, { k: 'Format', v: 'Lab notes + builds' }, { k: 'Audience', v: 'Builders & peers' }].map((row) => (
              <div key={row.k} className="px-2 first:pl-0 last:pr-0">
                <dt className={`text-[0.55rem] font-semibold uppercase tracking-[0.2em] ${mutedClass}`}>{row.k}</dt>
                <dd className={`mt-1.5 text-xs font-medium leading-snug sm:text-sm ${bodyClass}`}>{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </BlogCard>

      {/* 2 — Background */}
      <BlogCard isNight={isNight} reduced={reduced} dense index={1} className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
          <div className="shrink-0 sm:w-36">
            <p className={labelCaps}>Background</p>
            <p className={`mt-2 font-heading text-lg ${strongClass}`}>
              <InkRevealText text="From shipping to writing" delay={0.2} />
            </p>
          </div>
          <p className={`min-w-0 flex-1 text-sm leading-[1.7] sm:text-[0.9375rem] ${bodyClass}`}>
            I write from the intersection of backend engineering, applied ML, and production AI — from Amdocs-era Java
            and APIs to ITU work on multilingual voice, RAG, and clinical guardrails. These cards are where I share
            the longer arc: what I am building in the open, what broke, and what actually shipped.
          </p>
        </div>
      </BlogCard>

      {/* 3 — Roadmap grid */}
      <div>
        <div ref={roadmapHeadRef} className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <p className={labelCaps}>Roadmap</p>
            <p className={`mt-1 font-heading text-lg sm:text-xl ${strongClass}`}>
              <InkRevealText text="Upcoming on the log" delay={0.1} />
            </p>
          </div>
          <p className={`text-xs ${mutedClass}`}>Shipped entries will link from here as they go live.</p>
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingItems.map((item, i) => (
            <BlogCard key={item.title} isNight={isNight} reduced={reduced} dense index={2 + i} className="flex h-full flex-col p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${isNight ? 'border-violet-400/25 bg-violet-500/[0.08] text-violet-200/90' : 'border-rose-200/55 bg-white/80 text-rose-700'}`}>
                  <RoadmapIcon kind={item.icon} isNight={isNight} />
                </span>
                {/* Kanji badge instead of plain number */}
                <span
                  className={`font-jp-hand text-xl ${isNight ? 'text-sakura-pink/20' : 'text-rose-300/40'}`}
                  style={{ textShadow: isNight ? '0 0 12px rgba(245,198,214,0.2)' : 'none' }}
                >
                  {item.kanji}
                </span>
              </div>
              <p className={`font-heading text-base ${strongClass}`}>{item.title}</p>
              <p className={`mt-2 flex-1 text-xs leading-relaxed sm:text-sm ${mutedClass}`}>{item.detail}</p>
              {/* Animated ink line instead of static bar */}
              <BlogInkLine
                className={`mt-4 h-0.5 origin-left rounded-full ${isNight ? 'bg-gradient-to-r from-sakura-pink/40 to-violet-400/20' : 'bg-gradient-to-r from-rose-300/60 to-amber-200/40'}`}
                delay={0.3 + i * 0.12}
              />
            </BlogCard>
          ))}
        </div>
      </div>

      {/* 4 — Newsletter — aurora border */}
      <BlogCard isNight={isNight} reduced={reduced} index={5} aurora
        className={`p-6 sm:p-8 ${isNight ? 'ring-1 ring-violet-500/15' : 'ring-1 ring-rose-200/40'}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <div className="lg:max-w-xs lg:shrink-0">
            <p className={labelCaps}>Newsletter</p>
            <h4 className={`mt-2 font-heading text-xl ${strongClass}`}>
              <InkRevealText text="Stay in the loop" delay={0.15} />
            </h4>
            <p className={`mt-3 text-sm leading-relaxed ${bodyClass}`}>
              Vik AI milestones, essays, and portfolio updates. One list, low frequency, no noise — unsubscribe any time.
            </p>
          </div>
          <form className="relative min-w-0 flex-1 space-y-4" onSubmit={onSubmit}>
            <div className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
              <label htmlFor="blog-newsletter-honeypot-website">Website</label>
              <input type="text" id="blog-newsletter-honeypot-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <Field label="Name" id="blog-news-name" theme={theme}><input id="blog-news-name" name="name" className={inputClass} required autoComplete="name" /></Field>
              <Field label="Email" id="blog-news-email" theme={theme}><input id="blog-news-email" name="email" type="email" className={inputClass} required autoComplete="email" /></Field>
            </div>
            <Field label="Note (optional)" id="blog-news-note" theme={theme}><textarea id="blog-news-note" name="note" rows={2} className={`${inputClass} resize-none`} placeholder="Topics you care about, or how you found Vik…" /></Field>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <button type="submit" disabled={sending} className={btnClass}>
                {!reduced && <motion.span className={`h-2 w-2 rounded-full ${isNight ? 'bg-sky-300/90' : 'bg-gradient-to-br from-rose-500 to-amber-400'}`}
                  animate={sending ? { scale: [1, 1.25, 1] } : { opacity: [0.65, 1, 0.65] }}
                  transition={sending ? { duration: 0.65, repeat: Infinity, ease: softLoop } : { duration: 2.8, repeat: Infinity, ease: softLoop }} />}
                {sending ? 'Joining…' : 'Subscribe'}
              </button>
              <AnimatePresence mode="wait">
                {toast ? (
                  <motion.p key={toast} className={`max-w-[min(100%,260px)] text-right text-[0.68rem] leading-relaxed ${isNight ? 'text-parchment/88' : 'text-[color:var(--dawn-muted)]'}`}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease } }} exit={{ opacity: 0, y: -3, transition: { duration: 0.28, ease } }} role="status">{toast}</motion.p>
                ) : (
                  <motion.p key="hint" className={`text-right text-[0.65rem] ${mutedClass}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>7-day cooldown per email.</motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </BlogCard>
    </div>
  )

  if (embedded) {
    return (
      <div className="relative mt-2 overflow-hidden rounded-2xl border border-white/[0.08]">
        <video className="pointer-events-none absolute inset-0 h-full w-full object-cover" src={BLOGPOST_VIDEO} poster={BLOGPOST_POSTER} autoPlay loop muted playsInline aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-black/60" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/50" aria-hidden />
        <div className="relative z-10 p-3 sm:p-4">{content}</div>
      </div>
    )
  }

  return (
    <SectionShell id="blogpost" label="Blogpost" eyebrow="Journal" theme={theme} mainAlign="start" backgroundVideo={BLOGPOST_VIDEO}>
      {content}
    </SectionShell>
  )
}


{/*Add this line after spotlightY (around line 120), before handleMouseMove
  
  const spotlightY = useTransform(springY, [0, 1], ['0%', '100%'])

  // ADD THIS — hook called unconditionally (Rules of Hooks fix)
  const spotlightBg = useTransform(
    [spotlightX, spotlightY],
    ([x, y]) =>
      `radial-gradient(350px circle at ${x} ${y}, ${
        isNight ? 'rgba(245,198,214,0.1)' : 'rgba(244,114,182,0.12)'
      } 0%, transparent 65%)`,
  )

  const handleMouseMove = useCallback(...)*/}


  {/* Replace the spotlight style prop (around line 175):
    // Find:
          style={{
            background: useTransform(
              [spotlightX, spotlightY],
              ([x, y]) =>
                `radial-gradient(350px circle at ${x} ${y}, ${
                  isNight ? 'rgba(245,198,214,0.1)' : 'rgba(244,114,182,0.12)'
                } 0%, transparent 65%)`,
            ),
          }}

// Replace with:
          style={{ background: spotlightBg }}
    
    */}