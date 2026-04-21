interface LevelTimelineProps {
  locale: string
}

const levels = [
  { emoji: '🌱', name: 'AI Rookie', xp: '0' },
  { emoji: '💡', name: 'AI User', xp: '1K' },
  { emoji: '🧠', name: 'AI Thinker', xp: '5K' },
  { emoji: '🎯', name: 'AI Strategist', xp: '15K' },
  { emoji: '🏗️', name: 'AI Architect', xp: '40K' },
  { emoji: '👑', name: 'AI Dirigent', xp: '100K' },
]

export default function LevelTimeline({ locale }: LevelTimelineProps) {
  const isDE = locale === 'de'

  return (
    <section className="py-10">
      <div className="max-w-3xl mx-auto px-5">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center text-white mb-10">
          {isDE ? 'Dein Aufstieg' : 'Your progression'}
        </h2>

        {/* Timeline container */}
        <div className="relative">
          {/* Connecting gradient line */}
          <div
            className="absolute top-6 left-0 right-0 h-0.5"
            style={{
              background: 'linear-gradient(to right, var(--color-primary), var(--color-teal), var(--color-gold))',
            }}
          />

          {/* Level nodes */}
          <div className="relative flex justify-between">
            {levels.map((level, index) => {
              const isLast = index === levels.length - 1
              return (
                <div key={level.name} className="flex flex-col items-center gap-2">
                  {/* Circle node */}
                  <div
                    className="w-12 h-12 rounded-full bg-bg-mid border-2 flex items-center justify-center text-xl z-10"
                    style={{
                      borderColor: isLast ? 'var(--color-gold)' : 'var(--color-primary)',
                      boxShadow: isLast ? '0 0 20px rgba(251,191,36,0.15)' : undefined,
                    }}
                  >
                    {level.emoji}
                  </div>
                  {/* Level name */}
                  <span
                    className="text-xs font-semibold text-center leading-tight"
                    style={{ color: isLast ? 'var(--color-gold)' : 'var(--color-text-secondary)', maxWidth: '60px' }}
                  >
                    {level.name}
                  </span>
                  {/* XP */}
                  <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    {level.xp}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
