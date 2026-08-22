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
  'system_notice.thank_you_support.title': 'Ευχαριστώ που χρησιμοποιείτε το TREK',
  'system_notice.thank_you_support.body':
    'Ένα γρήγορο ευχαριστώ που εγκαταστήσατε το TREK — σημαίνει πραγματικά πολλά για μένα.\n\nΕίμαι ένας μόνος προγραμματιστής και φτιάχνω το TREK στον ελεύθερό μου χρόνο. Ξεκίνησε ως ένα μικρό εργαλείο μόνο για τα δικά μου ταξίδια, και ειλικρινά με συγκλονίζει η στήριξη και το ενδιαφέρον της κοινότητας από τότε. Το TREK φτιάχνεται με πολλή αγάπη από τη δική μου πλευρά — αλλά και χάρη στους πολλούς υπέροχους εξωτερικούς συνεισφέροντες που βοήθησαν να το διαμορφώσουν.\n\n**Το TREK είναι ανοιχτού κώδικα και εντελώς δωρεάν — και θα παραμείνει έτσι για πάντα. Καμία έκδοση επί πληρωμή, καμία συνδρομή, καμία παγίδα. Το υπόσχομαι.**\n\nΑν το TREK σάς είναι χρήσιμο και θέλετε να στηρίξετε την ανάπτυξή του, ένας μικρός καφές με βοηθά πραγματικά να συνεχίζω να φτιάχνω — καμία πίεση, αλλά κάθε φλιτζάνι κρατά ζωντανές τις ξενύχτιες.\n\nΣας ευχαριστώ που είστε εδώ.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% ανοιχτού κώδικα στο GitHub',
  'system_notice.thank_you_support.highlight_free': 'Δωρεάν για πάντα — ποτέ επί πληρωμή',
  'system_notice.thank_you_support.highlight_community': 'Φτιαγμένο μαζί με την κοινότητα',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Στηρίξτε στο Ko-fi',
  'system_notice.pager.prev': 'Προηγούμενη ειδοποίηση',
  'system_notice.pager.next': 'Επόμενη ειδοποίηση',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Μετάβαση στην ειδοποίηση {n}',
  'system_notice.pager.position': 'Ειδοποίηση {current} από {total}',
  'system_notice.release_400.eyebrow': 'Ενημερώθηκε',
  'system_notice.release_400.tag': 'Έκδοση',
  'system_notice.release_400.headline': 'Η μεγαλύτερη έκδοση που είχε ποτέ το TREK.',
  'system_notice.release_400.intro':
    'Το TREK αποκτά τηλέφωνο, και βιβλίο. Αυτή την έκδοση την έγραψαν δεκαεννέα άτομα — και μαζί της έφυγαν περίπου εκατόν πενήντα σφάλματα που αναφέρατε.',
  'system_notice.release_400.feature_mobile_title': 'Το TREK σε κινητό',
  'system_notice.release_400.feature_mobile_body':
    'Οτιδήποτε κάτω από 768px έχει πλέον δικό του περιβάλλον — ένα γυάλινο dock, δικά του πάνελ, δικό του σχεδιαστή ταξιδιού. Ανοίξτε το TREK στο κινητό σας.',
  'system_notice.release_400.feature_studio_title': 'TREK Studio',
  'system_notice.release_400.feature_studio_badge': 'Beta',
  'system_notice.release_400.feature_studio_body':
    'Το PDF του Journey έγινε σχεδιαστής βιβλίου φωτογραφιών. Στήνει το βιβλίο όταν του το ζητήσετε, και μετά κάνει στην άκρη.',
  'system_notice.release_400.feature_vacay_title': 'Το Vacay μαθαίνει τα υπόλοιπα',
  'system_notice.release_400.feature_vacay_body':
    'Μισές ημέρες, ρεπό και ευέλικτες ημέρες, σχολικές αργίες στο πλέγμα — και ένα έτος αδειών που δεν χρειάζεται να ξεκινά τον Ιανουάριο.',
  'system_notice.release_400.feature_places_title': 'Οι τοποθεσίες συστήνονται, τα αρχεία φεύγουν',
  'system_notice.release_400.feature_places_body':
    'Εικόνες και περιγραφή συμπληρώνονται μόνες τους πριν αποθηκεύσετε μια τοποθεσία. Και τα αρχεία σας δεν χρειάζεται πια να μένουν στον δίσκο όπου τρέχει το TREK.',
  'system_notice.release_400.footnote':
    'Και αυτές είναι τέσσερις. Η 4.0.0 φέρνει αρκετές εκατοντάδες ακόμη αλλαγές, από τα Collections και το Atlas μέχρι όλο τον server από κάτω.',
  'system_notice.release_400.note_eyebrow': 'Μια σημείωση από τον δημιουργό',
  'system_notice.release_400.note_title': 'Ευχαριστώ που χρησιμοποιείτε το TREK.',
  'system_notice.release_400.note_body':
    'Το TREK ξεκίνησε ως ένα μικρό εργαλείο για τα δικά μου ταξίδια, γραμμένο στον ελεύθερό μου χρόνο. Έτσι είναι ακόμα: βράδια, σαββατοκύριακα, οι ώρες δίπλα σε μια δουλειά πλήρους απασχόλησης.\n\nΓια κάποιο διάστημα ήμουν μόνο εγώ. Όχι πια — δεκαεννέα άτομα έβγαλαν αυτή την έκδοση, και χιλιάδες από εσάς ήρθατε με αστέρια, αναφορές, μεταφράσεις και pull requests. Είμαι ευγνώμων για κάθε κομμάτι της.',
  'system_notice.release_400.promise_label': 'Η υπόσχεση',
  'system_notice.release_400.promise_text':
    'Η ανοιχτού κώδικα πλευρά του TREK μένει δωρεάν, για πάντα. Καμία έκδοση επί πληρωμή, καμία συνδρομή, καμία παγίδα. Το υπόσχομαι.',
  'system_notice.release_400.note_body_after':
    'Η 4.0.0 πήρε εβδομάδες από ξενύχτια — μια εφαρμογή για κινητό, έναν σχεδιαστή βιβλίου, μια μετάβαση του server, τα περισσότερα γραμμένα ανάμεσα στα μεσάνυχτα και τις δύο. Δεν είναι παράπονο: μου αρέσει να το φτιάχνω. Είναι απλώς η ειλικρινής απάντηση στο πώς βγαίνει μια τόσο μεγάλη έκδοση από ένα έργο του ελεύθερου χρόνου.',
  'system_notice.release_400.note_closing': 'Σας ευχαριστώ που είστε εδώ.',
  'system_notice.release_400.note_signature': '— Maurice',
  'system_notice.release_400.support_text':
    'Η στήριξη είναι αυτό που κρατά όλο αυτό ζωντανό — servers, domains και οι ξενύχτιες που γίνονται εκδόσεις σαν κι αυτή. Αν το TREK αξίζει κάτι για εσάς, ένας καφές είναι ο πιο άμεσος τρόπος να συνεχίσει.',
  'system_notice.release_400.cta_bmc': 'Buy me a coffee',
  'system_notice.release_400.cta_kofi': 'Στηρίξτε στο Ko-fi',
};
export default system_notice;
