interface HowItWorksProps {
  locale: 'de' | 'en'
}

const cards = {
  de: [
    {
      emoji: '🎯',
      title: 'Daily Quiz spielen',
      desc: 'Jeden Werktag 3 Szenarien + 1 Bonus. Gleiche Fragen für alle.',
    },
    {
      emoji: '🧠',
      title: 'Mindset trainieren',
      desc: 'Jede Antwort erklärt warum sie richtig oder riskant ist.',
    },
    {
      emoji: '🏆',
      title: 'Champion werden',
      desc: 'Sammle XP, steige durch 6 Level auf, werde Wochen-Champion.',
    },
  ],
  en: [
    {
      emoji: '🎯',
      title: 'Play Daily Quiz',
      desc: 'Every weekday 3 scenarios + 1 bonus. Same questions for everyone.',
    },
    {
      emoji: '🧠',
      title: 'Train your mindset',
      desc: 'Every answer explains why it\'s right or risky.',
    },
    {
      emoji: '🏆',
      title: 'Become champion',
      desc: 'Collect XP, level up through 6 levels, become weekly champion.',
    },
  ],
}

export default function HowItWorks({ locale }: HowItWorksProps) {
  const isDE = locale === 'de'
  const items = cards[locale]

  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-4xl mx-auto px-5">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-white mb-12">
          {isDE ? 'So funktioniert\'s' : 'How it works'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((card) => (
            <div
              key={card.title}
              className="bg-white/4 border border-white/6 rounded-2xl p-6"
            >
              <div className="text-4xl mb-4">{card.emoji}</div>
              <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
