import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Σύνδεση στο TREK',
  'native.connect.hint': 'Πληκτρολογήστε τη διεύθυνση με την οποία ανοίγετε το TREK στο πρόγραμμα περιήγησης.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Σύνδεση',
  'native.connect.checking': 'Έλεγχος…',
  'native.connect.errorInvalid': 'Αυτό δεν μοιάζει με διεύθυνση ιστού.',
  'native.connect.errorUnreachable': 'Κανένας διακομιστής δεν απαντά σε αυτή τη διεύθυνση. Ελέγξτε τη διεύθυνση και τη σύνδεσή σας.',
  'native.connect.errorNotTrek': 'Ο διακομιστής σε αυτή τη διεύθυνση δεν είναι TREK.',
  'native.connect.errorTooOld': 'Αυτός ο διακομιστής TREK είναι πολύ παλιός για την εφαρμογή. Χρειάζεται πρώτα ενημέρωση.',
  'native.offline.title': 'Ο διακομιστής δεν είναι προσβάσιμος',
  'native.offline.hint': 'Το TREK δεν μπόρεσε να συνδεθεί στο {server}. Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.',
  'native.offline.retry': 'Δοκιμάστε ξανά',
  'native.changeServer': 'Αλλαγή διακομιστή',
  'native.login.failed': 'Η σύνδεση δεν ολοκληρώθηκε. Δοκιμάστε ξανά.',
  'native.handoff.title': 'Συνέχεια στην εφαρμογή',
  'native.handoff.hint': 'Έχετε συνδεθεί ως {name}. Ανοίξτε την εφαρμογή TREK για να ολοκληρώσετε εκεί τη σύνδεση.',
  'native.handoff.open': 'Άνοιγμα της εφαρμογής TREK',
  'native.handoff.switchAccount': 'Χρήση άλλου λογαριασμού',
  'native.settings.server': 'Διακομιστής',
  'native.settings.serverHint': 'Αυτή η εφαρμογή είναι συνδεδεμένη στο {server}.',
};

export default native;
