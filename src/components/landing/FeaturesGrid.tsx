interface FeaturesGridProps {
  locale: string
}

const features: Record<string, { emoji: string; title: string; desc: string }[]> = {
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
  tr: [
    { emoji: '🔥', title: 'Günlük Seriler', desc: 'Her iş gününde oyna. Seriyi kaybetmek acıtır.' },
    { emoji: '⚔️', title: '1v1 Meydan Okuma', desc: 'Meslektaşlarına link ile meydan oku.' },
    { emoji: '🏢', title: 'Takım Savaşları', desc: 'Departman vs. departman.' },
    { emoji: '🎖️', title: '12 Rozet', desc: 'Hepsini topla.' },
  ],
  es: [
    { emoji: '🔥', title: 'Rachas Diarias', desc: 'Juega cada día laboral. Perder tu racha duele.' },
    { emoji: '⚔️', title: 'Duelos 1v1', desc: 'Reta a colegas con un link.' },
    { emoji: '🏢', title: 'Batallas de Equipo', desc: 'Departamento vs. departamento.' },
    { emoji: '🎖️', title: '12 Badges', desc: 'Colecciónalos todos.' },
  ],
}

const HEADERS: Record<string, string> = {
  de: 'Mehr als ein Quiz',
  en: 'More than a quiz',
  tr: 'Sadece bir quiz değil',
  es: 'Más que un quiz',
}

export default function FeaturesGrid({ locale }: FeaturesGridProps) {
  const items = features[locale] ?? features['en']
  const header = HEADERS[locale] ?? HEADERS['en']

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-5">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-text-primary mb-12">
          {header}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/4 border border-white/6 rounded-2xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="text-3xl mb-3">{feature.emoji}</div>
              <h3 className="text-base font-bold text-text-primary mb-1">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
