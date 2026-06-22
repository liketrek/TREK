import type { TranslationStrings } from '../types';

const trips: TranslationStrings = {
  'trips.memberRemoved': '{username} verwijderd',
  'trips.memberRemoveError': 'Verwijderen mislukt',
  'trips.memberAdded': '{username} toegevoegd',
  'trips.memberAddError': 'Toevoegen mislukt',
  'trips.reminder': 'Herinnering',
  'trips.reminderNone': 'Geen',
  'trips.reminderDay': 'dag',
  'trips.reminderDays': 'dagen',
  'trips.reminderCustom': 'Aangepast',
  'trips.reminderDaysBefore': 'dagen voor vertrek',
  'trips.reminderDisabledHint':
    'Reisherinneringen zijn uitgeschakeld. Schakel ze in via Admin > Instellingen > Meldingen.',
  'trips.routingAvoid': 'Avoid', // en-fallback
  'trips.routingAvoidTolls': 'Tolls', // en-fallback
  'trips.routingAvoidHighways': 'Highways', // en-fallback
  'trips.routingAvoidFerries': 'Ferries', // en-fallback
};
export default trips;
