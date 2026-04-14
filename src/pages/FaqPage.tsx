import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { LEVELS, BADGES, CATEGORIES, CATEGORY_LABELS } from '../lib/constants'
import type { Locale } from '../types'

interface FaqSection {
  title: Record<Locale, string>
  content: (locale: Locale) => React.ReactNode
}

const sections: FaqSection[] = [
  {
    title: { de: 'Was ist AI-Shift Happens?', en: 'What is AI-Shift Happens?' },
    content: (locale) => locale === 'de'
      ? 'AI-Shift Happens ist ein tägliches Quiz, das dein KI-Mindset testet und trainiert. Jeden Werktag (Mo\u2013Fr) bekommst du 3+1 Bonus-Fragen aus realistischen KI-Szenarien. Ziel: Nicht nur die richtige Antwort finden, sondern verstehen, wie man KI als Partner nutzt statt als Ersatz.'
      : 'AI-Shift Happens is a daily quiz that tests and trains your AI mindset. Every weekday (Mon\u2013Fri) you get 3+1 bonus questions from realistic AI scenarios. Goal: Not just finding the right answer, but understanding how to use AI as a partner rather than a replacement.',
  },
  {
    title: { de: 'Wie funktioniert das Scoring?', en: 'How does scoring work?' },
    content: (locale) => (
      <div className="space-y-3">
        <p>{locale === 'de'
          ? 'Jede Frage hat 3 Antwortmöglichkeiten mit unterschiedlichen Punkten:'
          : 'Each question has 3 answer options with different scores:'}</p>
        <div className="grid gap-2">
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
            <span className="text-green-400 font-bold text-lg">+100</span>
            <span className="text-text-secondary text-sm">{locale === 'de' ? 'Optimale Antwort' : 'Optimal answer'}</span>
          </div>
          <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
            <span className="text-yellow-400 font-bold text-lg">0</span>
            <span className="text-text-secondary text-sm">{locale === 'de' ? 'Akzeptabel, aber nicht optimal' : 'Acceptable, but not optimal'}</span>
          </div>
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            <span className="text-red-400 font-bold text-lg">-100</span>
            <span className="text-text-secondary text-sm">{locale === 'de' ? 'Gefährlich \u2014 bricht den Streak!' : 'Dangerous \u2014 breaks your streak!'}</span>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          {locale === 'de'
            ? 'Dein Endscore berechnet sich so: Base \u00d7 Streak-Multiplikator + Speed-Bonus. Bei Bonus-Fragen wird alles nochmal \u00d71.5 multipliziert.'
            : 'Your final score is calculated as: Base \u00d7 Streak Multiplier + Speed Bonus. Bonus questions get an additional \u00d71.5 multiplier.'}
        </p>
      </div>
    ),
  },
  {
    title: { de: 'Streak-Multiplikator', en: 'Streak Multiplier' },
    content: (locale) => (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">
          {locale === 'de'
            ? 'Je mehr richtige Antworten in Folge, desto höher der Multiplikator:'
            : 'The more correct answers in a row, the higher the multiplier:'}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { streak: 0, multi: '1.0\u00d7' },
            { streak: 1, multi: '1.5\u00d7' },
            { streak: 2, multi: '2.0\u00d7' },
            { streak: 3, multi: '2.5\u00d7' },
            { streak: 4, multi: '3.0\u00d7' },
          ].map(s => (
            <div key={s.streak} className="text-center bg-white/4 rounded-xl py-2">
              <div className="text-primary font-bold text-sm">{s.multi}</div>
              <div className="text-text-muted text-xs">{s.streak}+</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-text-secondary">
          {locale === 'de'
            ? 'Eine \u201egefährliche\u201c Antwort (-100) setzt den Streak auf 0 zurück. Eine neutrale Antwort (0 Punkte) behält den Streak.'
            : 'A \u201cdangerous\u201d answer (-100) resets the streak to 0. A neutral answer (0 points) keeps the streak.'}
        </p>
      </div>
    ),
  },
  {
    title: { de: 'Speed-Bonus', en: 'Speed Bonus' },
    content: (locale) => locale === 'de'
      ? 'Bei richtigen Antworten bekommst du bis zu 50 Bonus-Punkte für Schnelligkeit. Der Bonus sinkt um 2.5 Punkte pro Sekunde. Wer innerhalb von 5 Sekunden antwortet, bekommt den vollen Bonus. Nach 20 Sekunden gibt es keinen Speed-Bonus mehr.'
      : 'For correct answers you get up to 50 bonus points for speed. The bonus decreases by 2.5 points per second. Answering within 5 seconds gives full bonus. After 20 seconds there is no speed bonus.',
  },
  {
    title: { de: 'Tages-Streaks', en: 'Daily Streaks' },
    content: (locale) => locale === 'de'
      ? 'Spiele jeden Werktag (Mo\u2013Fr) und halte deinen Streak am Leben! Das Wochenende unterbricht den Streak nicht \u2014 du musst also nur unter der Woche spielen. Längere Streaks geben dir XP-Multiplikatoren: ab 5 Tagen \u00d71.25, ab 10 Tagen \u00d71.5, ab 20 Tagen \u00d72.0.'
      : 'Play every weekday (Mon\u2013Fri) and keep your streak alive! Weekends don\u2019t break your streak \u2014 you only need to play on weekdays. Longer streaks give XP multipliers: from 5 days \u00d71.25, from 10 days \u00d71.5, from 20 days \u00d72.0.',
  },
  {
    title: { de: 'Wochen-Champion', en: 'Weekly Champion' },
    content: (locale) => locale === 'de'
      ? 'Jeden Montag wird der Wochen-Champion der Vorwoche gekürt. Der Score berechnet sich aus der Summe aller Daily-Quiz-Punkte von Montag bis Freitag. Der Champion landet in der Hall of Fame und bekommt einen speziellen Badge.'
      : 'Every Monday the weekly champion of the previous week is crowned. The score is the sum of all daily quiz points from Monday to Friday. The champion lands in the Hall of Fame and receives a special badge.',
  },
]

function AccordionItem({ section, locale }: { section: FaqSection; locale: Locale }) {
  return (
    <details className="group bg-white/4 border border-white/6 rounded-2xl overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-white/4 transition-colors">
        <span className="font-semibold text-text-primary">{section.title[locale]}</span>
        <span className="text-text-muted group-open:rotate-180 transition-transform text-lg">&#9662;</span>
      </summary>
      <div className="px-5 pb-4 text-text-secondary text-sm leading-relaxed">
        {typeof section.content === 'function' ? section.content(locale) : section.content}
      </div>
    </details>
  )
}

export function FaqPage() {
  const { locale } = useLocale()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <Link to="/app" className="text-text-muted hover:text-text-primary transition-colors">&larr;</Link>
        <span className="text-lg font-bold tracking-tight text-primary">FAQ</span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-6 gap-4 max-w-lg mx-auto w-full">
        {/* Intro */}
        <p className="text-text-secondary text-sm">
          {locale === 'de'
            ? 'Alles, was du über AI-Shift Happens wissen musst.'
            : 'Everything you need to know about AI-Shift Happens.'}
        </p>

        {/* FAQ Sections */}
        <div className="flex flex-col gap-3">
          {sections.map((s, i) => (
            <AccordionItem key={i} section={s} locale={locale} />
          ))}
        </div>

        {/* Levels */}
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-3">
            {locale === 'de' ? '6 Level' : '6 Levels'}
          </h2>
          <div className="flex flex-col gap-2">
            {LEVELS.map(lvl => (
              <div key={lvl.level} className="flex items-center gap-3 bg-white/4 border border-white/6 rounded-xl px-4 py-3">
                <span className="text-xl">{lvl.emoji}</span>
                <div className="flex-1">
                  <span className="font-semibold text-sm">{lvl.title[locale]}</span>
                  <span className="text-text-muted text-xs ml-2">Level {lvl.level}</span>
                </div>
                <span className="text-primary text-xs font-mono">
                  {lvl.xp.toLocaleString(locale === 'de' ? 'de-DE' : 'en-US')} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-3">
            {locale === 'de' ? 'Badges' : 'Badges'}
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {BADGES.map(b => (
              <div key={b.type} className="flex items-center gap-3 bg-white/4 border border-white/6 rounded-xl px-4 py-3">
                <span className="text-xl">{b.emoji}</span>
                <div>
                  <div className="font-semibold text-sm">{b.title[locale]}</div>
                  <div className="text-text-muted text-xs">{b.description[locale]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-3">
            {locale === 'de' ? '10 Kategorien' : '10 Categories'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <span key={cat} className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg">
                {CATEGORY_LABELS[cat][locale]}
              </span>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="mt-4 bg-white/4 border border-white/6 rounded-2xl px-5 py-4">
          <h2 className="text-lg font-bold mb-2">
            {locale === 'de' ? 'Datenschutz' : 'Privacy'}
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            {locale === 'de'
              ? 'AI-Shift Happens ist DSGVO-konform. Wir speichern nur die für das Spiel notwendigen Daten: Anzeigename, E-Mail, Spielfortschritt und Scores. Es gibt kein Tracking, keine Werbung und keine Weitergabe an Dritte.'
              : 'AI-Shift Happens is GDPR compliant. We only store data necessary for the game: display name, email, game progress and scores. There is no tracking, no ads and no sharing with third parties.'}
          </p>
        </div>
      </main>
    </div>
  )
}
