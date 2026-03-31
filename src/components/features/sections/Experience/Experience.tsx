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
import { dayGlassSection, nightGlassSection } from '../sectionGlass'

const entries = [
  {
    period: '03/2026 — Present',
    place: 'International Telecommunication Union',
    location: 'Geneva, Switzerland',
    role: 'Backend Dev & AI Full Stack Engineer (LLM & Voice Module)',
    accent: 'rgba(245,198,214,0.6)',
    bullets: [
      'Conducted an end-to-end architectural review of the Genie AI NCD Healthcare pipeline and re-engineered the semantic cache intercept point post-guardrail, eliminating redundant LLM inference on cache hits and significantly reducing API token costs and response latency.',
      'Created a clinical query classification gate to route safety-critical NCD queries via the full RAG pipeline. Directed general queries using cosine similarity (≥0.95 clinical, ≥0.85 general), avoiding incorrect cached responses for distinct but similar queries.',
      'Developed a multi-path retrieval pipeline integrating vector search, sparse indexing, Knowledge Graph traversal, keyword search, filtering, and Re-Ranker to deliver contextually accurate, guideline-based answers on cache misses.',
      'Architectured a validated cache store-back mechanism that persists only guardrail-approved LLM responses paired with query embeddings, enabling progressive cache warming while guaranteeing clinically safe responses are served on future cache hits.',
      'Defined a TTL-based cache invalidation strategy linked to knowledge base versioning, automatically purging cached clinical responses when source documents or medical guidelines are updated.',
      'Integrated a multilingual voice-text I/O system. Connected STT transcription, TTS synthesis, and Machine Translation layers. Ensured consistent cache behavior across input languages.',
      'Designed and developed the Amina Care frontend interface, implementing voice and text input/output components, session-aware chat UI, and an interactive pipeline visualisation layer to support both end users and internal team workflows.',
      'Produced system architecture documentation, redesigned pipeline diagrams, and authored full team onboarding materials covering server SSH access, GitLab PAT setup, branch configuration, and daily Git workflow.',
    ],
  },
  {
    period: '06/2021 — 10/2023',
    place: 'Amdocs',
    location: 'Pune, India',
    role: 'Software Engineer',
    accent: 'rgba(160,200,255,0.5)',
    bullets: [
      'Developed and maintained Amdocs products (CRM, OMS) with Java and Spring, achieving a 20% boost in application performance.',
      'Executed thorough testing for online/offline events and billing, ensuring a 95% accuracy rate in functionality.',
      'Conducted API testing and debugging for Java and REST APIs, decreasing bug resolution time by 30%.',
      'Streamlined development processes by leveraging technologies like Ginger, JSON, and CI/CD pipelines, enhancing team efficiency.',
      'Helped with frontend development with REST API and React JS.',
      'Automated testing processes with Ginger and Selenium, resulting in a 40% reduction in manual testing time.',
    ],
  },
  {
    period: '06/2025 — 06/2025',
    place: 'West Bengal Youth Computer Center (Jagacha)',
    location: 'Kolkata, India',
    role: 'Software Engineer',
    accent: 'rgba(180,220,180,0.5)',
    bullets: [
      'Worked on front-end web development with the HP exam integration system to the youth center\'s exam system.',
      'Designed workflow and CI/CD integrations with Jira.',
      'Worked with SQL to merge student datasets with billing entities.',
      'Worked with students and professionals with mentorship programs.',
    ],
  },
]

const sakuraLine = 'linear-gradient(180deg, rgba(245,198,214,0.85) 0%, rgba(236,72,153,0.35) 55%, rgba(245,198,214,0.12) 100%)'
const sakuraGlow = '0 0 14px rgba(245,198,214,0.55), 0 0 28px rgba(236,72,153,0.2)'

function TimelineProgress({ theme }: { theme: 'night' | 'day' }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 28 })
  const isNight = theme === 'night'

  return (
    <div ref={ref} className="absolute inset-y-0 left-3 w-[2px] overflow-visible sm:left-3.5">
      <div
        className={`absolute inset-0 rounded-full ${
          isNight ? 'bg-white/[0.06]' : 'bg-white/[0.12]'
        }`}
      />
      <motion.div
        className="absolute inset-x-0 top-0 origin-top rounded-full"
        style={{
          scaleY,
          height: '100%',
          background: isNight
            ? 'linear-gradient(180deg, rgba(245,198,214,0.75) 0%, rgba(245,198,214,0.22) 100%)'
            : sakuraLine,
          boxShadow: isNight ? '0 0 12px rgba(245,198,214,0.45), 0 0 4px rgba(245,198,214,0.55)' : sakuraGlow,
        }}
      />
    </div>
  )
}

