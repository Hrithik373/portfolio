import React from 'react'
import './SakuraPetals.css'

type Petal = {
  id: number
  left: number
  size: number
  duration: number
  delay: number
  rotation: number
}

const PETAL_COUNT = 25

// Runs once when module loads (not during render)
const petals: Petal[] = Array.from({ length: PETAL_COUNT }).map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: 12 + Math.random() * 12,
  duration: 8 + Math.random() * 6,
  delay: Math.random() * 5,
  rotation: Math.random() * 360,
}))

const SakuraPetals: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  if (!enabled) return null

  return (
    <div className="sakura-container">
      {petals.map((petal) => (
        <span
          key={petal.id}
          className="sakura-petal"
          style={{
            left: `${petal.left}%`,
            width: `${petal.size}px`,
            height: `${petal.size}px`,
            animationDuration: `${petal.duration}s`,
            animationDelay: `${petal.delay}s`,
            transform: `rotate(${petal.rotation}deg)`,
          }}
        />
      ))}
    </div>
  )
}

export default SakuraPetals
