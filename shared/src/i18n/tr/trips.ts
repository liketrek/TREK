import type { TranslationStrings } from '../types';

const trips: TranslationStrings = {
  'trips.memberRemoved': '{username} kaldırıldı',
  'trips.memberRemoveError': 'Kaldırılamadı',
  'trips.memberAdded': '{username} eklendi',
  'trips.memberAddError': 'Eklenemedi',
  'trips.reminder': 'Hatırlatıcı',
  'trips.reminderNone': 'Yok',
  'trips.reminderDay': 'gün',
  'trips.reminderDays': 'gün',
  'trips.reminderCustom': 'Özel',
  'trips.reminderDaysBefore': 'hareketten önce gün',
  'trips.reminderDisabledHint': 'Seyahat hatırlatıcıları kapalı. Yönetici > Ayarlar > Bildirimler bölümünden açın.',
  'trips.routingAvoid': 'Avoid', // en-fallback
  'trips.routingAvoidTolls': 'Tolls', // en-fallback
  'trips.routingAvoidHighways': 'Highways', // en-fallback
  'trips.routingAvoidFerries': 'Ferries', // en-fallback
};
export default trips;
