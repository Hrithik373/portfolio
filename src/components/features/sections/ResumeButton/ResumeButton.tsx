import type { SectionProps } from '../SectionTypes'

const RESUME_PATH = '/hrithikgh_resume.pdf'
/** Filename used when the browser saves the file (same-origin `download` attribute). */
const DOWNLOAD_NAME = 'hrithikgh_resume.pdf'

export function ResumeButton({ theme = 'night' }: Pick<SectionProps, 'theme'>) {
  const isNight = theme === 'night'

  const shell = isNight
    ? 'border-ink-red/70 bg-black/60 text-parchment/80 shadow-[0_0_20px_rgba(139,47,60,0.45)] hover:bg-ink-red/70 hover:text-parchment focus-visible:ring-ink-red/80'
    : 'border-[color:var(--dawn-card-border)] bg-[color:var(--dawn-card)] text-[color:var(--dawn-text)] shadow-[0_4px_18px_var(--dawn-shadow)] hover:bg-[color:var(--dawn-nav)] focus-visible:ring-[color:var(--dawn-text)]'

  const seal = isNight
    ? 'border border-parchment/30 bg-black/80 text-[0.55rem] text-parchment/90'
    : 'border border-rose-200/60 bg-white text-[0.55rem] text-rose-800/90'

  const rule = isNight
    ? 'from-parchment/40 via-parchment/10 to-transparent group-hover:from-parchment/80 group-hover:via-parchment/20'
    : 'from-[color:var(--dawn-text)]/35 via-transparent to-transparent group-hover:from-[color:var(--dawn-text)]/55'

  return (
    <a
      href={RESUME_PATH}
      download={DOWNLOAD_NAME}
      className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium tracking-[0.12em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 ${shell}`}
    >
      <span className={`relative flex h-6 w-6 items-center justify-center rounded-full ${seal}`}>
        <span
          className={`absolute inset-1 rounded-full border ${isNight ? 'border-parchment/20' : 'border-rose-200/40'}`}
        />
        印
      </span>
      <span>My résumé · PDF</span>
      <span className={`h-4 w-px bg-gradient-to-b ${rule}`} />
    </a>
  )
}
