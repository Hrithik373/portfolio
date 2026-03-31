import { motion } from 'framer-motion'

import { dayGlassSection, nightGlassSection } from '../sectionGlass'

export function Footer({ theme }: { theme: 'night' | 'day' }) {
  const isNight = theme === 'night'

  return (
    <footer className="relative mx-auto mt-10 flex w-full min-w-0 max-w-7xl flex-col gap-4 px-4 pb-10 pt-6 sm:px-6 md:px-8 lg:px-10 xl:max-w-[80rem] xl:px-12 2xl:max-w-[90rem] 2xl:px-16 min-[1600px]:max-w-[min(112rem,calc(100%-3rem))]">
      <motion.div
        className={`h-px w-full bg-gradient-to-r from-transparent ${
          isNight ? 'via-white/15' : 'via-[color:var(--dawn-text)]'
        } to-transparent opacity-50`}
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 0.6 }}
        viewport={{ amount: 0.6, once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'center' }}
      />
      <motion.div
        className={`px-5 py-4 text-xs ${
          isNight ? `${nightGlassSection} text-parchment/70` : `${dayGlassSection} text-[color:var(--dawn-muted)]`
        }`}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.5, once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[0.7rem] leading-relaxed">
          Building practical, trustworthy AI systems — from RAG pipelines and evaluation to multilingual voice
          interfaces.
        </p>
      </motion.div>
      <motion.p
        className={`text-[0.68rem] ${
          isNight ? 'text-parchment/50' : 'text-[color:var(--dawn-text)]'
        }`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ amount: 0.6, once: true }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        © {new Date().getFullYear()} Hrithik Ghosh. Built with care.
      </motion.p>
    </footer>
  )
}
