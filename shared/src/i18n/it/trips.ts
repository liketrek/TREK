import type { TranslationStrings } from '../types';

const trips: TranslationStrings = {
  'trips.memberRemoved': '{username} rimosso',
  'trips.memberRemoveError': 'Rimozione non riuscita',
  'trips.memberAdded': '{username} aggiunto',
  'trips.memberAddError': 'Aggiunta non riuscita',
  'trips.reminder': 'Promemoria',
  'trips.reminderNone': 'Nessuno',
  'trips.reminderDay': 'giorno',
  'trips.reminderDays': 'giorni',
  'trips.reminderCustom': 'Personalizzato',
  'trips.reminderDaysBefore': 'giorni prima della partenza',
  'trips.reminderDisabledHint':
    'I promemoria dei viaggi sono disabilitati. Abilitali in Admin > Impostazioni > Notifiche.',
  'trips.routingAvoid': 'Avoid', // en-fallback
  'trips.routingAvoidTolls': 'Tolls', // en-fallback
  'trips.routingAvoidHighways': 'Highways', // en-fallback
  'trips.routingAvoidFerries': 'Ferries', // en-fallback
};
export default trips;
