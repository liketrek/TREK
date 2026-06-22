import type { TranslationStrings } from '../types';

const trips: TranslationStrings = {
  'trips.memberRemoved': '{username} удалён',
  'trips.memberRemoveError': 'Не удалось удалить',
  'trips.memberAdded': '{username} добавлен',
  'trips.memberAddError': 'Не удалось добавить',
  'trips.reminder': 'Напоминание',
  'trips.reminderNone': 'Нет',
  'trips.reminderDay': 'день',
  'trips.reminderDays': 'дней',
  'trips.reminderCustom': 'Другое',
  'trips.reminderDaysBefore': 'дней до отъезда',
  'trips.reminderDisabledHint': 'Напоминания о поездках отключены. Включите их в Админ > Настройки > Уведомления.',
  'trips.routingAvoid': 'Avoid', // en-fallback
  'trips.routingAvoidTolls': 'Tolls', // en-fallback
  'trips.routingAvoidHighways': 'Highways', // en-fallback
  'trips.routingAvoidFerries': 'Ferries', // en-fallback
};
export default trips;
