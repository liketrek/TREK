import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Se connecter à TREK',
  'native.connect.hint': 'Saisissez l’adresse à laquelle vous ouvrez TREK dans votre navigateur.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Se connecter',
  'native.connect.checking': 'Vérification…',
  'native.connect.errorInvalid': 'Cela ne ressemble pas à une adresse web.',
  'native.connect.errorUnreachable': 'Aucun serveur ne répond à cette adresse. Vérifiez l’adresse et votre connexion.',
  'native.connect.errorNotTrek': 'Le serveur à cette adresse n’est pas TREK.',
  'native.connect.errorTooOld': 'Ce serveur TREK est trop ancien pour l’application. Il doit d’abord être mis à jour.',
  'native.offline.title': 'Serveur injoignable',
  'native.offline.hint': 'TREK n’a pas pu joindre {server}. Vérifiez votre connexion et réessayez.',
  'native.offline.retry': 'Réessayer',
  'native.changeServer': 'Changer de serveur',
  'native.login.failed': 'La connexion n’a pas abouti. Veuillez réessayer.',
  'native.handoff.title': 'Continuer dans l’application',
  'native.handoff.hint': 'Vous êtes connecté en tant que {name}. Ouvrez l’application TREK pour y terminer la connexion.',
  'native.handoff.open': 'Ouvrir l’application TREK',
  'native.handoff.switchAccount': 'Utiliser un autre compte',
  'native.settings.server': 'Serveur',
  'native.settings.serverHint': 'Cette application est connectée à {server}.',
};

export default native;
