import { useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { vikApiUrl } from '../../../../config/vikApiBase'
import { useScrollReveal } from '../../../../hooks/useScrollAnimation'
import { SectionSakuraRain } from '../../petals/FloatingCardPetals'
import { SectionShell } from '../SectionShell/SectionShell'
import type { SectionProps } from '../SectionTypes'
import { dayGlassSection, nightGlassSection } from '../sectionGlass'
import { VikChatPanel } from './VikChatPanel'
import { VikOrb, type VikBackendStatus } from './VikOrb'

export type VikProps = SectionProps & { embedded?: boolean }

const statusLabel: Record<VikBackendStatus, string> = {
  checking: 'Checking…',
  online: 'Online',
  offline: 'Offline — running locally via Docker',
}

export function Vik({ theme, embedded = false }: VikProps) {
  const isNight = theme === 'night'
  const reduced = useReducedMotion() ?? false
  const [status, setStatus] = useState<VikBackendStatus>('checking')
  const cardRef = useScrollReveal<HTMLDivElement>({
    from: { opacity: 0, y: 24 },
    to: { opacity: 1, y: 0 },
    start: 'top 90%',
  })

  useEffect(() => {
    let cancelled = false
    fetch(vikApiUrl('/agent/health'))
      .then((res) => {
        if (!cancelled) setStatus(res.ok ? 'online' : 'offline')
      })
      .catch(() => {
        if (!cancelled) setStatus('offline')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const mutedClass = isNight ? 'text-parchment/58' : 'text-[color:var(--dawn-muted)]'
  const glass = isNight ? nightGlassSection : dayGlassSection
  const statusColor =
    status === 'online'
      ? isNight
        ? 'text-emerald-300/80'
        : 'text-emerald-600/80'
      : status === 'checking'
        ? isNight
          ? 'text-amber-300/80'
          : 'text-amber-600/80'
        : isNight
          ? 'text-rose-300/80'
          : 'text-rose-600/80'

  const content = (
    <div ref={cardRef} className={`relative overflow-hidden ${glass} p-6 sm:p-8`}>
      {!reduced && <SectionSakuraRain isNight={isNight} />}

      {/* Kanji watermark — 話, "speak" */}
      <span
        className={`pointer-events-none absolute -right-3 -top-6 select-none font-jp-hand text-[7rem] leading-none ${
          isNight ? 'text-sakura-pink/[0.05]' : 'text-rose-400/[0.14]'
        }`}
        aria-hidden="true"
      >
        話
      </span>

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <VikOrb isNight={isNight} reduced={reduced} status={status} />
          <div>
            <p className={`text-sm leading-relaxed sm:max-w-md ${mutedClass}`}>
              Ask Vik about Hrithik's experience, projects, or skills — grounded in his real résumé, running on
              the agentic RAG pipeline built alongside this portfolio.
            </p>
            <p className={`mt-2 text-[0.62rem] font-semibold uppercase tracking-[0.24em] ${statusColor}`}>
              {statusLabel[status]}
            </p>
          </div>
        </div>

        <VikChatPanel theme={theme} status={status} onBackendUnreachable={() => setStatus('offline')} />
      </div>
    </div>
  )

  if (embedded) return content

  return (
    <SectionShell id="vik" label="Vik" eyebrow="AI Agent" theme={theme}>
      {content}
    </SectionShell>
  )
}
