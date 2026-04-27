import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { LEVELS, BADGES, CATEGORIES, CATEGORY_LABELS, lf } from '../lib/constants'
import type { Locale } from '../types'

interface FaqSection {
  title: Record<Locale, string>
  content: (locale: Locale) => React.ReactNode
}

const L = {
  intro: {
    de: 'Alles, was du über AI-Shift Happens wissen musst.',
    en: 'Everything you need to know about AI-Shift Happens.',
    tr: 'AI-Shift Happens hakkında bilmen gereken her şey.',
    es: 'Todo lo que necesitas saber sobre AI-Shift Happens.',
  },
  levelsTitle: { de: '6 Level', en: '6 Levels', tr: '6 Seviye', es: '6 Niveles' },
  badgesTitle: { de: 'Badges', en: 'Badges', tr: 'Rozetler', es: 'Insignias' },
  categoriesTitle: { de: '30 Kategorien', en: '30 Categories', tr: '30 Kategori', es: '30 Categorías' },
  privacyTitle: { de: 'Datenschutz', en: 'Privacy', tr: 'Gizlilik', es: 'Privacidad' },
  privacyBody: {
    de: 'AI-Shift Happens ist DSGVO-konform. Wir speichern nur die für das Spiel notwendigen Daten: Anzeigename, E-Mail, Spielfortschritt und Scores. Es gibt kein Tracking, keine Werbung und keine Weitergabe an Dritte.',
    en: 'AI-Shift Happens is GDPR compliant. We only store data necessary for the game: display name, email, game progress and scores. There is no tracking, no ads and no sharing with third parties.',
    tr: 'AI-Shift Happens GDPR uyumludur. Sadece oyun için gerekli verileri saklarız: görünen ad, e-posta, oyun ilerlemesi ve puanlar. Takip yok, reklam yok ve üçüncü taraflarla paylaşım yok.',
    es: 'AI-Shift Happens cumple con el RGPD. Solo almacenamos datos necesarios para el juego: nombre, email, progreso y puntuaciones. Sin tracking, sin anuncios y sin compartir con terceros.',
  },
  confidence: { de: 'Wie sicher bist du?', en: 'How confident are you?', tr: 'Ne kadar eminsin?', es: '¿Qué tan seguro estás?' },
  absSure: { de: 'Absolut sicher', en: 'Absolutely sure', tr: 'Kesinlikle eminim', es: 'Totalmente seguro' },
  prettySure: { de: 'Ziemlich sicher', en: 'Pretty sure', tr: 'Oldukça eminim', es: 'Bastante seguro' },
  unsure: { de: 'Hmm... unsicher', en: 'Hmm... not sure', tr: 'Hmm... emin değilim', es: 'Hmm... no seguro' },
}

