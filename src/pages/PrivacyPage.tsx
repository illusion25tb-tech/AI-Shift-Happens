import { Link } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'

export function PrivacyPage() {
  const { locale } = useLocale()
  const de = locale === 'de'

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <Link to="/app" className="text-text-muted hover:text-text-primary text-lg">&larr;</Link>
        <span className="text-lg font-bold tracking-tight text-primary">
          {de ? 'Datenschutz & Impressum' : 'Privacy & Legal'}
        </span>
      </header>

      <main className="flex-1 px-5 py-6 max-w-lg mx-auto w-full space-y-6 text-sm text-text-secondary leading-relaxed">
        {/* Impressum */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-2">{de ? 'Impressum' : 'Legal Notice'}</h2>
          <div className="flex items-start gap-4">
            <img src={`${import.meta.env.BASE_URL}tbai-cloud-logo.png`} alt="tbai" className="w-16 rounded-lg mt-1" />
            <div>
              <p className="font-semibold">tbai — Thorsten Behder AI Consulting</p>
              <p>Thorsten Behder</p>
              <p>E-Mail: contact@tbai.cloud</p>
              <p>Web: <a href="https://tbai.cloud" className="text-primary hover:underline">tbai.cloud</a></p>
            </div>
          </div>
        </section>

        {/* Datenschutz */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-2">{de ? 'Datenschutzerklärung' : 'Privacy Policy'}</h2>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? '1. Verantwortlicher' : '1. Controller'}</h3>
          <p>{de
            ? 'Verantwortlich für die Datenverarbeitung ist Thorsten Behder, tbai, contact@tbai.cloud.'
            : 'The data controller is Thorsten Behder, tbai, contact@tbai.cloud.'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? '2. Welche Daten wir speichern' : '2. Data We Store'}</h3>
          <p>{de
            ? 'Bei der Registrierung: E-Mail-Adresse, Anzeigename, optional Profilbild. Beim Spielen: Quiz-Antworten, Scores, Streaks, XP, Level, Badges. Bei Firmen-Profil: Firmenname. Bei Teams: Teamname und Mitgliedschaft.'
            : 'On registration: email address, display name, optional profile picture. During gameplay: quiz answers, scores, streaks, XP, level, badges. Company profile: company name. Teams: team name and membership.'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? '3. Zweck der Verarbeitung' : '3. Purpose'}</h3>
          <p>{de
            ? 'Alle Daten werden ausschließlich für den Betrieb des Quiz-Spiels verwendet: Authentifizierung, Spielfortschritt, Leaderboard, Team-Features.'
            : 'All data is used exclusively for operating the quiz game: authentication, game progress, leaderboard, team features.'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? '4. Kein Tracking' : '4. No Tracking'}</h3>
          <p>{de
            ? 'Wir setzen keine Analytics-Tools, Tracking-Pixel oder Werbecookies ein. Es werden keine Daten an Dritte weitergegeben.'
            : 'We do not use analytics tools, tracking pixels, or advertising cookies. No data is shared with third parties.'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? '5. Hosting & Dienste' : '5. Hosting & Services'}</h3>
          <p>{de
            ? 'Die App wird auf Strato (Deutschland) gehostet. Die Datenbank läuft auf Supabase (EU-West, Irland). Authentifizierung über Supabase Auth (Google OAuth, LinkedIn OIDC, E-Mail/Passwort).'
            : 'The app is hosted on Strato (Germany). The database runs on Supabase (EU-West, Ireland). Authentication via Supabase Auth (Google OAuth, LinkedIn OIDC, email/password).'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? '6. Cookies & LocalStorage' : '6. Cookies & LocalStorage'}</h3>
          <p>{de
            ? 'Wir verwenden nur technisch notwendige Cookies für die Authentifizierung (Supabase Auth Session). LocalStorage wird für Spracheinstellung, Onboarding-Status und Notification-Präferenzen genutzt.'
            : 'We only use technically necessary cookies for authentication (Supabase Auth session). LocalStorage is used for language preference, onboarding status, and notification preferences.'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? '7. Ihre Rechte' : '7. Your Rights'}</h3>
          <p>{de
            ? 'Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit. Kontakt: contact@tbai.cloud. Sie können Ihren Account jederzeit im Profil löschen.'
            : 'You have the right to access, rectification, deletion, and data portability. Contact: contact@tbai.cloud. You can delete your account at any time in your profile.'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? '8. Aufbewahrung' : '8. Retention'}</h3>
          <p>{de
            ? 'Daten werden gelöscht, wenn Sie Ihren Account löschen. Anonymisierte Leaderboard-Daten können bestehen bleiben.'
            : 'Data is deleted when you delete your account. Anonymized leaderboard data may persist.'}</p>
        </section>

        {/* Spielregeln */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-2">{de ? 'Spielregeln' : 'Game Rules'}</h2>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? 'Daily Quiz' : 'Daily Quiz'}</h3>
          <p>{de
            ? 'Jeden Werktag (Mo-Fr) gibt es ein Quiz mit 3 Fragen + 1 Bonus-Frage. Das Wochenende unterbricht den Streak nicht. Jede Frage hat 3 Antwortmöglichkeiten mit unterschiedlicher Punktzahl (+100, 0, -100). Die Antwortzeit beträgt 30 Sekunden.'
            : 'Every weekday (Mon-Fri) there is a quiz with 3 questions + 1 bonus question. Weekends do not break the streak. Each question has 3 answer options with different scores (+100, 0, -100). Answer time is 30 seconds.'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? 'Scoring' : 'Scoring'}</h3>
          <p>{de
            ? 'Basis-Punkte werden mit dem Streak-Multiplikator (1.0x-3.0x) multipliziert. Schnelle richtige Antworten erhalten bis zu 50 Speed-Bonus-Punkte. Bei Bonus-Fragen wird alles nochmal x1.5 multipliziert. Gefährliche Antworten (-100) brechen den Streak.'
            : 'Base points are multiplied by the streak multiplier (1.0x-3.0x). Fast correct answers earn up to 50 speed bonus points. Bonus questions get an additional x1.5 multiplier. Dangerous answers (-100) break the streak.'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? 'XP & Level' : 'XP & Levels'}</h3>
          <p>{de
            ? '6 Level von AI Rookie (0 XP) bis AI Dirigent (100.000 XP). XP werden durch Quiz-Punkte verdient. Negative Punkte geben kein XP. Streak Freeze kostet 500 XP.'
            : '6 levels from AI Rookie (0 XP) to AI Dirigent (100,000 XP). XP is earned through quiz points. Negative points give no XP. Streak Freeze costs 500 XP.'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? 'Wochen-/Monats-Champion' : 'Weekly/Monthly Champion'}</h3>
          <p>{de
            ? 'Der Wochen-Champion wird montags automatisch ermittelt (Summe aller Daily-Scores Mo-Fr). Der Monats-Champion wird am 1. jedes Monats berechnet. Champions erhalten Badges und ggf. Sponsoren-Preise.'
            : 'The weekly champion is determined automatically on Mondays (sum of all daily scores Mon-Fri). The monthly champion is calculated on the 1st of each month. Champions receive badges and potentially sponsor prizes.'}</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-1">{de ? 'Challenges & Teams' : 'Challenges & Teams'}</h3>
          <p>{de
            ? '1v1 Challenges: 5 gleiche Fragen für beide Spieler. Teams: Captain und Admins können einladen und verwalten. Team-Score = Summe aller Daily-Scores der Mitglieder.'
            : '1v1 Challenges: 5 identical questions for both players. Teams: Captains and admins can invite and manage. Team score = sum of all daily scores of members.'}</p>
        </section>

        {/* Haftungsausschluss */}
        <section>
          <h2 className="text-lg font-bold text-text-primary mb-2">{de ? 'Haftungsausschluss' : 'Disclaimer'}</h2>
          <p>{de
            ? 'AI-Shift Happens ist ein Lern- und Unterhaltungsangebot. Die Quizfragen und Szenarien dienen der Wissensvermittlung zum Thema Künstliche Intelligenz im Arbeitsumfeld. Sie stellen keine Rechts-, Datenschutz- oder IT-Sicherheitsberatung dar.'
            : 'AI-Shift Happens is an educational and entertainment service. The quiz questions and scenarios serve to convey knowledge about artificial intelligence in the workplace. They do not constitute legal, data protection, or IT security advice.'}</p>
          <p className="mt-2">{de
            ? 'Die Bewertung der Antworten basiert auf allgemein anerkannten Best Practices im Umgang mit KI-Tools. Für individuelle Entscheidungen in Ihrem Unternehmen konsultieren Sie bitte Ihre IT-Abteilung, Ihren Datenschutzbeauftragten oder einen Fachberater.'
            : 'The evaluation of answers is based on generally recognized best practices for using AI tools. For individual decisions in your organization, please consult your IT department, data protection officer, or a specialist advisor.'}</p>
          <p className="mt-2">{de
            ? 'Preise und Sponsoren-Leistungen werden ohne Gewähr angeboten. Ein Rechtsanspruch auf Gewinne besteht nicht. Der Veranstalter behält sich vor, Preise zu ändern oder die Aktion jederzeit zu beenden.'
            : 'Prizes and sponsor services are offered without warranty. There is no legal claim to winnings. The organizer reserves the right to change prizes or end the campaign at any time.'}</p>
          <p className="mt-2">{de
            ? 'Für die Inhalte externer verlinkter Seiten sind ausschließlich deren Betreiber verantwortlich.'
            : 'The operators of externally linked pages are solely responsible for their content.'}</p>
        </section>

        <p className="text-text-muted text-xs pt-4 border-t border-white/6">
          {de ? 'Stand: April 2026' : 'Last updated: April 2026'}
        </p>
      </main>
    </div>
  )
}
