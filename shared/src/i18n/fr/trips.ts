import type { TranslationStrings } from '../types';

const trips: TranslationStrings = {
  'trips.memberRemoved': '{username} supprimé',
  'trips.memberRemoveError': 'Échec de la suppression',
  'trips.memberAdded': '{username} ajouté',
  'trips.memberAddError': "Échec de l'ajout",
  'trips.reminder': 'Rappel',
  'trips.reminderNone': 'Aucun',
  'trips.reminderDay': 'jour',
  'trips.reminderDays': 'jours',
  'trips.reminderCustom': 'Personnalisé',
  'trips.reminderDaysBefore': 'jours avant le départ',
  'trips.reminderDisabledHint':
    'Les rappels de voyage sont désactivés. Activez-les dans Admin > Paramètres > Notifications.',
  'trips.routingAvoid': 'Avoid', // en-fallback
  'trips.routingAvoidTolls': 'Tolls', // en-fallback
  'trips.routingAvoidHighways': 'Highways', // en-fallback
  'trips.routingAvoidFerries': 'Ferries', // en-fallback
};
export default trips;
