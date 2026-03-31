import { useId } from 'react'
import { motion } from 'framer-motion'

export type SakuraCanvasProps = {
  reduced: boolean
  theme: 'night' | 'day'
  /**
   * `fullscreen` — fixed to the viewport (main portfolio). `embedded` — fills a `relative` parent (intro loader).
   * Embedded avoids `fixed`+low z-index painting **behind** a z-50 overlay.
   */
  layout?: 'fullscreen' | 'embedded'
}

export function SakuraCanvas({ reduced, theme, layout = 'fullscreen' }: SakuraCanvasProps) {
  const gradientId = `petalGradient-${useId().replace(/:/g, '')}`

  // SVG-based, gentle looping petals to avoid heavy canvas work
  if (reduced) return null

  const isNight = theme === 'night'

  const layers = [
    { id: 'back', count: 8, duration: 32, delayOffset: 0 },
    { id: 'mid', count: 10, duration: 24, delayOffset: 4 },
    { id: 'front', count: 8, duration: 18, delayOffset: 8 },
  ] as const

  const rootClass =
    layout === 'embedded'
      ? 'pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden'
      : 'pointer-events-none fixed inset-0 z-10 overflow-hidden'

  return (
    <div className={rootClass}>
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="10%" r="80%">
            <stop offset="0%" stopColor={isNight ? '#fef6fb' : '#ffeef7'} stopOpacity={0.9} />
            <stop offset="40%" stopColor={isNight ? '#f5c6d6' : '#f9bcd6'} stopOpacity={0.7} />
            <stop offset="100%" stopColor={isNight ? '#f5c6d6' : '#f9bcd6'} stopOpacity={0} />
          </radialGradient>
        </defs>

        {layers.map((layer, layerIndex) =>
          Array.from({ length: layer.count }).map((_, i) => {
            const key = `${layer.id}-${i}`
            const delay = (layer.delayOffset + i * 1.7) % layer.duration
            const depthOpacity = layerIndex === 0 ? 0.06 : layerIndex === 1 ? 0.09 : 0.13
            const startX = (i * 13) % 120 - 10
            const endX = (i * 13) % 120 - 30
            const startY = -20 - i * 5
            const endY = 140 + i * 4
            const startRotate = -10 + i * 5
            const endRotate = 20 - i * 4

            return (
              <motion.g
                key={key}
                initial={{
                  x: startX,
                  y: startY,
                  rotate: startRotate,
                  opacity: 0,
                }}
                animate={{
                  x: [startX, endX],
                  y: [startY, endY],
                  rotate: [startRotate, endRotate],
                  opacity: [0, depthOpacity * 1.1, 0],
                }}
                transition={{
                  duration: layer.duration,
                  delay,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <path
                  d="M50 10 C47 16 44 22 46 27 C48 32 52 32 54 27 C56 22 53 16 50 10 Z"
                  fill={`url(#${gradientId})`}
                />
              </motion.g>
            )
          }),
        )}
      </svg>
    </div>
  )
}
