import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Import e-mailů s rezervacemi',
  'mailAdmin.hint': 'Přeposlaná potvrzení rezervací se stanou rezervacemi ve správném výletu.',
  'mailAdmin.enabled': 'Importovat e-maily s rezervacemi',
  'mailAdmin.enabledHint':
    'Dá každému na této instalaci adresu pro přeposílání. Při vypnutí žádná adresa nepřijímá poštu.',
  'mailAdmin.transport.label': 'Jak e-maily přicházejí',
  'mailAdmin.transport.off': 'Pouze nahrávání',
  'mailAdmin.transport.imap': 'Schránka IMAP',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Bez schránky: uložený e-mail se nahraje v nastavení jako soubor .eml a TREK ho přečte stejně. Vhodné na vyzkoušení.',
  'mailAdmin.transport.imapInfo':
    'TREK každé dvě minuty nahlédne do schránky a vyzvedne nové e-maily. Použij vlastní schránku, která přijímá adresy s + (trek+…@tvoje-domena), ne osobní: přečtené e-maily se přesunou do TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Poštovní služba, třeba Cloudflare Email Worker, předá každý e-mail přímo TREKu a podepíše ho klíčem níže, aby nikdo jiný nemohl podstrčit cizí e-maily. Pro nasazení bez schránky.',
  'mailAdmin.aiDaily': 'E-maily s AI na osobu a den',
  'mailAdmin.aiDailyHint': 'Nad tento limit se čtou jen strojově čitelné údaje o rezervaci.',
  'mailAdmin.template': 'Šablona adresy',
  'mailAdmin.templateHint': 'Adresa pro přeposílání, kde {token} nahradí kód každého uživatele.',
  'mailAdmin.imap.host': 'Server', // same-as-en
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Šifrování',
  'mailAdmin.imap.user': 'Uživatel',
  'mailAdmin.imap.pass': 'Heslo',
  'mailAdmin.imap.mailbox': 'Složka',
  'mailAdmin.imap.mailboxHint': 'Přečtené e-maily se přesunou do TREK/processed.',
  'mailAdmin.webhook.secret': 'Podpisový klíč',
  'mailAdmin.webhook.secretHint':
    'Alespoň 32 znaků; odesílatel jím podepisuje každý e-mail. Prázdný klíč webhook vypne.',
  'mailAdmin.inboundUrl': 'Adresa webhooku',
  'mailAdmin.inboundUrlHint': 'Tvoje e-mailová služba sem posílá každý e-mail, nezpracovaný a podepsaný.',
  'mailAdmin.copyUrl': 'Kopírovat adresu',
  'mailAdmin.envHint': 'Proměnné prostředí (MAIL_INGEST_*) mají přednost před těmito poli.',
  'mailAdmin.loadError': 'Nastavení importu e-mailů se nepodařilo načíst.',
  'mailAdmin.problem.secretShort': 'Klíč musí mít alespoň 32 znaků.',
  'mailAdmin.problem.portInvalid': 'Zadej port mezi 1 a 65535.',
  'mailAdmin.problem.templateToken': 'Adresa musí obsahovat {token} pro kód každého uživatele.',
  'mailAdmin.problem.dailyInvalid': 'Zadej celé číslo od 0 do 1000.',
  'mailAdmin.status.title': 'Stav',
  'mailAdmin.status.lastRead': 'Naposledy přečteno {time}',
  'mailAdmin.status.never': 'nikdy',
  'mailAdmin.status.mails': 'E-maily, 24 h',
  'mailAdmin.status.added': 'Přidáno automaticky',
  'mailAdmin.status.waiting': 'Čeká',
  'mailAdmin.status.failed': 'Selhalo',
  'mailAdmin.test.run': 'Otestovat připojení',
  'mailAdmin.test.ok': 'Připojeno',
  'mailAdmin.test.failed': 'Bez připojení',
};
export default mailAdmin;
