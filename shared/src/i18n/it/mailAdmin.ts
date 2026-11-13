import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Importazione delle e-mail di prenotazione',
  'mailAdmin.hint': 'Le conferme di prenotazione inoltrate diventano prenotazioni nel viaggio giusto.',
  'mailAdmin.enabled': 'Importa e-mail di prenotazione',
  'mailAdmin.enabledHint':
    'Dà a tutti su questa installazione un indirizzo di inoltro. Disattivato, nessun indirizzo riceve posta.',
  'mailAdmin.transport.label': 'Come arriva la posta',
  'mailAdmin.transport.off': 'Solo caricamento di file',
  'mailAdmin.transport.imap': 'Casella IMAP',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Nessuna casella di posta: si carica una mail salvata come file .eml nelle impostazioni, e TREK la legge allo stesso modo. Ideale per provare.',
  'mailAdmin.transport.imapInfo':
    'TREK controlla una casella di posta ogni due minuti e preleva le nuove mail. Usa una casella dedicata che accetti indirizzi con + (trek+…@tuo-dominio), non una personale: le mail lette passano in TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Un servizio di posta, come un Cloudflare Email Worker, consegna ogni mail direttamente a TREK e la firma con la chiave qui sotto, così nessun altro può infilare delle mail. Per installazioni senza casella di posta.',
  'mailAdmin.aiDaily': 'E-mail con IA per persona al giorno',
  'mailAdmin.aiDailyHint':
    'Oltre questo numero, vengono lette solo le e-mail con dati di prenotazione leggibili da una macchina.',
  'mailAdmin.template': 'Modello di indirizzo',
  'mailAdmin.templateHint': 'L’indirizzo di inoltro, con {token} dove va il codice di ogni persona.',
  'mailAdmin.imap.host': 'Server', // same-as-en
  'mailAdmin.imap.port': 'Porta',
  'mailAdmin.imap.tls': 'Crittografia',
  'mailAdmin.imap.user': 'Utente',
  'mailAdmin.imap.pass': 'Password', // same-as-en
  'mailAdmin.imap.mailbox': 'Cartella',
  'mailAdmin.imap.mailboxHint': 'Le e-mail lette vengono spostate in TREK/processed.',
  'mailAdmin.webhook.secret': 'Segreto di firma',
  'mailAdmin.webhook.secretHint':
    'Almeno 32 caratteri; il mittente firma ogni e-mail con esso. Vuoto, il webhook è disattivato.',
  'mailAdmin.inboundUrl': 'Indirizzo del webhook',
  'mailAdmin.inboundUrlHint': 'Il tuo servizio di posta invia qui ogni e-mail, grezza e firmata.',
  'mailAdmin.copyUrl': 'Copia indirizzo',
  'mailAdmin.envHint': 'Le variabili d’ambiente (MAIL_INGEST_*) hanno la precedenza su questi campi.',
  'mailAdmin.loadError': 'Impossibile caricare le impostazioni di importazione delle e-mail.',
  'mailAdmin.problem.secretShort': 'Il segreto deve avere almeno 32 caratteri.',
  'mailAdmin.problem.portInvalid': 'Inserisci una porta tra 1 e 65535.',
  'mailAdmin.problem.templateToken': 'L’indirizzo richiede {token} per il codice di ogni persona.',
  'mailAdmin.problem.dailyInvalid': 'Inserisci un numero intero da 0 a 1000.',
  'mailAdmin.status.title': 'Stato',
  'mailAdmin.status.lastRead': 'Ultima lettura {time}',
  'mailAdmin.status.never': 'mai',
  'mailAdmin.status.mails': 'E-mail, 24 h',
  'mailAdmin.status.added': 'Aggiunte automaticamente',
  'mailAdmin.status.waiting': 'In attesa',
  'mailAdmin.status.failed': 'Non riuscite',
  'mailAdmin.test.run': 'Verifica connessione',
  'mailAdmin.test.ok': 'Connesso',
  'mailAdmin.test.failed': 'Nessuna connessione',
};
export default mailAdmin;