const sections: FaqSection[] = [
  {
    title: {
      de: 'Was ist AI-Shift Happens?',
      en: 'What is AI-Shift Happens?',
      tr: 'AI-Shift Happens nedir?',
      es: '¿Qué es AI-Shift Happens?',
    },
    content: (locale) => lf({
      de: 'AI-Shift Happens ist ein tägliches Quiz, das dein KI-Mindset testet und trainiert. Jeden Werktag (Mo–Fr) bekommst du 3+1 Bonus-Fragen aus realistischen KI-Szenarien. Ziel: Nicht nur die richtige Antwort finden, sondern verstehen, wie man KI als Partner nutzt statt als Ersatz.',
      en: 'AI-Shift Happens is a daily quiz that tests and trains your AI mindset. Every weekday (Mon–Fri) you get 3+1 bonus questions from realistic AI scenarios. Goal: Not just finding the right answer, but understanding how to use AI as a partner rather than a replacement.',
      tr: 'AI-Shift Happens, yapay zeka zihniyetini test eden ve geliştiren günlük bir quizdir. Her iş günü (Pzt–Cum) gerçekçi yapay zeka senaryolarından 3+1 bonus soru alırsın. Amaç: Sadece doğru cevabı bulmak değil, yapay zekayı bir alternatif yerine bir ortak olarak kullanmayı anlamak.',
      es: 'AI-Shift Happens es un quiz diario que pone a prueba y entrena tu mentalidad de IA. Cada día laboral (Lun–Vie) obtienes 3+1 preguntas bonus de escenarios realistas de IA. Objetivo: No solo encontrar la respuesta correcta, sino entender cómo usar la IA como un compañero en lugar de un reemplazo.',
    }, locale),
  },
  {
    title: {
      de: 'Wie funktioniert das Scoring?',
      en: 'How does scoring work?',
      tr: 'Puanlama nasıl çalışır?',
      es: '¿Cómo funciona la puntuación?',
    },
    content: (locale) => (
      <div className="space-y-3">
        <p>{lf({
          de: 'Nach jeder Antwort wählst du dein Confidence-Level — wie sicher bist du dir?',
          en: 'After each answer, you choose your confidence level — how sure are you?',
          tr: 'Her cevaptan sonra güven seviyeni seçersin — ne kadar eminsin?',
          es: 'Después de cada respuesta, eliges tu nivel de confianza — ¿qué tan seguro estás?',
        }, locale)}</p>
        <div className="grid gap-2">
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
            <span className="text-lg">🔥</span>
            <span className="text-green-400 font-bold">+300 / -150</span>
            <span className="text-text-secondary text-sm">{lf(L.absSure, locale)}</span>
          </div>
          <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
            <span className="text-lg">🎯</span>
            <span className="text-yellow-400 font-bold">+150 / -50</span>
            <span className="text-text-secondary text-sm">{lf(L.prettySure, locale)}</span>
          </div>
          <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
            <span className="text-lg">🤔</span>
            <span className="text-blue-400 font-bold">+50 / 0</span>
            <span className="text-text-secondary text-sm">{lf(L.unsure, locale)}</span>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          {lf({
            de: 'Dazu kommt ein Speed-Bonus (bis +50) für schnelle Antworten, ein Streak-Multiplikator und bei Bonus-Fragen nochmal ×1.5.',
            en: 'On top: speed bonus (up to +50) for fast answers, streak multiplier, and bonus questions get ×1.5.',
            tr: 'Ek olarak: hızlı cevaplar için hız bonusu (+50\'ye kadar), seri çarpanı ve bonus soruları ×1.5 alır.',
            es: 'Además: bonus de velocidad (hasta +50) por respuestas rápidas, multiplicador de racha y las preguntas bonus obtienen ×1.5.',
          }, locale)}
        </p>
      </div>
    ),
  },
  {
    title: {
      de: 'Was ist der Bullshit-Detektor?',
      en: 'What is the Bullshit Detector?',
      tr: 'Saçmalık Dedektörü nedir?',
      es: '¿Qué es el Detector de Tonterías?',
    },
    content: (locale) => lf({
      de: 'Manche Fragen haben eine Bullshit-Falle: Eine Antwort die professionell klingt, aber inhaltsleer ist — typisches Berater-Deutsch oder LinkedIn-Sprech. Wer mit hoher Confidence auf die Falle reinfällt, verliert extra Punkte (-200 statt -150). Wer die Falle erkennt, bekommt einen Bonus. Es gibt spezielle Badges dafür!',
      en: 'Some questions have a BS trap: an answer that sounds professional but is empty — typical consultant-speak or LinkedIn jargon. High confidence on the trap means extra point loss (-200 instead of -150). Detecting traps earns a bonus. There are special badges for it!',
      tr: 'Bazı soruların BS tuzağı vardır: profesyonel kulağa gelen ama içi boş bir cevap — tipik danışman dili veya LinkedIn jargonu. Yüksek güvenle tuzağa düşmek ekstra puan kaybı demektir (-150 yerine -200). Tuzakları fark etmek bonus kazandırır. Bunun için özel rozetler var!',
      es: 'Algunas preguntas tienen una trampa BS: una respuesta que suena profesional pero está vacía — típica jerga de consultor o lenguaje de LinkedIn. Caer en la trampa con alta confianza significa pérdida de puntos extra (-200 en lugar de -150). Detectar trampas otorga un bonus. ¡Hay insignias especiales para ello!',
    }, locale),
  },
  {
    title: {
      de: 'Wer ist SHIFT?',
      en: 'Who is SHIFT?',
      tr: 'SHIFT kimdir?',
      es: '¿Quién es SHIFT?',
    },
    content: (locale) => lf({
      de: 'SHIFT ist dein KI-Buddy, der jede Antwort kommentiert. Du kannst zwischen zwei Styles wählen: 🎩 Seriös (professionell, motivierend) oder 😎 Frech (Memes, Roasts, Gen-Z-Energy). SHIFT reagiert auf deine Confidence: Overconfident + falsch = maximaler Roast. Wechsel jederzeit im Profil.',
      en: 'SHIFT is your AI buddy who comments on every answer. Choose between two styles: 🎩 Serious (professional, motivating) or 😎 Cheeky (memes, roasts, Gen-Z energy). SHIFT reacts to your confidence: Overconfident + wrong = maximum roast. Switch anytime in your profile.',
      tr: 'SHIFT, her cevabı yorumlayan yapay zeka dostundur. İki stil arasında seç: 🎩 Ciddi (profesyonel, motive edici) veya 😎 Küstah (memes, roastlar, Gen-Z enerjisi). SHIFT güvenine göre tepki verir: Aşırı güven + yanlış = maksimum roast. İstediğin zaman profilinden değiştir.',
      es: 'SHIFT es tu compañero de IA que comenta cada respuesta. Elige entre dos estilos: 🎩 Serio (profesional, motivador) o 😎 Atrevido (memes, roasts, energía Gen-Z). SHIFT reacciona a tu confianza: Demasiado seguro + incorrecto = roast máximo. Cambia en cualquier momento desde tu perfil.',
    }, locale),
  },
  {
    title: {
      de: 'Streak-Multiplikator',
      en: 'Streak Multiplier',
      tr: 'Seri Çarpanı',
      es: 'Multiplicador de Racha',
    },
    content: (locale) => (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">
          {lf({
            de: 'Je mehr richtige Antworten in Folge, desto höher der Multiplikator:',
            en: 'The more correct answers in a row, the higher the multiplier:',
            tr: 'Arka arkaya ne kadar çok doğru cevap, o kadar yüksek çarpan:',
            es: 'Cuantas más respuestas correctas seguidas, mayor el multiplicador:',
          }, locale)}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { streak: 0, multi: '1.0×' },
            { streak: 1, multi: '1.5×' },
            { streak: 2, multi: '2.0×' },
            { streak: 3, multi: '2.5×' },
            { streak: 4, multi: '3.0×' },
          ].map(s => (
            <div key={s.streak} className="text-center bg-white/4 rounded-xl py-2">
              <div className="text-primary font-bold text-sm">{s.multi}</div>
              <div className="text-text-muted text-xs">{s.streak}+</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-text-secondary">
          {lf({
            de: 'Eine „gefährliche" Antwort (-100) setzt den Streak auf 0 zurück. Eine neutrale Antwort (0 Punkte) behält den Streak.',
            en: 'A "dangerous" answer (-100) resets the streak to 0. A neutral answer (0 points) keeps the streak.',
            tr: '"Tehlikeli" bir cevap (-100) seriyi 0\'a sıfırlar. Nötr bir cevap (0 puan) seriyi korur.',
            es: 'Una respuesta "peligrosa" (-100) reinicia la racha a 0. Una respuesta neutral (0 puntos) mantiene la racha.',
          }, locale)}
        </p>
      </div>
    ),
  },
  {
    title: {
      de: 'Timer & Speed-Bonus',
      en: 'Timer & Speed Bonus',
      tr: 'Sayaç ve Hız Bonusu',
      es: 'Temporizador y Bonus de Velocidad',
    },
    content: (locale) => lf({
      de: 'Du hast 60 Sekunden pro Frage (im Daily Quiz und bei Challenges). Bei richtigen Antworten bekommst du bis zu 50 Bonus-Punkte für Schnelligkeit — der Bonus sinkt ca. 1 Punkt pro Sekunde. Sofortige Antwort = +50, nach 60 Sekunden = +0. Free Play hat keinen Timer — dort lernst du ohne Zeitdruck.',
      en: 'You have 60 seconds per question (in Daily Quiz and Challenges). For correct answers you get up to 50 bonus points for speed — the bonus decreases about 1 point per second. Instant answer = +50, after 60 seconds = +0. Free Play has no timer — learn without time pressure.',
      tr: 'Soru başına 60 saniyen var (Günlük Quiz ve Düellolarda). Doğru cevaplar için hız için 50 bonus puana kadar alırsın — bonus saniyede yaklaşık 1 puan azalır. Anında cevap = +50, 60 saniye sonra = +0. Serbest Oyunda sayaç yok — zaman baskısı olmadan öğren.',
      es: 'Tienes 60 segundos por pregunta (en el Quiz Diario y Duelos). Por respuestas correctas obtienes hasta 50 puntos bonus por velocidad — el bonus disminuye aprox. 1 punto por segundo. Respuesta instantánea = +50, después de 60 segundos = +0. El Juego Libre no tiene temporizador — aprende sin presión de tiempo.',
    }, locale),
  },
  {
    title: {
      de: 'Tages-Streaks',
      en: 'Daily Streaks',
      tr: 'Günlük Seriler',
      es: 'Rachas Diarias',
    },
    content: (locale) => lf({
      de: 'Spiele jeden Werktag (Mo–Fr) und halte deinen Streak am Leben! Das Wochenende unterbricht den Streak nicht — du musst also nur unter der Woche spielen. Längere Streaks geben dir XP-Multiplikatoren: ab 5 Tagen ×1.25, ab 10 Tagen ×1.5, ab 20 Tagen ×2.0.',
      en: 'Play every weekday (Mon–Fri) and keep your streak alive! Weekends don\'t break your streak — you only need to play on weekdays. Longer streaks give XP multipliers: from 5 days ×1.25, from 10 days ×1.5, from 20 days ×2.0.',
      tr: 'Her iş günü (Pzt–Cum) oyna ve serini canlı tut! Hafta sonları seriyi bozmaz — sadece hafta içi oynaman yeterli. Uzun seriler XP çarpanı verir: 5 günden itibaren ×1.25, 10 günden itibaren ×1.5, 20 günden itibaren ×2.0.',
      es: '¡Juega cada día laboral (Lun–Vie) y mantén tu racha viva! Los fines de semana no rompen tu racha — solo necesitas jugar entre semana. Rachas largas dan multiplicadores de XP: desde 5 días ×1.25, desde 10 días ×1.5, desde 20 días ×2.0.',
    }, locale),
  },
  {
    title: {
      de: 'Wochen-Champion',
      en: 'Weekly Champion',
      tr: 'Haftanın Şampiyonu',
      es: 'Campeón Semanal',
    },
    content: (locale) => lf({
      de: 'Jeden Montag wird der Wochen-Champion der Vorwoche gekürt. Der Score berechnet sich aus der Summe aller Daily-Quiz-Punkte von Montag bis Freitag. Der Champion landet in der Hall of Fame und bekommt einen speziellen Badge.',
      en: 'Every Monday the weekly champion of the previous week is crowned. The score is the sum of all daily quiz points from Monday to Friday. The champion lands in the Hall of Fame and receives a special badge.',
      tr: 'Her Pazartesi önceki haftanın haftanın şampiyonu seçilir. Puan, Pazartesi\'den Cuma\'ya tüm günlük quiz puanlarının toplamıdır. Şampiyon Şöhret Salonu\'na girer ve özel bir rozet alır.',
      es: 'Cada lunes se corona al campeón semanal de la semana anterior. La puntuación es la suma de todos los puntos del quiz diario de lunes a viernes. El campeón entra en el Salón de la Fama y recibe una insignia especial.',
    }, locale),
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
        {section.content(locale)}
      </div>
    </details>
  )
}

const DATE_LOCALES: Record<Locale, string> = { de: 'de-DE', en: 'en-US', tr: 'tr-TR', es: 'es-ES' }

export function FaqPage() {
  const { locale } = useLocale()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <Link to="/app" className="text-text-muted hover:text-text-primary transition-colors">&larr;</Link>
        <span className="text-lg font-bold tracking-tight text-primary">FAQ</span>
      </header>

      <main className="flex-1 flex flex-col px-5 py-6 gap-4 max-w-lg mx-auto w-full">
        <p className="text-text-secondary text-sm">{lf(L.intro, locale)}</p>

        <div className="flex flex-col gap-3">
          {sections.map((s, i) => (
            <AccordionItem key={i} section={s} locale={locale} />
          ))}
        </div>

        {/* Levels */}
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-3">{lf(L.levelsTitle, locale)}</h2>
          <div className="flex flex-col gap-2">
            {LEVELS.map(lvl => (
              <div key={lvl.level} className="flex items-center gap-3 bg-white/4 border border-white/6 rounded-xl px-4 py-3">
                <span className="text-xl">{lvl.emoji}</span>
                <div className="flex-1">
                  <span className="font-semibold text-sm">{lvl.title[locale as 'de' | 'en']}</span>
                  <span className="text-text-muted text-xs ml-2">Level {lvl.level}</span>
                </div>
                <span className="text-primary text-xs font-mono">
                  {lvl.xp.toLocaleString(DATE_LOCALES[locale])} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-3">{lf(L.badgesTitle, locale)}</h2>
          <div className="grid grid-cols-1 gap-2">
            {BADGES.map(b => (
              <div key={b.type} className="flex items-center gap-3 bg-white/4 border border-white/6 rounded-xl px-4 py-3">
                <span className="text-xl">{b.emoji}</span>
                <div>
                  <div className="font-semibold text-sm">{b.title[locale as 'de' | 'en']}</div>
                  <div className="text-text-muted text-xs">{b.description[locale as 'de' | 'en']}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-3">{lf(L.categoriesTitle, locale)}</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <span key={cat} className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg">
                {CATEGORY_LABELS[cat][locale as 'de' | 'en']}
              </span>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="mt-4 bg-white/4 border border-white/6 rounded-2xl px-5 py-4">
          <h2 className="text-lg font-bold mb-2">{lf(L.privacyTitle, locale)}</h2>
          <p className="text-text-secondary text-sm leading-relaxed">{lf(L.privacyBody, locale)}</p>
        </div>
      </main>
    </div>
  )
}
