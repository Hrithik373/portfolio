import { useRef, useState } from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'

import { SectionShell } from '../SectionShell/SectionShell'
import type { SectionProps } from '../SectionTypes'

const ease = [0.22, 1, 0.36, 1] as const
const pink = 'rgba(245,198,214'
const pinkBorder = `${pink},0.35)`
const pinkGlow = `${pink},0.15)`
const pinkLine = `${pink},0.55)`

const focusItems = [
  { kanji: '検', label: 'RAG Systems & Evaluation', desc: 'Grounded answers, safety checks, and measurable AI quality.' },
  { kanji: '声', label: 'Voice + Multilingual AI', desc: 'STT/TTS + translation for inclusive healthcare access.' },
  { kanji: '築', label: 'Scalable Architecture', desc: 'Backend systems, caching strategies, and production-grade pipelines.' },
  { kanji: '学', label: 'Continuous Learning', desc: "Pursuing a Master's in AI & Data Science — always growing." },
]

function DojoCard({
  children,
  isNight,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  isNight: boolean
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { amount: 0.2, once: true })
  const [hovered, setHovered] = useState(false)

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const sx = useSpring(mouseX, { stiffness: 120, damping: 20 })
  const sy = useSpring(mouseY, { stiffness: 120, damping: 20 })
  const glowBg = useTransform([sx, sy], ([x, y]: string[]) =>
    isNight
      ? `radial-gradient(400px circle at ${x} ${y}, ${pinkGlow} 0%, transparent 70%)`
      : `radial-gradient(420px circle at ${x} ${y}, rgba(236,72,153,0.14) 0%, rgba(245,198,214,0.08) 40%, transparent 70%)`,
  )

  const handleMouse = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - r.left) / r.width)
    mouseY.set((e.clientY - r.top) / r.height)
  }

  return (
    <motion.div
      ref={ref}
      className={`group relative overflow-hidden rounded-3xl border backdrop-blur-sm ${
        isNight
          ? 'border-white/[0.14] bg-black/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'border-[color:var(--dawn-card-border)] bg-[color:var(--dawn-card)] shadow-[0_4px_30px_var(--dawn-shadow),inset_0_1px_0_rgba(255,255,255,0.65)]'
      } ${className}`}
      initial={{ opacity: 0, y: 26, filter: isNight ? 'blur(5px)' : 'blur(3px)' }}
      animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ delay, duration: 0.85, ease }}
      onMouseMove={handleMouse}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); mouseX.set(0.5); mouseY.set(0.5) }}
      whileHover={{ y: -3, transition: { duration: 0.3 } }}
    >
      {/* Inner hairline — night: cool white; day: sakura tint */}
      <div
        className={`pointer-events-none absolute inset-[3px] rounded-[1.2rem] ${
          isNight ? 'border border-white/[0.08]' : ''
        }`}
        style={
          isNight
            ? undefined
            : { border: `1px solid ${pink},0.14)` }
        }
      />

      {/* Corner ornaments */}
      {['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 right-0 rotate-180', 'bottom-0 left-0 -rotate-90'].map(
        (pos, i) => (
          <motion.div
            key={i}
            className={`pointer-events-none absolute ${pos}`}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: delay + 0.4 + i * 0.1, duration: 0.6 }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M0 0 L22 0 L22 2 L2 2 L2 22 L0 22 Z" fill={`${pink},0.18)`} />
            </svg>
          </motion.div>
        ),
      )}

      {/* Border trace SVG */}
      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
        <motion.rect
          x="0.5" y="0.5"
          width="calc(100% - 1px)" height="calc(100% - 1px)"
          rx="22" ry="22"
          fill="none"
          stroke={isNight ? 'rgba(255,255,255,0.22)' : 'rgba(236,72,153,0.55)'}
          strokeWidth={isNight ? '1' : '1.5'}
          strokeDasharray="900"
          initial={{ strokeDashoffset: 900 }}
          animate={isInView ? { strokeDashoffset: 0 } : {}}
          transition={{ delay: delay + 0.25, duration: 1.35, ease: 'easeInOut' }}
        />
      </svg>

      {/* Cursor glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: glowBg }}
      />

      {/* Shimmer sweep on hover */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: isNight
            ? 'linear-gradient(105deg, transparent 38%, rgba(245,198,214,0.12) 50%, transparent 62%)'
            : 'linear-gradient(105deg, transparent 35%, rgba(236,72,153,0.2) 50%, transparent 65%)',
          backgroundSize: '200% 100%',
        }}
        animate={hovered ? { backgroundPosition: ['200% 0', '-200% 0'] } : {}}
        transition={{ duration: 1.35, ease: 'easeInOut' }}
      />

      {/* Top ink brush line */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${pinkLine} 30%, ${pink},0.7) 50%, ${pinkLine} 70%, transparent 100%)`,
        }}
        initial={{ scaleX: 0, originX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ delay: delay + 0.2, duration: 1.2, ease }}
      />

      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

function ScrollRevealParagraph({ text, delay, isNight }: { text: string; delay: number; isNight: boolean }) {
  const hidden = isNight ? { opacity: 0.14, y: 5 } : { opacity: 0.32, y: 3 }
  return (
    <p className="leading-relaxed">
      {text.split(' ').map((word, wi) => (
        <motion.span
          key={wi}
          className="inline-block"
          style={
            !isNight
              ? { textShadow: '0 0 20px rgba(245,198,214,0.35), 0 1px 0 rgba(255,255,255,0.5)' }
              : undefined
          }
          initial={hidden}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-12% 0px' }}
          transition={{ delay: delay + wi * 0.01, duration: 0.42, ease }}
        >
          {word}&nbsp;
        </motion.span>
      ))}
    </p>
  )
}

function FloatingEnso({ isNight }: { isNight: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 180])
  const springRotate = useSpring(rotate, { stiffness: 42, damping: 22 })

  return (
    <div ref={ref} className="pointer-events-none absolute -right-8 -top-8 z-0 h-40 w-40 lg:-right-12 lg:-top-12 lg:h-56 lg:w-56">
      <motion.svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-[0_0_20px_rgba(245,198,214,0.25)]" style={{ rotate: springRotate }}>
        <motion.circle
          cx="100" cy="100" r="80" fill="none"
          stroke={isNight ? 'rgba(245,198,214,0.08)' : 'rgba(236,72,153,0.22)'}
          strokeWidth={isNight ? '6' : '7'}
          strokeLinecap="round" strokeDasharray="440 60"
          initial={{ strokeDashoffset: 500 }}
          whileInView={{ strokeDashoffset: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
        />
      </motion.svg>
    </div>
  )
}

export function About({ theme }: SectionProps) {
  const isNight = theme === 'night'

  const headingClass = isNight ? 'text-sakura-pink/70' : 'text-[color:var(--dawn-text)]'
  const mutedClass = isNight ? 'text-parchment/50' : 'text-[color:var(--dawn-muted)]'
  const bodyClass = isNight ? 'text-parchment/70' : 'text-[color:var(--dawn-muted)]'
  const primaryClass = isNight ? 'text-parchment/90' : 'text-[color:var(--dawn-text)]'

  return (
    <SectionShell id="about" label="About" eyebrow="Story" theme={theme} backgroundVideo="https://motionbgs.com/dl/hd/36">
      <div className="relative">
        <FloatingEnso isNight={isNight} />

        <motion.div
          className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          {/* Bio card */}
          <DojoCard isNight={isNight} delay={0}>
            <div className="relative p-6 lg:p-8">
              {/* Kanji watermark */}
              <motion.span
                className={`pointer-events-none absolute -right-2 -top-4 select-none font-jp-hand text-[8rem] leading-none ${
                  isNight ? 'text-sakura-pink/[0.05]' : 'text-rose-400/[0.14]'
                }`}
                initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease }}
                aria-hidden="true"
              >道</motion.span>

              {/* Title strip */}
              <motion.div
                className="mb-5 flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.7, ease }}
              >
                <motion.span
                  className={`font-jp-hand text-2xl ${isNight ? 'text-sakura-pink/70' : 'text-rose-500/90'}`}
                  style={!isNight ? { filter: 'drop-shadow(0 0 12px rgba(245,198,214,0.5))' } : undefined}
                  animate={{ opacity: isNight ? [0.5, 0.9, 0.5] : [0.75, 1, 0.75] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >士</motion.span>
                <div>
                  <p className={`font-heading text-[0.75rem] uppercase tracking-[0.22em] ${headingClass}`}>
                    The Engineer
                  </p>
                  <p className={`text-[0.6rem] tracking-[0.15em] ${mutedClass}`}>
                    4+ years · Backend · AI · ML
                  </p>
                </div>
              </motion.div>

              <div className={`space-y-4 text-sm ${bodyClass}`}>
                <ScrollRevealParagraph
                  isNight={isNight}
                  text="Software Engineer with 4+ years of experience in backend systems, scalable product engineering, and AI-driven solution development. My background spans Java, Spring Boot, databases, and system design, with prior industry experience at Amdocs delivering performance optimization, API development, testing automation, and reliability improvements in production environments."
                  delay={0.3}
                />
                <ScrollRevealParagraph
                  isNight={isNight}
                  text="More recently, through my work with ITU, I have expanded into applied AI and healthcare-focused intelligent systems, contributing to the design and development of multilingual, clinically aware AI platforms. My experience includes architecting Retrieval-Augmented Generation pipelines, semantic caching strategies, multimodal voice-and-text systems, frontend interfaces, and evaluation-oriented AI workflows for real-world public health use cases."
                  delay={0.6}
                />
                <ScrollRevealParagraph
                  isNight={isNight}
                  text="Currently pursuing a Master's degree in AI & Data Science, I am deeply committed to building practical, trustworthy, and impactful AI systems. With a strong software engineering foundation and growing expertise in machine learning, NLP, LLM systems, and applied AI architecture, I aim to contribute to scalable, responsible, and high-impact AI solutions that solve real-world problems."
                  delay={0.9}
                />
              </div>

              {/* Bottom ink separator */}
              <motion.div
                className="mt-6 h-px"
                style={{
                  background: isNight
                    ? `linear-gradient(90deg, ${pinkLine} 0%, ${pink},0.15) 60%, transparent 100%)`
                    : 'linear-gradient(90deg, rgba(236,72,153,0.45) 0%, rgba(245,198,214,0.35) 55%, transparent 100%)',
                }}
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.2, duration: 1, ease }}
              />
              <motion.p
                className={`mt-3 font-jp-hand text-sm tracking-wider ${isNight ? 'text-sakura-pink/40' : 'text-rose-600/75'}`}
                style={!isNight ? { textShadow: '0 0 16px rgba(245,198,214,0.35)' } : undefined}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.5, duration: 1 }}
              >
                一期一会 — One encounter, one chance
              </motion.p>
            </div>
          </DojoCard>

          {/* Focus card */}
          <DojoCard isNight={isNight} delay={0.2}>
            <div className="relative p-5 lg:p-6">
              <motion.span
                className={`pointer-events-none absolute -right-2 -top-4 select-none font-jp-hand text-[8rem] leading-none ${
                  isNight ? 'text-sakura-pink/[0.05]' : 'text-rose-400/[0.14]'
                }`}
                initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease }}
                aria-hidden="true"
              >技</motion.span>

              <motion.p
                className={`mb-4 font-heading text-[0.8rem] uppercase tracking-[0.22em] ${headingClass}`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Current Focus
              </motion.p>

              <ul className="space-y-4">
                {focusItems.map((item, i) => (
                  <motion.li
                    key={item.kanji}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.12, duration: 0.6, ease }}
                  >
                    <motion.span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-jp-hand text-lg"
                      style={{
                        border: `1px solid ${pinkBorder}`,
                        background: isNight ? 'rgba(245,198,214,0.06)' : 'var(--dawn-input)',
                        color: isNight ? 'rgba(245,198,214,0.8)' : 'var(--dawn-text)',
                      }}
                      whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {item.kanji}
                    </motion.span>
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${primaryClass}`}>{item.label}</p>
                      <p className={`mt-0.5 text-[0.7rem] leading-snug ${mutedClass}`}>{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>

              {/* Bamboo strokes */}
              <div className="pointer-events-none absolute bottom-4 right-4 flex gap-1.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className={`w-px rounded-full ${isNight ? 'bg-sakura-pink/18' : 'bg-rose-400/35'}`}
                    style={!isNight ? { boxShadow: '0 0 8px rgba(245,198,214,0.35)' } : undefined}
                    initial={{ height: 0 }}
                    whileInView={{ height: [0, 32 + i * 12] }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + i * 0.15, duration: 0.8, ease }}
                  />
                ))}
              </div>
            </div>
          </DojoCard>
        </motion.div>
      </div>
    </SectionShell>
  )
}
