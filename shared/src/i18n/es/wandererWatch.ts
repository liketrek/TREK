import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Comprobar cambios en mis rutas',
  'wanderer.watch.hint': 'Un aviso cuando una ruta importada podría haber cambiado.',
  'wanderer.watch.info':
    'Como mucho una vez al día, TREK lee la ficha breve de cada ruta que importaste, nunca su archivo GPX. Solo te avisa: tú decides si incorporas un cambio, mediante la comprobación de la fuente del recorrido.',
  'wanderer.watch.notConnected': 'Conecta primero wanderer',
  'wanderer.watch.on': 'Comprobación en segundo plano activada',
  'wanderer.watch.off': 'Comprobación en segundo plano desactivada',
  'wanderer.watch.failed': 'No se pudo cambiar la comprobación en segundo plano',
  'wanderer.watch.lastRun': 'Última comprobación {date}',
  'wanderer.watch.neverRun': 'Aún sin comprobar',
  'wanderer.watch.paused': 'En pausa hasta {time}',
  'wanderer.watch.pausedHint': 'wanderer no respondió. Tras cada fallo, TREK espera más antes de volver a preguntar.',
  'wanderer.watch.blocked': 'Token rechazado',
  'wanderer.watch.blockedHint':
    'wanderer rechazó el token de la API. La comprobación se reanuda cuando una prueba de conexión funcione o se guarde un token nuevo.',
  'wanderer.watch.hints': 'Avisos',
  'wanderer.watch.hintsCount': '{count} avisos abiertos',
  'wanderer.watch.hintsCount.one': '{count} aviso abierto',
  'wanderer.watch.empty': 'No hay avisos abiertos',
  'wanderer.watch.dialogTitle': 'Avisos sobre tus rutas',
  'wanderer.watch.openTour': 'Abrir el recorrido',
  'wanderer.watch.checkedAt': 'Comprobado {date}',
  'wanderer.watch.noticeLabel': 'Comprobación en segundo plano',
  'wanderer.watch.state.possible_change': 'Puede haber cambiado',
  'wanderer.watch.state.changed': 'Cambiado',
  'wanderer.watch.state.unverifiable': 'No comprobable',
  'wanderer.watch.stateHint.possible_change':
    'wanderer cambió la marca de tiempo de la ruta. Solo la comprobación de la fuente muestra si su contenido es distinto.',
  'wanderer.watch.stateHint.changed':
    'La ficha de wanderer muestra otro nombre u otra descripción. La comprobación de la fuente muestra todo lo que cambió.',
  'wanderer.watch.stateHint.unverifiable': 'TREK no pudo valorar esta ruta, así que no se dice nada sobre si cambió.',
  'wanderer.watch.reason.unavailable': 'Ruta no accesible',
  'wanderer.watch.reason.no_change_time': 'Sin marca de tiempo',
};
export default wandererWatch;
