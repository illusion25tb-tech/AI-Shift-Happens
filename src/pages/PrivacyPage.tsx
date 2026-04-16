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
          <p>
            tbai — Thorsten Behder AI Consulting<br />
            Thorsten Behder<br />
            E-Mail: contact@tbai.cloud<br />
            Web: tbai.cloud
          </p>
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

        <p className="text-text-muted text-xs pt-4 border-t border-white/6">
          {de ? 'Stand: April 2026' : 'Last updated: April 2026'}
        </p>
      </main>
    </div>
  )
}
