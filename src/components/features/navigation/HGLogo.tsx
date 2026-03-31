export function HGLogo({ theme }: { theme: 'night' | 'day' }) {
  const isNight = theme === 'night'
  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border text-xs font-heading tracking-[0.2em] uppercase ${
          isNight ? 'border-sakura-pink/40 bg-black/80 text-parchment' : 'border-ink-deep/20 bg-white/90 text-ink-deep'
        } transition-transform duration-200 hover:scale-[1.02] hover:border-sakura-pink/70`}
        aria-hidden="true"
      >
        <span className="relative z-10">HG</span>
        <span className="pointer-events-none absolute inset-[-40%] bg-[radial-gradient(circle_at_top,_rgba(245,198,214,0.35),_transparent_60%)]" />
      </div>
      <span className="hidden text-xs font-medium tracking-[0.28em] uppercase sm:inline">
        Hrithik&nbsp;Ghosh
      </span>
    </div>
  )
}
