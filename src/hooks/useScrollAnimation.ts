import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap-setup'

interface ScrollRevealOpts {
  from?: gsap.TweenVars
  to?: gsap.TweenVars
  start?: string
  stagger?: number
  children?: string
}

export function useScrollReveal<T extends HTMLElement>(opts: ScrollRevealOpts = {}) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const from: gsap.TweenVars = opts.from ?? { opacity: 0, y: 60 }
    const to: gsap.TweenVars = opts.to ?? { opacity: 1, y: 0 }

    if (opts.children) {
      const children = el.querySelectorAll(opts.children)
      if (children.length === 0) return
      gsap.set(children, from)
      const st = ScrollTrigger.create({
        trigger: el,
        start: opts.start ?? 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(children, {
            ...to,
            duration: 0.8,
            stagger: opts.stagger ?? 0.08,
            ease: 'power3.out',
            overwrite: true,
          })
        },
      })
      return () => st.kill()
    } else {
      gsap.set(el, from)
      const st = ScrollTrigger.create({
        trigger: el,
        start: opts.start ?? 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(el, {
            ...to,
            duration: 0.8,
            ease: 'power3.out',
            overwrite: true,
          })
        },
      })
      return () => st.kill()
    }
  }, [])

  return ref
}

export function useParallax<T extends HTMLElement>(speed: number = 0.3) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const st = gsap.to(el, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })

    return () => {
      if (st.scrollTrigger) st.scrollTrigger.kill()
    }
  }, [])

  return ref
}

export function useLineReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    gsap.set(el, { scaleX: 0, transformOrigin: 'left center' })
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(el, { scaleX: 1, duration: 1.2, ease: 'power3.inOut' })
      },
    })
    return () => st.kill()
  }, [])

  return ref
}
