import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Συγχρονισμός εγγράφων',
  'docsync.noProviders': 'Δεν υπάρχουν διαθέσιμοι πάροχοι εγγράφων',
  'docsync.noProvidersHint': 'Τους ενεργοποιεί ένας διαχειριστής της εγκατάστασης στο Διαχείριση → Πρόσθετα → Έγγραφα.',
  'docsync.addProvider': 'Σύνδεση παρόχου',
  'docsync.test': 'Δοκιμή σύνδεσης',
  'docsync.connect.optional': 'Προαιρετικό',
  'docsync.connected': 'Συνδεδεμένο',
  'docsync.chooseFolder': 'Επιλογή φακέλου',
  'docsync.noFolders': 'Δεν βρέθηκε ακόμη τίποτα σε αυτή την εγκατάσταση.',
  'docsync.newFolderPlaceholder': 'Όνομα νέου φακέλου',
  'docsync.syncNow': 'Συγχρονισμός τώρα',
  'docsync.unlink': 'Αποσύνδεση',
  'docsync.confirmUnlink':
    'Τα έγγραφα παραμένουν στο TREK και στον χώρο αποθήκευσης. Καταργείται μόνο η αντιστοίχισή τους.',
  'docsync.syncEnabled': 'Αυτόματος συγχρονισμός',
  'docsync.deletePolicy': 'Όταν διαγράφεται ένα έγγραφο',
  'docsync.deleteUnlink': 'Διατήρηση και των δύο αντιγράφων',
  'docsync.deleteTrash': 'Μετακίνηση στον κάδο ανακύκλωσης',
  'docsync.conflictPolicy': 'Όταν άλλαξαν και οι δύο πλευρές',
  'docsync.onConflict.manual': 'Να με ρωτάει',
  'docsync.onConflict.trek_wins': 'Διατήρηση του αντιγράφου TREK',
  'docsync.onConflict.provider_wins': 'Διατήρηση του αντιγράφου του χώρου',
  'docsync.webhookHint':
    'Επικολλήστε αυτό το URL στον πάροχό σας ώστε οι αλλαγές να φτάνουν αμέσως. Χωρίς αυτό, το TREK ελέγχει ανά τακτά διαστήματα.',

  // Τα πεδία της φόρμας σύνδεσης. Τα κλειδιά αντικατοπτρίζουν τη στήλη `label` του
  // document_provider_fields, που αποθηκεύει κατάληξη κλειδιού και όχι κείμενο.
  'docsync.providerUrl': 'Διεύθυνση',
  'docsync.providerApiToken': 'Διακριτικό API',
  'docsync.providerApiKey': 'Κλειδί API',
  'docsync.providerAppPassword': 'Κωδικός εφαρμογής',
  'docsync.providerAppToken': 'Διακριτικό εφαρμογής',
  'docsync.providerUsername': 'Όνομα χρήστη',
  'docsync.providerPassword': 'Κωδικός πρόσβασης',
  'docsync.providerOrganization': 'Αναγνωριστικό οργανισμού',
  'docsync.providerBasePath': 'Βασικός φάκελος',
  'docsync.providerOTP': 'Κωδικός δύο παραγόντων',
  'docsync.allowInsecureTls': 'Αποδοχή αυτο-υπογεγραμμένου πιστοποιητικού',

  'docsync.hintPaperlessToken':
    'Δημιουργήστε το στο Paperless, στο Το προφίλ μου. Φέρει όλα τα δικαιώματα εκείνου του λογαριασμού.',
  'docsync.hintPapraKey':
    'Δημιουργήστε το στο Papra, στα κλειδιά API. Τα κλειδιά του Papra φτάνουν πάντα σε κάθε οργανισμό στον οποίο ανήκετε.',
  'docsync.hintPapraOrg': 'Το αναγνωριστικό org_… από τη γραμμή διευθύνσεων του Papra.',
  'docsync.hintNextcloudLogin': 'Το όνομα σύνδεσής σας στο Nextcloud, όχι η διεύθυνση email σας.',
  'docsync.hintNextcloudAppPassword':
    'Ρυθμίσεις → Ασφάλεια → Δημιουργία νέου κωδικού εφαρμογής. Ποτέ ο κωδικός του λογαριασμού σας.',
  'docsync.hintOpenCloudToken': 'Δημιουργείται στο OpenCloud, στα διακριτικά εφαρμογών.',
  'docsync.hintBasePath': 'Πού ψάχνει το TREK για φακέλους ταξιδιών. Προεπιλογή /TREK.',
  'docsync.hintSynologyUrl': 'Συμπεριλάβετε τη θύρα, για παράδειγμα https://nas.example.com:5001',
  'docsync.hintSynologyUser':
    'Καλύτερα ένας ξεχωριστός λογαριασμός DSM με πρόσβαση μόνο σε αυτόν τον κοινόχρηστο φάκελο.',
  'docsync.hintSynologyOtp': 'Χρειάζεται μόνο μία φορά, αν ο λογαριασμός χρησιμοποιεί ταυτοποίηση δύο παραγόντων.',

  'docsync.linkState.never': 'Δεν έχει συγχρονιστεί ακόμα',
  'docsync.linkState.ok': 'Σε συγχρονισμό',
  'docsync.linkState.partial': 'Μερικώς συγχρονισμένο',
  'docsync.linkState.failed': 'Απέτυχε',
  'docsync.linkState.needs_reauth': 'Συνδεθείτε ξανά',
  'docsync.linkState.scope_lost': 'Ο φάκελος χάθηκε',
  'docsync.linkState.orphaned': 'Ο κάτοχος αποχώρησε από το ταξίδι',

  'docsync.state.pending': 'Σε αναμονή',
  'docsync.state.synced': 'Συγχρονίστηκε',
  'docsync.state.conflict': 'Διένεξη',
  'docsync.state.rejected_type': 'Μη επιτρεπτός τύπος',
  'docsync.state.too_large': 'Πολύ μεγάλο',
  'docsync.state.error': 'Σφάλμα',
  'docsync.state.remote_missing': 'Λείπει από τον πάροχο',
  'docsync.state.local_deleted': 'Διαγράφηκε στο TREK',
  'docsync.state.scope_drift': 'Μετακινήθηκε εκτός του φακέλου',

  'docsync.conflict.resolve': "Επίλυση {count}",

  'docsync.conflict.title': 'Άλλαξαν και τα δύο αντίγραφα',
  'docsync.conflict.keepTrek': 'Διατήρηση της έκδοσης του TREK',
  'docsync.conflict.keepProvider': 'Διατήρηση της έκδοσης του παρόχου',
  'docsync.conflict.keepBoth': 'Διατήρηση και των δύο',

  // Οι λόγοι αποτυχίας ταξιδεύουν ως κωδικοί, ποτέ ως κείμενο του παρόχου: ένας πάροχος
  // απαντά στα αγγλικά ή με τη σελίδα σύνδεσης ενός διαμεσολαβητή σε HTML, και κανένα από
  // τα δύο δεν έχει θέση εδώ.
  'docsync.error.unreachable': 'Δεν ήταν δυνατή η επικοινωνία με τον πάροχο.',
  'docsync.error.tls_untrusted':
    'Το πιστοποιητικό απορρίφθηκε. Επιτρέψτε τα αυτο-υπογεγραμμένα πιστοποιητικά αν εμπιστεύεστε αυτή την εγκατάσταση.',
  'docsync.error.unauthorized': 'Τα διαπιστευτήρια απορρίφθηκαν.',
  'docsync.error.forbidden': 'Αυτός ο λογαριασμός δεν επιτρέπεται να το κάνει αυτό.',
  'docsync.error.not_found': 'Δεν βρέθηκε στον πάροχο.',
  'docsync.error.scope_missing': 'Ο συνδεδεμένος φάκελος δεν υπάρχει πλέον.',
  'docsync.error.rate_limited': 'Ο πάροχος περιορίζει τον ρυθμό των αιτημάτων. Το TREK θα δοκιμάσει ξανά αργότερα.',
  'docsync.error.too_large': 'Το αρχείο είναι μεγαλύτερο από όσο δέχεται ο πάροχος.',
  'docsync.error.unsupported_type': 'Ο πάροχος δεν δέχεται αυτόν τον τύπο αρχείου.',
  'docsync.error.quota_exceeded': 'Ο πάροχος δεν έχει άλλο χώρο.',
  'docsync.error.conflict': 'Το έγγραφο άλλαξε και στις δύο πλευρές.',
  'docsync.error.checksum_mismatch': 'Η μεταφορά δεν έφτασε ακέραιη.',
  'docsync.error.provider_error': 'Ο πάροχος ανέφερε σφάλμα.',
  'docsync.error.timeout': 'Ο πάροχος άργησε πολύ να απαντήσει.',
  'docsync.error.ssrf_blocked': 'Αυτή η διεύθυνση δεν επιτρέπεται.',
  'docsync.error.mass_delete_guard':
    'Τα περισσότερα έγγραφα εξαφανίστηκαν μονομιάς, οπότε δεν άλλαξε τίποτα. Ελέγξτε ότι ο φάκελος είναι ακόμη προσαρτημένος.',
  'docsync.error.unknown': 'Κάτι πήγε στραβά.',

  // ── Ο διάλογος ─────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Αυτό το ταξίδι',
  'docsync.addAnother': 'Προσθήκη ακόμη ενός',
  'docsync.syncing': 'Συγχρονίζεται',
  'docsync.card.pickFolder': 'Συνδέθηκε, επιλέξτε φάκελο',

  'docsync.empty.title': 'Δεν έχει συνδεθεί ακόμη τίποτα',
  'docsync.empty.hintOwner':
    'Επιλέξτε έναν χώρο αποθήκευσης στα αριστερά. Το TREK κρατά δικό του αντίγραφο για όλα, οπότε δεν χάνεται τίποτα αν εκείνος πάψει να υπάρχει.',
  'docsync.empty.hintMember': 'Αυτό το ρυθμίζει ο κάτοχος του ταξιδιού. Τα έγγραφα παραμένουν έτσι κι αλλιώς στο TREK.',

  // Πώς αρχειοθετεί το καθένα. Εμφανίζεται πριν συνδεθεί κανείς, γιατί είναι
  // αυτό που θα ζητήσει η επόμενη οθόνη.
  'docsync.model.paperless': 'Αρχειοθέτηση με ετικέτα',
  'docsync.model.papra': 'Αρχειοθέτηση με ετικέτα, μέσα σε έναν οργανισμό',
  'docsync.model.nextcloud': 'Αρχειοθέτηση σε φάκελο',
  'docsync.model.opencloud': 'Αρχειοθέτηση σε χώρο',
  'docsync.model.synologydrive': 'Αρχειοθέτηση σε φάκελο στο NAS',

  // ── Η μπάρα ροής ───────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Προς τον χώρο',
  'docsync.flow.toTrek': 'Από τον χώρο',
  'docsync.flow.documents': 'έγγραφα',
  'docsync.flow.summary.both': 'Τα έγγραφα κινούνται και προς τις δύο πλευρές.',
  'docsync.flow.summary.pull': 'Τα έγγραφα μόνο έρχονται.',
  'docsync.flow.summary.push': 'Τα έγγραφα μόνο φεύγουν.',
  'docsync.flow.summaryEditable.both': 'Κινούνται και προς τις δύο πλευρές. Πατήστε μια λωρίδα για να τη σταματήσετε.',
  'docsync.flow.summaryEditable.pull': 'Μόνο έρχονται. Πατήστε την άλλη λωρίδα για να φεύγουν κιόλας.',
  'docsync.flow.summaryEditable.push': 'Μόνο φεύγουν. Πατήστε την άλλη λωρίδα για να έρχονται κιόλας.',

  // ── Μία αντιστοίχιση ───────────────────────────────────────────────────────
  'docsync.binding.settings': 'Ρυθμίσεις',
  'docsync.binding.folder': 'Φάκελος',
  'docsync.binding.lastRun': 'Τελευταία εκτέλεση',
  'docsync.binding.autoOff': 'Σε παύση',
  'docsync.binding.neverRun': 'δεν έχει εκτελεστεί ακόμη',
  'docsync.binding.deleteHint': 'Τι γίνεται με το αντίγραφο στην άλλη πλευρά.',
  'docsync.binding.conflictHint': 'Ποιο αντίγραφο μένει όταν ένα έγγραφο άλλαξε και στα δύο σημεία.',
  'docsync.binding.autoHint': 'Έλεγχος για αλλαγές στο παρασκήνιο.',
  'docsync.binding.webhookTitle': 'Άμεσες ενημερώσεις',
  'docsync.binding.copy': 'Αντιγραφή',
  'docsync.binding.copied': 'Αντιγράφηκε',

  // ── Η σύνδεση ──────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Σύνδεση',
  'docsync.connect.testing': 'Γίνεται προσπάθεια επικοινωνίας',
  'docsync.connect.okAs': 'Επιτεύχθηκε επικοινωνία, σύνδεση ως {account}',
  'docsync.connect.insecureHint': 'Για εγκατάσταση στο δικό σας δίκτυο με αυτο-υπογεγραμμένο πιστοποιητικό.',
  'docsync.connect.about.paperless':
    'Το TREK αρχειοθετεί αυτό το ταξίδι με δική του ετικέτα και δεν αγγίζει το υπόλοιπο αρχείο σας.',
  'docsync.connect.about.papra':
    'Επιλέξτε τον οργανισμό στον οποίο ανήκει αυτό το ταξίδι. Το TREK το αρχειοθετεί εκεί με δική του ετικέτα.',
  'docsync.connect.about.nextcloud':
    'Χρησιμοποιήστε κωδικό εφαρμογής, όχι τον κωδικό του λογαριασμού σας: αντέχει την ταυτοποίηση δύο παραγόντων και μπορείτε να τον ανακαλέσετε ξεχωριστά.',
  'docsync.connect.about.opencloud': 'Το TREK αποκτά δικό του χώρο για αυτό το ταξίδι, ξεχωριστό από όλα τα άλλα.',
  'docsync.connect.about.synologydrive':
    'Καλύτερα ένας λογαριασμός DSM που φτάνει μόνο στον κοινόχρηστο φάκελο που θα χρησιμοποιεί αυτό το ταξίδι.',

  // ── Η επιλογή του φακέλου ──────────────────────────────────────────────────
  'docsync.scope.title': 'Πού θα βρίσκεται αυτό το ταξίδι στο {provider};',
  'docsync.scope.intro':
    'Συγχρονίζεται μόνο ό,τι βρίσκεται εδώ. Όλα τα υπόλοιπα στον χώρο αποθήκευσής σας μένουν έξω από το TREK.',
  'docsync.scope.createTitle': 'Δημιουργία νέου',
  'docsync.scope.createAction': 'Δημιουργία',
  'docsync.scope.pickTitle': 'Ή χρησιμοποιήστε κάποιο που ήδη έχετε',
  'docsync.scope.search': 'Αναζήτηση',
  'docsync.scope.noMatch': 'Δεν ταιριάζει τίποτα με αυτό.',

  // ── Όσα πρέπει να αποφασίσει κάποιος ───────────────────────────────────────
  'docsync.issues.title': 'Χρειάζεται έλεγχο',
  'docsync.issues.conflict': 'Άλλαξε και στις δύο πλευρές. Επιλέξτε ποιο θα κρατήσετε.',
  'docsync.issues.remote_missing': 'Χάθηκε από τον χώρο αποθήκευσης. Το αντίγραφο του TREK είναι ακόμη εδώ.',
  'docsync.issues.rejected_type': 'Αυτός ο τύπος αρχείου δεν επιτρέπεται εδώ.',
  'docsync.issues.too_large': 'Μεγαλύτερο από το όριο.',
  'docsync.issues.error': 'Η μεταφορά δεν ολοκληρώθηκε.',

  'docsync.error.unknown_provider': 'Αυτός ο πάροχος δεν είναι διαθέσιμος σε αυτή την εγκατάσταση.',
  'docsync.error.provider_disabled': 'Σε παύση: ένας διαχειριστής απενεργοποίησε αυτόν τον πάροχο. Ο συγχρονισμός θα συνεχιστεί μόλις ενεργοποιηθεί ξανά.',
  'docsync.binding.reconnect': 'Επανασύνδεση',
};

export default docsync;