function TimelineNode({
  index,
  accent,
  isNight,
}: {
  index: number
  accent: string
  isNight: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { amount: 0.45 })
  const ringColor = isNight ? accent : 'rgba(245,198,214,0.85)'
  const glowFill = isNight ? accent : 'rgba(236,72,153,0.55)'
  const coreBg = isNight ? 'bg-ink-deep' : 'bg-white'

  return (
    <div ref={ref} className="absolute left-[-27px] top-5 flex items-center justify-center sm:left-[-29px]">
      <motion.div
        className="absolute rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: [0, 2.8, 0], opacity: [0, 0.65, 0] } : {}}
        transition={{ duration: 1.1, delay: index * 0.14, ease: 'easeOut' }}
        style={{
          width: 30,
          height: 30,
          border: `1.5px solid ${ringColor}`,
          boxShadow: isNight ? undefined : '0 0 12px rgba(245,198,214,0.45)',
        }}
      />
      <motion.div
        className="absolute rounded-full"
        animate={
          isInView
            ? { scale: [1, 2, 1], opacity: [0.45, 0, 0.45] }
            : { scale: 1, opacity: 0 }
        }
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.28,
        }}
        style={{
          width: 22,
          height: 22,
          background: glowFill,
          filter: 'blur(5px)',
        }}
      />
      <motion.div
        className={`relative h-3.5 w-3.5 rounded-full shadow-[0_0_10px_rgba(245,198,214,0.5)] ${coreBg}`}
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22, delay: index * 0.1 }}
      >
        <div
          className="absolute inset-[-5px] rounded-full border-2"
          style={{ borderColor: ringColor }}
        />
        <motion.div
          className="absolute inset-[2px] rounded-full"
          style={{ background: isNight ? accent : 'rgba(236,72,153,0.75)' }}
          animate={isInView ? { opacity: [0.55, 1, 0.55] } : { opacity: 0.65 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  )
}

