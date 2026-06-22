import type { TranslationStrings } from '../types';

const trips: TranslationStrings = {
  'trips.reminder': 'Recordatorio',
  'trips.reminderNone': 'Ninguno',
  'trips.reminderDay': 'día',
  'trips.reminderDays': 'días',
  'trips.reminderCustom': 'Personalizado',
  'trips.memberRemoved': '{username} eliminado',
  'trips.memberRemoveError': 'Error al eliminar',
  'trips.memberAdded': '{username} añadido',
  'trips.memberAddError': 'Error al añadir',
  'trips.reminderDaysBefore': 'días antes de la salida',
  'trips.reminderDisabledHint':
    'Los recordatorios de viaje están desactivados. Actívalos en Admin > Configuración > Notificaciones.',
  'trips.routingAvoid': 'Avoid', // en-fallback
  'trips.routingAvoidTolls': 'Tolls', // en-fallback
  'trips.routingAvoidHighways': 'Highways', // en-fallback
  'trips.routingAvoidFerries': 'Ferries', // en-fallback
};
export default trips;
