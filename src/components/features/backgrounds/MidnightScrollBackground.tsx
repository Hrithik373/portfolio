import { motion, useScroll, useTransform } from 'framer-motion'

export function MidnightScrollBackground() {
  const { scrollYProgress } = useScroll()

  const topOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.9, 0.5, 0.25])
  const midOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 0.7, 0.4])
  const bottomOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.15, 0.35, 0.75])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,#3b234f_0,#050316_55%)]"
        style={{ opacity: topOpacity }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,#7c3aed_0,#050316_65%)]"
        style={{ opacity: midOpacity }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,#ec4899_0,#050316_70%)]"
        style={{ opacity: bottomOpacity }}
      />
      <div className="grain-overlay absolute inset-0" />
    </div>
  )
}
