import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Vérifier les changements de mes sentiers',
  'wanderer.watch.hint': 'Une notification quand un sentier importé a pu changer.',
  'wanderer.watch.info':
    'Au plus une fois par jour, TREK lit la courte fiche de chaque sentier que vous avez importé, jamais son fichier GPX. Il vous prévient seulement : reprendre un changement reste votre choix, via la vérification de la source du parcours.',
  'wanderer.watch.notConnected': "Connectez d'abord wanderer",
  'wanderer.watch.on': 'Vérification en arrière-plan activée',
  'wanderer.watch.off': 'Vérification en arrière-plan désactivée',
  'wanderer.watch.failed': "La vérification en arrière-plan n'a pas pu être modifiée",
  'wanderer.watch.lastRun': 'Dernière vérification {date}',
  'wanderer.watch.neverRun': 'Pas encore vérifié',
  'wanderer.watch.paused': "En pause jusqu'à {time}",
  'wanderer.watch.pausedHint':
    "wanderer n'a pas répondu. Après chaque échec, TREK attend plus longtemps avant de redemander.",
  'wanderer.watch.blocked': 'Jeton refusé',
  'wanderer.watch.blockedHint':
    "wanderer a refusé le jeton API. La vérification reprend dès qu'un test de connexion réussit ou qu'un nouveau jeton est enregistré.",
  'wanderer.watch.hints': 'Signalements',
  'wanderer.watch.hintsCount': '{count} signalements ouverts',
  'wanderer.watch.hintsCount.one': '{count} signalement ouvert',
  'wanderer.watch.empty': 'Aucun signalement ouvert',
  'wanderer.watch.dialogTitle': 'Signalements sur vos sentiers',
  'wanderer.watch.openTour': 'Ouvrir le parcours',
  'wanderer.watch.checkedAt': 'Vérifié {date}',
  'wanderer.watch.noticeLabel': 'Vérification en arrière-plan',
  'wanderer.watch.state.possible_change': 'A peut-être changé',
  'wanderer.watch.state.changed': 'Modifié',
  'wanderer.watch.state.unverifiable': 'Non vérifiable',
  'wanderer.watch.stateHint.possible_change':
    "wanderer a changé l'horodatage du sentier. Seule la vérification de la source montre si son contenu diffère.",
  'wanderer.watch.stateHint.changed':
    'La fiche wanderer indique un autre nom ou une autre description. La vérification de la source montre tout ce qui a changé.',
  'wanderer.watch.stateHint.unverifiable':
    "TREK n'a pas pu juger ce sentier : rien n'est dit sur un éventuel changement.",
  'wanderer.watch.reason.unavailable': 'Sentier inaccessible',
  'wanderer.watch.reason.no_change_time': "Pas d'horodatage",
};
export default wandererWatch;
