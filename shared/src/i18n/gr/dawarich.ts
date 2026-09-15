import type { TranslationStrings } from '../types';

const dawarich: TranslationStrings = {
  // ── Connection ─────────────────────────────────────────────────────────────
  'dawarich.title': 'Dawarich',
  'dawarich.intro':
    'Συνδέστε τη δική σας εγκατάσταση Dawarich για να δείτε πού βρεθήκατε πραγματικά. Το TREK τη διαβάζει και προτείνει καταχωρήσεις ημερολογίου, τοποθεσίες και χώρες — τίποτα δεν προστίθεται πριν το επιβεβαιώσετε και τίποτα δεν γράφεται πίσω στο Dawarich.',
  'dawarich.url': 'Διεύθυνση εγκατάστασης',
  'dawarich.apiKey': 'Κλειδί API',
  'dawarich.apiKeyPlaceholder': 'Επικολλήστε το κλειδί API του Dawarich',
  'dawarich.apiKeyHint':
    'Βρίσκεται στο Dawarich στο Λογαριασμός → Κλειδί API. Αποθηκεύεται κρυπτογραφημένο και δεν εμφανίζεται ξανά.',
  'dawarich.allowInsecureTls': 'Να επιτρέπεται αυτο-υπογεγραμμένο πιστοποιητικό',
  'dawarich.allowInsecureTlsHint':
    'Χρειάζεται μόνο αν η εγκατάστασή σας χρησιμοποιεί πιστοποιητικό που δεν εμπιστεύεται ο διακομιστής σας.',
  'dawarich.syncEnabled': 'Αυτόματος έλεγχος για νέες στάσεις',
  'dawarich.syncEnabledHint':
    'Απενεργοποιημένο σημαίνει ότι το TREK διαβάζει το Dawarich μόνο όταν του το ζητήσετε.',
  'dawarich.test.button': 'Δοκιμή σύνδεσης',
  'dawarich.test.success': 'Συνδέθηκε. Βρέθηκαν {count} στάσεις τις τελευταίες 30 ημέρες.',
  'dawarich.test.failed': 'Δεν ήταν δυνατή η επικοινωνία με το Dawarich.',
  'dawarich.syncNow': 'Έλεγχος τώρα',
  'dawarich.connected': 'Συνδεδεμένο',
  'dawarich.notConnected': 'Μη συνδεδεμένο',
  'dawarich.disconnect': 'Αποσύνδεση',
  'dawarich.lastSync': 'Τελευταίος έλεγχος {when}',
  'dawarich.neverSynced': 'Δεν έχει ελεγχθεί ακόμα',
  'dawarich.syncPartial': 'ορισμένα ταξίδια δεν ήταν δυνατό να διαβαστούν',
  'dawarich.serverVersion': 'Dawarich {version}',

  'dawarich.toast.saved': 'Η σύνδεση με το Dawarich αποθηκεύτηκε',
  'dawarich.toast.saveError': 'Δεν ήταν δυνατή η αποθήκευση της σύνδεσης',
  'dawarich.toast.disconnected': 'Το Dawarich αποσυνδέθηκε',
  'dawarich.toast.synced': 'Βρέθηκαν {count} νέες στάσεις',
  'dawarich.toast.syncError': 'Δεν ήταν δυνατή η ανάγνωση του Dawarich',
  'dawarich.toast.syncRunning': 'Εκτελείται ήδη έλεγχος',
  'dawarich.toast.acceptError': 'Δεν ήταν δυνατή η προσθήκη',
  'dawarich.toast.updateError': 'Δεν ήταν δυνατή η ενημέρωση αυτής της πρότασης',
  'dawarich.toast.accepted.place': 'Προστέθηκε στο ταξίδι',
  'dawarich.toast.accepted.journal': 'Προστέθηκε στο ημερολόγιο',
  'dawarich.toast.accepted.bucket_list': 'Σημειώθηκε ως εκπληρωμένη επιθυμία',

  // ── What the connected instance can do ─────────────────────────────────────
  'dawarich.capability.visits': 'στάσεις',
  'dawarich.capability.track': 'καταγεγραμμένη διαδρομή',
  'dawarich.capability.locations': 'αντιστοίχιση λίστας επιθυμιών',
  'dawarich.capability.visitedCities': 'χώρες και πόλεις',
  'dawarich.capability.missing': 'Αυτή η έκδοση του Dawarich δεν προσφέρει: {features}.',

  // ── Failure reasons, as sentences the reader can act on ────────────────────
  'dawarich.error.unreachable': 'Το TREK δεν μπόρεσε να επικοινωνήσει με αυτή τη διεύθυνση.',
  'dawarich.error.unauthorized': 'Το Dawarich απέρριψε το κλειδί API.',
  'dawarich.error.forbidden': 'Αυτό το κλειδί API δεν επιτρέπεται να διαβάσει κάτι τέτοιο.',
  'dawarich.error.not_found': 'Αυτή η έκδοση του Dawarich δεν διαθέτει αυτό το σημείο πρόσβασης.',
  'dawarich.error.rate_limited': 'Το Dawarich ζήτησε από το TREK να επιβραδύνει. Δοκιμάστε ξανά σε λίγο.',
  'dawarich.error.server_error': 'Το Dawarich απάντησε με σφάλμα.',
  'dawarich.error.invalid_response': 'Αυτή η διεύθυνση απάντησε με κάτι που δεν είναι Dawarich.',
  'dawarich.error.too_large': 'Το Dawarich έστειλε περισσότερα δεδομένα από όσα διαβάζει το TREK με τη μία.',
  'dawarich.error.not_connected': 'Δεν έχει συνδεθεί ακόμα καμία εγκατάσταση Dawarich.',
  'dawarich.error.addon_disabled': 'Το πρόσθετο Dawarich είναι απενεργοποιημένο σε αυτή την εγκατάσταση.',
  'dawarich.error.offline': 'Αυτό χρειάζεται σύνδεση — το TREK είναι εκτός σύνδεσης αυτή τη στιγμή.',
  'dawarich.error.invalid_url': 'Το TREK δεν μπορεί να χρησιμοποιήσει αυτή τη διεύθυνση.',
  'dawarich.warning.private_ip': 'Αυτή η διεύθυνση οδηγεί σε ιδιωτική IP ({ip}). Βεβαιωθείτε ότι αυτό εννοούσατε — ο διακομιστής ίσως χρειάζεται ALLOW_INTERNAL_NETWORK=true.',
  'dawarich.error.unknown': 'Κάτι πήγε στραβά στην επικοινωνία με το Dawarich.',

  // ── The recorded route on the map ──────────────────────────────────────────
  'dawarich.trail.show': 'Εμφάνιση καταγεγραμμένης διαδρομής',
  'dawarich.trail.hide': 'Απόκρυψη καταγεγραμμένης διαδρομής',
  'dawarich.trail.loading': 'Φόρτωση της καταγεγραμμένης διαδρομής…',
  'dawarich.trail.empty': 'Δεν καταγράφηκε τίποτα αυτές τις ημερομηνίες',
  'dawarich.trail.offline': 'Η καταγεγραμμένη διαδρομή χρειάζεται σύνδεση',
  'dawarich.trail.unavailable': 'Δεν ήταν δυνατή η φόρτωση της καταγεγραμμένης διαδρομής',

  // ── Suggestions ────────────────────────────────────────────────────────────
  'dawarich.duration.minutes': '{minutes} λ',
  'dawarich.duration.hours': '{hours} ώ',
  'dawarich.duration.hoursMinutes': '{hours} ώ {minutes} λ',
  'dawarich.checkedAgo': 'ελέγχθηκε {ago}',

  'dawarich.badge.lowConfidence': 'Αβέβαιο',
  'dawarich.badge.sourceChanged': 'Άλλαξε στο Dawarich',
  'dawarich.badge.sourceMissing': 'Χάθηκε από το Dawarich',

  'dawarich.suggestions.title': 'Από το Dawarich',
  'dawarich.suggestions.pending': '{count} περιμένουν από εσάς',
  'dawarich.suggestions.loading': 'Ανάγνωση του Dawarich…',
  'dawarich.suggestions.notConnected':
    'Συνδέστε το Dawarich στις Ρυθμίσεις για να βλέπετε εδώ τις στάσεις σας.',
  'dawarich.suggestions.unavailable': 'Δεν ήταν δυνατή η ανάγνωση του Dawarich.',
  'dawarich.suggestions.allHandled': 'Όλα όσα καταγράφηκαν εδώ έχουν διεκπεραιωθεί.',
  'dawarich.suggestions.asJournal': 'Γράψτε καταχώρηση ημερολογίου',
  'dawarich.suggestions.asPlace': 'Προσθήκη ως τοποθεσία',
  'dawarich.suggestions.dismiss': 'Δεν είναι μέρος που επισκέφθηκα',
  'dawarich.suggestions.dismissed': 'Απορρίφθηκε',
  'dawarich.suggestions.restore': 'Επαναφορά',
  'dawarich.suggestions.showHandled': 'Εμφάνιση {count} που έχουν ήδη διεκπεραιωθεί',
  'dawarich.suggestions.hideHandled': 'Απόκρυψη όσων έχουν ήδη διεκπεραιωθεί',
  'dawarich.suggestions.matchesWish': 'Στη λίστα επιθυμιών σας: {name}',
  'dawarich.suggestions.acceptedAs.place': 'Προστέθηκε ως τοποθεσία',
  'dawarich.suggestions.acceptedAs.journal': 'Στο ημερολόγιο',
  'dawarich.suggestions.acceptedAs.bucket_list': 'Η επιθυμία σημειώθηκε ως εκπληρωμένη',
  'dawarich.suggestions.sourceChanged':
    'Αυτή η στάση έχει αλλάξει στο Dawarich από τότε που τη χρησιμοποιήσατε. Ό,τι γράψατε στο TREK παραμένει ανέπαφο.',
  'dawarich.suggestions.sourceMissing':
    'Αυτή η στάση δεν υπάρχει πλέον στο Dawarich. Ό,τι γράψατε στο TREK παραμένει ανέπαφο.',
  'dawarich.sourceStatus.suggested': 'Εντοπίστηκε, χωρίς επιβεβαίωση',
  'dawarich.confidence.high': 'Εντοπισμός με βεβαιότητα',
  'dawarich.confidence.medium': 'Εντοπισμός με σχετική βεβαιότητα',
  'dawarich.confidence.low': 'Αβέβαιος εντοπισμός',

  // ── The review step ────────────────────────────────────────────────────────
  'dawarich.accept.title.place': 'Προσθήκη αυτής της στάσης ως τοποθεσία',
  'dawarich.accept.title.journal': 'Γράψτε καταχώρηση ημερολογίου',
  'dawarich.accept.title.bucket_list': 'Σημειώστε μια επιθυμία ως εκπληρωμένη',
  'dawarich.accept.confirm.place': 'Προσθήκη τοποθεσίας',
  'dawarich.accept.confirm.journal': 'Προσθήκη καταχώρησης',
  'dawarich.accept.confirm.bucket_list': 'Σημείωση ως εκπληρωμένης',
  'dawarich.accept.recorded': 'Καταγράφηκε από {from} έως {to}',
  'dawarich.accept.duration': '{minutes} λεπτά',
  'dawarich.accept.name': 'Όνομα',
  'dawarich.accept.date': 'Ημερομηνία',
  'dawarich.accept.from': 'Άφιξη',
  'dawarich.accept.to': 'Αναχώρηση',
  'dawarich.accept.trip': 'Ταξίδι',
  'dawarich.accept.thisTrip': 'Αυτό το ταξίδι',
  'dawarich.accept.pickTrip': 'Επιλέξτε ταξίδι',
  'dawarich.accept.day': 'Ημέρα',
  'dawarich.accept.noDay': 'Χωρίς ημέρα ακόμα',
  'dawarich.accept.journal': 'Ημερολόγιο',
  'dawarich.accept.pickJournal': 'Επιλέξτε ημερολόγιο',
  'dawarich.accept.notes': 'Σημειώσεις',
  'dawarich.accept.story': 'Η ιστορία σας',
  'dawarich.accept.storyPlaceholder': 'Τι συνέβη εδώ;',
  'dawarich.accept.photosHint': 'Προσθέστε φωτογραφίες στην καταχώρηση αφού δημιουργηθεί.',

  // ── A place that came out of a recording ──────────────────────────────────
  'dawarich.place.fromDawarich': 'Προστέθηκε από τις καταγραφές σας στο Dawarich',

  // ── Wishlist ───────────────────────────────────────────────────────────────
  'dawarich.bucket.title': 'Ελέγξτε τη λίστα επιθυμιών σας με το Dawarich',
  'dawarich.bucket.description':
    'Ψάχνει στις καταγραφές σας για τα μέρη που θέλατε να φτάσετε. Μια επίσκεψη χρειάζεται και εγγύτητα και χρόνο παραμονής — το να περάσετε απλώς από μπροστά δεν μετράει.',
  'dawarich.bucket.scan': 'Έλεγχος λίστας επιθυμιών',
  'dawarich.bucket.scanning': 'Γίνεται έλεγχος…',
  'dawarich.bucket.noMatches': 'Τίποτα από τη λίστα επιθυμιών σας δεν εντοπίστηκε στις καταγραφές σας.',
  'dawarich.bucket.alreadyVisited': 'Ήδη σημειωμένο ως εκπληρωμένο',
  'dawarich.bucket.confirm': 'Σημείωση {count} ως εκπληρωμένων',
  'dawarich.bucket.confirmed': '{count} επιθυμίες σημειώθηκαν ως εκπληρωμένες',
  'dawarich.bucket.skipped': '{count} καταχωρήσεις δεν έχουν συντεταγμένες και δεν ήταν δυνατό να ελεγχθούν.',
  'dawarich.bucket.truncated':
    'Ελέγχθηκαν μόνο οι πρώτες καταχωρήσεις. Εκτελέστε το ξανά για τις υπόλοιπες.',
  'dawarich.bucket.visitedFrom': 'Σημειώθηκε ως εκπληρωμένη από τις καταγραφές σας στο Dawarich',
  'dawarich.bucket.clearVisit': 'Αναίρεση',

  // ── Atlas ──────────────────────────────────────────────────────────────────
  'dawarich.atlas.title': 'Χώρες από το Dawarich',
  'dawarich.atlas.description':
    'Χώρες στις οποίες βρεθήκατε σύμφωνα με τις καταγραφές σας. Επιβεβαιώστε όσες θέλετε στο Atlas σας — τίποτα δεν προστίθεται από μόνο του και όσα σημειώσατε χειροκίνητα παραμένουν δικά σας.',
  'dawarich.atlas.load': 'Αναζήτηση χωρών',
  'dawarich.atlas.loading': 'Ανάγνωση των καταγραφών σας…',
  'dawarich.atlas.empty': 'Οι καταγραφές σας δεν δείχνουν χώρες που δεν έχει ήδη το TREK.',
  'dawarich.atlas.cities': '{count} πόλεις',
  'dawarich.atlas.citiesOne': '1 πόλη',
  'dawarich.atlas.accept': 'Προσθήκη {count} χωρών',
  'dawarich.atlas.accepted': '{count} χώρες προστέθηκαν',
  'dawarich.atlas.unresolved': 'Το TREK δεν μπόρεσε να τα αντιστοιχίσει σε χώρα: {names}.',
  'dawarich.atlas.source': 'Από το Dawarich',
  'dawarich.atlas.range': 'Εξετάστηκε το διάστημα {from} έως {to}',

  'dawarich.atlas.trigger': 'Επιθυμίες και χώρες από τις καταγραφές σας',
  'dawarich.atlas.dialogSubtitle': 'Τι λένε οι καταγραφές σας για το Atlas σας',
  'dawarich.atlas.tab.wishes': 'Λίστα επιθυμιών',
  'dawarich.atlas.tab.countries': 'Χώρες',
  'dawarich.atlas.window': 'Ελέγχθηκαν οι τελευταίοι 12 μήνες.',
  'dawarich.selected': 'Επιλέχθηκαν {count}',
  'dawarich.again': 'Έλεγχος ξανά',
  'dawarich.bucket.metersAway': '{meters} μ. μακριά',
  'dawarich.bucket.kilometersAway': '{km} χλμ. μακριά',
  'dawarich.bucket.rule': 'Μια επιθυμία μετράει ως εκπληρωμένη σε απόσταση έως {meters} μ. και μετά από {minutes} λεπτά στο σημείο.',

};

export default dawarich;
