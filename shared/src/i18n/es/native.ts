import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Conectar con TREK',
  'native.connect.hint': 'Introduce la dirección con la que abres TREK en tu navegador.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Conectar',
  'native.connect.checking': 'Comprobando…',
  'native.connect.errorInvalid': 'Eso no parece una dirección web.',
  'native.connect.errorUnreachable': 'Ningún servidor responde en esta dirección. Revisa la dirección y tu conexión.',
  'native.connect.errorNotTrek': 'El servidor de esta dirección no es TREK.',
  'native.connect.errorTooOld': 'Este servidor de TREK es demasiado antiguo para la app. Primero necesita una actualización.',
  'native.offline.title': 'Servidor no disponible',
  'native.offline.hint': 'TREK no pudo conectar con {server}. Revisa tu conexión e inténtalo de nuevo.',
  'native.offline.retry': 'Reintentar',
  'native.changeServer': 'Cambiar de servidor',
  'native.login.failed': 'No se pudo iniciar sesión. Inténtalo de nuevo.',
  'native.handoff.title': 'Continuar en la app',
  'native.handoff.hint': 'Has iniciado sesión como {name}. Abre la app de TREK para terminar de iniciar sesión allí.',
  'native.handoff.open': 'Abrir la app de TREK',
  'native.handoff.switchAccount': 'Usar otra cuenta',
  'native.settings.server': 'Servidor',
  'native.settings.serverHint': 'Esta app está conectada a {server}.',
};

export default native;
