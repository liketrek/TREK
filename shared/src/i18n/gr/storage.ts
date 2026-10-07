import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Ριζικός κατάλογος',
  'storage.help.root': 'Απόλυτη διαδρομή στον διακομιστή όπου αυτό το backend αποθηκεύει τα αντικείμενά του.',
  'storage.field.endpoint': 'URL τελικού σημείου',
  'storage.help.endpoint':
    'Βασικό URL της υπηρεσίας συμβατής με S3, π.χ. https://s3.example.com ή http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'Αναγνωριστικό κλειδιού πρόσβασης',
  'storage.field.secretAccessKey': 'Μυστικό κλειδί πρόσβασης',
  'storage.field.region': 'Περιοχή',
  'storage.help.region': 'Διατήρησε την προεπιλογή εκτός αν ο πάροχός σου απαιτεί συγκεκριμένη περιοχή.',
  'storage.field.keyPrefix': 'Πρόθεμα κλειδιού',
  'storage.help.keyPrefix': 'Προαιρετικό πρόθεμα που προστίθεται σε κάθε κλειδί αντικειμένου, π.χ. trek/prod.',
  'storage.field.retries': 'Επαναλήψεις',
  'storage.field.timeoutMs': 'Χρονικό όριο (ms)',
  'storage.field.primary': 'Κύριο backend',
  'storage.field.replicas': 'Αντίγραφα',
  'storage.title': 'Αποθήκευση',
  'storage.description':
    'Πού διατηρεί το TREK τα αρχεία, τις φωτογραφίες και τα αντίγραφα ασφαλείας που ανεβάζεις. Τίποτα δεν αλλάζει μέχρι να αποθηκεύσεις.',
  'storage.loading': 'Φόρτωση…',
  'storage.saved': 'Η ρύθμιση αποθήκευσης αποθηκεύτηκε',
  'storage.save': 'Αποθήκευση αλλαγών',
  'storage.unsaved': 'Μη αποθηκευμένες αλλαγές',
  'storage.saveConflict':
    'Η ρύθμιση αποθήκευσης άλλαξε από τη στιγμή που φορτώθηκε, επομένως οι αλλαγές σας δεν αποθηκεύτηκαν. Απορρίψτε τις και φορτώστε ξανά τις αποθηκευμένες ρυθμίσεις για να ξεκινήσετε από την αρχή.',
  'storage.discardAndReload': 'Απόρριψη των αλλαγών μου και επαναφόρτωση',
  'storage.configError.banner':
    'Η φόρτωση των αποθηκευμένων ρυθμίσεων αποθήκευσης απέτυχε — η αποθήκευση θα τις αντικαταστήσει: {error}',
  'storage.backends.title': 'Backends',
  'storage.backends.add': 'Προσθήκη backend',
  'storage.backends.usedBy': 'Χρησιμοποιείται από: {categories}',
  'storage.backends.unused': 'Δεν έχει ανατεθεί σε καμία κατηγορία',
  'storage.backends.envReadOnly': 'Ορίζεται από μεταβλητή περιβάλλοντος — μόνο για ανάγνωση',
  'storage.source.built-in': 'Ενσωματωμένο',
  'storage.source.env': 'Περιβάλλον',
  'storage.source.settings': 'Ρυθμίσεις',
  'storage.type.local': 'Τοπικό',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Καθρέφτης',
  'storage.actions.test': 'Δοκιμή',
  'storage.actions.edit': 'Επεξεργασία',
  'storage.actions.remove': 'Αφαίρεση',
  'storage.test.running': 'Δοκιμή σε εξέλιξη…',
  'storage.test.ok': 'Η σύνδεση είναι επιτυχής',
  'storage.test.failed': 'Η δοκιμή απέτυχε',
  'storage.remove.title': 'Αφαίρεση backend',
  'storage.remove.body':
    'Αφαίρεση του {name} από τη ρύθμιση; Ο διακομιστής απορρίπτει την αποθήκευση αν κάτι εξακολουθεί να εξαρτάται από αυτό.',
  'storage.remove.stillAssigned': 'Εξακολουθεί να έχει ανατεθεί σε: {categories}',
  'storage.form.addTitle': 'Προσθήκη backend',
  'storage.form.editTitle': 'Επεξεργασία backend',
  'storage.form.name': 'Όνομα',
  'storage.form.type': 'Τύπος',
  'storage.form.apply': 'Εφαρμογή',
  'storage.form.cancel': 'Ακύρωση',
  'storage.form.duplicateName': 'Υπάρχει ήδη ένα backend με το όνομα {name}',
  'storage.categories.title': 'Κατηγορίες',
  'storage.categories.default': 'προεπιλογή',
  'storage.categories.reassignWarning':
    'Τα υπάρχοντα αντικείμενα δεν μετακινούνται: τα νέα αντικείμενα πηγαίνουν στο νεοανατεθέν backend, τα παλιά παραμένουν όπου είναι.',
  'storage.category.files': 'Έγγραφα ταξιδιού',
  'storage.category.journey': 'Φωτογραφίες ταξιδιού',
  'storage.category.covers': 'Εικόνες εξωφύλλου',
  'storage.category.avatars': 'Φωτογραφίες προφίλ',
  'storage.category.places': 'Εικόνες τοποθεσιών',
  'storage.category.photos-google': 'Κρυφή μνήμη φωτογραφιών Google',
  'storage.category.photos-trek': 'Κρυφή μνήμη φωτογραφιών TREK',
  'storage.category.backups': 'Αντίγραφα ασφαλείας',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Συνημμένα αρχεία που ανεβαίνουν στα ταξίδια — εισιτήρια, PDF, επιβεβαιώσεις κράτησης και αρχεία που κοινοποιούνται στη συνομιλία του ταξιδιού.',
  'storage.categoryDesc.journey': 'Φωτογραφίες και μικρογραφίες που επισυνάπτονται σε καταχωρίσεις ταξιδιού.',
  'storage.categoryDesc.covers':
    'Εικόνες εξωφύλλου ταξιδιών και συλλογών, συμπεριλαμβανομένων εξωφύλλων από το Unsplash.',
  'storage.categoryDesc.avatars': 'Φωτογραφίες προφίλ λογαριασμών χρηστών.',
  'storage.categoryDesc.places':
    'Εικόνες που επισυνάπτονται σε τοποθεσίες και τοποθεσίες συλλογών — μεταφορτωμένες ή εισαγόμενες.',
  'storage.categoryDesc.photos-google':
    'Αποθηκευμένα αντίγραφα φωτογραφιών από το Google Places — ανακτήσιμα ξανά, η απώλειά τους είναι ασφαλής.',
  'storage.categoryDesc.photos-trek':
    'Φωτογραφίες σε κρυφή μνήμη από την υπηρεσία φωτογραφιών TREK που χρησιμοποιείται από τις Φωτογραφίες (Memories) — ανακτήσιμες ξανά, η απώλειά τους είναι ασφαλής.',
  'storage.categoryDesc.backups':
    'Αρχεία αντιγράφων ασφαλείας του διακομιστή που δημιουργούνται από τον πίνακα Αντιγράφων Ασφαλείας ή το πρόγραμμα.',
  'storage.health.title': 'Κατάσταση',
  'storage.health.allClear': 'Δεν έχουν καταγραφεί αποτυχίες αντιγράφων.',
  'storage.health.seedFile':
    'Υπάρχει αρχείο seed storage-config.json αλλά αγνοείται — υπάρχουν ήδη γραμμές ρύθμισης. Διαχειρίσου την αποθήκευση εδώ.',
  'storage.health.failureLine': '{op} του {key} στο {backend} απέτυχε: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Στόχοι καθρέφτη',
  'storage.mirror.targetsHelp': 'Κάθε εγγραφή σε αυτό το backend αντιγράφεται επίσης σε κάθε επιλεγμένο στόχο.',
  'storage.mirror.latencyNote':
    'Τα αντίγραφα γράφονται το ένα μετά το άλλο σε κάθε μεταφόρτωση — ένας αργός ή μη προσβάσιμος στόχος επιβραδύνει κάθε μεταφόρτωση κάθε κατηγορίας σε αυτό το backend.',
  'storage.mirror.mirroredTo': 'Αντικατοπτρίζεται σε: {targets}',
  'storage.mirror.replicaOf': 'Αντίγραφο του: {primaries}',
  'storage.mirror.cacheWarning':
    'Δεν συνιστάται: αυτή η κατηγορία περιέχει περιεχόμενο που μπορεί να ανακτηθεί ξανά — η αναπαραγωγή του είναι συνήθως σπατάλη.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Ένας δεύτερος καθρέφτης τυλίγει το {primary} — ο πίνακας διαχειρίζεται μόνο τον πρώτο· αφαίρεσε αυτόν για να διαχειριστείς την αντικατοπτρισμό από το {primary}.',
  'storage.mirror.degenerate.env-primary':
    'Τυλίγει ένα backend που ορίζεται από μεταβλητή περιβάλλοντος — δεν επεξεργάζεται εδώ.',
  'storage.mirror.degenerate.missing-primary': 'Αναφέρεται σε ένα backend που δεν υπάρχει πια.',
  'storage.remove.usedAsReplicaBy': 'Χρησιμοποιείται ως αντίγραφο από: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Συγχρονισμός τώρα',
  'storage.sync.running': 'Συγχρονισμός… {done}/{total}',
  'storage.sync.counts': '{copied} αντιγράφηκαν · {skipped} παραλείφθηκαν · {failed} απέτυχαν',
  'storage.sync.cancel': 'Ακύρωση συγχρονισμού',
  'storage.sync.done': 'Ο συγχρονισμός ολοκληρώθηκε: {copied} αντιγράφηκαν, {deleted} διαγράφηκαν, {failed} απέτυχαν',
  'storage.sync.cancelled': 'Ο συγχρονισμός ακυρώθηκε',
  'storage.sync.error': 'Ο συγχρονισμός απέτυχε: {error}',
  'storage.sync.prompt': 'Τα υπάρχοντα αντικείμενα δεν έχουν αναπαραχθεί ακόμα — συγχρονισμός τώρα;',
  'storage.sync.dismiss': 'Απόρριψη',
  'storage.usage.line': '{objects} αντικείμενα · {size}',
  'storage.usage.computed': 'Η χρήση υπολογίστηκε {age}',
  'storage.usage.never': 'Η χρήση δεν έχει υπολογιστεί ακόμα',
  'storage.usage.refresh': 'Ανανέωση',
  'storage.usage.compute': 'Υπολογισμός τώρα',
  'storage.usage.legacyNote': 'περιλαμβάνει την παλιά βιβλιοθήκη φωτογραφιών',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Μετακίνηση των υπαρχόντων αντικειμένων στο νέο backend;',
  'storage.migrate.promptLine': '{category}: {objects} αντικείμενα ({size}) από {from} σε {to}',
  'storage.migrate.promptLineUnknown':
    '{category}: άγνωστο μέγεθος (δεν έχει γίνει ακόμα σάρωση χρήσης) από {from} σε {to}',
  'storage.migrate.move': 'Μετακίνηση υπαρχόντων αντικειμένων',
  'storage.migrate.routeOnly': 'Δρομολόγηση μόνο των νέων εγγραφών',
  'storage.migrate.running': 'Μετακίνηση {category}… {done}/{total}',
  'storage.migrate.done': 'Η μετακίνηση ολοκληρώθηκε: {copied} αντιγράφηκαν, {skipped} παραλείφθηκαν',
  'storage.migrate.doneFailures': '{failed} απέτυχαν — αυτά τα αντικείμενα δεν αντιγράφηκαν στο νέο backend',
  'storage.migrate.failed': 'Η μετακίνηση απέτυχε: {error} — η κατηγορία δεν άλλαξε',
  'storage.migrate.cancelled': 'Η μετακίνηση ακυρώθηκε — τίποτα δεν άλλαξε',
  'storage.migrate.reclaimable': '{objects} αντικείμενα ({size}) παραμένουν στο {from} — ανάκτησέ τα χειροκίνητα',
  'storage.migrate.cancel': 'Ακύρωση μετακίνησης',
  'storage.migrate.promptCancel': 'Ακύρωση',
  'storage.migrate.queued': 'Σε αναμονή: {categories}',
  'storage.migrate.queueDropped':
    'Δεν ήταν δυνατή η έναρξη της επόμενης μετακίνησης — η υπόλοιπη ουρά διαγράφηκε: {categories}',
};
export default storage;
