import type { TranslationStrings } from '../types';

const trips: TranslationStrings = {
  'trips.memberRemoved': '{username} تمت إزالته',
  'trips.memberRemoveError': 'فشل في الإزالة',
  'trips.memberAdded': '{username} تمت إضافته',
  'trips.memberAddError': 'فشل في الإضافة',
  'trips.reminder': 'تذكير',
  'trips.reminderNone': 'بدون',
  'trips.reminderDay': 'يوم',
  'trips.reminderDays': 'أيام',
  'trips.reminderCustom': 'مخصص',
  'trips.reminderDaysBefore': 'أيام قبل المغادرة',
  'trips.reminderDisabledHint': 'تذكيرات الرحلة معطلة. قم بتفعيلها من الإدارة > الإعدادات > الإشعارات.',
  'trips.routingAvoid': 'Avoid', // en-fallback
  'trips.routingAvoidTolls': 'Tolls', // en-fallback
  'trips.routingAvoidHighways': 'Highways', // en-fallback
  'trips.routingAvoidFerries': 'Ferries', // en-fallback
};
export default trips;
