import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { HeroAudioOrnament } from './HeroAudioOrnament'
import { HeroJapaneseMotifs } from './HeroJapaneseMotifs'
import { HeroPortraitSeal } from './HeroPortraitSeal'
import { HeroVoiceNoteCard } from './HeroVoiceNoteCard'
import { HERO_ORB_OUTER_FRAME_CLASS } from './heroOrbConstants'
import { VoiceCardPetals } from '../../petals/VoiceCardPetals'
import { ResumeButton } from '../ResumeButton/ResumeButton'
import type { SectionProps } from '../SectionTypes'
import { daySectionHeroFrame, nightSectionHeroFrame } from '../sectionGlass'

const introContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.12 },
  },
}

const introItem = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function Hero({ theme }: SectionProps) {
  const isNight = theme === 'night'
  const reduced = useReducedMotion() ?? false
  const [voiceStream, setVoiceStream] = useState<MediaStream | null>(null)
  const [voiceRecording, setVoiceRecording] = useState(false)

  const pillClass = isNight
    ? 'border-white/15 bg-black/25 text-parchment/75 backdrop-blur-sm'
    : 'border-[color:var(--dawn-card-border)] bg-white/55 text-[color:var(--dawn-muted)] backdrop-blur-sm shadow-sm'

  const kickerEn = isNight ? 'text-parchment/45' : 'text-[color:var(--dawn-muted)]'
  const kickerJp = isNight ? 'text-sakura-pink/75' : 'text-rose-600/85'
  const leadClass = isNight ? 'text-parchment/72' : 'text-[color:var(--dawn-muted)]'
  const subheadClass = isNight ? 'text-parchment/55' : 'text-[color:var(--dawn-muted)]'

  const pills = ['4+ years shipping', 'RAG & evaluation', 'Voice & multilingual']

  return (
    <motion.section
      id="hero"
      className="relative flex min-h-screen w-full max-w-[100%] flex-col pb-20 pt-24 lg:pb-28 lg:pt-32"
      aria-label="Hero"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="pointer-events-none absolute inset-y-4 left-0 right-0 -z-20 overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2.75rem]">
        <video
          className="h-full w-full object-cover"
          src="https://motionbgs.com/dl/hd/91"
          autoPlay
          muted
          loop
          playsInline
        />
        <div
          className={
            isNight
              ? 'absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/55'
              : 'absolute inset-0 bg-gradient-to-b from-white/70 via-white/45 to-pink-50/50'
          }
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,transparent_0%,rgba(0,0,0,0.55)_88%)]"
          style={{ opacity: isNight ? 1 : 0.22 }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(245,198,214,0.12),_transparent_52%),radial-gradient(circle_at_20%_80%,_rgba(139,47,60,0.18),_transparent_50%)]" />
      <div className={isNight ? nightSectionHeroFrame : daySectionHeroFrame} aria-hidden />

      <HeroJapaneseMotifs isNight={isNight} />

      <div className="relative z-10 mx-auto grid w-full min-w-0 max-w-7xl flex-1 grid-cols-1 items-center gap-12 px-4 sm:px-6 md:gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-16 lg:px-10 xl:max-w-[80rem] xl:gap-20 xl:px-12 2xl:max-w-[90rem] 2xl:gap-24 2xl:px-16 min-[1600px]:max-w-[min(112rem,calc(100%-3rem))]">
        <motion.div
          className="order-2 flex min-w-0 flex-col justify-center space-y-8 lg:order-1"
          variants={introContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={introItem} className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className={`font-jp-hand text-sm tracking-[0.35em] sm:text-base ${kickerJp}`}>信頼できるAI</span>
            <span
              className={`hidden h-px w-12 bg-gradient-to-r sm:block ${isNight ? 'from-sakura-pink/45 to-transparent' : 'from-rose-400/45 to-transparent'}`}
              aria-hidden
            />
            <span className={`text-[0.62rem] font-medium uppercase tracking-[0.28em] ${kickerEn}`}>
              Trustworthy systems
            </span>
          </motion.div>

          <div className="space-y-3">
            <h1
              className={`text-balance font-heading text-[1.85rem] font-medium leading-[1.2] tracking-tight sm:text-4xl lg:text-[2.65rem] lg:leading-[1.18] ${
                isNight ? 'text-parchment/95' : 'text-[color:var(--dawn-text)]'
              }`}
            >
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
              >
                Building trustworthy AI systems
              </motion.span>
              <motion.span
                className={`mt-1 block sm:mt-2 ${subheadClass}`}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              >
                for real-world healthcare and products.
              </motion.span>
            </h1>
            <motion.div
              className={`h-px max-w-[10rem] origin-left ${isNight ? 'bg-gradient-to-r from-sakura-pink/50 to-transparent' : 'bg-gradient-to-r from-rose-500/45 to-transparent'}`}
              initial={{ scaleX: reduced ? 1 : 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden
            />
          </div>

          <motion.p variants={introItem} className={`max-w-xl text-[0.9375rem] leading-[1.7] sm:text-base ${leadClass}`}>
            AI &amp; ML engineer focused on backend systems, product-grade ML, and evaluation. Experience across RAG
            pipelines, semantic caching, multilingual voice interfaces, and shipping reliable models to production.
          </motion.p>

          <motion.div variants={introItem} className="flex flex-wrap gap-2">
            {pills.map((label) => (
              <span
                key={label}
                className={`rounded-full border px-3 py-1.5 text-[0.58rem] font-medium uppercase tracking-[0.18em] ${pillClass}`}
              >
                {label}
              </span>
            ))}
          </motion.div>

          <motion.div variants={introItem} className="flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              href="#projects"
              className={`group inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                isNight
                  ? 'border-white/[0.16] bg-white/[0.06] text-parchment/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/22 hover:bg-white/[0.1] focus-visible:ring-white/25'
                  : 'border-[color:var(--dawn-card-border)] bg-[color:var(--dawn-card)] text-[color:var(--dawn-text)] hover:bg-[color:var(--dawn-nav)] focus-visible:ring-[color:var(--dawn-text)]'
              }`}
            >
              View work
              <span
                className={`h-px w-5 bg-gradient-to-r transition-all duration-500 group-hover:w-7 ${
                  isNight ? 'from-white/40 to-white/70' : 'from-[color:var(--dawn-text)] to-transparent'
                }`}
              />
            </a>
            <a
              href="#experience"
              className={`group inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                isNight
                  ? 'border-white/20 bg-white/[0.06] text-parchment/90 hover:border-sakura-pink/35 hover:bg-white/[0.1] focus-visible:ring-sakura-pink/50'
                  : 'border-[color:var(--dawn-card-border)] bg-white/70 text-[color:var(--dawn-text)] hover:bg-white focus-visible:ring-[color:var(--dawn-text)]'
              }`}
            >
              Career timeline
              <span
                className={`h-px w-5 bg-gradient-to-r transition-all duration-500 group-hover:w-7 ${
                  isNight ? 'from-parchment/40 to-transparent' : 'from-[color:var(--dawn-muted)] to-transparent'
                }`}
              />
            </a>
            <ResumeButton theme={theme} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className={`space-y-4 border-t pt-8 ${isNight ? 'border-white/10' : 'border-[color:var(--dawn-card-border)]'}`}
          >
            <div className={`flex items-baseline gap-3 ${isNight ? 'text-parchment/40' : 'text-[color:var(--dawn-muted)]'}`}>
              <span className={`font-jp-hand text-xs tracking-[0.4em] ${isNight ? 'text-sakura-pink/55' : 'text-rose-600/70'}`}>
                音声
              </span>
              <span className="text-[0.58rem] uppercase tracking-[0.22em]">Voice note</span>
            </div>
            {/* ✿ Petals rendered OUTSIDE the card's backdrop-blur context */}
            <div className="relative">
              <VoiceCardPetals isNight={isNight} />
              <HeroVoiceNoteCard
                theme={theme}
                contentTopClassName="mt-0"
                onVoiceStreamChange={setVoiceStream}
                onVoiceRecordingChange={setVoiceRecording}
              />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="order-1 flex min-w-0 flex-col items-center justify-center gap-7 md:gap-9 lg:order-2 xl:gap-11"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroPortraitSeal theme={theme} />
          <div className={HERO_ORB_OUTER_FRAME_CLASS}>
            <motion.div
              className="absolute inset-6 rounded-full border border-white/[0.12]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 1.2 }}
            />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1.05 }}
            >
              <div className="relative h-32 w-20 rounded-full bg-gradient-to-b from-sakura-pink/12 via-sakura-pink/4 to-transparent">
                <div className="absolute inset-x-0 top-8 h-24 rounded-full bg-gradient-to-b from-parchment/10 via-parchment/4 to-transparent blur-xl" />
                <div className="absolute bottom-8 left-1/2 h-8 w-16 -translate-x-1/2 rounded-full bg-gradient-to-r from-ink-deep via-transparent to-ink-deep opacity-70 blur-lg" />
              </div>
            </motion.div>
            <motion.div
              className="absolute inset-0 z-[1]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: 0.35, duration: 1.35 }}
            >
              <FogLayer />
            </motion.div>
            <HeroAudioOrnament
              theme={theme}
              stream={voiceStream}
              live={voiceRecording && !!voiceStream}
            />
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

function FogLayer() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-full">
      <motion.div
        className="absolute inset-x-[-40%] top-1/3 h-1/3 bg-gradient-to-r from-white/5 via-white/12 to-white/5 blur-3xl"
        animate={{ x: ['-10%', '10%', '-8%'] }}
        transition={{ duration: 26, ease: 'linear', repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-x-[-30%] top-1/2 h-1/3 bg-gradient-to-r from-ink-deep/60 via-ink-deep/20 to-ink-deep/60 blur-3xl"
        animate={{ x: ['8%', '-8%', '6%'] }}
        transition={{ duration: 34, ease: 'linear', repeat: Infinity }}
      />
    </div>
  )
}
