import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Foglalási e-mailek importja',
  'mailAdmin.hint': 'A továbbított foglalási visszaigazolásokból foglalás lesz a megfelelő utazásban.',
  'mailAdmin.enabled': 'Foglalási e-mailek importálása',
  'mailAdmin.enabledHint':
    'Mindenkinek ad egy továbbítási címet ezen a telepítésen. Kikapcsolva egyik cím sem fogad levelet.',
  'mailAdmin.transport.label': 'Hogyan érkezik a levél',
  'mailAdmin.transport.off': 'Csak feltöltés',
  'mailAdmin.transport.imap': 'IMAP-postafiók',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.aiDaily': 'AI-e-mailek személyenként és naponta',
  'mailAdmin.aiDailyHint': 'Efölött csak a géppel olvasható foglalási adatokat olvassa el.',
  'mailAdmin.template': 'Címsablon',
  'mailAdmin.templateHint': 'A továbbítási cím, ahol {token} áll, ott kerül be az egyes személyek kódja.',
  'mailAdmin.imap.host': 'Szerver',
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Titkosítás',
  'mailAdmin.imap.user': 'Felhasználó',
  'mailAdmin.imap.pass': 'Jelszó',
  'mailAdmin.imap.mailbox': 'Mappa',
  'mailAdmin.imap.mailboxHint': 'Az elolvasott levelek a TREK/processed mappába kerülnek.',
  'mailAdmin.webhook.secret': 'Aláírási titok',
  'mailAdmin.webhook.secretHint':
    'Legalább 32 karakter; a küldő ezzel írja alá az összes levelet. Üresen a webhook ki van kapcsolva.',
  'mailAdmin.inboundUrl': 'Webhook-cím',
  'mailAdmin.inboundUrlHint': 'A levelezőszolgáltatásod ide küldi az egyes leveleket, nyersen és aláírva.',
  'mailAdmin.copyUrl': 'Cím másolása',
  'mailAdmin.envHint': 'A környezeti változók (MAIL_INGEST_*) felülírják ezeket a mezőket.',
  'mailAdmin.loadError': 'Az e-mail-import beállításai nem tölthetők be.',
  'mailAdmin.problem.secretShort': 'A titoknak legalább 32 karakter hosszúnak kell lennie.',
  'mailAdmin.problem.portInvalid': 'Adj meg egy portot 1 és 65535 között.',
  'mailAdmin.problem.templateToken': 'A címben szerepelnie kell a {token} helyőrzőnek az egyes személyek kódjához.',
  'mailAdmin.problem.dailyInvalid': 'Adj meg egy egész számot 0 és 1000 között.',
  'mailAdmin.status.title': 'Állapot',
  'mailAdmin.status.lastRead': 'Utolsó olvasás: {time}',
  'mailAdmin.status.never': 'soha',
  'mailAdmin.status.mails': 'E-mailek, 24 óra',
  'mailAdmin.status.added': 'Magától hozzáadva',
  'mailAdmin.status.waiting': 'Várakozik',
  'mailAdmin.status.failed': 'Sikertelen',
  'mailAdmin.test.run': 'Kapcsolat tesztelése',
  'mailAdmin.test.ok': 'Csatlakozva',
  'mailAdmin.test.failed': 'Nincs kapcsolat',
};
export default mailAdmin;
