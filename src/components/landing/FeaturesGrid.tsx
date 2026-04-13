interface FeaturesGridProps {
  locale: 'de' | 'en'
}

const features = {
  de: [
    { emoji: '🔥', title: 'Daily Streaks', desc: 'Spiele jeden Werktag. Streak verlieren tut weh.' },
    { emoji: '⚔️', title: '1v1 Challenges', desc: 'Fordere Kollegen per Link heraus.' },
    { emoji: '🏢', title: 'Team Battles', desc: 'Abteilung vs. Abteilung.' },
    { emoji: '🎖️', title: '12 Badges', desc: 'Sammle sie alle.' },
  ],
  en: [
    { emoji: '🔥', title: 'Daily Streaks', desc: 'Play every weekday. Losing your streak hurts.' },
    { emoji: '⚔️', title: '1v1 Challenges', desc: 'Challenge colleagues via link.' },
    { emoji: '🏢', title: 'Team Battles', desc: 'Department vs. department.' },
    { emoji: '🎖️', title: '12 Badges', desc: 'Collect them all.' },
  ],
}

export default function FeaturesGrid({ locale }: FeaturesGridProps) {
  const isDE = locale === 'de'
  const items = features[locale]

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-5">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-white mb-12">
          {isDE ? 'Mehr als ein Quiz' : 'More than a quiz'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/4 border border-white/6 rounded-2xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="text-3xl mb-3">{feature.emoji}</div>
              <h3 className="text-base font-bold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
