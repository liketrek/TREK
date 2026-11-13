import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Import van boekingsmails',
  'mailAdmin.hint': 'Doorgestuurde boekingsbevestigingen worden boekingen in de juiste reis.',
  'mailAdmin.enabled': 'Boekingsmails importeren',
  'mailAdmin.enabledHint':
    'Geeft iedereen op deze installatie een doorstuuradres. Uit: geen enkel adres neemt mail aan.',
  'mailAdmin.transport.label': 'Hoe mail binnenkomt',
  'mailAdmin.transport.off': 'Alleen uploaden',
  'mailAdmin.transport.imap': 'IMAP-mailbox',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Geen mailbox nodig: een opgeslagen mail wordt in de eigen instellingen als .eml-bestand geüpload, en TREK leest hem op dezelfde manier. Handig om het uit te proberen.',
  'mailAdmin.transport.imapInfo':
    'TREK kijkt elke twee minuten in een mailbox en haalt nieuwe mails op. Gebruik een eigen mailbox die plusadressen accepteert (trek+…@jouw-domein), geen persoonlijke: gelezen mails gaan naar TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Een maildienst, zoals een Cloudflare Email Worker, geeft elke mail direct aan TREK door en ondertekent hem met de sleutel hieronder, zodat niemand anders mails kan binnensmokkelen. Voor opstellingen zonder mailbox.',
  'mailAdmin.aiDaily': 'AI-mails per persoon per dag',
  'mailAdmin.aiDailyHint': 'Daarboven worden alleen machineleesbare boekingsgegevens gelezen.',
  'mailAdmin.template': 'Adressjabloon',
  'mailAdmin.templateHint': 'Het doorstuuradres, met {token} op de plek van de code van elke persoon.',
  'mailAdmin.imap.host': 'Server', // same-as-en
  'mailAdmin.imap.port': 'Poort',
  'mailAdmin.imap.tls': 'Versleuteling',
  'mailAdmin.imap.user': 'Gebruiker',
  'mailAdmin.imap.pass': 'Wachtwoord',
  'mailAdmin.imap.mailbox': 'Map',
  'mailAdmin.imap.mailboxHint': 'Gelezen mails worden verplaatst naar TREK/processed.',
  'mailAdmin.webhook.secret': 'Ondertekeningsgeheim',
  'mailAdmin.webhook.secretHint':
    'Minimaal 32 tekens; de afzender ondertekent elke mail hiermee. Leeg schakelt de webhook uit.',
  'mailAdmin.inboundUrl': 'Webhook-adres',
  'mailAdmin.inboundUrlHint': 'Je mailservice post hier elke mail naartoe, ruw en ondertekend.',
  'mailAdmin.copyUrl': 'Adres kopiëren',
  'mailAdmin.envHint': 'Omgevingsvariabelen (MAIL_INGEST_*) gaan voor op deze velden.',
  'mailAdmin.loadError': 'De instellingen voor mailimport konden niet worden geladen.',
  'mailAdmin.problem.secretShort': 'Het geheim moet minimaal 32 tekens hebben.',
  'mailAdmin.problem.portInvalid': 'Voer een poort in tussen 1 en 65535.',
  'mailAdmin.problem.templateToken': 'Het adres heeft {token} nodig voor de code van elke persoon.',
  'mailAdmin.problem.dailyInvalid': 'Voer een geheel getal van 0 tot 1000 in.',
  'mailAdmin.status.lastRead': 'Laatst gelezen {time}',
  'mailAdmin.status.never': 'nooit',
  'mailAdmin.status.mails': 'Mails, 24 u',
  'mailAdmin.status.added': 'Zelf toegevoegd',
  'mailAdmin.status.waiting': 'In afwachting',
  'mailAdmin.status.failed': 'Mislukt',
  'mailAdmin.test.run': 'Verbinding testen',
  'mailAdmin.test.ok': 'Verbonden',
  'mailAdmin.test.failed': 'Geen verbinding',
};
export default mailAdmin;
