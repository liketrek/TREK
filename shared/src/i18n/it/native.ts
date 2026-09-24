import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Connetti a TREK',
  'native.connect.hint': 'Inserisci l’indirizzo con cui apri TREK nel browser.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Connetti',
  'native.connect.checking': 'Verifica in corso…',
  'native.connect.errorInvalid': 'Non sembra un indirizzo web.',
  'native.connect.errorUnreachable': 'Nessun server risponde a questo indirizzo. Controlla l’indirizzo e la connessione.',
  'native.connect.errorNotTrek': 'Il server a questo indirizzo non è TREK.',
  'native.connect.errorTooOld': 'Questo server TREK è troppo vecchio per l’app. Deve prima essere aggiornato.',
  'native.offline.title': 'Server non raggiungibile',
  'native.offline.hint': 'TREK non è riuscito a raggiungere {server}. Controlla la connessione e riprova.',
  'native.offline.retry': 'Riprova',
  'native.changeServer': 'Cambia server',
  'native.login.failed': 'L’accesso non è riuscito. Riprova.',
  'native.handoff.title': 'Continua nell’app',
  'native.handoff.hint': 'Hai effettuato l’accesso come {name}. Apri l’app TREK per completare lì l’accesso.',
  'native.handoff.open': 'Apri l’app TREK',
  'native.handoff.switchAccount': 'Usa un altro account',
  'native.settings.server': 'Server',
  'native.settings.serverHint': 'Questa app è collegata a {server}.',
};

export default native;
