import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Importació de correus de reserva',
  'mailAdmin.hint': 'Les confirmacions de reserva reenviades es converteixen en reserves del viatge correcte.',
  'mailAdmin.enabled': 'Importa correus de reserva',
  'mailAdmin.enabledHint':
    'Dona a tothom en aquesta instal·lació una adreça de reenviament. Desactivat, cap adreça rep correu.',
  'mailAdmin.transport.label': 'Com arriba el correu',
  'mailAdmin.transport.off': 'Només pujada de fitxers',
  'mailAdmin.transport.imap': 'Bústia IMAP',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Sense bústia: es puja un correu desat com a fitxer .eml a la configuració, i TREK el llegeix igual. Ideal per provar-ho.',
  'mailAdmin.transport.imapInfo':
    'TREK revisa una bústia cada dos minuts i recull els correus nous. Fes servir una bústia pròpia que accepti adreces amb + (trek+…@el-teu-domini), no una de personal: els correus llegits passen a TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Un servei de correu, com un Cloudflare Email Worker, lliura cada correu directament a TREK i el signa amb la clau de sota, perquè ningú més hi pugui colar correus. Per a instal·lacions sense bústia.',
  'mailAdmin.aiDaily': 'Correus amb IA per persona i dia',
  'mailAdmin.aiDailyHint': 'Per sobre d’aquest nombre, només es llegeixen dades de reserva llegibles per màquina.',
  'mailAdmin.template': 'Plantilla d’adreça',
  'mailAdmin.templateHint': 'L’adreça de reenviament, amb {token} allà on va el codi de cada persona.',
  'mailAdmin.imap.host': 'Servidor',
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Xifratge',
  'mailAdmin.imap.user': 'Usuari',
  'mailAdmin.imap.pass': 'Contrasenya',
  'mailAdmin.imap.mailbox': 'Carpeta',
  'mailAdmin.imap.mailboxHint': 'Els correus llegits es mouen a TREK/processed.',
  'mailAdmin.webhook.secret': 'Secret de signatura',
  'mailAdmin.webhook.secretHint':
    'Almenys 32 caràcters; el remitent signa cada correu amb ell. Buit, el webhook es desactiva.',
  'mailAdmin.inboundUrl': 'Adreça del webhook',
  'mailAdmin.inboundUrlHint': 'El teu servei de correu hi envia cada correu, en brut i signat.',
  'mailAdmin.copyUrl': 'Copia l’adreça',
  'mailAdmin.envHint': 'Les variables d’entorn (MAIL_INGEST_*) tenen prioritat sobre aquests camps.',
  'mailAdmin.loadError': 'No s’ha pogut carregar la configuració d’importació de correu.',
  'mailAdmin.problem.secretShort': 'El secret necessita almenys 32 caràcters.',
  'mailAdmin.problem.portInvalid': 'Introdueix un port entre 1 i 65535.',
  'mailAdmin.problem.templateToken': 'L’adreça necessita {token} per al codi de cada persona.',
  'mailAdmin.problem.dailyInvalid': 'Introdueix un nombre enter de 0 a 1000.',
  'mailAdmin.status.lastRead': 'Darrera lectura {time}',
  'mailAdmin.status.never': 'mai',
  'mailAdmin.status.mails': 'Correus, 24 h',
  'mailAdmin.status.added': 'Afegits automàticament',
  'mailAdmin.status.waiting': 'En espera',
  'mailAdmin.status.failed': 'Fallits',
  'mailAdmin.test.run': 'Prova la connexió',
  'mailAdmin.test.ok': 'Connectat',
  'mailAdmin.test.failed': 'Sense connexió',
};
export default mailAdmin;
