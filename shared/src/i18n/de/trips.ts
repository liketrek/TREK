import type { TranslationStrings } from '../types';

const trips: TranslationStrings = {
  'trips.reminder': 'Erinnerung',
  'trips.reminderNone': 'Keine',
  'trips.reminderDay': 'Tag',
  'trips.reminderDays': 'Tage',
  'trips.reminderCustom': 'Benutzerdefiniert',
  'trips.memberRemoved': '{username} entfernt',
  'trips.memberRemoveError': 'Entfernen fehlgeschlagen',
  'trips.memberAdded': '{username} hinzugefügt',
  'trips.memberAddError': 'Hinzufügen fehlgeschlagen',
  'trips.reminderDaysBefore': 'Tage vor Abreise',
  'trips.reminderDisabledHint':
    'Reiseerinnerungen sind deaktiviert. Aktivieren Sie sie unter Admin > Einstellungen > Benachrichtigungen.',
  'trips.routingAvoid': 'Avoid', // en-fallback
  'trips.routingAvoidTolls': 'Tolls', // en-fallback
  'trips.routingAvoidHighways': 'Highways', // en-fallback
  'trips.routingAvoidFerries': 'Ferries', // en-fallback
};
export default trips;
