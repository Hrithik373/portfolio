import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { MidnightScrollBackground } from '../components/features/backgrounds/MidnightScrollBackground'
import { Loader } from '../components/features/loader/Loader'
import { HGLogo } from '../components/features/navigation/HGLogo'
import { NavbarPetal } from '../components/features/navigation/NavbarPetal'
import { SakuraCanvas } from '../components/features/petals/SakuraCanvas'
import { About } from '../components/features/sections/About/About'
import { BlogPost } from '../components/features/sections/BlogPost/BlogPost'
import { Contact } from '../components/features/sections/Contact/Contact'
import { Experience } from '../components/features/sections/Experience/Experience'
import { Footer } from '../components/features/sections/Footer/Footer'
import { Hero } from '../components/features/sections/Hero/Hero'
import { Projects } from '../components/features/sections/Projects/Projects'
import { Skills } from '../components/features/sections/Skills/Skills'
import { useBlossomSound } from '../hooks/useBlossomSound'

function mixLin(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Dawn palette without integer rounding — avoids banding / “stuck” contrast steps. */
function buildDawnStyleVars(dawn: number): Record<string, string> {
  const t = Math.max(0, Math.min(1, dawn))
  const mixRgb = (from: [number, number, number], to: [number, number, number]) =>
    `rgb(${mixLin(from[0], to[0], t)} ${mixLin(from[1], to[1], t)} ${mixLin(from[2], to[2], t)})`
  return {
    '--dawn-bg-from': mixRgb([210, 214, 236], [232, 198, 210]),
    '--dawn-bg-to': mixRgb([196, 204, 230], [222, 190, 202]),
    '--dawn-card': mixRgb([214, 218, 236], [220, 190, 202]),
    '--dawn-card-border': mixRgb([164, 172, 200], [176, 156, 170]),
    '--dawn-nav': mixRgb([210, 214, 236], [222, 192, 204]),
    '--dawn-input': mixRgb([220, 224, 240], [228, 200, 210]),
    '--dawn-text': mixRgb([34, 38, 64], [54, 42, 50]),
    '--dawn-muted': mixRgb([62, 72, 104], [84, 72, 82]),
    '--dawn-shadow': `rgba(${mixLin(120, 200, t)} ${mixLin(140, 120, t)} ${mixLin(200, 150, t)} / ${0.28 + t * 0.28})`,
  }
}

const sections = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'blogpost', label: 'Blog' },
  { id: 'contact', label: 'Contact' },
]

