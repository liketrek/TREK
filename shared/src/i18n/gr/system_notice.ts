import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': 'Οι Φωτογραφίες μετακινήθηκαν στην 3.0',
  'system_notice.v3_photos.body':
    'Οι **Φωτογραφίες** στον Σχεδιαστή Ταξιδιού έχουν αφαιρεθεί. Οι φωτογραφίες σας είναι ασφαλείς — το TREK δεν τροποποίησε ποτέ τη βιβλιοθήκη σας Immich ή Synology.\n\nΟι φωτογραφίες τώρα βρίσκονται στο πρόσθετο **Journey**. Το Journey είναι προαιρετικό — αν δεν είναι ακόμα διαθέσιμο, ζητήστε από τον διαχειριστή σας να το ενεργοποιήσει από το Διαχειριστής → Πρόσθετα.',
  'system_notice.v3_journey.title': 'Γνωρίστε το Journey — ημερολόγιο ταξιδιών',
  'system_notice.v3_journey.body':
    'Καταγράψτε τα ταξίδια σας ως πλούσιες ταξιδιωτικές ιστορίες με χρονολόγια, συλλογές φωτογραφιών και διαδραστικούς χάρτες.',
  'system_notice.v3_journey.cta_label': 'Άνοιγμα Journey',
  'system_notice.v3_journey.highlight_timeline': 'Χρονολόγιο ανά ημέρα & συλλογή',
  'system_notice.v3_journey.highlight_photos': 'Εισαγωγή από Immich ή Synology',
  'system_notice.v3_journey.highlight_share': 'Δημόσια κοινοποίηση — δεν χρειάζεται σύνδεση',
  'system_notice.v3_journey.highlight_export': 'Εξαγωγή ως βιβλίο φωτογραφιών PDF',
  'system_notice.v3_features.title': 'Περισσότερα αξιοσημείωτα στην 3.0',
  'system_notice.v3_features.body': 'Μερικά ακόμα πράγματα που αξίζει να γνωρίζετε για αυτή την έκδοση.',
  'system_notice.v3_features.highlight_dashboard': 'Σχεδιασμός πίνακα ελέγχου πρώτα για κινητά',
  'system_notice.v3_features.highlight_offline': 'Πλήρης λειτουργία εκτός σύνδεσης ως PWA',
  'system_notice.v3_features.highlight_search': 'Αυτόματη συμπλήρωση αναζήτησης τοποθεσιών σε πραγματικό χρόνο',
  'system_notice.v3_features.highlight_import': 'Εισαγωγή τοποθεσιών από αρχεία KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: Αναβάθμιση OAuth 2.1',
  'system_notice.v3_mcp.body':
    'Η ενσωμάτωση MCP ανασχεδιάστηκε πλήρως. Το OAuth 2.1 είναι τώρα η συνιστώμενη μέθοδος αυθεντικοποίησης. Τα παλιά στατικά tokens (trek_…) είναι παρωχημένα και θα αφαιρεθούν σε μελλοντική έκδοση.',
  'system_notice.v3_mcp.highlight_oauth': 'Συνιστάται OAuth 2.1 (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 λεπτομερή εύρη δικαιωμάτων',
  'system_notice.v3_mcp.highlight_deprecated': 'Στατικά tokens trek_ παρωχημένα',
  'system_notice.v3_mcp.highlight_tools': 'Επεκτεταμένο σύνολο εργαλείων & προτροπών',
  'system_notice.v3_thankyou.title': 'Μια προσωπική σημείωση από εμένα',
  'system_notice.v3_thankyou.body':
    'Πριν φύγετε — θέλω να αφιερώσω μια στιγμή.\n\nΤο TREK ξεκίνησε ως ένα δευτερεύον έργο που έφτιαξα για τα δικά μου ταξίδια. Ποτέ δεν φαντάστηκα ότι θα γινόταν κάτι που 4.000 από εσάς εμπιστεύεστε τώρα για να σχεδιάσετε τις περιπέτειές σας. Κάθε αστέρι, κάθε αναφορά, κάθε αίτημα χαρακτηριστικού — τα διαβάζω όλα, και με κρατούν να συνεχίζω τις ξενύχτιες ανάμεσα σε δουλειά πλήρους απασχόλησης και πανεπιστήμιο.\n\nΘέλω να ξέρετε: το TREK θα είναι πάντα ανοιχτού κώδικα, πάντα self-hosted, πάντα δικό σας. Χωρίς παρακολούθηση, χωρίς συνδρομές, χωρίς δεσμεύσεις. Απλώς ένα εργαλείο φτιαγμένο από κάποιον που λατρεύει τα ταξίδια όσο κι εσείς.\n\nΙδιαίτερες ευχαριστίες στον [jubnl](https://github.com/jubnl) — έγινες ένας απίστευτος συνεργάτης. Πολλά από αυτά που κάνουν την 3.0 σπουδαία φέρουν τα δαχτυλικά σου αποτυπώματα. Σε ευχαριστώ που πίστεψες σε αυτό το έργο όταν ήταν ακόμα ατελές.\n\nΚαι σε κάθε έναν από εσάς που αναφέρατε ένα σφάλμα, μεταφράσατε ένα κείμενο, μοιραστήκατε το TREK με έναν φίλο, ή απλώς το χρησιμοποιήσατε για να σχεδιάσετε ένα ταξίδι — **σας ευχαριστώ**. Είστε ο λόγος που υπάρχει αυτό.\n\nΕις πολλές ακόμα περιπέτειες μαζί.\n\n— Maurice\n\n---\n\n[Γίνετε μέλος της κοινότητας στο Discord](https://discord.gg/7Q6M6jDwzf)\n\nΑν το TREK κάνει τα ταξίδια σας καλύτερα, ένας [μικρός καφές](https://ko-fi.com/mauriceboe) πάντα κρατά τα φώτα αναμμένα.',

  'system_notice.v3014_whitespace_collision.title': 'Απαιτείται ενέργεια: σύγκρουση λογαριασμού χρήστη',
  'system_notice.v3014_whitespace_collision.body':
    'Η αναβάθμιση 3.0.14 εντόπισε μία ή περισσότερες συγκρούσεις ονομάτων χρήστη ή email που προκλήθηκαν από κενά στην αρχή/τέλος αποθηκευμένων λογαριασμών. Οι επηρεαζόμενοι λογαριασμοί μετονομάστηκαν αυτόματα. Ελέγξτε τα logs του server για γραμμές που ξεκινούν με **[migration] WHITESPACE COLLISION** για να εντοπίσετε ποιοι λογαριασμοί χρειάζονται έλεγχο.',
  'system_notice.welcome_v1.title': 'Καλώς ήρθατε στο TREK',
  'system_notice.welcome_v1.body':
    'Ο πλήρης ταξιδιωτικός σας σχεδιαστής. Δημιουργήστε δρομολόγια, μοιραστείτε ταξίδια με φίλους και μείνετε οργανωμένοι — συνδεδεμένοι ή εκτός σύνδεσης.',
  'system_notice.welcome_v1.cta_label': 'Σχεδιάστε ένα ταξίδι',
  'system_notice.welcome_v1.hero_alt':
    'Ένας γραφικός ταξιδιωτικός προορισμός με επικάλυψη περιβάλλοντος σχεδιασμού TREK',
  'system_notice.welcome_v1.highlight_plan': 'Δρομολόγια ανά ημέρα για κάθε ταξίδι',
  'system_notice.welcome_v1.highlight_share': 'Συνεργαστείτε με συνταξιδιώτες',
  'system_notice.welcome_v1.highlight_offline': 'Λειτουργεί εκτός σύνδεσης σε κινητά',
  'system_notice.dev_test_modal.title': '[Dev] Δοκιμαστική ειδοποίηση',
  'system_notice.dev_test_modal.body': 'Αυτή είναι μια δοκιμαστική ειδοποίηση μόνο για ανάπτυξη.',
  'system_notice.pager.prev': 'Προηγούμενη ειδοποίηση',
  'system_notice.pager.next': 'Επόμενη ειδοποίηση',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Μετάβαση στην ειδοποίηση {n}',
  'system_notice.pager.position': 'Ειδοποίηση {current} από {total}',
};
export default system_notice;
