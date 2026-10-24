import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Comprovar canvis en els meus camins',
  'wanderer.watch.hint': 'Un avís quan un camí importat podria haver canviat.',
  'wanderer.watch.info':
    "Com a molt un cop al dia, TREK llegeix la fitxa breu de cada camí que has importat, mai el seu fitxer GPX. Només t'avisa: incorporar un canvi ho decideixes tu, amb la comprovació de la font del recorregut.",
  'wanderer.watch.notConnected': 'Connecta primer wanderer',
  'wanderer.watch.on': 'Comprovació en segon pla activada',
  'wanderer.watch.off': 'Comprovació en segon pla desactivada',
  'wanderer.watch.failed': "No s'ha pogut canviar la comprovació en segon pla",
  'wanderer.watch.lastRun': 'Darrera comprovació {date}',
  'wanderer.watch.neverRun': 'Encara sense comprovar',
  'wanderer.watch.paused': 'En pausa fins a {time}',
  'wanderer.watch.pausedHint':
    'wanderer no ha respost. Després de cada error, TREK espera més abans de tornar a preguntar.',
  'wanderer.watch.blocked': 'Testimoni rebutjat',
  'wanderer.watch.blockedHint':
    "wanderer ha rebutjat el testimoni de l'API. La comprovació es reprèn quan una prova de connexió funcioni o es desi un testimoni nou.",
  'wanderer.watch.hints': 'Avisos',
  'wanderer.watch.hintsCount': '{count} avisos oberts',
  'wanderer.watch.hintsCount.one': '{count} avís obert',
  'wanderer.watch.empty': 'Cap avís obert',
  'wanderer.watch.dialogTitle': 'Avisos sobre els teus camins',
  'wanderer.watch.openTour': 'Obre el recorregut',
  'wanderer.watch.checkedAt': 'Comprovat {date}',
  'wanderer.watch.noticeLabel': 'Comprovació en segon pla',
  'wanderer.watch.state.possible_change': 'Pot haver canviat',
  'wanderer.watch.state.changed': 'Canviat',
  'wanderer.watch.state.unverifiable': 'No comprovable',
  'wanderer.watch.stateHint.possible_change':
    'wanderer ha canviat la marca de temps del camí. Només la comprovació de la font mostra si el contingut és diferent.',
  'wanderer.watch.stateHint.changed':
    'La fitxa de wanderer mostra un altre nom o una altra descripció. La comprovació de la font mostra tot el que ha canviat.',
  'wanderer.watch.stateHint.unverifiable':
    'TREK no ha pogut valorar aquest camí, així que no es diu res sobre si ha canviat.',
  'wanderer.watch.reason.unavailable': 'Camí inaccessible',
  'wanderer.watch.reason.no_change_time': 'Sense marca de temps',
};
export default wandererWatch;
