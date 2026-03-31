import { motion } from 'framer-motion'

import { daySectionHeroFrame, nightSectionHeroFrame } from '../sectionGlass'

export function SectionShell({
  id,
  label,
  eyebrow,
  children,
  theme,
  backgroundVideo,
  backgroundImage,
  mainAlign = 'center',
}: {
  id: string
  label: string
  eyebrow?: string
  children: React.ReactNode
  theme: 'night' | 'day'
  backgroundVideo?: string
  /** Full-bleed still image behind the section (e.g. blogpost art). Takes precedence over `backgroundVideo`. */
  backgroundImage?: string
  /** Use `start` for tall sections (e.g. Contact) so content isn’t pushed below the fold by vertical centering. */
  mainAlign?: 'center' | 'start'
}) {
  const isNight = theme === 'night'
  const justifyMain = mainAlign === 'start' ? 'justify-start' : 'justify-center'

  const mediaFrame =
    'pointer-events-none absolute inset-y-4 left-0 right-0 -z-20 overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2.25rem]'

  return (
    <section
      id={id}
      className="relative w-full min-h-screen max-w-[100%]"
      aria-label={label}
    >
      {backgroundImage ? (
        <div className={mediaFrame}>
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
            role="img"
            aria-hidden
          />
          <div
            className={`absolute inset-0 ${isNight ? 'bg-black/72' : 'bg-black/58'}`}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55"
            aria-hidden
          />
        </div>
      ) : (
        backgroundVideo && (
          <div className={mediaFrame}>
            <video
              className="h-full w-full object-cover"
              src={backgroundVideo}
              autoPlay
              muted
              loop
              playsInline
            />
            <div className={`absolute inset-0 ${isNight ? 'bg-black/70' : 'bg-black/55'}`} />
          </div>
        )
      )}
      <div
        className={isNight ? nightSectionHeroFrame : daySectionHeroFrame}
        aria-hidden
      />
      <div
        className={`relative z-10 mx-auto flex min-h-screen w-full min-w-0 max-w-7xl flex-col ${justifyMain} gap-8 px-4 py-16 sm:px-6 lg:px-10 lg:py-24 xl:max-w-[80rem] xl:px-12 2xl:max-w-[90rem] 2xl:px-16 min-[1600px]:max-w-[min(112rem,calc(100%-3rem))]`}
      >
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.45 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 max-w-xl space-y-3 pl-[2px]"
      >
        {eyebrow && (
          <p
            className={`text-xs uppercase tracking-[0.28em] ${
              isNight ? 'text-sakura-pink/70' : 'text-white/80'
            }`}
            style={
              !isNight
                ? {
                    textShadow:
                      '0 0 12px rgba(168,85,247,0.7), 0 0 30px rgba(168,85,247,0.35)',
                  }
                : undefined
            }
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={`text-2xl font-heading sm:text-3xl ${
            isNight ? 'text-parchment/90' : 'text-white'
          }`}
          style={
            !isNight
              ? {
                  textShadow:
                    '0 0 16px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.3), 0 1px 3px rgba(0,0,0,0.4)',
                }
              : undefined
          }
        >
          {label}
        </h2>
      </motion.header>
      {children}
      </div>
    </section>
  )
}
