import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

import { SectionShell } from '../SectionShell/SectionShell'
import type { SectionProps } from '../SectionTypes'
import { dayGlassSection, nightGlassSection } from '../sectionGlass'

type SkillGroup = {
  title: string
  icon: string
  items: { name: string; note?: string }[]
}

const skillGroups: SkillGroup[] = [
  {
    title: 'Languages',
    icon: '{ }',
    items: [
      { name: 'Python' },
      { name: 'TypeScript' },
      { name: 'JavaScript', note: 'beginner' },
      { name: 'Java', note: 'beginner' },
      { name: 'ReactJS' },
      { name: 'Vue.js' },
      { name: 'Three.js' },
      { name: 'CSS' },
    ],
  },
  {
    title: 'APIs & Tools',
    icon: '⚡',
    items: [
      { name: 'FastAPI' },
      { name: 'REST API' },
      { name: 'GraphQL' },
      { name: 'Postman' },
    ],
  },
  {
    title: 'ML & Data Science',
    icon: '📊',
    items: [
      { name: 'NumPy' },
      { name: 'Pandas' },
      { name: 'Matplotlib' },
      { name: 'Seaborn' },
      { name: 'Scikit-learn' },
      { name: 'XGBoost' },
      { name: 'LightGBM' },
    ],
  },
  {
    title: 'Deep Learning',
    icon: '🧠',
    items: [
      { name: 'TensorFlow' },
      { name: 'Transformers (BERTs)' },
      { name: 'CNN' },
      { name: 'OpenCV', note: 'beginner' },
    ],
  },
  {
    title: 'LLM & Voice',
    icon: '🗣️',
    items: [
      { name: 'OpenAI' },
      { name: 'Mistral' },
      { name: 'Google Flan' },
      { name: 'Whisper STT' },
      { name: 'CoquiTTS' },
      { name: 'Piper TTS' },
    ],
  },
  {
    title: 'Architecture & Infra',
    icon: '🏗️',
    items: [
      { name: 'RAG' },
      { name: 'Haystack' },
      { name: 'OPEA' },
      { name: 'HayHooks' },
      { name: 'Kong' },
      { name: 'Docker' },
      { name: 'Kubernetes' },
    ],
  },
  {
    title: 'Vector Databases',
    icon: '🔍',
    items: [
      { name: 'ArcadeDB' },
      { name: 'ArangoDB' },
    ],
  },
  {
    title: 'Databases & Deploy',
    icon: '🚀',
    items: [
      { name: 'SQL' },
      { name: 'MongoDB' },
      { name: 'Streamlit' },
      { name: 'Google Colab' },
      { name: 'Jupyter' },
      { name: 'VS Code' },
    ],
  },
]

type Cert = { title: string; issuer: string; badge: string }

const certifications: Cert[] = [
  { title: 'The Complete Python Course', issuer: 'Udemy', badge: 'Certified 2025' },
  { title: 'Deep Learning Certification', issuer: 'Kaggle', badge: 'Kaggle Certified' },
  { title: 'Machine Learning Certification', issuer: 'Kaggle', badge: 'Kaggle Certified' },
]

