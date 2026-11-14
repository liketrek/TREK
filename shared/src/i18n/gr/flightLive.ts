import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} ημ {h} ώ',
  'flightLive.durHoursMinutes': '{h} ώ {m} λ',
  'flightLive.durMinutes': '{m} λ',
  'flightLive.late': '+{m} λ',
  'flightLive.early': '{m} λ νωρίτερα',
  'flightLive.onTime': 'Στην ώρα της',
  'flightLive.departsIn': 'Αναχώρηση σε {time}',
  'flightLive.scheduled': 'Προγραμματισμένη',
  'flightLive.taxiing': 'Έτοιμη για αναχώρηση',
  'flightLive.atAirport': 'Στο έδαφος στο {code}',
  'flightLive.airborne': 'Στον αέρα',
  'flightLive.landsIn': 'Προσγείωση σε {time}',
  'flightLive.landed': 'Προσγειώθηκε',
  'flightLive.landedAt': 'Προσγειώθηκε στις {time} στο {code}',
  'flightLive.estimated': 'εκτιμώμενη',
  'flightLive.altitude': 'Ύψος',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Ταχύτητα',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': 'Απομένουν',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Αεροσκάφος',
  'flightLive.noGateHint':
    'Η πύλη, ο τερματικός σταθμός και ο ιμάντας αποσκευών δεν ανήκουν στα ανοιχτά δεδομένα πτήσεων. Πρόσθεσέ τα μόνος σου στην κράτηση αν τα χρειάζεσαι.',
  'flightLive.legOf': 'Πτήση {n} από {total}',
  'flightLive.adminTitle': 'Ζωντανή κατάσταση πτήσεων',
  'flightLive.adminHint':
    'Δείχνει θέση, καθυστέρηση και εκτιμώμενη άφιξη κρατημένων πτήσεων από ανοιχτά δεδομένα ADS-B (adsb.lol, adsb.fi). Μόνο το διακριτικό κλήσης της πτήσης φεύγει από αυτόν τον διακομιστή.',
  'flightLive.adminToggle': 'Ζωντανή παρακολούθηση κρατημένων πτήσεων',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Δείχνει θέση, καθυστέρηση και εκτιμώμενη άφιξη κρατημένων πτήσεων από ανοιχτά δεδομένα ADS-B (adsb.lol). Μόνο το διακριτικό κλήσης της πτήσης φεύγει από την εγκατάσταση.',
  'flightLive.noFlight': 'Καμία προσεχής πτήση',
  'flightLive.envLocked': 'Ορίζεται από το FLIGHT_LIVE_ENABLED στον διακομιστή και δεν αλλάζει εδώ.',
};

export default flightLive;
