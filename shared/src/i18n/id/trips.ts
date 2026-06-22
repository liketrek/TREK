import type { TranslationStrings } from '../types';

const trips: TranslationStrings = {
  'trips.memberRemoved': '{username} dihapus',
  'trips.memberRemoveError': 'Gagal menghapus',
  'trips.memberAdded': '{username} ditambahkan',
  'trips.memberAddError': 'Gagal menambahkan',
  'trips.reminder': 'Pengingat',
  'trips.reminderNone': 'Tidak ada',
  'trips.reminderDay': 'hari',
  'trips.reminderDays': 'hari',
  'trips.reminderCustom': 'Kustom',
  'trips.reminderDaysBefore': 'hari sebelum keberangkatan',
  'trips.reminderDisabledHint': 'Pengingat perjalanan dinonaktifkan. Aktifkan di Admin > Pengaturan > Notifikasi.',
  'trips.routingAvoid': 'Avoid', // en-fallback
  'trips.routingAvoidTolls': 'Tolls', // en-fallback
  'trips.routingAvoidHighways': 'Highways', // en-fallback
  'trips.routingAvoidFerries': 'Ferries', // en-fallback
};
export default trips;
