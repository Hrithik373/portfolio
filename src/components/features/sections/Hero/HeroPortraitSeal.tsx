import { motion } from 'framer-motion'
import { useState } from 'react'

import type { SectionProps } from '../SectionTypes'

import { HERO_ORB_OUTER_FRAME_CLASS } from './heroOrbConstants'

/** Profile image in `public/` — PNG or JPG. */
export const HERO_PORTRAIT_PUBLIC_PATH = '/hrithik-portrait.png'

type Props = Pick<SectionProps, 'theme'>

/**
 * Same outer ring as the hero audio orb; photo fills the circle (no side chrome).
 */
export function HeroPortraitSeal({ theme }: Props) {
  const isNight = theme === 'night'
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <motion.div
      className={HERO_ORB_OUTER_FRAME_CLASS}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{ delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="pointer-events-none absolute inset-6 z-[2] rounded-full border border-sakura-pink/14"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.35, duration: 0.9 }}
        aria-hidden
      />
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {!imageFailed ? (
          <img
            src={HERO_PORTRAIT_PUBLIC_PATH}
            alt="Hrithik Ghosh"
            className="h-full w-full object-cover object-[center_18%]"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className={`flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center ${
              isNight ? 'bg-black/85 text-parchment/55' : 'bg-stone-200/90 text-stone-600'
            }`}
          >
            <span className={`font-jp-hand text-2xl ${isNight ? 'text-sakura-pink/40' : 'text-rose-500/50'}`}>
              像
            </span>
            <span className="max-w-[11rem] text-[0.55rem] uppercase tracking-[0.16em] opacity-75">
              Add hrithik-portrait.png in public
            </span>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-black/40 via-transparent to-black/20"
          aria-hidden
        />
      </div>
    </motion.div>
  )
}
