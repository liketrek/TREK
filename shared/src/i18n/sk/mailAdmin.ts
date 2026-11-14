import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Import e-mailov s rezerváciami',
  'mailAdmin.hint': 'Preposlané potvrdenia rezervácií sa stanú rezerváciami v správnom výlete.',
  'mailAdmin.enabled': 'Importovať e-maily s rezerváciami',
  'mailAdmin.enabledHint':
    'Dá každému na tejto inštalácii adresu na preposielanie. Pri vypnutí žiadna adresa neprijíma poštu.',
  'mailAdmin.transport.label': 'Ako e-maily prichádzajú',
  'mailAdmin.transport.off': 'Iba nahrávanie',
  'mailAdmin.transport.imap': 'Schránka IMAP',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Bez schránky: uložený e-mail sa nahrá v nastaveniach ako súbor .eml a TREK ho prečíta rovnako. Vhodné na vyskúšanie.',
  'mailAdmin.transport.imapInfo':
    'TREK každé dve minúty nazrie do schránky a vyzdvihne nové e-maily. Použi vlastnú schránku, ktorá prijíma adresy s + (trek+…@tvoja-domena), nie osobnú: prečítané e-maily sa presunú do TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Poštová služba, napríklad Cloudflare Email Worker, odovzdá každý e-mail priamo TREKu a podpíše ho kľúčom nižšie, aby nikto iný nemohol podstrčiť cudzie e-maily. Pre nasadenia bez schránky.',
  'mailAdmin.aiDaily': 'E-maily s AI na osobu a deň',
  'mailAdmin.aiDailyHint': 'Nad tento limit sa čítajú len strojovo čitateľné údaje o rezervácii.',
  'mailAdmin.template': 'Šablóna adresy',
  'mailAdmin.templateHint': 'Adresa na preposielanie, kde {token} nahradí kód každého používateľa.',
  'mailAdmin.imap.host': 'Server', // same-as-en
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Šifrovanie',
  'mailAdmin.imap.user': 'Používateľ',
  'mailAdmin.imap.pass': 'Heslo',
  'mailAdmin.imap.mailbox': 'Priečinok',
  'mailAdmin.imap.mailboxHint': 'Prečítané e-maily sa presunú do TREK/processed.',
  'mailAdmin.webhook.secret': 'Podpisový kľúč',
  'mailAdmin.webhook.secretHint':
    'Aspoň 32 znakov; odosielateľ ním podpisuje každý e-mail. Prázdny kľúč webhook vypne.',
  'mailAdmin.inboundUrl': 'Adresa webhooku',
  'mailAdmin.inboundUrlHint': 'Tvoja e-mailová služba sem posiela každý e-mail, nespracovaný a podpísaný.',
  'mailAdmin.copyUrl': 'Kopírovať adresu',
  'mailAdmin.envHint': 'Premenné prostredia (MAIL_INGEST_*) majú prednosť pred týmito poľami.',
  'mailAdmin.loadError': 'Nastavenia importu e-mailov sa nepodarilo načítať.',
  'mailAdmin.problem.secretShort': 'Kľúč musí mať aspoň 32 znakov.',
  'mailAdmin.problem.portInvalid': 'Zadaj port medzi 1 a 65535.',
  'mailAdmin.problem.templateToken': 'Adresa musí obsahovať {token} pre kód každého používateľa.',
  'mailAdmin.problem.dailyInvalid': 'Zadaj celé číslo od 0 do 1000.',
  'mailAdmin.status.lastRead': 'Naposledy prečítané {time}',
  'mailAdmin.status.never': 'nikdy',
  'mailAdmin.status.mails': 'E-maily, 24 h',
  'mailAdmin.status.added': 'Pridané automaticky',
  'mailAdmin.status.waiting': 'Čaká',
  'mailAdmin.status.failed': 'Zlyhalo',
  'mailAdmin.test.run': 'Otestovať pripojenie',
  'mailAdmin.test.ok': 'Pripojené',
  'mailAdmin.test.failed': 'Bez pripojenia',
};
export default mailAdmin;
