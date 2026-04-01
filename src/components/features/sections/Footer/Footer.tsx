import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../../../lib/gsap-setup'
import { useScrollReveal } from '../../../../hooks/useScrollAnimation'
import { dayGlassSection, nightGlassSection } from '../sectionGlass'
import { useCookieConsent } from '../../../../context/CookieConsentContext'

function FooterCookieLink({ isNight }: { isNight: boolean }) {
  const { reopen, consent } = useCookieConsent()
  return (
    <button
      type="button"
      onClick={reopen}
      className={`text-[0.62rem] underline-offset-2 transition-colors hover:underline ${
        isNight ? 'text-parchment/30 hover:text-parchment/55' : 'text-[color:var(--dawn-muted)] opacity-60 hover:opacity-100'
      }`}
    >
      {consent === 'denied' ? '🔒 Cookie settings (features limited)' : 'Cookie & privacy settings'}
    </button>
  )
}

export function Footer({ theme }: { theme: 'night' | 'day' }) {
  const isNight = theme === 'night'
  const lineRef = useRef<HTMLDivElement>(null)
  const cardRef = useScrollReveal<HTMLDivElement>({ from: { opacity: 0, y: 16 }, to: { opacity: 1, y: 0 }, start: 'top 92%' })
  const copyrightRef = useScrollReveal<HTMLParagraphElement>({ from: { opacity: 0 }, to: { opacity: 1 }, start: 'top 95%' })

  useEffect(() => {
    const el = lineRef.current
    if (!el) return
    gsap.set(el, { scaleX: 0, opacity: 0, transformOrigin: 'center' })
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 95%',
      once: true,
      onEnter: () => gsap.to(el, { scaleX: 1, opacity: 0.6, duration: 0.9, ease: 'power3.inOut' }),
    })
    return () => st.kill()
  }, [])

  return (
    <footer className="relative mx-auto mt-10 flex w-full min-w-0 max-w-7xl flex-col gap-4 px-4 pb-10 pt-6 sm:px-6 md:px-8 lg:px-10 xl:max-w-[80rem] xl:px-12 2xl:max-w-[90rem] 2xl:px-16 min-[1600px]:max-w-[min(112rem,calc(100%-3rem))]">
      <div
        ref={lineRef}
        className={`h-px w-full bg-gradient-to-r from-transparent ${
          isNight ? 'via-white/15' : 'via-[color:var(--dawn-text)]'
        } to-transparent opacity-50`}
      />
      <div
        ref={cardRef}
        className={`px-5 py-4 text-xs ${
          isNight ? `${nightGlassSection} text-parchment/70` : `${dayGlassSection} text-[color:var(--dawn-muted)]`
        }`}
      >
        <p className="text-[0.7rem] leading-relaxed">
          Building practical, trustworthy AI systems — from RAG pipelines and evaluation to multilingual voice
          interfaces.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <p
          ref={copyrightRef}
          className={`text-[0.68rem] ${
            isNight ? 'text-parchment/50' : 'text-[color:var(--dawn-text)]'
          }`}
        >
          © {new Date().getFullYear()} Hrithik Ghosh. Built with care.
        </p>
        <FooterCookieLink isNight={isNight} />
      </div>
    </footer>
  )
}
