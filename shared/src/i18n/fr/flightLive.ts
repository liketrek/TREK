import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} j {h} h',
  'flightLive.durHoursMinutes': '{h} h {m} min',
  'flightLive.durMinutes': '{m} min',
  'flightLive.late': '+{m} min',
  'flightLive.early': '{m} min en avance',
  'flightLive.onTime': 'À l’heure',
  'flightLive.departsIn': 'Départ dans {time}',
  'flightLive.scheduled': 'Prévu',
  'flightLive.taxiing': 'Prêt au départ',
  'flightLive.atAirport': 'Au sol à {code}',
  'flightLive.airborne': 'En vol',
  'flightLive.landsIn': 'Atterrit dans {time}',
  'flightLive.landed': 'Atterri',
  'flightLive.landedAt': 'Atterri à {time} à {code}',
  'flightLive.estimated': 'estimé',
  'flightLive.altitude': 'Altitude', // same-as-en
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Vitesse',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': 'Restant',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Avion',
  'flightLive.noGateHint':
    'La porte, le terminal et le tapis à bagages ne font pas partie des données de vol ouvertes. Ajoutez-les vous-même à la réservation si besoin.',
  'flightLive.legOf': 'Vol {n} sur {total}',
  'flightLive.adminTitle': 'Statut des vols en direct',
  'flightLive.adminHint':
    'Affiche la position, le retard et l’arrivée estimée des vols réservés à partir de données ADS-B ouvertes (adsb.lol, adsb.fi). Seul l’indicatif du vol quitte ce serveur.',
  'flightLive.adminToggle': 'Suivre les vols réservés en direct',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Affiche la position, le retard et l’arrivée estimée des vols réservés à partir de données ADS-B ouvertes (adsb.lol). Seul l’indicatif du vol quitte l’instance.',
  'flightLive.noFlight': 'Aucun vol à venir',
  'flightLive.envLocked': 'Défini par FLIGHT_LIVE_ENABLED sur le serveur et non modifiable ici.',
};

export default flightLive;
