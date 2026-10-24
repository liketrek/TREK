import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Έλεγχος αλλαγών στα μονοπάτια μου',
  'wanderer.watch.hint': 'Μια ειδοποίηση όταν ένα εισαγμένο μονοπάτι μπορεί να άλλαξε.',
  'wanderer.watch.info':
    'Το πολύ μία φορά την ημέρα, το TREK διαβάζει τη σύντομη εγγραφή κάθε μονοπατιού που εισήγαγες, ποτέ το αρχείο GPX του. Μόνο σε ειδοποιεί: αν θα περάσει μια αλλαγή το αποφασίζεις εσύ, με τον έλεγχο της πηγής της διαδρομής.',
  'wanderer.watch.notConnected': 'Σύνδεσε πρώτα το wanderer',
  'wanderer.watch.on': 'Ο έλεγχος στο παρασκήνιο ενεργοποιήθηκε',
  'wanderer.watch.off': 'Ο έλεγχος στο παρασκήνιο απενεργοποιήθηκε',
  'wanderer.watch.failed': 'Δεν ήταν δυνατή η αλλαγή του ελέγχου στο παρασκήνιο',
  'wanderer.watch.lastRun': 'Τελευταίος έλεγχος {date}',
  'wanderer.watch.neverRun': 'Δεν έχει ελεγχθεί ακόμη',
  'wanderer.watch.paused': 'Σε παύση έως {time}',
  'wanderer.watch.pausedHint':
    'Το wanderer δεν απάντησε. Μετά από κάθε αποτυχία, το TREK περιμένει περισσότερο πριν ρωτήσει ξανά.',
  'wanderer.watch.blocked': 'Το διακριτικό απορρίφθηκε',
  'wanderer.watch.blockedHint':
    'Το wanderer απέρριψε το διακριτικό API. Ο έλεγχος συνεχίζεται μόλις πετύχει μια δοκιμή σύνδεσης ή αποθηκευτεί νέο διακριτικό.',
  'wanderer.watch.hints': 'Υποδείξεις',
  'wanderer.watch.hintsCount': '{count} ανοιχτές υποδείξεις',
  'wanderer.watch.hintsCount.one': '{count} ανοιχτή υπόδειξη',
  'wanderer.watch.empty': 'Καμία ανοιχτή υπόδειξη',
  'wanderer.watch.dialogTitle': 'Υποδείξεις για τα μονοπάτια σου',
  'wanderer.watch.openTour': 'Άνοιγμα διαδρομής',
  'wanderer.watch.checkedAt': 'Ελέγχθηκε {date}',
  'wanderer.watch.noticeLabel': 'Έλεγχος στο παρασκήνιο',
  'wanderer.watch.state.possible_change': 'Ίσως άλλαξε',
  'wanderer.watch.state.changed': 'Άλλαξε',
  'wanderer.watch.state.unverifiable': 'Δεν ελέγχεται',
  'wanderer.watch.stateHint.possible_change':
    'Το wanderer άλλαξε τη χρονοσφραγίδα του μονοπατιού. Μόνο ο έλεγχος της πηγής δείχνει αν διαφέρει το περιεχόμενο.',
  'wanderer.watch.stateHint.changed':
    'Η εγγραφή στο wanderer δείχνει άλλο όνομα ή άλλη περιγραφή. Ο έλεγχος της πηγής δείχνει όλα όσα άλλαξαν.',
  'wanderer.watch.stateHint.unverifiable':
    'Το TREK δεν μπόρεσε να κρίνει αυτό το μονοπάτι, οπότε δεν λέγεται τίποτα για αλλαγή.',
  'wanderer.watch.reason.unavailable': 'Μονοπάτι μη προσβάσιμο',
  'wanderer.watch.reason.no_change_time': 'Χωρίς χρονοσφραγίδα',
};
export default wandererWatch;
