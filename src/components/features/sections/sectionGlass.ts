/**
 * Shared "glass" panel rim — thin light border + large radius.
 * Night glass uses bg-black/40 so card animations (3D tilt, sakura rain, ink wipe) show through.
 */
export const nightGlassSection =
  'rounded-3xl border border-white/[0.14] bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl'

export const dayGlassSection =
  'rounded-3xl border border-[color:var(--dawn-card-border)] bg-[color:var(--dawn-card)] shadow-[0_8px_40px_var(--dawn-shadow),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-xl'

export const nightGlassHeroVoice =
  'rounded-3xl border border-white/[0.14] bg-gradient-to-br from-white/[0.07] via-black/48 to-black/85 text-parchment/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_0_48px_rgba(0,0,0,0.5)] backdrop-blur-xl'

export const dayGlassHeroVoice =
  'rounded-3xl border border-[color:var(--dawn-card-border)] bg-[color:var(--dawn-card)] text-[color:var(--dawn-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_48px_var(--dawn-shadow)] backdrop-blur-xl ring-1 ring-black/[0.05]'

export const nightSectionHeroFrame =
  'pointer-events-none absolute inset-y-12 left-4 right-4 -z-10 overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-b from-white/[0.04] via-black/70 to-black/92 shadow-[0_0_120px_rgba(0,0,0,0.88)] sm:left-6 sm:right-6'

export const daySectionHeroFrame =
  'pointer-events-none absolute inset-y-12 left-4 right-4 -z-10 overflow-hidden rounded-3xl border border-rose-200/30 bg-gradient-to-b from-white/55 via-white/35 to-pink-50/45 shadow-[0_0_80px_rgba(244,114,182,0.12)] sm:left-6 sm:right-6'

/** Mobile section shell — lighter gradient for inner animation visibility. */
export const nightMobileSectionShell =
  'relative overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-b from-white/[0.04] via-black/65 to-black/85 p-5 shadow-[0_0_72px_rgba(0,0,0,0.82)] sm:p-6'

export const dayMobileSectionShell =
  'relative overflow-hidden rounded-3xl border border-[color:var(--dawn-card-border)] bg-[color:var(--dawn-card)] p-5 shadow-[0_8px_40px_var(--dawn-shadow),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-xl sm:p-6'