const easeBezier: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Pill that gently drifts toward the cursor when hovering the card. */
function MagneticPill({
  name,
  note,
  isNight,
  cursorX,
  cursorY,
  cardHovered,
}: {
  name: string
  note?: string
  isNight: boolean
  cursorX: ReturnType<typeof useMotionValue<number>>
  cursorY: ReturnType<typeof useMotionValue<number>>
  cardHovered: boolean
}) {
  const pillRef = useRef<HTMLSpanElement>(null)
  const x = useSpring(0, { stiffness: 150, damping: 18 })
  const y = useSpring(0, { stiffness: 150, damping: 18 })

  useEffect(() => {
    if (!cardHovered) {
      x.set(0)
      y.set(0)
      return
    }
    const unsub = cursorX.on('change', () => {
      if (!pillRef.current) return
      const pr = pillRef.current.getBoundingClientRect()
      const pcx = pr.left + pr.width / 2
      const pcy = pr.top + pr.height / 2
      const dx = cursorX.get() - pcx
      const dy = cursorY.get() - pcy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const pull = Math.max(0, 1 - dist / 220) * 6
      x.set(dx > 0 ? pull : -pull)
      y.set(dy > 0 ? pull * 0.5 : -pull * 0.5)
    })
    return unsub
  }, [cardHovered, cursorX, cursorY, x, y])

  return (
    <motion.span
      ref={pillRef}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.66rem] tracking-wide transition-shadow duration-300 ${
        isNight
          ? 'border-white/12 bg-white/[0.04] text-parchment/70 hover:border-white/22 hover:shadow-[0_0_12px_rgba(255,255,255,0.08)]'
          : 'border-[rgba(245,198,214,0.3)] bg-white/70 text-[color:var(--dawn-muted)] hover:border-[rgba(245,198,214,0.5)] hover:shadow-[0_0_12px_rgba(245,198,214,0.15)]'
      }`}
      style={{ x, y }}
    >
      {name}
      {note && <span className="text-[0.55rem] text-sakura-pink/60">({note})</span>}
    </motion.span>
  )
}

function SkillCard({
  group,
  index,
  isNight,
}: {
  group: SkillGroup
  index: number
  isNight: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const [hovered, setHovered] = useState(false)
  const [shimmerDone, setShimmerDone] = useState(false)

  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    },
    [cursorX, cursorY],
  )

  useEffect(() => {
    if (inView && !shimmerDone) {
      const t = window.setTimeout(() => setShimmerDone(true), 800 + index * 80)
      return () => clearTimeout(t)
    }
  }, [inView, shimmerDone, index])

  const row = Math.floor(index / 4)
  const col = index % 4

  return (
    <motion.div
      ref={ref}
      className={`group relative flex flex-col overflow-hidden px-5 py-5 lg:px-6 lg:py-6 ${
        isNight ? nightGlassSection : dayGlassSection
      }`}
      initial={{ opacity: 0, scale: 0.88, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        delay: row * 0.15 + col * 0.08,
        duration: 0.7,
        ease: easeBezier,
      }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Shimmer sweep on scroll-in */}
      {inView && !shimmerDone && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 0.7, delay: index * 0.08, ease: 'easeInOut' }}
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(245,198,214,0.18) 45%, rgba(255,255,255,0.12) 50%, rgba(245,198,214,0.18) 55%, transparent 70%)',
          }}
        />
      )}

      {/* Cursor-follow spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(245,198,214,0.14),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(139,47,60,0.08),_transparent_45%)]" />
      </motion.div>

      <div className="relative z-10">
        {/* Icon with pulsing ring */}
        <div className="mb-3 flex items-center gap-2.5">
          <span className="relative flex items-center justify-center">
            <motion.span
              className="absolute inset-[-6px] rounded-full border border-sakura-pink/0"
              animate={
                hovered
                  ? {
                      borderColor: [
                        'rgba(245,198,214,0)',
                        'rgba(245,198,214,0.4)',
                        'rgba(245,198,214,0)',
                      ],
                      scale: [1, 1.3, 1],
                    }
                  : { borderColor: 'rgba(245,198,214,0)', scale: 1 }
              }
              transition={hovered ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
            />
            <span className="relative text-sm">{group.icon}</span>
          </span>
          <p
            className={`font-heading text-sm ${
              isNight ? 'text-parchment/90' : 'text-[color:var(--dawn-text)]'
            }`}
          >
            {group.title}
          </p>
          <motion.span
            className={`ml-auto rounded-full px-2 py-0.5 text-[0.55rem] font-medium ${
              isNight ? 'bg-white/5 text-parchment/40' : 'bg-black/5 text-[color:var(--dawn-muted)]'
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: row * 0.15 + col * 0.08 + 0.4, duration: 0.4 }}
          >
            {group.items.length}
          </motion.span>
        </div>

        {/* Pills with wave-stagger + magnetic drift */}
        <div className="flex flex-wrap gap-1.5">
          {group.items.map((item, ti) => {
            const waveDelay =
              row * 0.15 +
              col * 0.08 +
              0.3 +
              Math.sin(ti * 0.8) * 0.06 +
              ti * 0.045

            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 14, scale: 0.85 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: waveDelay, duration: 0.45, ease: easeBezier }}
              >
                <MagneticPill
                  name={item.name}
                  note={item.note}
                  isNight={isNight}
                  cursorX={cursorX}
                  cursorY={cursorY}
                  cardHovered={hovered}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export function Skills({ theme }: SectionProps) {
  const isNight = theme === 'night'

  return (
    <SectionShell
      id="skills"
      label="Skills & Certifications"
      eyebrow="Dojo"
      theme={theme}
      backgroundVideo="https://motionbgs.com/dl/hd/36"
    >
      {/* Skill grid */}
      <div className="grid min-w-0 gap-5 sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))] xl:grid-cols-[repeat(4,minmax(0,1fr))] lg:gap-6">
        {skillGroups.map((group, i) => (
          <SkillCard key={group.title} group={group} index={i} isNight={isNight} />
        ))}
      </div>

      {/* Certifications */}
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: easeBezier }}
      >
        <motion.h3
          className={`mb-5 flex items-center gap-2 font-heading text-base ${
            isNight ? 'text-parchment/90' : 'text-[color:var(--dawn-text)]'
          }`}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeBezier }}
        >
          <span className="text-sm">🎓</span>
          Certifications
        </motion.h3>

        <div className="grid min-w-0 gap-4 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
          {certifications.map((cert, ci) => (
            <motion.div
              key={cert.title}
              className={`group relative overflow-hidden px-5 py-4 ${
                isNight ? nightGlassSection : dayGlassSection
              }`}
              initial={{ opacity: 0, y: 20, rotateX: 12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              whileHover={{
                y: -3,
                boxShadow: isNight
                  ? '0 0 40px rgba(245,198,214,0.12)'
                  : '0 0 30px var(--dawn-shadow)',
              }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.12, duration: 0.7, ease: easeBezier }}
              style={{ transformPerspective: 600 }}
            >
              {/* Hover shimmer */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(245,198,214,0.14),_transparent_55%)]" />
              </div>

              <div className="relative z-10">
                <p
                  className={`text-[0.62rem] font-medium uppercase tracking-[0.22em] ${
                    isNight ? 'text-sakura-pink/70' : 'text-[color:var(--dawn-text)]'
                  }`}
                >
                  {cert.issuer}
                </p>
                <p
                  className={`mt-1 text-sm font-medium leading-snug ${
                    isNight ? 'text-parchment/90' : 'text-[color:var(--dawn-text)]'
                  }`}
                >
                  {cert.title}
                </p>
                <motion.span
                  className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[0.6rem] tracking-wide ${
                    isNight
                      ? 'border-sakura-pink/20 bg-sakura-pink/8 text-sakura-pink/80'
                      : 'border-[rgba(245,198,214,0.3)] bg-white/80 text-[color:var(--dawn-muted)]'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: ci * 0.12 + 0.3, duration: 0.4, ease: easeBezier }}
                >
                  {cert.badge}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SectionShell>
  )
}
