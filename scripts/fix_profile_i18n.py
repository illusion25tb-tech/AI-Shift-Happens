import io
fp = 'src/pages/ProfilePage.tsx'
src = open(fp, encoding='utf-8').read()

old_import = "import { CATEGORY_LABELS } from '../lib/constants'"
new_import = """import { CATEGORY_LABELS, lf } from '../lib/constants'

const L = {
  min6: { de: 'Mindestens 6 Zeichen', en: 'Minimum 6 characters', tr: 'En az 6 karakter', es: 'Minimo 6 caracteres' },
  pwMismatch: { de: 'Passwoerter stimmen nicht ueberein', en: 'Passwords do not match', tr: 'Sifreler eslesmiyor', es: 'Las contrasenas no coinciden' },
  pwChanged: { de: 'Passwort geaendert!', en: 'Password changed!', tr: 'Sifre degistirildi!', es: 'Contrasena cambiada!' },
  memberSince: { de: (d) => `Mitglied seit ${d}`, en: (d) => `Member since ${d}`, tr: (d) => `Uye olma: ${d}`, es: (d) => `Miembro desde ${d}` },
  yourInvite: { de: 'Dein Invite-Code:', en: 'Your invite code:', tr: 'Davet kodun:', es: 'Tu codigo de invitacion:' },
  copyLink: { de: 'Link kopieren', en: 'Copy link', tr: 'Baglantiyi kopyala', es: 'Copiar enlace' },
  inviteFriends: { de: 'Freunde einladen = 200 XP fuer dich pro Anmeldung', en: 'Invite friends = 200 XP per signup', tr: 'Arkadaslarini davet et = kayit basina 200 XP', es: 'Invita amigos = 200 XP por registro' },
  quizzes: { de: 'Quizzes', en: 'Quizzes', tr: 'Quizler', es: 'Quizzes' },
  accuracy: { de: 'Trefferquote', en: 'Accuracy', tr: 'Isabet Orani', es: 'Precision' },
  correct: { de: 'richtig', en: 'correct', tr: 'dogru', es: 'correcto' },
  catsPlayed: { de: 'Kategorien gespielt', en: 'Categories played', tr: 'Oynanan kategoriler', es: 'Categorias jugadas' },
  company: { de: 'Unternehmen', en: 'Company', tr: 'Sirket', es: 'Empresa' },
  enterCompany: { de: 'Firmenname eingeben...', en: 'Enter company name...', tr: 'Sirket adi gir...', es: 'Ingresa nombre de empresa...' },
  saving: { de: 'Speichern...', en: 'Saving...', tr: 'Kaydediliyor...', es: 'Guardando...' },
  save: { de: 'Speichern', en: 'Save', tr: 'Kaydet', es: 'Guardar' },
  saved: { de: 'Gespeichert', en: 'Saved', tr: 'Kaydedildi', es: 'Guardado' },
  companyHint: { de: 'Dein Unternehmen erscheint im Firmen-Leaderboard (min. 3 Spieler).', en: 'Your company appears in the company leaderboard (min. 3 players).', tr: 'Sirketin firma siralamasinda gorunur (en az 3 oyuncu).', es: 'Tu empresa aparece en la clasificacion (min. 3 jugadores).' },
  recentActivity: { de: 'Letzte Aktivitaet', en: 'Recent Activity', tr: 'Son Etkinlik', es: 'Actividad Reciente' },
  shiftStyle: { de: 'SHIFT-Style', en: 'SHIFT Style', tr: 'SHIFT Stili', es: 'Estilo SHIFT' },
  shiftBuddyDesc: { de: 'Dein KI-Buddy kommentiert jede Antwort', en: 'Your AI buddy comments on every answer', tr: 'AI dostun her cevabi yorumlar', es: 'Tu companero de IA comenta cada respuesta' },
  serious: { de: 'Serioes', en: 'Serious', tr: 'Ciddi', es: 'Serio' },
  cheeky: { de: 'Frech', en: 'Cheeky', tr: 'Kuestah', es: 'Atrevido' },
  reminders: { de: 'Erinnerungen', en: 'Reminders', tr: 'Hatirlaticilar', es: 'Recordatorios' },
  reminderDesc: { de: 'Daily Quiz Erinnerung (Mo-Fr)', en: 'Daily quiz reminder (Mon-Fri)', tr: 'Gunluk quiz hatirlaticisi (Pzt-Cum)', es: 'Recordatorio de quiz diario (Lun-Vie)' },
  on: { de: 'An', en: 'On', tr: 'Acik', es: 'Activado' },
  off: { de: 'Aus', en: 'Off', tr: 'Kapali', es: 'Desactivado' },
  language: { de: 'Sprache', en: 'Language', tr: 'Dil', es: 'Idioma' },
  changePw: { de: 'Passwort aendern', en: 'Change password', tr: 'Sifreyi degistir', es: 'Cambiar contrasena' },
  newPw: { de: 'Neues Passwort (min. 6 Zeichen)', en: 'New password (min. 6 chars)', tr: 'Yeni sifre (en az 6 karakter)', es: 'Nueva contrasena (min. 6 chars)' },
  confirmPw: { de: 'Passwort bestaetigen', en: 'Confirm password', tr: 'Sifreyi dogrula', es: 'Confirmar contrasena' },
  savePw: { de: 'Passwort speichern', en: 'Save password', tr: 'Sifreyi kaydet', es: 'Guardar contrasena' },
  deleteAccount: { de: 'Account loeschen...', en: 'Delete account...', tr: 'Hesabi sil...', es: 'Eliminar cuenta...' },
  reallyDelete: { de: 'Account wirklich loeschen? Alle Daten gehen verloren.', en: 'Really delete account? All data will be lost.', tr: 'Hesabi gercekten sil? Tum veriler kaybolur.', es: 'Realmente eliminar cuenta? Todos los datos se perderan.' },
  yesDelete: { de: 'Ja, loeschen', en: 'Yes, delete', tr: 'Evet, sil', es: 'Si, eliminar' },
  cancel: { de: 'Abbrechen', en: 'Cancel', tr: 'Iptal', es: 'Cancelar' },
}

const DATE_LOCALES_P = { de: 'de-DE', en: 'en-US', tr: 'tr-TR', es: 'es-ES' }

function lfFn(obj, locale, ...args) {
  return (obj[locale] || obj.en)(...args)
}"""

