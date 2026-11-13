import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Broneeringukirjade import',
  'mailAdmin.hint': 'Edastatud broneeringute kinnitustest saavad broneeringud õigel reisil.',
  'mailAdmin.enabled': 'Impordi broneeringukirjad',
  'mailAdmin.enabledHint':
    'Annab igaühele selles paigalduses edastusaadressi. Väljalülitatuna ei võta ükski aadress kirju vastu.',
  'mailAdmin.transport.label': 'Kuidas kiri saabub',
  'mailAdmin.transport.off': 'Ainult üleslaadimine',
  'mailAdmin.transport.imap': 'IMAP-postkast',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Postkasti pole vaja: salvestatud kiri laaditakse seadetes üles .eml-failina ja TREK loeb seda samamoodi. Hea proovimiseks.',
  'mailAdmin.transport.imapInfo':
    'TREK vaatab iga kahe minuti järel postkasti ja võtab uued kirjad. Kasuta eraldi postkasti, mis võtab vastu plussaadresse (trek+…@sinu-domeen), mitte isiklikku: loetud kirjad liiguvad kausta TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Meiliteenus, näiteks Cloudflare Email Worker, annab iga kirja otse TREKile ja allkirjastab selle allpool oleva võtmega, et keegi teine ei saaks kirju sisse sokutada. Postkastita seadistuste jaoks.',
  'mailAdmin.aiDaily': 'Tehisintellekti kirju inimese kohta päevas',
  'mailAdmin.aiDailyHint': 'Sellest üle loetakse ainult masinloetavaid broneeringuandmeid.',
  'mailAdmin.template': 'Aadressi mall',
  'mailAdmin.templateHint': 'Edastusaadress, kus {token} asub iga inimese koodi kohal.',
  'mailAdmin.imap.host': 'Server', // same-as-en
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Krüpteerimine',
  'mailAdmin.imap.user': 'Kasutaja',
  'mailAdmin.imap.pass': 'Parool',
  'mailAdmin.imap.mailbox': 'Kaust',
  'mailAdmin.imap.mailboxHint': 'Loetud kirjad liiguvad kausta TREK/processed.',
  'mailAdmin.webhook.secret': 'Allkirjastamise saladus',
  'mailAdmin.webhook.secretHint':
    'Vähemalt 32 märki; saatja allkirjastab sellega iga kirja. Tühi väli lülitab webhooki välja.',
  'mailAdmin.inboundUrl': 'Webhooki aadress',
  'mailAdmin.inboundUrlHint': 'Sinu e-posti teenus postitab iga kirja siia, toorelt ja allkirjastatult.',
  'mailAdmin.copyUrl': 'Kopeeri aadress',
  'mailAdmin.envHint': 'Keskkonnamuutujad (MAIL_INGEST_*) on nendest väljadest tähtsamad.',
  'mailAdmin.loadError': 'Kirjaimpordi seadeid ei saanud laadida.',
  'mailAdmin.problem.secretShort': 'Saladus peab olema vähemalt 32 märki.',
  'mailAdmin.problem.portInvalid': 'Sisesta port vahemikus 1 kuni 65535.',
  'mailAdmin.problem.templateToken': 'Aadressis peab iga inimese koodi jaoks olema {token}.',
  'mailAdmin.problem.dailyInvalid': 'Sisesta täisarv vahemikus 0 kuni 1000.',
  'mailAdmin.status.title': 'Olek',
  'mailAdmin.status.lastRead': 'Viimati loetud {time}',
  'mailAdmin.status.never': 'mitte kunagi',
  'mailAdmin.status.mails': 'Kirjad, 24 t',
  'mailAdmin.status.added': 'Ise lisatud',
  'mailAdmin.status.waiting': 'Ootel',
  'mailAdmin.status.failed': 'Ebaõnnestunud',
  'mailAdmin.test.run': 'Testi ühendust',
  'mailAdmin.test.ok': 'Ühendatud',
  'mailAdmin.test.failed': 'Ühendus puudub',
};
export default mailAdmin;