function ExperienceCard({
  entry,
  index,
  isNight,
}: {
  entry: (typeof entries)[number]
  index: number
  isNight: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { amount: 0.15, once: true })
  const [isHovered, setIsHovered] = useState(false)

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 })

  const gradientX = useTransform(springX, [0, 1], ['0%', '100%'])
  const gradientY = useTransform(springY, [0, 1], ['0%', '100%'])

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  const borderTraceDelay = index * 0.15
  const scanAccent = isNight ? entry.accent : 'rgba(245,198,214,0.95)'
  const traceStroke = isNight ? 'rgba(255,255,255,0.28)' : 'rgba(236,72,153,0.55)'
  const introBlur = isNight ? 'blur(6px)' : 'blur(3px)'

  return (
    <motion.article
      ref={ref}
      className={`group relative ml-9 overflow-hidden p-5 text-xs lg:ml-12 lg:p-6 ${
        isNight ? `${nightGlassSection} text-parchment/75` : `${dayGlassSection} text-[color:var(--dawn-muted)]`
      }`}
      initial={{ opacity: 0, y: 28, filter: introBlur }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
          : { opacity: 0, y: 28, filter: introBlur }
      }
      transition={{ delay: index * 0.18, duration: 0.75, ease: [0.22, 1, 0.36, 1] as const }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        mouseX.set(0.5)
        mouseY.set(0.5)
      }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
    >
      {/* Animated border trace — draws around the card on scroll-in */}
      <svg
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        style={{ overflow: 'visible' }}
      >
        <motion.rect
          x="0.5"
          y="0.5"
          width="calc(100% - 1px)"
          height="calc(100% - 1px)"
          rx="22"
          ry="22"
          fill="none"
          stroke={traceStroke}
          strokeWidth={isNight ? '1' : '1.5'}
          strokeDasharray="1200"
          initial={{ strokeDashoffset: 1200 }}
          animate={isInView ? { strokeDashoffset: 0 } : { strokeDashoffset: 1200 }}
          transition={{ delay: borderTraceDelay + 0.2, duration: 1.4, ease: 'easeInOut' }}
        />
      </svg>

      {/* Cursor-following glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: useTransform(
            [gradientX, gradientY],
            ([x, y]) => {
              const core = isNight
                ? entry.accent.replace(/[\d.]+\)$/, '0.14)')
                : 'rgba(245,198,214,0.22)'
              return `radial-gradient(420px circle at ${x} ${y}, ${core} 0%, transparent 72%)`
            },
          ),
        }}
      />

      {/* Scan line reveal */}
      {isInView && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 z-20 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${scanAccent} 50%, transparent 100%)`,
            boxShadow: isNight
              ? `0 0 16px ${entry.accent}`
              : '0 0 18px rgba(236,72,153,0.55), 0 0 32px rgba(245,198,214,0.35)',
          }}
          initial={{ top: 0, opacity: 1 }}
          animate={{ top: '100%', opacity: 0 }}
          transition={{ delay: borderTraceDelay + 0.1, duration: 0.8, ease: 'easeInOut' }}
        />
      )}

      {/* Timeline node */}
      <TimelineNode index={index} accent={entry.accent} isNight={isNight} />

      {/* Card header */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: index * 0.18 + 0.2, duration: 0.6 }}
      >
        <p
          className="text-[0.7rem] uppercase tracking-[0.22em]"
          style={{
            color: isNight ? entry.accent : 'rgb(190 24 93)',
            textShadow: isNight ? undefined : '0 0 20px rgba(245,198,214,0.45)',
          }}
        >
          {entry.period}
        </p>
        <h3
          className={`mt-1 font-heading text-sm ${
            isNight ? 'text-parchment/90' : 'text-[color:var(--dawn-text)]'
          }`}
        >
          {entry.place}
        </h3>
        <p
          className={`text-[0.65rem] ${
            isNight ? 'text-parchment/50' : 'text-[color:var(--dawn-muted)]'
          }`}
        >
          {entry.location}
        </p>
        <p
          className={`mt-1 font-medium ${
            isNight ? 'text-parchment/80' : 'text-[color:var(--dawn-text)]'
          }`}
        >
          {entry.role}
        </p>
      </motion.div>

      {/* Separator line */}
      <motion.div
        className="my-3 h-px"
        style={{
          background: isNight
            ? `linear-gradient(90deg, transparent 0%, ${entry.accent.replace(/[\d.]+\)$/, '0.35)')} 50%, transparent 100%)`
            : 'linear-gradient(90deg, transparent 0%, rgba(236,72,153,0.45) 50%, transparent 100%)',
        }}
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ delay: index * 0.18 + 0.4, duration: 0.8, ease: 'easeOut' }}
      />

      {/* Bullets */}
      <ul
        className={`space-y-2 ${
          isNight ? 'text-parchment/60' : 'text-[color:var(--dawn-muted)]'
        }`}
      >
        {entry.bullets.map((bullet, bi) => (
          <motion.li
            key={bi}
            className="flex gap-2.5 leading-relaxed"
            initial={{ opacity: 0, x: -14, filter: 'blur(3px)' }}
            animate={
              isInView
                ? { opacity: 1, x: 0, filter: 'blur(0px)' }
                : { opacity: 0, x: -14, filter: 'blur(3px)' }
            }
            transition={{
              delay: index * 0.18 + 0.5 + bi * 0.06,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ring-1 ring-rose-300/50"
              style={{
                background: isNight ? entry.accent : 'rgba(236,72,153,0.85)',
                boxShadow: isNight ? undefined : '0 0 8px rgba(245,198,214,0.5)',
              }}
              animate={
                isHovered
                  ? { scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }
                  : { scale: 1, opacity: 0.5 }
              }
              transition={{
                duration: 1.4,
                repeat: isHovered ? Infinity : 0,
                delay: bi * 0.08,
                ease: 'easeInOut',
              }}
            />
            <span>{bullet}</span>
          </motion.li>
        ))}
      </ul>

      {/* Bottom accent glow on hover */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background: isNight
            ? `linear-gradient(90deg, transparent, ${entry.accent}, transparent)`
            : 'linear-gradient(90deg, transparent, rgba(236,72,153,0.75), transparent)',
        }}
        animate={isHovered ? { opacity: 0.9, scaleX: 1 } : { opacity: 0, scaleX: 0.3 }}
        transition={{ duration: 0.4 }}
      />
    </motion.article>
  )
}

export function Experience({ theme }: SectionProps) {
  const isNight = theme === 'night'

  return (
    <SectionShell
      id="experience"
      label="Experience"
      eyebrow="Path"
      theme={theme}
      backgroundVideo="https://motionbgs.com/dl/hd/2915"
    >
      <div className="relative">
        <TimelineProgress theme={theme} />
        <div className="space-y-8">
          {entries.map((entry, index) => (
            <ExperienceCard
              key={entry.period}
              entry={entry}
              index={index}
              isNight={isNight}
            />
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