export default function DesktopPortfolio() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeSectionId, setActiveSectionId] = useState<string>('hero')
  const [theme, setTheme] = useState<'night' | 'day'>('night')
  const [heroAnimKey, setHeroAnimKey] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [navPetalTrigger, setNavPetalTrigger] = useState(0)
  const [isSoundOn, setIsSoundOn] = useState(false)
  const [dawnIntensity, setDawnIntensity] = useState(55)
  const prefersReducedMotion = useReducedMotion() ?? false
  useBlossomSound(isSoundOn)
  const rootRef = useRef<HTMLDivElement>(null)
  const dawnGlowRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    const minimum = prefersReducedMotion ? 500 : 2200
    const timeout = window.setTimeout(() => setIsLoading(false), minimum)
    return () => window.clearTimeout(timeout)
  }, [prefersReducedMotion])

  useEffect(() => {
    document.body.dataset.theme = theme
  }, [theme])

  const handleSkip = () => setIsLoading(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && window.scrollY < 80) {
        setHeroAnimKey((key) => key + 1)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop)

        if (visible[0]) {
          const id = visible[0].target.id
          if (id && id !== activeSectionId) {
            setActiveSectionId(id)
          }
        }
      },
      { threshold: 0.6 },
    )

    sections.forEach((section) => {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [activeSectionId])

  const handleNavClick = (id: string) => {
    setNavPetalTrigger((n) => n + 1)
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
    if (id === 'hero') {
      setHeroAnimKey((key) => key + 1)
    }
  }

  const isNight = theme === 'night'

  const applyDawnToDom = (dawn: number) => {
    const el = rootRef.current
    if (!el) return
    const vars = buildDawnStyleVars(dawn)
    for (const [key, value] of Object.entries(vars)) {
      el.style.setProperty(key, value)
    }
    el.style.background = 'linear-gradient(180deg, var(--dawn-bg-from), var(--dawn-bg-to))'

    const glow = dawnGlowRef.current
    if (glow) {
      const g = Math.max(0, Math.min(1, dawn))
      glow.style.background = `linear-gradient(90deg, rgba(255,182,193,0) 0%, rgba(255,182,193,${
        0.25 + g * 0.5
      }) 50%, rgba(255,182,193,0) 100%)`
      glow.style.boxShadow = `0 0 12px rgba(255,182,193,${0.35 + g * 0.5})`
    }
  }

  /** Only background in React — dawn CSS vars are set via setProperty (no spring) so the slider never lags behind the thumb. */
  const rootStyle = useMemo(
    () =>
      !isNight
        ? ({
            background: 'linear-gradient(180deg, var(--dawn-bg-from), var(--dawn-bg-to))',
          } as React.CSSProperties)
        : undefined,
    [isNight],
  )

  useLayoutEffect(() => {
    if (isNight || !rootRef.current) return
    applyDawnToDom(dawnIntensity / 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-apply palette when leaving night mode
  }, [isNight])

  const dawnFillPercent = Math.max(0, Math.min(100, ((dawnIntensity - 20) / 80) * 100))
  /** One decimal so sub–integer warmth changes are visible; avoids “jumping” whole percents. */
  const dawnWarmthLabel = dawnFillPercent.toFixed(1)

  const handleDawnInput = (raw: number) => {
    const clamped = Math.min(100, Math.max(20, raw))
    setDawnIntensity(clamped)
    applyDawnToDom(clamped / 100)
  }

  /** One “warmth %” on the 0–100 label = 0.8 units on the 20–100 range (80 span). */
  const handleDawnKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const stepWarmth = event.shiftKey ? 5 : 1
    const rawDelta = (stepWarmth / 100) * 80
    const dir = event.key === 'ArrowRight' ? 1 : -1
    handleDawnInput(dawnIntensity + dir * rawDelta)
  }

  return (
    <div
      ref={rootRef}
      className={`relative min-h-screen overflow-x-hidden ${
        isNight ? 'bg-black text-parchment' : 'text-[color:var(--dawn-text)]'
      }`}
      style={rootStyle}
    >
      {isNight && <MidnightScrollBackground />}
      <SakuraCanvas reduced={prefersReducedMotion} theme={theme} />
      <AnimatePresence>
        {isLoading && <Loader onSkip={handleSkip} theme={theme} />}
      </AnimatePresence>

      <div className="pointer-events-none fixed left-4 top-4 z-40 flex flex-col gap-2">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(isNight ? 'day' : 'night')}
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.68rem] font-medium tracking-[0.18em] uppercase shadow-soft-glow backdrop-blur-md transition-all ${
              isNight
                ? 'border-white/20 bg-white/10 text-white/90 shadow-[0_0_18px_rgba(255,255,255,0.35)] hover:bg-white/15'
                : 'border-pink-200/60 bg-white/70 text-[#4a3a44] shadow-[0_0_18px_rgba(255,182,193,0.45)] hover:bg-white/85'
            }`}
            aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
          >
            <span aria-hidden="true" className="text-sm">
              {isNight ? '🌙' : '☀️'}
            </span>
            <span className="hidden sm:inline">{isNight ? 'Night' : 'Day'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSoundOn((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.68rem] font-medium tracking-[0.18em] uppercase shadow-soft-glow backdrop-blur-md transition-all ${
              isNight
                ? 'border-white/20 bg-white/10 text-white/90 shadow-[0_0_18px_rgba(255,255,255,0.35)] hover:bg-white/15'
                : 'border-pink-200/60 bg-white/70 text-[#4a3a44] shadow-[0_0_18px_rgba(255,182,193,0.45)] hover:bg-white/85'
            }`}
            aria-label={isSoundOn ? 'Mute cherry blossom sound' : 'Play cherry blossom sound'}
          >
            <span aria-hidden="true" className="text-sm">
              {isSoundOn ? '🔊' : '🔇'}
            </span>
            <span className="hidden sm:inline">{isSoundOn ? 'Sound on' : 'Sound off'}</span>
          </button>
        </div>
        {!isNight && (
          <div className="pointer-events-auto w-[min(100vw-2rem,16rem)] rounded-2xl border border-stone-200/80 bg-white/90 px-3.5 py-2.5 shadow-[0_8px_32px_rgba(15,23,42,0.08),0_0_1px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:w-64">
            <div className="mb-2 flex items-end justify-between gap-2">
              <div>
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Atmosphere
                </p>
                <p className="mt-0.5 text-[0.7rem] font-medium text-stone-800">Dawn warmth</p>
              </div>
              <span className="tabular-nums text-[0.75rem] font-semibold text-rose-500/90">{dawnWarmthLabel} %</span>
            </div>
            <div className="relative flex items-center py-1">
              <div
                className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-stone-200/95 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-l-full bg-gradient-to-r from-rose-200/95 via-pink-300/95 to-fuchsia-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                style={{ width: `${dawnFillPercent}%` }}
                aria-hidden
              />
              <input
                type="range"
                className="dawn-range-input relative z-10 w-full"
                min={20}
                max={100}
                step="any"
                value={dawnIntensity}
                onInput={(event) => handleDawnInput(Number((event.target as HTMLInputElement).value))}
                onChange={(event) => handleDawnInput(Number(event.target.value))}
                onKeyDown={handleDawnKeyDown}
                aria-label="Dawn warmth — soft to rich. Arrow keys adjust 1% warmth; Shift+arrows 5%."
                aria-valuetext={`${dawnWarmthLabel} percent warmth`}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[0.55rem] font-medium uppercase tracking-[0.14em] text-stone-400">
              <span>Soft</span>
              <span>Rich</span>
            </div>
            <span
              ref={dawnGlowRef}
              className="pointer-events-none mt-2 block h-px w-full rounded-full bg-gradient-to-r from-transparent via-rose-300/50 to-transparent opacity-80"
              style={{
                boxShadow: `0 0 14px rgba(244, 114, 182, ${0.12 + (dawnIntensity / 100) * 0.22})`,
              }}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center bg-gradient-to-b from-black/80 via-black/40 to-transparent py-4 backdrop-blur-xs"
        aria-hidden="true"
      >
        <div
          className={`h-px w-2/3 bg-gradient-to-r from-transparent ${
            isNight ? 'via-sakura-pink/40' : 'via-[color:var(--dawn-text)]'
          } to-transparent opacity-40`}
        />
      </div>

      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center">
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-auto relative mt-3 flex items-center gap-5 overflow-visible rounded-full border px-5 ${
            isScrolled ? 'py-1.5' : 'py-2'
          } text-xs sm:text-sm shadow-soft-glow backdrop-blur-md transition-all duration-300 ${
            isNight
              ? 'border-white/[0.14] bg-black/70 text-parchment/80'
              : 'border-[color:var(--dawn-card-border)] bg-[color:var(--dawn-nav)] text-[color:var(--dawn-text)]'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div
              className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,198,214,0.16),_transparent_65%)] ${
                isNight ? '' : 'opacity-80'
              }`}
            />
            <div className="grain-overlay absolute inset-0" />
          </div>
          <div className="pointer-events-none absolute inset-0 z-0 overflow-visible">
            <NavbarPetal
              reduced={prefersReducedMotion}
              theme={theme}
              triggerFromParent={navPetalTrigger}
            />
          </div>
          <HGLogo theme={theme} />
          <div className="hidden items-center gap-3 md:flex">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`group relative z-0 rounded-full px-3 py-1 text-[0.7rem] font-medium tracking-[0.12em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-pink/70 ${
                  activeSectionId === section.id
                    ? isNight
                      ? 'text-parchment'
                      : 'text-[color:var(--dawn-text)]'
                    : isNight
                      ? 'text-parchment/70'
                      : 'text-[color:var(--dawn-muted)]'
                }`}
                onClick={() => handleNavClick(section.id)}
              >
                <span
                  className={`pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_center,_rgba(245,198,214,0.25),_transparent_70%)] blur-md transition-opacity duration-500 ${
                    activeSectionId === section.id
                      ? 'opacity-60'
                      : 'opacity-0 group-hover:opacity-35'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`relative z-10 ${
                    isNight ? 'group-hover:text-parchment' : 'group-hover:text-[color:var(--dawn-text)]'
                  }`}
                >
                  {section.label}
                </span>
                <span
                  className={`pointer-events-none absolute inset-x-2 bottom-0 h-px origin-center transition-all duration-300 ${
                    isNight ? 'bg-sakura-pink/70' : 'bg-[color:var(--dawn-text)]'
                  } ${
                    activeSectionId === section.id
                      ? 'scale-x-100 opacity-90'
                      : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-80'
                  }`}
                />
              </button>
            ))}
          </div>
        </motion.nav>
      </header>

      <main className="relative z-10 w-full min-w-0">
        <Hero key={heroAnimKey} theme={theme} />
        <About theme={theme} />
        <Skills theme={theme} />
        <Projects theme={theme} />
        <Experience theme={theme} />
        <BlogPost theme={theme} />
        <Contact theme={theme} />
        <Footer theme={theme} />
      </main>
    </div>
  )
}
