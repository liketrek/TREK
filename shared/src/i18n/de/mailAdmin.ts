import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Buchungsmail-Import',
  'mailAdmin.hint': 'Weitergeleitete Buchungsbestätigungen werden zu Buchungen in der passenden Reise.',
  'mailAdmin.enabled': 'Buchungsmails importieren',
  'mailAdmin.enabledHint':
    'Gibt allen auf dieser Instanz eine Weiterleitungsadresse. Aus, nimmt keine Adresse Mails an.',
  'mailAdmin.transport.label': 'Wie Mails ankommen',
  'mailAdmin.transport.off': 'Nur Hochladen',
  'mailAdmin.transport.imap': 'IMAP-Postfach',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Kein Postfach nötig: Eine gespeicherte Mail wird in den eigenen Einstellungen als .eml-Datei hochgeladen und genauso gelesen. Gut zum Ausprobieren.',
  'mailAdmin.transport.imapInfo':
    'TREK schaut alle zwei Minuten in ein Postfach und holt neue Mails ab. Nimm ein eigenes Postfach, das Plus-Adressen annimmt (trek+…@deine-domain), kein persönliches: Gelesene Mails wandern nach TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Ein Mail-Dienst, etwa ein Cloudflare Email Worker, gibt jede Mail direkt an TREK weiter und signiert sie mit dem Schlüssel unten, damit niemand fremde Mails einschleust. Für Setups ohne Postfach.',
  'mailAdmin.aiDaily': 'AI-Mails pro Person und Tag',
  'mailAdmin.aiDailyHint': 'Darüber werden nur maschinenlesbare Buchungsdaten gelesen.',
  'mailAdmin.template': 'Adressvorlage',
  'mailAdmin.templateHint': 'Die Weiterleitungsadresse, mit {token} an der Stelle des persönlichen Codes.',
  'mailAdmin.imap.host': 'Server', // same-as-en
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Verschlüsselung',
  'mailAdmin.imap.user': 'Benutzer',
  'mailAdmin.imap.pass': 'Passwort',
  'mailAdmin.imap.mailbox': 'Ordner',
  'mailAdmin.imap.mailboxHint': 'Gelesene Mails wandern weiter nach TREK/processed.',
  'mailAdmin.webhook.secret': 'Signaturschlüssel',
  'mailAdmin.webhook.secretHint':
    'Mindestens 32 Zeichen, der Absender signiert damit jede Mail. Leer schaltet den Webhook aus.',
  'mailAdmin.inboundUrl': 'Webhook-Adresse',
  'mailAdmin.inboundUrlHint': 'Dein Mail-Dienst schickt jede Mail roh und signiert an diese Adresse.',
  'mailAdmin.copyUrl': 'Adresse kopieren',
  'mailAdmin.envHint': 'Umgebungsvariablen (MAIL_INGEST_*) haben Vorrang vor diesen Feldern.',
  'mailAdmin.loadError': 'Die Einstellungen des Mail-Imports konnten nicht geladen werden.',
  'mailAdmin.problem.secretShort': 'Der Schlüssel braucht mindestens 32 Zeichen.',
  'mailAdmin.problem.portInvalid': 'Gib einen Port zwischen 1 und 65535 ein.',
  'mailAdmin.problem.templateToken': 'Die Adresse braucht {token} für den persönlichen Code.',
  'mailAdmin.problem.dailyInvalid': 'Gib eine ganze Zahl von 0 bis 1000 ein.',
  'mailAdmin.status.title': 'Status', // same-as-en
  'mailAdmin.status.lastRead': 'Zuletzt gelesen {time}',
  'mailAdmin.status.never': 'noch nie',
  'mailAdmin.status.mails': 'Mails, 24 Std.',
  'mailAdmin.status.added': 'Selbst eingetragen',
  'mailAdmin.status.waiting': 'Offen',
  'mailAdmin.status.failed': 'Fehlgeschlagen',
  'mailAdmin.test.run': 'Verbindung testen',
  'mailAdmin.test.ok': 'Verbunden',
  'mailAdmin.test.failed': 'Keine Verbindung',
};
export default mailAdmin;
