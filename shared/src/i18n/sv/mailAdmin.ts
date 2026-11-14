import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Import av bokningsmejl',
  'mailAdmin.hint': 'Vidarebefordrade bokningsbekräftelser blir bokningar i rätt resa.',
  'mailAdmin.enabled': 'Importera bokningsmejl',
  'mailAdmin.enabledHint':
    'Ger alla på den här installationen en vidarebefordringsadress. När det är av tar ingen adress emot mejl.',
  'mailAdmin.transport.label': 'Hur mejl kommer in',
  'mailAdmin.transport.off': 'Endast uppladdning',
  'mailAdmin.transport.imap': 'IMAP-brevlåda',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Ingen brevlåda behövs: ett sparat mejl laddas upp som .eml-fil i inställningarna, och TREK läser det på samma sätt. Bra för att prova.',
  'mailAdmin.transport.imapInfo':
    'TREK tittar i en brevlåda varannan minut och hämtar nya mejl. Använd en egen brevlåda som tar emot plusadresser (trek+…@din-doman), inte en personlig: lästa mejl flyttas till TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'En e-posttjänst, till exempel en Cloudflare Email Worker, lämnar varje mejl direkt till TREK och signerar det med nyckeln nedan, så att ingen annan kan smyga in mejl. För installationer utan brevlåda.',
  'mailAdmin.aiDaily': 'AI-mejl per person och dag',
  'mailAdmin.aiDailyHint': 'Över gränsen läses endast maskinläsbara bokningsdata.',
  'mailAdmin.template': 'Adressmall',
  'mailAdmin.templateHint': 'Vidarebefordringsadressen, med {token} där varje persons kod ska stå.',
  'mailAdmin.imap.host': 'Server', // same-as-en
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Kryptering',
  'mailAdmin.imap.user': 'Användare',
  'mailAdmin.imap.pass': 'Lösenord',
  'mailAdmin.imap.mailbox': 'Mapp',
  'mailAdmin.imap.mailboxHint': 'Lästa mejl flyttas till TREK/processed.',
  'mailAdmin.webhook.secret': 'Signeringshemlighet',
  'mailAdmin.webhook.secretHint': 'Minst 32 tecken; avsändaren signerar varje mejl med den. Tom stänger av webhooken.',
  'mailAdmin.inboundUrl': 'Webhook-adress',
  'mailAdmin.inboundUrlHint': 'Din mejltjänst skickar varje mejl hit, rått och signerat.',
  'mailAdmin.copyUrl': 'Kopiera adress',
  'mailAdmin.envHint': 'Miljövariabler (MAIL_INGEST_*) gäller före de här fälten.',
  'mailAdmin.loadError': 'Inställningarna för mejlimport kunde inte laddas.',
  'mailAdmin.problem.secretShort': 'Hemligheten måste vara minst 32 tecken.',
  'mailAdmin.problem.portInvalid': 'Ange en port mellan 1 och 65535.',
  'mailAdmin.problem.templateToken': 'Adressen behöver {token} för varje persons kod.',
  'mailAdmin.problem.dailyInvalid': 'Ange ett heltal från 0 till 1000.',
  'mailAdmin.status.lastRead': 'Senast läst {time}',
  'mailAdmin.status.never': 'aldrig',
  'mailAdmin.status.mails': 'Mejl, 24 h',
  'mailAdmin.status.added': 'Tillagda automatiskt',
  'mailAdmin.status.waiting': 'Väntar',
  'mailAdmin.status.failed': 'Misslyckade',
  'mailAdmin.test.run': 'Testa anslutning',
  'mailAdmin.test.ok': 'Ansluten',
  'mailAdmin.test.failed': 'Ingen anslutning',
};
export default mailAdmin;