src = src.replace(old_import, new_import)

reps = [
  ("locale === 'de' ? 'Mindestens 6 Zeichen' : 'Minimum 6 characters'", "lf(L.min6, locale)"),
  ("locale === 'de' ? 'Passwoerter stimmen nicht ueberein' : 'Passwords do not match'", "lf(L.pwMismatch, locale)"),
  ("locale === 'de' ? 'Passwort geaendert!' : 'Password changed!'", "lf(L.pwChanged, locale)"),
  ("locale === 'de' ? 'de-DE' : 'en-US'", "DATE_LOCALES_P[locale]"),
  ("locale === 'de' ? `Mitglied seit ${memberSince}` : `Member since ${memberSince}`", "lfFn(L.memberSince, locale, memberSince)"),
  ("locale === 'de' ? 'Dein Invite-Code:' : 'Your invite code:'", "lf(L.yourInvite, locale)"),
  ("locale === 'de' ? 'Link kopieren' : 'Copy link'", "lf(L.copyLink, locale)"),
  ("locale === 'de' ? 'Quizzes' : 'Quizzes'", "lf(L.quizzes, locale)"),
  ("locale === 'de' ? 'Trefferquote' : 'Accuracy'", "lf(L.accuracy, locale)"),
  ("locale === 'de' ? 'richtig' : 'correct'", "lf(L.correct, locale)"),
  ("locale === 'de' ? 'Kategorien gespielt' : 'Categories played'", "lf(L.catsPlayed, locale)"),
  ("locale === 'de' ? 'Unternehmen' : 'Company'", "lf(L.company, locale)"),
  ("locale === 'de' ? 'Firmenname eingeben...' : 'Enter company name...'", "lf(L.enterCompany, locale)"),
  ("locale === 'de' ? 'Speichern...' : 'Saving...'", "lf(L.saving, locale)"),
  ("locale === 'de' ? 'Speichern' : 'Save'", "lf(L.save, locale)"),
  ("locale === 'de' ? 'Gespeichert' : 'Saved'", "lf(L.saved, locale)"),
  ("locale === 'de' ? 'Letzte Aktivitaet' : 'Recent Activity'", "lf(L.recentActivity, locale)"),
  ("locale === 'de' ? 'SHIFT-Style' : 'SHIFT Style'", "lf(L.shiftStyle, locale)"),
  ("locale === 'de' ? 'Dein KI-Buddy kommentiert jede Antwort' : 'Your AI buddy comments on every answer'", "lf(L.shiftBuddyDesc, locale)"),
  ("mode === 'serious' ? (locale === 'de' ? 'Serioes' : 'Serious') : (locale === 'de' ? 'Frech' : 'Cheeky')", "lf(mode === 'serious' ? L.serious : L.cheeky, locale)"),
  ("locale === 'de' ? 'Erinnerungen' : 'Reminders'", "lf(L.reminders, locale)"),
  ("locale === 'de' ? 'Daily Quiz Erinnerung (Mo-Fr)' : 'Daily quiz reminder (Mon-Fri)'", "lf(L.reminderDesc, locale)"),
  ("reminderOn ? (locale === 'de' ? 'An' : 'On') : (locale === 'de' ? 'Aus' : 'Off')", "reminderOn ? lf(L.on, locale) : lf(L.off, locale)"),
  ("locale === 'de' ? 'Sprache' : 'Language'", "lf(L.language, locale)"),
  ("locale === 'de' ? 'Passwort aendern' : 'Change password'", "lf(L.changePw, locale)"),
  ("locale === 'de' ? 'Neues Passwort (min. 6 Zeichen)' : 'New password (min. 6 chars)'", "lf(L.newPw, locale)"),
  ("locale === 'de' ? 'Passwort bestaetigen' : 'Confirm password'", "lf(L.confirmPw, locale)"),
  ("locale === 'de' ? 'Passwort speichern' : 'Save password'", "lf(L.savePw, locale)"),
  ("locale === 'de' ? 'Account loeschen...' : 'Delete account...'", "lf(L.deleteAccount, locale)"),
  ("locale === 'de' ? 'Ja, loeschen' : 'Yes, delete'", "lf(L.yesDelete, locale)"),
  ("locale === 'de' ? 'Abbrechen' : 'Cancel'", "lf(L.cancel, locale)"),
]

