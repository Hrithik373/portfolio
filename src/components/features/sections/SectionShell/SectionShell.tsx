import { useScrollReveal } from '../../../../hooks/useScrollAnimation'
import { daySectionHeroFrame, nightSectionHeroFrame } from '../sectionGlass'
import type { SectionProps } from '../SectionTypes'

type SectionShellProps = Pick<SectionProps, 'theme'> & {
  id: string
  label: string
  eyebrow: string
  backgroundVideo?: string
  mainAlign?: 'start' | 'center'
  children: React.ReactNode
}

export function SectionShell({
  id,
  label,
  eyebrow,
  theme,
  backgroundVideo,
  mainAlign = 'center',
  children,
}: SectionShellProps) {
  const isNight = theme === 'night'
  const headerRef = useScrollReveal<HTMLElement>({
    from: { opacity: 0, y: 22 },
    to: { opacity: 1, y: 0 },
    start: 'top 88%',
  })

  return (
    <section
      id={id}
      className="relative flex min-h-screen w-full max-w-[100%] flex-col pb-20 pt-24 lg:pb-28 lg:pt-32"
      aria-label={label}
    >
      {backgroundVideo && (
        <div className="pointer-events-none absolute inset-y-4 left-0 right-0 -z-20 overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2.75rem]">
          <video
            className="h-full w-full object-cover"
            src={backgroundVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div
            className={
              isNight
                ? 'absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/55'
                : 'absolute inset-0 bg-gradient-to-b from-white/70 via-white/45 to-pink-50/50'
            }
          />
        </div>
      )}
      <div className={isNight ? nightSectionHeroFrame : daySectionHeroFrame} aria-hidden />

      <div
        className={`relative z-10 mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-12 px-4 sm:px-6 lg:gap-16 lg:px-10 xl:max-w-[80rem] xl:px-12 2xl:max-w-[90rem] 2xl:px-16 min-[1600px]:max-w-[min(112rem,calc(100%-3rem))] ${
          mainAlign === 'start' ? 'justify-start' : 'justify-center'
        }`}
      >
        <header ref={headerRef} className="space-y-3">
          <div className="flex items-center gap-4">
            <span
              className={`text-[0.6rem] font-medium uppercase tracking-[0.32em] ${
                isNight ? 'text-sakura-pink/70' : 'text-rose-500/70'
              }`}
            >
              {eyebrow}
            </span>
            <span
              className={`h-px w-8 bg-gradient-to-r ${
                isNight ? 'from-sakura-pink/40 to-transparent' : 'from-rose-400/40 to-transparent'
              }`}
              aria-hidden
            />
          </div>
          <h2
            className={`font-heading text-3xl font-medium tracking-tight sm:text-4xl lg:text-[2.25rem] ${
              isNight ? 'text-parchment/92' : 'text-[color:var(--dawn-text)]'
            }`}
          >
            {label}
          </h2>
        </header>
        {children}
      </div>
    </section>
  )
}
