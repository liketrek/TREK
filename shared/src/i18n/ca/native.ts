import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Connecta amb TREK',
  'native.connect.hint': 'Introdueix l’adreça amb què obres TREK al navegador.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Connecta',
  'native.connect.checking': 'S’està comprovant…',
  'native.connect.errorInvalid': 'Això no sembla una adreça web.',
  'native.connect.errorUnreachable': 'Cap servidor respon en aquesta adreça. Comprova l’adreça i la connexió.',
  'native.connect.errorNotTrek': 'El servidor d’aquesta adreça no és TREK.',
  'native.connect.errorTooOld': 'Aquest servidor de TREK és massa antic per a l’app. Primer cal actualitzar-lo.',
  'native.offline.title': 'No es pot accedir al servidor',
  'native.offline.hint': 'TREK no ha pogut connectar amb {server}. Comprova la connexió i torna-ho a provar.',
  'native.offline.retry': 'Torna-ho a provar',
  'native.changeServer': 'Canvia de servidor',
  'native.login.failed': 'No s’ha pogut iniciar la sessió. Torna-ho a provar.',
  'native.handoff.title': 'Continua a l’app',
  'native.handoff.hint': 'Has iniciat la sessió com a {name}. Obre l’app de TREK per acabar d’iniciar-hi la sessió.',
  'native.handoff.open': 'Obre l’app de TREK',
  'native.handoff.switchAccount': 'Fes servir un altre compte',
  'native.settings.server': 'Servidor',
  'native.settings.serverHint': 'Aquesta app està connectada a {server}.',
};

export default native;