# fix mojibake/umlaut variants in source first to make matches work
fixes_in_src = [
  ("'Passwoerter stimmen nicht ueberein'", "'Passwörter stimmen nicht überein'"),
  ("'Mindestens 6 Zeichen'", "'Mindestens 6 Zeichen'"),
]

n = 0
for old, new in reps:
    # Try umlaut variant first
    old_um = (old.replace("Passwoerter stimmen nicht ueberein", "Passwörter stimmen nicht überein")
                 .replace("geaendert", "geändert")
                 .replace("aendern", "ändern")
                 .replace("bestaetigen", "bestätigen")
                 .replace("loeschen", "löschen")
                 .replace("Aktivitaet", "Aktivität")
                 .replace("Serioes", "Seriös")
                 .replace("fuer", "für"))
    if old_um in src:
        src = src.replace(old_um, new)
        n += 1
    elif old in src:
        src = src.replace(old, new)
        n += 1

ml = [
  ("locale === 'de'\n              ? 'Freunde einladen = 200 XP für dich pro Anmeldung'\n              : 'Invite friends = 200 XP per signup'", "lf(L.inviteFriends, locale)"),
  ("locale === 'de'\n              ? 'Dein Unternehmen erscheint im Firmen-Leaderboard (min. 3 Spieler).'\n              : 'Your company appears in the company leaderboard (min. 3 players).'", "lf(L.companyHint, locale)"),
  ("locale === 'de'\n                  ? 'Account wirklich löschen? Alle Daten gehen verloren.'\n                  : 'Really delete account? All data will be lost.'", "lf(L.reallyDelete, locale)"),
]
for old, new in ml:
    if old in src:
        src = src.replace(old, new)
        n += 1

open(fp, 'w', encoding='utf-8').write(src)
print(f'Total replaced: {n}')
