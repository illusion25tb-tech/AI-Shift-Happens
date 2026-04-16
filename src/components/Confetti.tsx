import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  color: string
  size: number
  vx: number
  vy: number
  rotation: number
  rotSpeed: number
}

const COLORS = ['#5B4FC7', '#2DD4BF', '#FBBF24', '#F97316', '#DB2777', '#3B82F6']

export default function Confetti({ duration = 3000 }: { duration?: number }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const initial: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 3,
      vy: 1 + Math.random() * 3,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
    }))
    setParticles(initial)

    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  if (!visible) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 1,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${1.5 + Math.random() * 2}s linear forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
